//

import * as Template from './symbol.chart.html?style=./symbol.chart.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import moment from 'moment'
import Symbol from './symbol'
import * as echarts from 'echarts'
import * as Snackbar from '../../comps/snackbar/snackbar'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'
import * as charts from '../../services/charts'
import * as ecbones from '../../services/ecbones'
import * as datasets from '../../services/datasets'
import * as historicals from '../../services/historicals'



@Vts.Component(<VueComponent>{
	name: 'SymbolChartChart',
	template: '<div v-on:mousewheel="onMouseWheelChart"></div>',
} as any)
class SymbolChartChart extends Vue {

	get parent() { return this.$parent as SymbolChart }

	@Vts.Prop() datasets: Array<datasets.Dataset>
	@Vts.Prop() cquote: CalcQuote

	echart: echarts.ECharts
	quotes: Array<FullQuote>
	offsetWidth: number
	offsetHeight: number
	startPrice: number
	height: number
	ctbounds: ChartBounds
	tipspos: any
	primaryHeight: number
	gridHeight = 150

	created() {
		this.quotes = []
		this.ctbounds = { start: 0, startValue: 0, end: 100, endValue: 0, needsupdate: false }
		this.ondatazoom = _.debounce(this._ondatazoom, 100, { leading: false, trailing: true })
		this.onresize = _.debounce(this._onresize, 300, { leading: false, trailing: true })
	}

	mounted() {
		this.offsetWidth = this.$el.parentElement.offsetWidth
		this.offsetHeight = this.$el.parentElement.offsetHeight
		this.echart = echarts.init(this.$el as any, null, { width: this.offsetWidth, height: this.offsetHeight })
		this.echart.on('click', this.onclick)
		this.echart.on('datazoom', this.ondatazoom)
		this.echart.on('showtip', this.onshowtip)
		this.echart.on('hidetip', this.onhidetip)
		this.$el.addEventListener('dblclick', this.ondblclick)
		window.addEventListener('keydown', this.onkeydown)
		window.addEventListener('keyup', this.onkeyup)
		window.addEventListener('resize', this.onresize)
	}

	beforeDestroy() {
		this.echart.off('click')
		this.echart.off('datazoom')
		this.echart.off('showtip')
		this.echart.off('hidetip')
		this.echart.clear()
		this.echart.dispose()
		this.echart = null
		this.ondatazoom.cancel()
		this.ondatazoom = null
		this.onresize.cancel()
		this.onresize = null
		this.quotes.splice(0)
		this.$el.removeEventListener('dblclick', this.ondblclick)
		window.removeEventListener('keydown', this.onkeydown)
		window.removeEventListener('keyup', this.onkeyup)
		window.removeEventListener('resize', this.onresize)
	}

	onresize: (() => void) & _.Cancelable
	_onresize() {
		this.offsetWidth = this.$el.parentElement.offsetWidth
		this.offsetHeight = this.$el.parentElement.offsetHeight
		this.syncDatasets()
	}
	resize() {
		this.offsetWidth = this.$el.parentElement.offsetWidth
		this.offsetHeight = this.$el.parentElement.offsetHeight
		this.echart.resize({ width: this.offsetWidth })
		if (this.parent.source == 'yahoo') return;
		let splitNumber = _.floor(this.offsetWidth / 150)
		let bones = this.echart.getOption()
		bones.xAxis.forEachFast(v => v.splitNumber = splitNumber)
		this.echart.setOption(bones)
	}

	ondatazoom: (() => void) & _.Cancelable
	_ondatazoom() {
		let bones = this.echart.getOption()
		if (!_.isEmpty(bones.dataZoom)) Object.assign(this.ctbounds, _.pick(bones.dataZoom[0], ['start', 'startValue', 'end', 'endValue']));
		if (_.isEmpty(this.quotes)) return;
		if (this.ctbounds.needsupdate) {
			this.ctbounds.needsupdate = false
			this.syncQuotes(true)
		}
		let quote = this.parent.source == 'lives' ? this.quotes.find(v => v && v.lastStamp >= this.ctbounds.startValue) : this.quotes[this.ctbounds.startValue]
		this.startPrice = quote[this.parent.source == 'lives' ? 'lastPrice' : 'open']
	}

	onshowtip(event: any) {
		this.tipspos = { x: event.x, y: event.y }
	}
	onhidetip(event: any) {
		this.tipspos = null
	}

	onclick(event: any) {
		if (this.parent.source != 'lives') return;
		// console.log('event', event)
		let stamp = event.value[0] as number
		let ds = this.parent.datasets.find(v => v.backtestable)
		if (ds) {
			let bkindex = this.quotes.findIndex(v => v.lastStamp == stamp)
			if (bkindex == -1) return;
			ds.bkindex = bkindex
			this.parent.debounceSyncDatasets()
			// this.$nextTick(this.parent.debounceSyncDatasets.cancel)
			// this.parent.debounceSyncDatasets()
			// if (_.get(this.parent, 'editing.uuid') != ds.uuid) this.syncDatasets();
		}
	}

	ondblclick(event: MouseEvent) {
		let bones = this.echart.getOption()
		// console.log('ondblclick > bones', bones)
		console.log('ondblclick > this.echart', this.echart)
		let gindex = bones.grid.mapFast((v, i) => this.echart.containPixel({ gridIndex: [i] }, [event.offsetX, event.offsetY])).findIndex(v => v == true)
		if (gindex == 0) {
			if (this.ctbounds.start == 0 && this.ctbounds.end == 100) return;
			this.echart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
		}
		if (gindex > 0) {
			if (this.usingscrollgrid == gindex - 1) {
				this.usingscrollgrid = NaN
				let scrollgrid = this.scrollgrid
				this.scrollgrid = 0
				this.echart.setOption(this.getScrollGrids(this.echart.getOption()))
				this.$nextTick(() => this.scrollgrid = scrollgrid)
				return
			}
			let grid = bones.grid[gindex]
			let gbottom = grid.top + grid.height + 30
			let el = ((event as any).path as Array<HTMLElement>).find(v => v.id == 'sc_chart_scroll')
			this.usingscrollgrid = gindex - 1
			if (this.usingscrollgrid == this.scrollgrid) this.echart.setOption(this.getScrollGrids(this.echart.getOption()));
			el.scrollTo({ top: gbottom - el.offsetHeight, behavior: 'instant' })
		}
	}

	mainheight: number
	eachheight: number
	scrollgrid = 0
	usingscrollgrid = NaN
	onchartscroll(event: MouseEvent) {
		if (!Number.isFinite(this.mainheight)) return;
		let el = event.target as HTMLElement
		let scrolltop = el.offsetHeight + el.scrollTop
		let yscroll = scrolltop - (this.mainheight - 20) - this.eachheight
		let scrollgrid = Math.max(_.floor(yscroll / this.eachheight), 0)
		if (this.scrollgrid == scrollgrid) return;
		this.scrollgrid = scrollgrid
		if (Number.isFinite(this.usingscrollgrid)) {
			if (this.usingscrollgrid != this.scrollgrid) {
				this.usingscrollgrid = NaN
				this.scrollgrid = 0
			}
			this.echart.setOption(this.getScrollGrids(this.echart.getOption()))
		}
	}
	getScrollGrids(bones: ECharts.Options): ECharts.Options {
		let gtop = 20 + (this.scrollgrid * this.eachheight)
		let dtop = gtop + this.mainheight - 65
		return {
			dataZoom: [{ top: dtop }],
			grid: bones.grid.mapFast((grid, i) => {
				if (i == 0) return { top: gtop } as ECharts.Grid;
				if (i > 0 && i <= this.scrollgrid) return { left: Infinity } as ECharts.Grid;
				return { left: 60, right: 40 } as ECharts.Grid;
			}),
		}
	}

	zoomtoolbox() { return (this.echart as any)._componentsViews.find(v => v && v.__id.indexOf('0_toolbox') >= 0)._features.dataZoom.model.iconPaths.zoom }
	onkeydown(event: KeyboardEvent) {
		if (!event.shiftKey || event.key != 'Shift') return;
		let zoom = this.zoomtoolbox()
		if (zoom.style.stroke != '#666') return;
		zoom.trigger('click')
	}
	onkeyup(event: KeyboardEvent) {
		if (event.key != 'Shift') return;
		let zoom = this.zoomtoolbox()
		if (zoom.style.stroke == '#666') return;
		zoom.trigger('click')
	}

	syncDatasets(reset = false) {
		if (_.isEmpty(this.echart)) return;

		let tstart = Date.now()
		if (reset) this.echart.clear();
		let prebones = this.echart.getOption() || {} as ECharts.Options
		let bones = ecbones.blank({ dataZoom: true })
		bones.toolbox = { itemSize: 0, feature: { dataZoom: { show: true, yAxisIndex: false } } }

		bones.tooltip.formatter = params => charts.tooltipFormatter(params, { linkpointer: this.parent.linkpointer, axishr: true, masterhr: true, uuidhr: true })
		bones.dataZoom[0].labelFormatter = this.labelFormatter

		let gridIndex = 0
		let xAxisIndex = 0
		let yAxisIndex = 0
		let seriesIndex = 0
		this.datasets.forEachFast((ds, i) => {
			if (ds.id == 'lives') ds.candles = this.parent.livecandles;
			let dsbones = ds.bones(this.quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, this.parent.source)
			if (_.isArray(dsbones.xAxis)) {
				dsbones.xAxis.forEachFast((xaxis, ii) => {
					gridIndex = _.max([gridIndex, xaxis.gridIndex])
					bones.xAxis.push(xaxis)
				})
			}
			if (_.isArray(dsbones.yAxis)) {
				dsbones.yAxis.forEachFast((yaxis, ii) => {
					if (gridIndex >= 1) {
						yaxis.axisLine = { show: false }
						yaxis.splitNumber = 3 // _.ceil(this.gridHeight / 33)
					}
					bones.yAxis.push(yaxis)
				})
			}
			if (_.isArray(dsbones.visualMap)) {
				dsbones.visualMap.forEachFast((vismap, ii) => {
					bones.visualMap.push(vismap)
				})
			}
			let data = ds.data(this.quotes, this.cquote)
			dsbones.series.forEachFast((series, ii) => {
				xAxisIndex = _.max([xAxisIndex, series.xAxisIndex])
				yAxisIndex = _.max([yAxisIndex, series.yAxisIndex])
				series.id = ds.id + ':' + ds.uuid + ':' + shared.parseToId(series.name, true) + ':' + shared.parseToId(bones.xAxis[xAxisIndex].name, true) + ':' + ii
				series.data = data[ii]
				bones.series.push(series)
				let vismap = bones.visualMap.find(v => v.seriesIndex.indexOf(seriesIndex) >= 0)
				if (vismap) {
					let values = series.data.mapFast(v => v.value[1])
					vismap.pieces[0].max = _.max(values.concat(0)) * 1.1
					vismap.pieces[1].min = _.min(values.concat(0)) * 1.1
				}
				seriesIndex++
			})
		})

		let grids = _.uniq(bones.xAxis.mapFast(v => v.gridIndex))
		// let offsetHeight = grids.length == 1 ? this.offsetHeight : (this.offsetHeight * 0.75)
		let offsetHeight = grids.length == 1 ? this.offsetHeight : (this.offsetHeight - (this.gridHeight + 25))
		// offsetHeight = shared.math_clamp(offsetHeight, 400, 600)
		offsetHeight = _.max([offsetHeight, 400])
		this.primaryHeight = offsetHeight
		let height = offsetHeight - 100
		bones.grid.push({
			show: false,
			left: 60,
			right: 40,
			top: 20,
			height,
		})
		height = height + 50
		_.merge(bones.dataZoom[0], {
			left: 60,
			right: 40,
			top: height,
			height: 30,
		} as ECharts.DataZoom)
		height = height + 45

		this.mainheight = height
		this.eachheight = this.gridHeight + 40

		grids.forEachFast(v => {
			if (v == 0) return;
			bones.grid.push({
				show: true,
				left: 60,
				right: 40,
				top: height,
				height: this.gridHeight,
				borderColor: ecbones.Styles.t,
				borderWidth: 1,
				z: 9,
				// zlevel: 2,
			})
			height = height + this.gridHeight + 40
		})
		height = height - 10

		bones.dataZoom.forEachFast((v, i) => {
			v.xAxisIndex = grids
			_.merge(v, this.ctbounds)
		})

		let xsnumber = _.floor(this.offsetWidth / 150)
		bones.xAxis.forEachFast(function(axis) {
			axis.splitNumber = xsnumber
			if (_.get(axis, 'axisLabel.show') == true) {
				_.merge(axis, { axisLabel: { formatter: function(x: number) { return charts.xlabel(x) } } } as ECharts.Axis)
			}
			if (_.get(axis, 'axisPointer.show') == true) {
				_.merge(axis, { axisPointer: { label: { formatter: function(params) { return charts.xlabel(params.value, true) } } } } as ECharts.Axis)
			}
		})
		bones.yAxis.forEachFast(function(axis) {
			if (_.get(axis, 'axisLabel.show') == true) {
				_.merge(axis, { axisLabel: { formatter: function(y: number) { return utils.formatNumber(y, null, 1000) } } } as ECharts.Axis)
			}
			if (_.get(axis, 'axisPointer.show') == true && axis.gridIndex > 0) {
				_.merge(axis, { axisPointer: { label: { formatter: function(params) { return utils.formatNumber(params.value, null, 10000) } } } } as ECharts.Axis)
			}
		})
		_.merge(bones.yAxis[0], { axisPointer: { label: { formatter: params => utils.formatPrice(params.value) + '\n' + utils.humanPlusMinus(shared.calcPercentChange(params.value, this.startPrice), 1, false, false) + '%' } } } as ECharts.Axis)

		let mldata = []
		if (this.parent.source == 'lives') {
			bones.xAxis.forEachFast(function(v) {
				v.type = 'time'
			})
			bones.series.forEachFast(v => v.silent = ['scatter', 'line'].indexOf(v.type) == -1)
			mldata = mldata.concat(charts.livesMlData(this.quotes))
		}
		if (this.parent.source == 'yahoo') {
			this.parent.datasets.forEachFast
			let stamps = this.quotes.mapFast(v => v.lastStamp)
			bones.xAxis.forEachFast(function(v) {
				v.type = 'category'
				v.data = stamps
			})
			bones.series.forEachFast((series, i) => {
				let xs = [] as Array<number>
				let ys = [] as Array<number>
				series.data.forEachFast(function(v) {
					if (i <= 1) v.value.shift();
					else xs.push(v.value.shift());
					if (v.value.length == 1) v.value = v.value[0] as any;
					if (i >= 2) ys.push(v.value as any);
				})
				if (xs.length > 0) {
					this.quotes.forEachFast((quote, ii) => {
						let index = xs.indexOf(quote.lastStamp)
						if (index >= 0) {
							xs.splice(index, 1)
							ys.splice(index, 1)
						} else {
							series.data.splice(ii, 0, { value: null })
						}
					})
					xs.forEachFast(function(x, ii) {
						let index = utils.array_closest(stamps, x)
						if (shared.isBad(series.data[index].value)) {
							series.data[index].value = ys[ii] as any
							xs.splice(index, 1)
							ys.splice(index, 1)
						} else if (shared.isBad(series.data[index - 1].value)) {
							series.data[index - 1].value = ys[ii] as any
							xs.splice(index, 1)
							ys.splice(index, 1)
						} else if (shared.isBad(series.data[index + 1].value)) {
							series.data[index + 1].value = ys[ii] as any
							xs.splice(index, 1)
							ys.splice(index, 1)
						} else {
							console.error('YAHOO CANT FIT >', series.name, index, x, ys[ii])
							Snackbar.rxItems.next({ message: 'YAHOO CANT FIT > ' + series.name, color: 'error' })
						}
					})
				}
				if (i >= 2 && series.xAxisIndex == 0 && !Number.isFinite(series.z)) series.z = 9;
			})
			mldata = mldata.concat(charts.yahooMlData(this.quotes, stamps, this.parent.range))
		}

		this.fixXaxisAlignment(bones)

		let xaxis = -1
		bones.series.forEachFast((series, i) => {
			if (series.xAxisIndex <= xaxis) return;
			xaxis = series.xAxisIndex
			series.markLine = ecbones.markLine({ data: mldata })
		})

		bones.xAxis.forEachFast((v, i) => {
			if (v.nameTextStyle) {
				let grid = bones.grid[v.gridIndex]
				v.nameGap = -grid.height + 0.5
				if (v.name && v.name.indexOf('%') >= 0) {
					v.name = v.name.replace('%', '％')
				}
			}
		})

		if (this.usingscrollgrid == this.scrollgrid) _.merge(bones, this.getScrollGrids(bones));

		console.log('syncDatasets', shared.getDuration(tstart), '> bones', bones)
		this.echart.setOption(bones, true)

		if (reset) {
			this.echart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
			this.ondatazoom.flush()
		}

		if (height != this.height || this.offsetWidth != this.$el.parentElement.offsetWidth) {
			// console.warn('height != this.height', height != this.height)
			// console.warn('this.offsetWidth != this.$el.parentElement.offsetWidth', this.offsetWidth != this.$el.parentElement.offsetWidth)
			this.offsetWidth = this.$el.parentElement.offsetWidth
			this.height = height
			this.echart.resize({ width: this.offsetWidth, height })
			let el = document.getElementById('sc_chart_scroll')
			let scroll = el.scrollTop
			this.$nextTick(() => el.scrollTop = scroll)
		}

		if (this.parent.showedit && this.parent.editing) {
			if (!_.isEmpty(this.parent.editing.notes)) this.$nextTick(() => this.parent.$forceUpdate());
		}
		this.parent.saveDatasets()

	}

	syncQuotes(clean = false) {
		// if (this.parent.picking == true) return;
		if (this.parent.source == 'yahoo') return;

		let prebones = this.echart.getOption()
		if (_.isEmpty(this.quotes)) {
			this.echart.setOption({ series: prebones.series.mapFast(v => { return { data: [] } }) })
			return
		}

		if (clean == true) _.remove(this.quotes, v => v.iscalc);
		if (this.ctbounds.end < 100) return this.ctbounds.needsupdate = true;

		let tstart = Date.now()
		let bones = { series: [], visualMap: [] } as ECharts.Options
		this.datasets.forEachFast(ds => {
			let data = ds.data(this.quotes, this.cquote)
			data.forEachFast(v => bones.series.push({ data: v }))
		})

		prebones.visualMap.forEachFast(function(vismap, i) {
			let sindexes = vismap.seriesIndex as Array<number>
			sindexes.forEachFast(function(sindex, ii) {
				let values = bones.series[sindex].data.mapFast(v => v.value[1])
				vismap.pieces[(ii * 2) + 0].max = _.max(values.concat(0)) * 1.1
				vismap.pieces[(ii * 2) + 1].min = _.min(values.concat(0)) * 1.1
			})
			bones.visualMap.push(vismap)
		})

		this.fixXaxisAlignment(bones)

		if (bones.series.length != prebones.series.length) {
			// console.warn('syncQuotes > bones.series.length != prebones.series.length')
			// console.log('prebones.series', shared.clone(prebones.series))
			// console.log('bones.series', shared.clone(bones.series))
			return this.parent.debounceSyncDatasets()
		}

		// console.log('syncQuotes', shared.getDuration(tstart), '> bones', bones)
		this.echart.setOption(bones)

		if (!_.isEmpty(this.tipspos)) {
			let tipspos = Object.assign({}, this.tipspos)
			setTimeout(() => this.echart.dispatchAction(Object.assign({ type: 'showTip' }, tipspos)), 1)
		}

	}

	fixXaxisAlignment(bones: ECharts.Options) {
		if (_.isEmpty(this.quotes)) return;
		if (this.parent.source == 'lives') {
			let minstamp = _.min(bones.series.filter(v => v.data[0]).mapFast(function(series) {
				return series.data[0].value[0]
			}))
			let maxstamp = _.max(bones.series.filter(v => v.data[0]).mapFast(function(series) {
				return series.data[series.data.length - 1].value[0]
			}))
			bones.series.filter(v => v.data[0]).forEachFast(function(series) {
				if (series.yAxisIndex <= 1) return;
				if (series.data[0].value[0] != minstamp) {
					let first = shared.clone(series.data[0])
					first.value = [minstamp, null]
					series.data.unshift(first)
				}
				if (series.data[series.data.length - 1].value[0] != maxstamp) {
					let last = shared.clone(series.data[series.data.length - 1])
					last.value = [maxstamp, null]
					series.data.push(last)
				}
			})
		}
	}

	labelFormatter(i: number, x: any): string {
		if (this.parent.source == 'lives') return charts.xlabel(i);
		if (this.parent.source == 'yahoo') return charts.xlabel(_.parseInt(x));
	}

	onMouseWheelChart(event: WheelEvent) {
		if (Math.abs(event.wheelDeltaY) >= Math.abs(event.wheelDeltaX)) return;
		let deltaX = event.deltaX
		if (_.round(event.deltaX) == 0) return;
		if (this.ctbounds.start == 0 && deltaX < 0) return;
		if (this.ctbounds.end == 100 && deltaX > 0) return;
		let zoomwidth = this.ctbounds.end - this.ctbounds.start
		if (zoomwidth == 100) return;
		let scale = (zoomwidth / (this.$el.offsetWidth * 0.5))
		deltaX = deltaX * scale
		let start = shared.math_clamp(this.ctbounds.start + deltaX, 0, 100 - zoomwidth)
		let end = shared.math_clamp(this.ctbounds.end + deltaX, zoomwidth, 100)
		this.echart.dispatchAction({ type: 'dataZoom', start, end })
		Object.assign(this.ctbounds, { start, end })
	}

}



@Template
@Vts.Component(<VueComponent>{
	name: 'SymbolChart',
	components: {
		'symbol-chart-chart': SymbolChartChart,
	},
} as any)
export default class SymbolChart extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	get parent() { return this.$parent as Symbol }
	get cquote() { return this.parent.cquote }

	get chart() { return this.$children.find(v => v.$options.name == 'SymbolChartChart') as SymbolChartChart }
	onchartscroll(event: MouseEvent) { this.chart.onchartscroll(event) }

	created() {
		this.sync()
	}

	mounted() {
		// _.delay(() => this.showpicker = true, 1000)
		// _.delay(() => this.setEditing(this.datasets.find(v => v.settings && v.settings.length > 0).uuid), 1000)
	}

	beforeDestroy() {
		socket.emitter.removeListener(this.socketLiveQuote)
		this.sync.cancel()
		this.sync = null
	}



	get symbol() { return this.$route.params.symbol.toUpperCase() }
	@Vts.Watch('symbol') w_symbol() {
		this.sync()
	}

	busy = false
	get loading() { return this.parent.loading }
	@Vts.Watch('loading') w_loading(to: boolean, from: boolean) {
		if (from == true && to == false) this.$nextTick(this.sync);
	}
	get v_busy() { return this.busy || this.loading }



	sources = ['lives', 'yahoo']
	source = lockr.get('symbol.chart.source', this.sources[0]) as 'lives' | 'yahoo'
	@Vts.Watch('source') w_source(to: string, from: string) {
		lockr.set('symbol.chart.source', to)
		socket.emitter.removeListener(this.socketLiveQuote)
		if (to != from) {
			this.resetPicking()
			this.datasets.splice(0)
		}
		this.sync()
		this.sync.flush()
	}

	get pickstartstamp() { return utils.parseDateTimePicked(this.livesrangepicker.dstart, this.livesrangepicker.tstart).valueOf() }
	get pickendstamp() { return utils.parseDateTimePicked(this.livesrangepicker.dend, this.livesrangepicker.tend).valueOf() }
	livesrangepicker = lockr.get('symbol.chart.livesrangepicker', {
		dstart: shared.moment().format('YYYY-MM-DD'),
		tstart: shared.moment(process.$marketStamps.am4).format('h:mma'), // '9:30am',
		dend: shared.moment().format('YYYY-MM-DD'),
		tend: shared.moment(process.$marketStamps.pm8).format('h:mma'), // '4:00pm',
	} as LivesRangePicker)
	@Vts.Watch('livesrangepicker', { deep: true }) w_livesrangepicker(to: LivesRangePicker, from: LivesRangePicker) {
		lockr.set('symbol.chart.livesrangepicker', to)
		let dstart = shared.moment(new Date(to.dstart)).valueOf()
		let dend = shared.moment(new Date(to.dend)).valueOf()
		if (dstart > dend) {
			this.$nextTick(() => this.livesrangepicker.dend = shared.moment(dstart).add(1, 'day').format('YYYY-MM-DD'))
			return
		}

		let day = shared.moment().startOf('day').valueOf()
		let am4 = process.$marketStamps.am4 - day
		let pm8 = process.$marketStamps.pm8 - day
		let mstart = shared.moment(to.tstart, 'h:mma').valueOf() - day
		if (am4 > mstart) return this.$nextTick(() => this.livesrangepicker.tstart = shared.moment(to.tstart, 'h:mma').add(12, 'hours').format('h:mma'));
		if (pm8 < mstart) return this.$nextTick(() => this.livesrangepicker.tstart = shared.moment(to.tstart, 'h:mma').subtract(12, 'hours').format('h:mma'));
		let mend = shared.moment(to.tend, 'h:mma').valueOf() - day
		if (am4 > mend) return this.$nextTick(() => this.livesrangepicker.tend = shared.moment(to.tend, 'h:mma').add(12, 'hours').format('h:mma'));
		if (pm8 < mend) return this.$nextTick(() => this.livesrangepicker.tend = shared.moment(to.tend, 'h:mma').subtract(12, 'hours').format('h:mma'));

		this.sync()
	}
	v_format_picker(date: string) {
		return shared.moment(new Date(date)).utc().format('ddd, MMM D')
		// let stamp = shared.moment(new Date(date)).utc().valueOf()
		// let mstamp = shared.moment(stamp)
		// if (stamp >= shared.moment().startOf('day').valueOf()) return 'Today';
		// else if (stamp >= shared.moment().startOf('day').subtract(1, 'day').valueOf()) return 'Yesterday';
		// else return mstamp.format('ddd, MMM D');
	}

	ranges = shared.clone(historicals.YRanges).reverse()
	range = lockr.get('symbol.chart.range', '5d') // this.ranges[this.ranges.length - 2])
	@Vts.Watch('range') w_range(to: string, from: string) {
		if (this.source != 'yahoo') this.source = 'yahoo';
		lockr.set('symbol.chart.range', to)
		this.interval = historicals.YFrames[to]
		this.sync()
	}
	intervals = shared.clone(historicals.YIntervals).reverse()
	interval = lockr.get('symbol.chart.interval', '15m') // this.intervals[0])
	@Vts.Watch('interval') w_interval(to: string, from: string) {
		lockr.set('symbol.chart.interval', to)
		this.sync()
	}
	v_pretty_period(period: string) { return historicals.prettyPeriod(period) }





	/*████████████████████████████████
	█            SETTINGS            █
	████████████████████████████████*/

	linkpointer = lockr.get('symbol.chart.linkpointer', false)
	@Vts.Watch('linkpointer') w_linkpointer(linkpointer: boolean) {
		lockr.set('symbol.chart.linkpointer', linkpointer)
	}

	livecandles = lockr.get('symbol.chart.livecandles', false)
	@Vts.Watch('livecandles') w_livecandles(livecandles: boolean) {
		lockr.set('symbol.chart.livecandles', livecandles)
		this.chart.syncDatasets()
	}

	liveminutes = lockr.get('symbol.chart.liveminutes', true)
	@Vts.Watch('liveminutes') w_liveminutes(liveminutes: boolean) {
		lockr.set('symbol.chart.liveminutes', liveminutes)
		this.syncLives(false)
	}

	syncing = lockr.get('symbol.chart.syncing', true)
	@Vts.Watch('syncing') w_syncing(syncing: boolean) {
		lockr.set('symbol.chart.syncing', syncing)
		this.chart.syncQuotes(true)
	}





	/*████████████████████████████
	█            SYNC            █
	████████████████████████████*/

	sync = _.debounce(this._sync, 300, { leading: false, trailing: true })
	_sync() {
		if (this.loading) return;

		if (_.isEmpty(this.datasets)) {
			let id = { yahoo: 'historicals', lives: 'lives' }[this.source]
			let mdataset = new datasets.Dataset(datasets.Templates.find(v => v.id == id), this.source)
			this.datasets.push(mdataset)

			let saveds = lockr.get('symbol.chart.datasets.' + this.source, []) as Array<datasets.Dataset>
			saveds.forEachFast(saved => {
				let template = datasets.Templates.find(vv => vv.id == saved.id)
				if (_.isEmpty(template)) return;
				let dataset = new datasets.Dataset(template, this.source)
				_.merge(dataset, saved)
				this.datasets.push(dataset)
			})
		}

		this.datasets.filter(v => !_.isEmpty(v.bkquotes)).forEachFast(v => v.bkquotes.splice(0))

		if (this.source == 'yahoo') {
			this.syncHistoricals()
		} else if (this.source == 'lives') {
			this.syncLives()
		}
	}

	syncHistoricals() {
		this.busy = true
		historicals.getChart(this.symbol, this.range, this.interval).then(response => {
			utils.vdestroyedSafety(this)
			if (this.source != 'yahoo') return Promise.resolve();
			if (response.length == 0) Snackbar.rxItems.next({ message: 'Historical quotes for requested range (' + this.range + ') is empty.', color: 'warning' });
			this.chart.quotes = response
			this.chart.syncDatasets(true)
		}).catch(function(error) {
			console.error('syncHistoricals > error', error)
		}).then(() => this.$nextTick(() => this.busy = false))
	}

	syncLives(reset = true) {
		this.busy = true
		socket.emitter.removeListener(this.socketLiveQuote)
		http.post<GetLivesRangeBody, GetLivesRangeResponse>('/lives.range', {
			symbol: this.symbol,
			start: this.pickstartstamp,
			end: this.pickendstamp,
			minutes: this.liveminutes,
		}).then(response => {
			utils.vdestroyedSafety(this)
			if (this.source != 'lives') return Promise.resolve();
			response = response.mapFast(v => shared.explode(shared.RMAP.LIVES, v))
			if (response.length == 0) {
				let reqstart = this.v_format_picker(this.livesrangepicker.dstart) + ' ' + this.livesrangepicker.tstart
				let reqend = this.v_format_picker(this.livesrangepicker.dend) + ' ' + this.livesrangepicker.tend
				Snackbar.rxItems.next({ message: 'Live quotes for requested range (' + reqstart + ' ▶ ' + reqend + ') is empty.', color: 'warning' })
			}
			if (response.length > 0) response.sort((a, b) => a.lastStamp - b.lastStamp);
			this.chart.quotes = response
			this.chart.syncDatasets(reset)
			let rkey = this.liveminutes ? shared.RKEY.LIVES_MINUTES : shared.RKEY.LIVES
			socket.emitter.addListener(rkey + ':' + this.symbol, this.socketLiveQuote)
			if (this.bkauto) {
				let index = this.datasets.findIndex(v => v.backtestable)
				if (index >= 0) {
					this.eindex = index
					this.runBacktest()
					this.$nextTick(() => this.showedit = true)
				}
			}
		}).catch(error => {
			console.error('syncLives > error', error)
		}).then(() => this.$nextTick(() => this.busy = false))
	}

	socketLiveQuote(lquote: LiveQuote) {
		if (this.busy || this.source != 'lives') return;
		lquote = shared.explode(shared.RMAP.LIVES, lquote)
		if (lquote.lastStamp < this.pickstartstamp || lquote.lastStamp > this.pickendstamp) return;
		this.chart.quotes.push(lquote)
		if (!this.syncing) return;
		this.chart.syncQuotes(true)
	}

	@Vts.Watch('cquote', { deep: true }) w_cquote(cquote: CalcQuote, fcquote: CalcQuote) {
		if (this.busy || !this.syncing || this.source != 'lives' || _.isEmpty(this.chart.quotes)) return;
		if (cquote.lastStamp < this.pickstartstamp || cquote.lastStamp > this.pickendstamp) return;
		let laststamp = this.chart.quotes[this.chart.quotes.length - 1].lastStamp
		if (cquote.lastStamp <= laststamp) return;
		cquote = shared.clone(cquote)
		cquote.iscalc = true
		let found = this.chart.quotes.find(v => v.iscalc)
		if (found) shared.merge(found, cquote);
		else this.chart.quotes.push(cquote);
		this.chart.syncQuotes()
	}





	/*██████████████████████████████████████
	█            DATASET PICKER            █
	██████████████████████████████████████*/

	get picking() { return this.showpicker || this.showedit || this.showbacktest }
	resetPicking() {
		this.showpicker = false
		this.showedit = false
		this.showbacktest = false
		this.eindex = -1
	}
	@Vts.Watch('picking') w_picking(to: boolean, from: boolean) {
		if (to || to == from) return;
		this.$nextTick(() => {
			if (this.picking) return;
			if (this.chart.offsetWidth != this.chart.$el.parentElement.offsetWidth) this.chart.resize();
		})
	}

	pickersearch = ''
	showpicker = false
	pickersync = false
	@Vts.Watch('showpicker') w_showpicker = _.debounce(this._w_showpicker, 300, { leading: false, trailing: true })
	_w_showpicker(to: boolean, from: boolean) {
		if (to == true) {
			document.getElementById('sc_picker_search').focus()
		}
		if (to == false) {
			this.pickersearch = ''
			if (this.pickersync) {
				this.pickersync = false
				this.chart.syncDatasets()
			}
		}
	}

	togglePicker() {
		this.resetPicking()
		if (!this.showpicker) this.showpicker = true;
	}

	templates = datasets.Templates
		.filter(v => !v.master)
		.mapFast(v => {
			v = _.pick(v, ['id', 'dname', 'category', 'sources', 'helpurl', 'single']) as any
			v.favorite = lockr.get('datasets.favorites.' + v.id, false)
			return v
		})

	get v_templates() {
		return _.orderBy(this.templates, ['favorite', 'dname'], ['desc', 'asc']).filter(v => {
			return v.sources.length > 0 ? v.sources.indexOf(this.source) >= 0 : true
		}).filter(v => {
			if (v.single) {
				let exists = this.datasets.find(vv => vv.id == v.id)
				if (exists) return false;
			}
			let tsearch = utils.cleanSearch(this.pickersearch)
			if (tsearch.length == 0) return true;
			let cleaned = utils.cleanSearch(v.id + ' ' + v.dname)
			return cleaned.indexOf(tsearch) >= 0
		})
	}

	toggleFavorite(item: datasets.Dataset, i: number) {
		lockr.set('datasets.favorites.' + item.id, !item.favorite)
		item.favorite = !item.favorite
	}

	pickTemplate(item: datasets.Dataset) {
		let dataset = new datasets.Dataset(datasets.Templates.find(v => v.id == item.id), this.source)
		this.datasets.push(dataset)
		this.pickersync = true
		if (dataset.autoedit) this.setEditing(dataset.uuid);
		if (dataset.backtestable && this.bkauto) {
			this.setEditing(dataset.uuid)
			this.runBacktest()
		}
	}

	resetAllDatasets() {
		this.datasets.splice(1)
		this.resetPicking()
		_.delay(function() {
			document.getElementById('sc_chart_scroll').scrollTo({ top: 0, behavior: 'smooth' })
		}, 100)
	}





	/*████████████████████████████████
	█            DATASETS            █
	████████████████████████████████*/

	datasets = [] as Array<datasets.Dataset>
	get v_datasets() {
		return this.datasets.filter(v => !v.master)
	}

	@Vts.Watch('datasets') w_datasets(to: Array<datasets.Dataset>, from: Array<datasets.Dataset>) {
		if (to.length == 0 || this.busy) return;
		// this.saveDatasets()
		// if (this.showpicker) return;
		this.debounceSyncDatasets()
	}

	saveDatasets() {
		let saves = [] as Array<datasets.Dataset>
		this.datasets.forEachFast(function(ds) {
			if (ds.master) return;
			let save = { id: ds.id, bkindex: ds.bkindex, settings: [], notes: [] } as datasets.Dataset
			ds.settings.forEachFast(v => save.settings.push({ id: v.id, value: v.value } as DatasetSetting))
			ds.notes.forEachFast(v => save.notes.push({ id: v.id, graph: v.graph } as DatasetNote))
			saves.push(save)
		})
		lockr.set('symbol.chart.datasets.' + this.source, saves)
	}

	showedit = false
	@Vts.Watch('showedit') w_showedit(to: boolean, from: boolean) {
		if (this.loading) this.$nextTick(() => this.showedit = false);
		if (to != from) this.$nextTick(() => this.chart.resize());
	}

	eindex = -1

	editcache: string
	get editing() { return this.datasets[this.eindex] || {} as datasets.Dataset }
	@Vts.Watch('editing', { deep: true }) w_editing(to: datasets.Dataset, from: datasets.Dataset) {
		// if (Array.isArray(to.settings)) console.log('editing > to.settings', shared.clone(to.settings));
		if (_.isEmpty(to) || _.isEmpty(from)) return;

		let cache = JSON.stringify(_.pick(to, ['settings']))
		if (!this.editcache) this.editcache = cache;

		if (this.showedit && to.id != from.id) {
			_.delay(() => this.showedit = true, 10)
			return
		}

		if (this.editcache != cache) {
			this.editcache = cache
			if (to.backtestable && this.bkauto) this.runBacktest();
		}

		this.debounceSyncDatasets()
	}
	debounceSyncDatasets = _.debounce(() => this.chart.syncDatasets(), 100, { leading: false, trailing: true })

	v_cantEdit(uuid: string) {
		let index = this.datasets.findIndex(v => v.uuid == uuid)
		let ds = this.datasets[index]
		return !ds.backtestable && ds.settings.length == 0 && ds.notes.length == 0
	}

	setEditing(uuid: string) {
		let index = this.datasets.findIndex(v => v.uuid == uuid)
		if (this.showedit && this.eindex == index) return this.showedit = false;
		let ds = this.datasets[index]
		if (!ds.backtestable && ds.settings.length == 0 && ds.notes.length == 0) return;
		this.resetPicking()
		this.$nextTick(() => {
			this.eindex = index
			this.showedit = true
		})
	}

	deleteDataset(uuid: string) {
		this.eindex = -1
		this.showedit = false
		let index = this.datasets.findIndex(v => v.uuid == uuid)
		this.datasets.splice(index, 1)
		this.debounceSyncDatasets()
	}

	resetDataset(uuid: string) {
		let ds = this.datasets.find(v => v.uuid == uuid)
		let settings = datasets.Templates.find(v => v.id == ds.id).settings
		settings.forEachFast((v, i) => Object.assign(ds.settings[i], v))
		ds.init(this.source)
	}





	/*████████████████████████████████
	█            BACKTEST            █
	████████████████████████████████*/

	bkauto = lockr.get('symbol.chart.bkauto', true)
	@Vts.Watch('bkauto') w_bkauto(to: boolean, from: boolean) { lockr.set('symbol.chart.bkauto', to) }

	showbacktest = false
	@Vts.Watch('showbacktest') w_showbacktest(to: boolean, from: boolean) {
		if (this.loading) this.$nextTick(() => this.showbacktest = false);
		if (to != from) this.$nextTick(() => this.chart.resize());
	}
	toggleBacktest() {
		let showbacktest = this.showbacktest
		this.resetPicking()
		if (!showbacktest) this.showbacktest = true;
	}

	runBacktest() {
		let ds = this.editing && !!this.editing.runBacktest ? this.editing : this.datasets.find(v => !!v.runBacktest)
		if (!ds) return;
		ds.runBacktest(this.chart.quotes)
		this.debounceSyncDatasets()
	}









}









