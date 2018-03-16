//

import * as Template from './metrics.html?style=./metrics.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import Rx from 'rxjs/Rx'
import _ from 'lodash'
import lockr from 'lockr'
import moment from 'moment'
import Humanize from 'humanize-plus'
import pdelay from 'delay'
import pevent from 'p-event'
import pforever from 'p-forever'
import pqueue from 'p-queue'
import * as echarts from 'echarts'
import * as utils from '../../services/utils'
import * as shared from '../../shared'
import * as http from '../../services/http'
import * as socket from '../../services/socket'
import * as charts from '../../services/charts'
import * as ecbones from '../../services/ecbones'
import * as RouterIcon from '../../mixins/router.icon/router.icon'



@Vts.Component(<VueComponent>{
	name: 'MetricsChart',
	template: `
	<div>
		<v-layout v-show="ready" row justify-center class="py-2">
			<v-btn large color="primary" class="ma-0 mr-3 t-400" :class="{ 't-bold': item == range }"
				:outline="item != range" v-on:click="range = item" v-for="item in ranges" :key="item">
				{{ item }}
			</v-btn>
		</v-layout>
		<v-divider />
		<div />
	</div>
	`,
} as any)
class MetricsChart extends Vue {

	get parent() { return this.$parent as Metrics }
	@Vts.Prop() item: MetricItem

	echart: echarts.ECharts
	tipspos: any
	ready = false

	mounted() {
		this.echart = echarts.init(this.$el.lastChild as any)
		this.echart.on('showtip', this.onshowtip)
		this.echart.on('hidetip', this.onhidetip)
		this.syncChart()
	}

	beforeDestroy() {
		socket.emitter.removeListener(this.socketAvgs)
		this.echart.off('showtip')
		this.echart.off('hidetip')
		this.echart.clear()
		this.echart.dispose()
		this.echart = null
	}

	onshowtip(event: any) {
		this.tipspos = { x: event.x, y: event.y }
	}
	onhidetip(event: any) {
		this.tipspos = null
	}

	ranges = ['second', 'minute', 'hour']
	range = this.ranges[1]
	@Vts.Watch('range') w_range() {
		this.syncChart()
	}

	syncChart() {
		socket.emitter.removeListener(this.socketAvgs)
		let lrkey = { 'second': this.item.lrkey1s, 'minute': this.item.lrkey1m, 'hour': this.item.lrkey1h }[this.range]
		http.post('/get.metrics.lives', { lrkey }, { silent: true }).then((response: Array<MetricData>) => {
			this.buildChart(response)
			socket.emitter.addListener(lrkey, this.socketAvgs)
		}).catch(error => {
			console.error('syncChart > error', error)
		})
	}

	getKeys(avgs: MetricData) {
		return Object.keys(avgs).filter(key => {
			return ['time', 'stamp'].indexOf(key) == -1 && Number.isFinite(avgs[key])
		})
	}

	buildChart(mdatas: Array<MetricData>) {
		this.echart.clear()
		let bones = ecbones.blank({})

		bones.tooltip.formatter = params => charts.tooltipFormatter(params, { linkpointer: false })

		let top = 0
		let colors = Object.keys(utils.COLORS_500).mapFast(k => utils.COLORS_500[k]) as Array<string>
		this.getKeys(this.item.avgs).forEachFast((key, i) => {
			let name = this.parent.parseKey(key, this.item.rkey, this.item.type)

			bones.grid.push({ show: true, left: 60, right: 15, top: top + 20, height: 150, borderColor: ecbones.Styles.t, borderWidth: 1 })
			top += 180

			let axisname = this.item.name + ' - '
			if (this.item.desc) axisname += this.item.desc + ' - ';
			axisname += name
			bones.xAxis.push(ecbones.xAxis({ gridIndex: i, name: axisname, type: 'time', }, {
				axisLabel: { formatter: x => charts.xlabel(x) },
				axisPointer: { label: { formatter: params => charts.xlabel(params.value, true) } },
				nameGap: -bones.grid[i].height + 0.5,
			}))

			bones.yAxis.push(ecbones.yAxis({ gridIndex: i }, {
				axisLabel: { formatter: y => utils.formatNumber(y, null, 1000) },
				axisPointer: { label: { formatter: params => utils.formatNumber(params.value, null, 1000) } },
			}))

			bones.series.push(ecbones.line({ xAxisIndex: i, yAxisIndex: i, name, color: colors[i], smooth: true, width: 2 }, {
				data: mdatas.mapFast(v => { return { value: [v.stamp, v[key]] } }),
			}))
		})

		this.echart.setOption(bones)
		this.echart.resize({ height: top + 20 })
		this.$nextTick(() => this.ready = true)
	}

	socketAvgs(avgs: MetricData) {
		let bones = this.echart.getOption()
		this.getKeys(this.item.avgs).forEachFast((key, i) => {
			let series = bones.series[i]
			series.data.shift()
			series.data.push({ value: [avgs.stamp, avgs[key]] })
		})
		this.echart.setOption({ series: bones.series })
		if (!_.isEmpty(this.tipspos)) {
			let tipspos = Object.assign({}, this.tipspos)
			setTimeout(() => this.echart.dispatchAction(Object.assign({ type: 'showTip' }, tipspos)), 1)
		}
	}

}





const TABS = _.uniq(Object.keys(shared.METRICS).mapFast(k => shared.METRICS[k].category)).mapFast(function(key) {
	return {
		id: key,
		dname: _.startCase(key),
	} as BottomTabItem
}).mapFast(function(item) {
	if (item.id == 'watchers') item.icon = 'mdi-eye';
	else if (item.id == 'adapters') item.icon = 'mdi-nintendo-switch';
	else if (item.id == 'system') item.icon = 'mdi-server';
	else if (item.id == 'network') item.icon = 'mdi-access-point-network';
	else item.icon = 'mdi-help-circle';
	return item
})



@Template
@Vts.Component(<VueComponent>{
	name: 'Metrics',
	components: {
		'metrics-chart': MetricsChart,
	},

	beforeRouteEnter(to: VueRoute, from: VueRoute, next: VueRouteNext) {
		if (to.query.tab && TABS.find(v => v.id == to.query.tab)) return next();
		let route = utils.clone(to)
		let i = lockr.get('metrics.tab.index', 1)
		route.query.tab = TABS[i].id
		next(route)
	},

} as any)
export default class Metrics extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	created() {

	}

	mounted() {
		this.syncTab()
		pforever(() => {
			if (utils.visDestroyed(this)) return pforever.end;
			return pevent(process.ee3, shared.RKEY.SYS.TICK_1).then(() => {
				if (utils.visDestroyed(this)) return Promise.resolve();
				return this.syncItems()
			})
		})
	}

	beforeDestroy() {

	}



	gblocked = false
	items = [] as Array<MetricItem>

	chart = ''
	toggleChart(key: string) {
		if (this.chart == key) return this.chart = '';
		this.chart = key
	}

	tabs = utils.clone(TABS)
	get index() {
		return this.tabs.findIndex(v => v.id == this.$route.query.tab)
	}
	set index(index: number) {
		lockr.set('metrics.tab.index', index)
		let query = Object.assign(utils.clone(this.$route.query), { tab: this.tabs[index].id })
		this.$router.replace({ query })
		_.delay(this.syncTab, 100)
	}

	get category() {
		return _.get(this.tabs, this.index + '.id')
		// return this.tabs[this.index].id
	}
	get rkeys() {
		return Object.keys(shared.METRICS).filter(k => shared.METRICS[k].category == this.category).mapFast(k => shared.METRICS[k].rkey)
	}

	syncTab() {
		this.chart = ''
		document.getElementById('metrics_scroll').scrollTo({ top: 0, behavior: 'smooth' })
		this.syncItems()
	}

	syncItems() {
		return http.post<GetMetricsBody, GetMetricsResponse>('/get.metrics', {
			rkeys: this.rkeys,
		}, { silent: true }).then(response => {
			utils.vdestroyedSafety(this)
			this.gblocked = response.gblocked
			// _.remove(response.items, v => _.isEmpty(v.idatas))
			response.items.forEachFast(v => shared.calcMetricData(v))
			// console.log('response.items', JSON.stringify(response.items, null, 4))
			this.items = response.items
			// socket.emitter.removeListener(this.socketItem)
			// response.items.forEachFast(v => socket.emitter.addListener(v.rkey, this.socketItem))
			return Promise.resolve()

		}).catch(error => {
			console.error('syncItems > error', error)
			return Promise.resolve()
		})
	}

	// socketItem(toitem: MetricItem) {
	// 	if (_.isEmpty(toitem)) return;
	// 	let item = this.items.find(v => v && v.key == toitem.key)
	// 	if (_.isEmpty(item)) return;
	// 	let toikeys = Object.keys(toitem.idatas)
	// 	// console.log(Object.keys(toitem.idatas)[0], 'toitem', JSON.stringify(toitem))
	// 	console.log('toikeys', toikeys)
	// 	if (toikeys.length == 1) {
	// 		let ikey = toikeys[0]
	// 		Object.assign(item.idatas[ikey], toitem.idatas[ikey])
	// 	} else {
	// 		_.merge(item, toitem)
	// 	}
	// }



	parseKey(k: string, rkey: string, type: string) {

		// if (k == 'time') return 'When';
		if (k == 'stamp') return 'Updated';

		if (['meter', 'histogram', 'timer'].indexOf(type) >= 0) {
			if (k == 'm1') return '1m';
			if (k == 'm5') return '5m';
			if (k == 'm15') return '15m';
			if (k == 'm30') return '30m';
			if (k == 'm60') return '1hr';
			if (k == 'm00') return '00m';
		}

		// if (rkey == shared.METRICS.ms_redis_perf.rkey) {
		// 	if (k == 'instantaneous_ops_per_sec') return 'Ops/Sec';
		// 	if (k == 'instantaneous_input_kbps') return 'Input Kbps';
		// 	if (k == 'instantaneous_output_kbps') return 'Output Kbps';
		// 	if (k == 'connected_clients') return 'Clients';
		// 	if (k == 'client_longest_output_list') return 'Longest List';
		// 	if (k == 'client_biggest_input_buf') return 'Biggest Input';
		// 	if (k == 'lazyfree_pending_objects') return 'Pending Objects';
		// 	if (k == 'used_cpu_sys') return 'System CPU';
		// 	if (k == 'used_cpu_user') return 'User CPU';
		// 	if (k == 'lru_clock') return 'Lru Clock';
		// }
		// if (rkey == shared.METRICS.ms_redis_memory.rkey) {
		// 	if (k == 'uptime_in_seconds') return 'Uptime Hrs';
		// 	if (k == 'used_memory') return 'Used Memory';
		// 	if (k == 'used_memory_rss') return 'Used Memory RSS';
		// 	if (k == 'used_memory_peak') return 'Used Memory Peak';
		// 	if (k == 'used_memory_overhead') return 'Used Memory Overhead';
		// 	if (k == 'used_memory_startup') return 'Used Memory Startup';
		// 	if (k == 'used_memory_dataset') return 'Used Memory Dataset';
		// 	if (k == 'used_memory_lua') return 'Used Memory Lua';
		// 	if (k == 'mem_fragmentation_ratio') return 'Frag Ratio';
		// }

		if (rkey == shared.METRICS.eventloop.rkey) {
			if (k == 'min') return 'Shortest Latency';
			if (k == 'max') return 'Longest Latency';
			if (k == 'avg') return 'Average Latency';
		}
		if (rkey == shared.METRICS.loop.rkey) {
			if (k == 'count') return 'Total Ticks';
			if (k == 'minimum') return 'Fastest Tick';
			if (k == 'maximum') return 'Slowest Tick';
			if (k == 'average') return 'Average Tick';
		}

		if (rkey == shared.METRICS.cpu.rkey) {

		}

		if (rkey == shared.METRICS.memory.rkey) {
			if (k == 'physical_total') return 'System Total RAM';
			if (k == 'physical_used') return 'System Used RAM';
			if (k == 'physical_free') return 'System Free RAM';
			if (k == 'virtual') return 'Process Virtual Used';
			if (k == 'private') return 'Process Private Used';
			if (k == 'physical') return 'Process Used RAM';
		}

		if (rkey == shared.METRICS.gc.rkey) {
			if (k == 'size') return 'Heap Size';
			if (k == 'used') return 'Heap Used';
			if (k == 'duration') return 'Cycle Duration';
		}

		// if (rkey == shared.METRICS.ms_streams_streaming.rkey && k.indexOf('x') == 0) return k;

		return _.startCase(k)
		// return shared.capitalize(k)
	}

	parseValue(v: number, k: string, item: MetricItem) {
		if (['time', 'stamp'].indexOf(k) >= 0) return moment(v).fromNow();

		if (item.key.indexOf('news') >= 0) return utils.formatNumber(v, 0);

		if (['meter', 'histogram', 'timer'].indexOf(item.type) >= 0) {
			if (
				[
					'm1', 'm5', 'm15', 'm30', 'm60', 'm00',
					'mean', 'median', 'stdDev', 'min', 'max', 'p75', 'p95', 'p98', 'p99', 'p999'
				].indexOf(k) >= 0
			) {
				return utils.formatNumber(v, 2)
			}
		}

		// if (item.rkey == shared.METRICS.ms_redis_perf.item.rkey) {
		// 	if (['instantaneous_ops_per_sec', 'lru_clock', 'connected_clients', 'repl_backlog_size'].indexOf(k) >= 0) return utils.formatNumber(v, 0);
		// 	if (['instantaneous_input_kbps', 'instantaneous_output_kbps'].indexOf(k) >= 0) return utils.formatNumber(v, 0);
		// }
		// if (item.rkey == shared.METRICS.ms_redis_memory.item.rkey) {
		// 	if (k == 'uptime_in_seconds') return utils.formatNumber(moment.duration(v, 'seconds').asHours());
		// 	if (k.indexOf('used_memory') == 0) return Humanize.fileSize(v);
		// }

		// if (item.rkey == shared.METRICS.ms_streams_streaming.item.rkey && k.indexOf('x') == 0) {
		// 	if (v == 0) return 'OFFLINE';
		// 	return utils.formatNumber(v, 0)
		// }

		if (item.rkey == shared.METRICS.memory.rkey) {
			if (['physical_total', 'physical_used', 'physical_free', 'virtual', 'private', 'physical'].indexOf(k) >= 0) return Humanize.fileSize(v);
		}

		if (item.rkey == shared.METRICS.cpu.rkey) {
			if (['process', 'system'].indexOf(k) >= 0) return utils.formatNumber(v * 100, 1) + '%';
		}
		if (item.rkey == shared.METRICS.loop.rkey) {
			if (k.indexOf('cpu') >= 0) return utils.formatNumber(v * 100, 1) + '%';
		}

		if (item.rkey == shared.METRICS.gc.rkey) {
			if (k == 'size') return Humanize.fileSize(v);
			if (k == 'used') return Humanize.fileSize(v);
			if (k == 'duration') return utils.formatNumber(v, 0) + ' ms';
		}

		if ([shared.METRICS.eventloop.rkey, shared.METRICS.loop.rkey].indexOf(item.rkey) >= 0) {
			if (['min', 'max', 'avg', 'minimum', 'maximum', 'average'].indexOf(k) >= 0) return utils.formatNumber(v, 2) + ' ms';
		}

		if (['count', 'size', 'total'].indexOf(k) >= 0) return utils.formatNumber(v, 0);

		return utils.formatNumber(v, 2)
	}





}





