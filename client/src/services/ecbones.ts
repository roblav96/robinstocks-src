// 

import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import * as moment from 'moment'
import * as ti from 'technicalindicators'
import * as shared from '../shared'
import * as utils from './utils'
import * as charts from './charts'
import * as datasets from './datasets'



export const Styles = {
	t: '#202020',
	tlight: '#707071',
	tlighter: '#989899',
	tlightest: '#DCDCDE',
	tbg: '#EAEAEE',
	white: '#FFFFFF',
	secondary: '#424242',
}



/*████  BLANK  ████*/

export function blank(opts = {} as {
	dataZoom?: boolean
	animation?: boolean
}, mods = {} as ECharts.Options) {
	let options = {
		animation: opts.animation || false,
		legend: { show: false },
		toolbox: { show: false },
		tooltip: {
			// alwaysShowContent: true,
			trigger: 'axis',
			transitionDuration: 0,
			backgroundColor: Styles.secondary,
			showDelay: 0,
			hideDelay: 1,//1000,
			padding: [4, 8, 2, 8] as any,
			// confine: true,
			// enterable: false,
			extraCssText: 'pointer-events: none;',
			axisPointer: {
				animation: false,
				type: 'cross',
				label: { textStyle: { color: Styles.t }, backgroundColor: Styles.tbg, shadowBlur: 0, borderWidth: 0 },
				shadowStyle: { shadowBlur: 0 },
			},
		},
		axisPointer: {
			animation: false,
			link: { xAxisIndex: 'all' },
			shadowStyle: { shadowBlur: 0 },
		},
		dataZoom: [],
		grid: [],
		xAxis: [],
		yAxis: [],
		series: [],
		visualMap: [],
	} as ECharts.Options
	if (opts.dataZoom) {
		options.dataZoom = [{
			type: 'slider',
			handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
			throttle: 60,
		}, {
			type: 'inside',
			zoomOnMouseWheel: 'shift',
			throttle: 60,
		}]
	}
	return _.merge(options, mods)
}



/*████  X AXIS  ████*/

export function xAxis(opts = {} as {
	name?: string
	uuid?: string
	type?: string
	gridIndex?: number
	splitNumber?: number
	blank?: boolean
	tick?: boolean
}, mods = {} as ECharts.Axis) {
	let xAxis = {
		silent: true,
		name: opts.name,
		uuid: opts.uuid || shared.randomBytes(),
		type: opts.type || 'category',
		gridIndex: opts.gridIndex || 0,
		splitNumber: opts.splitNumber || 8,
		splitLine: { show: false },
		axisLabel: { show: true, textStyle: { color: Styles.t } },
		axisTick: { show: opts.tick != false },
		axisPointer: { show: true },
	} as ECharts.Axis
	if (opts.name) {
		xAxis.nameGap = 0
		xAxis.nameLocation = 'middle'
		xAxis.nameTextStyle = {
			color: Styles.t,
			fontSize: 14,
			fontWeight: 'bold',
			padding: 4,
			backgroundColor: Styles.tbg,
			borderWidth: 1,
			borderColor: Styles.tlighter,
			shadowBlur: 0,
		}
	}
	if (opts.blank) {
		xAxis.axisLine = { show: false }
		xAxis.axisTick = { show: false }
		xAxis.splitLine = { show: false }
		xAxis.axisLabel = { show: false }
		// xAxis.axisPointer = { show: false, status: 'hide' }
	}
	return _.merge(xAxis, mods)
}



/*████  Y AXIS  ████*/

export function yAxis(opts = {} as {
	name?: string
	uuid?: string
	gridIndex?: number
	type?: string
	scale?: boolean
	blank?: boolean
}, mods = {} as ECharts.Axis) {
	let yAxis = {
		silent: true,
		name: opts.name,
		uuid: opts.uuid || shared.randomBytes(),
		gridIndex: opts.gridIndex || 0,
		type: opts.type || 'value',
		scale: opts.scale != false,
		position: 'left',
		axisLabel: { show: true, textStyle: { color: Styles.t } },
		axisPointer: { show: true },
	} as ECharts.Axis
	if (opts.blank) {
		yAxis.axisLine = { show: false }
		yAxis.axisTick = { show: false }
		yAxis.splitLine = { show: false }
		yAxis.axisLabel = { show: false }
		yAxis.axisPointer = { show: false, status: 'hide' }
	}
	return _.merge(yAxis, mods)
}



/*████  SCATTER  ████*/

export function scatter(opts = {} as {
	animation?: boolean
	name?: string
	uuid?: string
	xAxisIndex?: number
	yAxisIndex?: number
	color?: string
	opacity?: number
	width?: number
	outline?: boolean
	item?: boolean
	flip?: boolean
	symbol?: string
	z?: number
}, mods = {} as ECharts.Series) {
	let scatter = {
		silent: true,
		animation: opts.animation || false,
		hoverAnimation: false,
		legendHoverLink: false,
		name: opts.name,
		uuid: opts.uuid || shared.randomBytes(),
		xAxisIndex: opts.xAxisIndex || 0,
		yAxisIndex: opts.yAxisIndex || 0,
		type: 'scatter',
		z: opts.z,
		showSymbol: false,
		showAllSymbol: false,
		symbol: opts.symbol,
		symbolSize: (opts.width || 3) * 2,
		symbolRotate: opts.flip ? 180 : 0,
		itemStyle: {
			normal: { show: opts.item != false, opacity: opts.opacity || 1, color: opts.color }, emphasis: null
		},
	} as ECharts.Series
	if (opts.outline) {
		scatter.itemStyle.normal.borderWidth = 1
		if (scatter.symbolSize >= 8) scatter.itemStyle.normal.borderWidth = 1.5;
		if (scatter.symbolSize >= 16) scatter.itemStyle.normal.borderWidth = 2;
		scatter.itemStyle.normal.borderColor = 'black'
	}
	return _.merge(scatter, mods)
}



/*████  LINE  ████*/

export function line(opts = {} as {
	animation?: boolean
	name?: string
	uuid?: string
	xAxisIndex?: number
	yAxisIndex?: number
	color?: string
	opacity?: number
	width?: number
	smooth?: boolean
	step?: boolean
	item?: boolean
	area?: number
	stack?: string
	dashed?: boolean
	dotted?: boolean
	z?: number
}, mods = {} as ECharts.Series) {
	let line = {
		silent: true,
		animation: opts.animation || false,
		hoverAnimation: false,
		legendHoverLink: false,
		name: opts.name,
		uuid: opts.uuid || shared.randomBytes(),
		xAxisIndex: opts.xAxisIndex || 0,
		yAxisIndex: opts.yAxisIndex || 0,
		type: 'line',
		z: opts.z,
		smooth: opts.smooth || false,
		stack: opts.stack,
		showSymbol: false,
		symbolSize: opts.item == false ? 0 : 6,
		itemStyle: {
			normal: { show: opts.item != false, color: opts.color }, emphasis: null
		},
		lineStyle: {
			normal: { width: opts.width || 2, opacity: opts.opacity || 1, color: opts.color }, emphasis: null
		},
	} as ECharts.Series
	if (opts.step) {
		line.step = 'middle'
		line.smooth = false
	}
	if (opts.dashed) line.lineStyle.normal.type = 'dashed';
	if (opts.dotted) line.lineStyle.normal.type = 'dotted';
	if (_.isFinite(opts.area) && opts.area > 0) {
		line.areaStyle = {
			normal: { show: true, opacity: opts.area, color: opts.color }, emphasis: null
		}
	}
	return _.merge(line, mods)
}



/*████  BAR  ████*/

export function bar(opts = {} as {
	animation?: boolean
	name?: string
	uuid?: string
	xAxisIndex?: number
	yAxisIndex?: number
	color?: string
	opacity?: number
	barWidth?: any
	barMaxWidth?: any
	stack?: string
	overlap?: boolean
	outline?: boolean
	z?: number
}, mods = {} as ECharts.Series) {
	let bar = {
		silent: true,
		animation: opts.animation || false,
		hoverAnimation: false,
		legendHoverLink: false,
		name: opts.name,
		uuid: opts.uuid || shared.randomBytes(),
		xAxisIndex: opts.xAxisIndex || 0,
		yAxisIndex: opts.yAxisIndex || 0,
		type: 'bar',
		z: opts.z,
		stack: opts.stack,
		barWidth: opts.barWidth, // || '50%',
		barMaxWidth: opts.barMaxWidth || 4, //'75%',
		itemStyle: {
			normal: { opacity: opts.opacity || 1, color: opts.color, }, emphasis: null
		},
	} as ECharts.Series
	if (opts.overlap) {
		bar.barGap = '-100%'
		bar.barWidth = 4
		// bar.barWidth = '66%'
		// bar.barMaxWidth = 4
	}
	if (opts.outline) {
		bar.itemStyle.normal.borderColor = opts.color
		bar.itemStyle.normal.borderWidth = 1
		// bar.itemStyle.normal.color = 'transparent'
	}
	return _.merge(bar, mods)
}



/*████  CANDLE STICK  ████*/

export function candlestick(opts = {} as {
	animation?: boolean
	name?: string
	uuid?: string
	xAxisIndex?: number
	yAxisIndex?: number
	barWidth?: any
	barMaxWidth?: any
	z?: number
}, mods = {} as ECharts.Series) {
	let candlestick = {
		silent: true,
		animation: opts.animation || false,
		hoverAnimation: false,
		legendHoverLink: false,
		name: opts.name,
		uuid: opts.uuid || shared.randomBytes(),
		xAxisIndex: opts.xAxisIndex || 0,
		yAxisIndex: opts.yAxisIndex || 0,
		type: 'candlestick',
		z: opts.z,
		barWidth: opts.barWidth, // || '50%',
		barMaxWidth: opts.barMaxWidth, // || 4,
		itemStyle: {
			normal: { color: utils.COLORS_500.green, color0: utils.COLORS_500.red, borderColor: utils.COLORS_500.green, borderColor0: utils.COLORS_500.red, }, emphasis: null
		},
	} as ECharts.Series
	return _.merge(candlestick, mods)
}



/*████  VISUAL MAP  ████*/

export function visualMap(seriesIndex: Array<number>) {
	return {
		seriesIndex,
		show: false,
		pieces: [{
			min: 0,
			color: utils.COLORS_500.green,
		}, {
			max: 0,
			color: utils.COLORS_500.red,
		}],
	} as any
}



/*████  MARK LINE  ████*/

export function markLine(opts = {} as {
	data?: Array<any>
	color?: string
}, mods = {} as ECharts.MarkLine) {
	let markline = {
		silent: true,
		animation: false,
		symbolSize: 0,
		data: opts.data,
		lineStyle: { normal: { color: opts.color || Styles.tlighter } },
		label: { normal: { show: false } },
	} as ECharts.MarkLine
	return _.merge(markline, mods)
}



/*████  MARK AREA  ████*/

export function markArea(opts = {} as {
	data?: Array<any>
	color?: string
}, mods = {} as ECharts.MarkArea) {
	let markarea = {
		silent: true,
		animation: false,
		data: opts.data,
		itemStyle: { normal: { color: opts.color || Styles.tlightest, opacity: 0.5 } },
		label: { normal: { show: false } },
	} as ECharts.MarkArea
	return _.merge(markarea, mods)
}



/*████  EWMAS  ████*/

export function ewmaBones(name: string, gridIndex: number, xAxisIndex: number, yAxisIndex: number) {
	let bones = { xAxis: [], yAxis: [], series: [] } as ECharts.Options

	let ckeys = Object.keys(utils.COLORS_500)
	let colors = ckeys.filter((v, i) => i % 3 == 0).concat(ckeys.filter((v, i) => i % 3 == 1)).concat(ckeys.filter((v, i) => i % 3 == 2))

	bones.xAxis.push(xAxis({ gridIndex: gridIndex + 1, name: name + ' Value' }))
	bones.yAxis.push(yAxis({ gridIndex: gridIndex + 1 }))
	bones.series.push(line({ name: 'Value', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.bluegrey }))

	let ewmas = shared.EWMAS.PERIODS
	bones.xAxis.push(xAxis({ gridIndex: gridIndex + 2, name: name + ' Rates' }))
	bones.yAxis.push(yAxis({ gridIndex: gridIndex + 2 }))
	ewmas.forEachFast(function(period, i) {
		bones.series.push(line({ name: period + 'm', xAxisIndex: xAxisIndex + 2, yAxisIndex: yAxisIndex + 2, color: utils.COLORS_500[colors[i]], width: 1.5 }))
	})

	let smas = shared.EWMAS.SMAS.mapFast(function(period) {
		let minutes = moment.duration(period * shared.livesTick, 'seconds').asMinutes()
		if (minutes >= 1) return minutes + 'm';
		return moment.duration(minutes, 'minutes').asSeconds() + 's';
	})
	bones.xAxis.push(xAxis({ gridIndex: gridIndex + 3, name: name + ' SMAs' }))
	bones.yAxis.push(yAxis({ gridIndex: gridIndex + 3 }))
	smas.forEachFast(function(period, i) {
		bones.series.push(line({ name: period, xAxisIndex: xAxisIndex + 3, yAxisIndex: yAxisIndex + 3, color: utils.COLORS_500[colors[i]], width: 1.5 }))
	})

	let slps = shared.EWMAS.SLPS.mapFast(function(period) {
		let minutes = moment.duration(period * shared.livesTick, 'seconds').asMinutes()
		if (minutes >= 1) return minutes + 'm';
		return moment.duration(minutes, 'minutes').asSeconds() + 's';
	})
	bones.xAxis.push(xAxis({ gridIndex: gridIndex + 4, name: name + ' Slopes' }))
	bones.yAxis.push(yAxis({ gridIndex: gridIndex + 4 }))
	slps.forEachFast(function(period, i) {
		bones.series.push(line({ name: period, xAxisIndex: xAxisIndex + 4, yAxisIndex: yAxisIndex + 4, color: utils.COLORS_500[colors[i]], width: 1.5 }))
	})

	// bones.xAxis.push(xAxis({ gridIndex: gridIndex + 5, name: name + ' Skewness' }))
	// bones.yAxis.push(yAxis({ gridIndex: gridIndex + 5 }))
	// bones.series.push(line({ name: 'Skewness', xAxisIndex: xAxisIndex + 5, yAxisIndex: yAxisIndex + 6, color: utils.COLORS_500.pink }))

	return bones
}

export function ewmaData(name: string, quotes: Array<FullQuote>) {
	name = shared.parseToId(name, true)
	let ewmas = shared.EWMAS.PERIODS
	let smas = shared.EWMAS.SMAS
	let slps = shared.EWMAS.SLPS
	let data = shared.prefilledArray(1 + _.sum([ewmas.length, smas.length, slps.length]), [] as Array<ECharts.DataPoint>)

	quotes.forEachFast(function(v) {
		let ii = 0

		data[ii].push({ value: [v.lastStamp, v[name + '_other_value']] }); ii++

		ewmas.forEachFast(function(period) {
			data[ii].push({ value: [v.lastStamp, v[name + '_ewma_' + period]] }); ii++
		})

		smas.forEachFast(function(period) {
			data[ii].push({ value: [v.lastStamp, v[name + '_sma_' + period]] }); ii++
		})

		slps.forEachFast(function(period) {
			data[ii].push({ value: [v.lastStamp, v[name + '_slp_' + period]] }); ii++
		})

		// data[ii].push({ value: [v.lastStamp, v[name + '_other_skewness']] }); ii++

	})

	return data
}



/*████  BACKTEST  ████*/

export function bkBones(bones: ECharts.Options, gridIndex: number, xAxisIndex: number, yAxisIndex: number, seriesIndex: number, show: boolean, notes: Array<DatasetNote>): ECharts.Options {
	if (!show) return bones;
	let gnotes = notes.filter(v => v.graph == true)

	if (!Array.isArray(bones.xAxis)) bones.xAxis = [];
	bones.xAxis.push(xAxis({ gridIndex: gridIndex + gnotes.length, name: 'Results' }))
	gnotes.forEachFast((v, i) => bones.xAxis.push(xAxis({ gridIndex: gridIndex + i, name: _.startCase(v.id) })))

	if (!Array.isArray(bones.yAxis)) bones.yAxis = [];
	bones.yAxis.push(yAxis({ gridIndex: gridIndex + gnotes.length }))
	gnotes.forEachFast((v, i) => bones.yAxis.push(yAxis({ gridIndex: gridIndex + i })))

	if (!Array.isArray(bones.series)) bones.series = [];
	bones.series.push(scatter({ name: 'Orders', z: 49, width: 8, symbol: 'arrow', outline: true }))
	bones.series.push(scatter({ name: 'Action', z: 39, width: 2.5, symbol: 'circle' }))
	bones.series.push(line({ name: 'Buy', color: utils.COLORS_500.green, z: 29, width: 3 }))
	bones.series.push(line({ name: 'Sell', color: utils.COLORS_500.red, z: 29, width: 3 }))
	bones.series.push(line({ name: 'P/L Percent', xAxisIndex, yAxisIndex }))
	gnotes.forEachFast((v, i) => bones.series.push(line({ name: _.startCase(v.id), xAxisIndex: xAxisIndex + 1 + i, yAxisIndex: yAxisIndex + 1 + i, color: utils.COLORS_500.bluegrey })))

	if (!Array.isArray(bones.visualMap)) bones.visualMap = [];
	bones.visualMap.push(visualMap([seriesIndex + 4]))

	return bones
}

export function bkData(data: Array<Array<ECharts.DataPoint>>, quotes: Array<FullQuote>, bkquotes: Array<BacktestQuote>, notes: Array<DatasetNote>): Array<Array<ECharts.DataPoint>> {
	if (_.isEmpty(bkquotes)) return data;
	let gnotes = notes.filter(v => v.graph == true)
	let bkdata = shared.prefilledArray(5 + gnotes.length, [] as Array<ECharts.DataPoint>)
	let orders = 0
	let fees = 0
	let shares = 0
	let cash = 10000
	let net = cash
	let action = 'sell'
	bkquotes.forEachFast(function(bkquote, i) {
		let quote = quotes.find(v => v.lastStamp == bkquote.lastStamp)
		let color = bkquote.action == 'sell' ? utils.COLORS_500.red : utils.COLORS_500.green

		bkdata[2][i] = { value: [bkquote.lastStamp, null] }
		bkdata[3][i] = { value: [bkquote.lastStamp, null] }

		if (bkquote.action) {
			if (bkquote.prevAction == bkquote.action && bkquote.action != action) {
				// if (bkquote.action != action) {
				action = bkquote.action
				orders++

				if (bkquote.action == 'buy') {
					shares += _.floor(cash / quote.lastPrice)
					fees += 0.005 * shares
					cash -= shares * quote.lastPrice
					// shares += _.floor(cash / (quote.lastPrice + 0.005))
					// fees += 0.005 * shares
					// cash -= shares * (quote.lastPrice + 0.005)
				}
				if (bkquote.action == 'sell') {
					fees += 0.005 * shares
					cash += shares * quote.lastPrice
					shares -= shares
				}

				let name = utils.humanPlusMinus(net, 2, true, false)
				let symbolRotate = bkquote.action == 'buy' ? 0 : 180
				// let symbolOffset = bkquote.action == 'buy' ? [0, '-50%'] : [0, '50%']
				let color = bkquote.action == 'buy' ? utils.COLORS_500.green : utils.COLORS_500.red
				bkdata[0].push({ value: [bkquote.lastStamp, quote.lastPrice], name: name as any, symbolRotate, itemStyle: { normal: { color } } })
			}

			let prev = bkquotes[i - 1]; if (!prev) prev = {} as any;
			let next = bkquotes[i + 1]; if (!next) next = {} as any;
			if (bkquote.action == prev.action || bkquote.action == next.action) {
				if (bkquote.action == 'buy') bkdata[2][i] = { value: [bkquote.lastStamp, quote.lastPrice] };
				if (bkquote.action == 'sell') bkdata[3][i] = { value: [bkquote.lastStamp, quote.lastPrice] };
			} else {
				bkdata[1].push({ value: [bkquote.lastStamp, quote.lastPrice], name: _.startCase(bkquote.action), itemStyle: { normal: { color } } })
			}

		}

		net = (shares * quote.lastPrice) + cash
		bkdata[4].push({ value: [bkquote.lastStamp, utils.calcPercentChange(net, 10000)] })

		gnotes.forEachFast(function(note, ii) {
			bkdata[5 + ii].push({ value: [bkquote.lastStamp, bkquote.notes[note.id]] })
		})

	})

	notes.find(v => v.id == 'orders').value = orders
	notes.find(v => v.id == 'fees').value = fees
	let nets = bkdata[4].mapFast(v => v.value[1])
	notes.find(v => v.id == 'pnlHigh').value = _.max(nets)
	notes.find(v => v.id == 'pnlLow').value = _.min(nets)
	notes.find(v => v.id == 'pnlClose').value = utils.calcPercentChange(net - fees, 10000)

	// console.log('bkdata', shared.clone(bkdata))
	return data.concat(bkdata)
}

export function bkQuoteNotes(bkquote: BacktestQuote, strat: any, nids: Array<string>, notes: Array<DatasetNote>) {
	Object.keys(strat).forEachFast(function(key) {
		let nid = nids.indexOf(key)
		if (nid == -1) return;
		let note = notes[nid]
		let value = strat[key]
		note.graphable = Number.isFinite(value)
		bkquote.notes[key] = value
	})
}




