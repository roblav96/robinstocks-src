//

import * as Template from './markets.html?style=./markets.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import pdelay from 'delay'
import pevent from 'p-event'
import pforever from 'p-forever'
import pqueue from 'p-queue'
import chartist from 'chartist'
import * as echarts from 'echarts'
import * as ss from 'simple-statistics'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as socket from '../../services/socket'
import * as charts from '../../services/charts'
import * as ecbones from '../../services/ecbones'
import * as http from '../../services/http'
import * as yahoo from '../../services/yahoo'
import * as RouterIcon from '../../mixins/router.icon/router.icon'
import * as Charts from '../../services/charts'



@Vts.Component(<VueComponent>{
	name: 'MarketsChart',
	template: `
	<div>
		<div class="markets-chart-wrapper"></div>
		<v-divider />
		<div class="ml-3">
			<v-btn outline small :color="v_btn_color(item)" v-on:click="range = item" :class="{ 'btn-bold': item == range }"
				class="btn-px-0 w-initial px-3 mx-0 mr-2" v-for="item in ranges" :key="item">
				{{ item }}
			</v-btn>
		</div>
	</div>
	`,
} as any)
class MarketsChart extends Vue {

	get parent() { return this.$parent as Markets }
	@Vts.Prop() mkcquote: MarketCalcQuote

	echart: echarts.ECharts

	mounted() {
		this.echart = echarts.init(this.$el.firstChild as any, null, { height: 250 })
		this.syncChart()
	}

	beforeDestroy() {
		this.echart.clear()
		this.echart.dispose()
		this.echart = null
	}

	ranges = ['1d', '5d']
	range = this.ranges[0]
	@Vts.Watch('range') w_range() {
		this.syncChart()
	}

	v_btn_color(range: string) {
		if (this.range != range) return 'grey';
		return this.mkcquote.change > 0 ? 'success' : 'error'
	}

	syncChart() {
		let range = { '1d': 'm1', '5d': 'm5' }
		http.get('https://quoteapi.webull.com/api/quote/v2/tickerMinutes/' + this.mkcquote.tickerId, {
			minuteType: range[this.range],
		}).then((response: WebullTickerMinutesChart) => {
			let tquotes = shared.wbParseChartResponse(response)
			this.buildChart(tquotes, response.preClose)
		}).catch(error => {
			console.error('getChartData > error', error)
		})
	}

	buildChart(tquotes: Array<TinyQuote>, prevClose?: number) {
		this.echart.clear()
		let bones = ecbones.blank()

		bones.tooltip.formatter = params => charts.tooltipFormatter(params, { hidezeros: true })

		bones.grid.push({ left: 50, right: 15, top: 10, bottom: 10 })

		bones.xAxis.push(ecbones.xAxis({ blank: true }, {
			data: tquotes.mapFast(v => v.lastStamp),
			axisLine: { show: true },
			axisPointer: { label: { formatter: params => charts.xlabel(params.value, true) } },
		}))

		bones.yAxis.push(ecbones.yAxis({}, {
			splitLine: { show: false },
			axisLabel: { formatter: y => utils.formatNumber(y) },
			// axisPointer: { label: { formatter: params => utils.formatNumber(params.value) } },
			axisPointer: { label: { formatter: params => utils.formatNumber(params.value) + '\n' + utils.humanPlusMinus(shared.calcPercentChange(params.value, prevClose), 1, false, false) + '%' } },
		}))

		let pseries = ecbones.line({ name: 'Price', color: utils.COLORS_500.blue, smooth: true }, {
			data: tquotes.mapFast(v => v.lastPrice) as any,
		})
		if (Number.isFinite(prevClose)) pseries.markLine = ecbones.markLine({ data: [{ yAxis: prevClose }] });
		bones.series.push(pseries)

		bones.yAxis.push(ecbones.yAxis({ blank: true }))
		bones.series.push(ecbones.bar({ name: 'Size', yAxisIndex: 1 }, {
			data: tquotes.mapFast(function(v, i) {
				let opacity = 0.5
				let color = utils.COLORS_500.bluegrey
				let prev = tquotes[i - 1]
				if (prev && v.lastPrice < prev.lastPrice) color = utils.COLORS_500.red;
				if (prev && v.lastPrice > prev.lastPrice) {
					color = utils.COLORS_500.green
					opacity = opacity + 0.1
				}
				return { value: v.size as any, itemStyle: { normal: { color, opacity } } } as ECharts.DataPoint
			}),
		}))

		// console.log('buildChart > bones', bones)
		this.echart.setOption(bones, true)
	}

}



@Template
@Vts.Component(<VueComponent>{
	name: 'Markets',
	components: {
		'markets-chart': MarketsChart,
	},
} as any)
export default class Markets extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	created() {
		this.initMarkets()
	}

	mounted() {

	}

	beforeDestroy() {
		socket.emitter.removeListener(this.socketMkcquotes)
	}



	mkcquotes = [] as Array<MarketCalcQuote>

	// headers = shared.RMAP.MARKET_CALCS.mapFast(function(key) {
	// 	return { key, text: _.startCase(key) } as VueHeaderItem
	// })
	headers = ([
		{ key: 'volume' },
		{ key: 'vibrateRatio', text: 'Range' },
		// { key: 'prevClose', text: 'Previous Close' },
		{ key: 'lastStamp', text: 'Last Sale' },
	] as Array<VueHeaderItem>).mapFast(function(header) {
		if (!header.text) header.text = _.startCase(header.key);
		return header
	})

	initMarkets() {
		http.get<Array<MarketCalcQuote>>('/get.markets').then(response => {
			utils.vdestroyedSafety(this)
			// this.mkcquotes = [response[0]]
			// return
			this.mkcquotes = response
			socket.emitter.addListener(shared.RKEY.MARKET.CALCS, this.socketMkcquotes)
		}).catch(error => {
			console.error('initMarkets > error', error)
		})
	}

	socketMkcquotes(mkcquotes: Array<MarketCalcQuote>) {
		mkcquotes.forEachFast(mkcquote => {
			mkcquote = shared.explode(shared.RMAP.MARKET_CALCS, mkcquote)
			let found = this.mkcquotes.find(v => v.symbol == mkcquote.symbol)
			if (found) return shared.merge(found, mkcquote);
			this.mkcquotes.push(mkcquote)
		})
	}



	v_value(mkcquote: MarketCalcQuote, k: string) {
		let v = mkcquote[k]
		if (_.isString(v)) return v;
		else if (k == 'status') return this.v_status(mkcquote as any);
		else if (k == 'volume') return utils.formatNumber(v, 0);
		else if (k == 'vibrateRatio') return utils.formatNumber(v * 100, 2) + '%';
		else if (k == 'lastStamp' || k == 'stamp') return utils.format_stamp(v, true);
		else if (Number.isFinite(v)) return utils.formatNumber(v, 2);
		return v
	}



}



// const ctAxisPointer = function() {
// 	return function(chart) {
// 		console.log('chartist', chartist)
// 		// utils.keys('chartist', chartist)
// 		console.debug('chart')
// 		console.dir(chart)

// 		// chartist.createSvg(chart.container, '10', '10', 'idk')

// 		chart.on('created', function(data) {
// 			console.log('created', data)

// 			let width = data.svg.width()
// 			let height = data.svg.height()

// 			// let defs = data.svg.elem('defs')
// 			// console.log('defs', defs)

// 			// defs
// 			// 	.elem('mask', {
// 			// 		x: 0,
// 			// 		y: 0,
// 			// 		width: width,
// 			// 		height: height,
// 			// 		id: 'someid'
// 			// 	})
// 			// 	.elem('rect', {
// 			// 		x: 0,
// 			// 		y: 0,
// 			// 		width: width,
// 			// 		height: height,
// 			// 		fill: 'white'
// 			// 	})

// 			// data.svg.append(defs, true)

// 			// let line = chartist.Svg.Path.prototype.line
// 			// let line = new chartist.Svg.Path()
// 			// line.line(0, 5)
// 			// console.log('line', line)

// 			let title = new chartist.Svg('text')
// 			title.addClass('ct-axis-title')
// 			title.text('ewfegw fwg')
// 			title.attr({
// 				x: 0,
// 				y: height,
// 			})
// 			data.svg.append(title, true)

// 		})

// 		chart.container.addEventListener('mouseover', function(event) {
// 			console.log('mouseover', event)
// 		})
// 		chart.container.addEventListener('mousemove', function(event: MouseEvent) {
// 			console.log('mousemove', event)

// 			// let title = new chartist.Svg('text')
// 			// title.addClass('ct-axis-title')
// 			// title.text('wtf')
// 			// title.attr({
// 			// 	x: _.random(1,100),
// 			// 	y: _.random(1,100),
// 			// })
// 			// console.log('title', title)
// 			// console.log('chart.svg', chart.svg)
// 			// // chart.svg.append(title, true)

// 		})
// 		chart.container.addEventListener('mouseout', function(event) {
// 			console.log('mouseout', event)
// 		})
// 		// console.log('chart', chart)
// 	}
// }






