// 

import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import nib from 'ib'
import * as ecstat from 'echarts-stat'
import * as echarts from 'echarts'
import * as ss from 'simple-statistics'
import * as ti from 'technicalindicators'
import * as shared from '../shared'
import * as utils from './utils'
import * as http from './http'
import * as charts from './charts'
import * as ecbones from './ecbones'
import * as store from './store'
import * as ibstore from './ib.store'



declare global {
	interface DatasetSetting {
		id: string
		dname: string
		desc: string
		type: string
		color: string
		step: number
		multi: boolean
		autocomplete: boolean
		defaults: Array<any>
		value: any
	}
	interface DatasetNote {
		id: string
		isbk: boolean
		graph: boolean
		graphable: boolean
		value: any
	}
}

export class Dataset {

	id: string
	dname: string
	category: string
	helpurl: string
	favorite: boolean
	candles: boolean
	autoedit: boolean
	sources: Array<string>
	bkquotes: Array<BacktestQuote>
	bkbenchmark: number

	master = false
	show = true
	uuid = utils.randomBytes(8)
	single = false
	backtestable = false
	bkindex = -1
	settings = [] as Array<DatasetSetting>
	notes = [] as Array<DatasetNote>

	constructor(template: Dataset, source: 'lives' | 'yahoo', mods = {} as Dataset) {
		_.merge(this, _.cloneDeep(template), _.cloneDeep(mods))
		if (!!this.init) this.init(source);
	}

	init: (this: Dataset, source: 'lives' | 'yahoo') => void
	bones: (this: Dataset, quotes: Array<FullQuote>, gridIndex: number, xAxisIndex: number, yAxisIndex: number, seriesIndex: number, source: 'lives' | 'yahoo') => ECharts.Options
	// data: (this: Dataset, quotes: Array<FullQuote>, cquote: CalcQuote, ctbounds?: ChartBounds, source?: 'lives' | 'yahoo') => Array<Array<ECharts.DataPoint>>
	data: (this: Dataset, quotes: Array<FullQuote>, cquote: CalcQuote) => Array<Array<ECharts.DataPoint>>
	// calcBuySell: (this: Dataset, quotes: Array<FullQuote>, cquote: CalcQuote, bkindex: number) => 'buy' | 'sell'
	runBacktest: (this: Dataset, quotes: Array<FullQuote>) => Array<BacktestQuote>

}

export const Templates = [



	/*████  Historicals  ████*/
	{
		id: 'historicals',
		dname: 'Historicals',
		master: true,
		sources: ['yahoo'],
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				xAxis: [ecbones.xAxis({ tick: false })],
				yAxis: [ecbones.yAxis(), ecbones.yAxis({ blank: true })],
				series: [
					ecbones.candlestick({ name: 'OHLC' }),
					ecbones.bar({ name: 'Size', yAxisIndex: 1 }),
				],
			}
		},
		data: function(quotes, cquote) {
			let ohlc = []
			let sizes = []
			quotes.forEachFast(function(v, i) {
				ohlc.push({ value: [v.lastStamp, v.open, v.close, v.low, v.high] })
				let opacity = 0.3
				let color = utils.COLORS_500.red
				if (v.close > v.open) {
					color = utils.COLORS_500.green
					opacity = opacity + 0.1
				}
				sizes.push({ value: [v.lastStamp, v.size], itemStyle: { normal: { color, opacity } } })
			})
			return [ohlc, sizes]
		},
	},



	/*████  Lives  ████*/
	{
		id: 'lives',
		dname: 'Lives',
		master: true,
		sources: ['lives'],
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			let bones = {
				xAxis: [ecbones.xAxis()],
				yAxis: [ecbones.yAxis(), ecbones.yAxis({ blank: true })],
				series: [
					ecbones.line({ name: 'Price', color: utils.COLORS_500.blue }),
					ecbones.bar({ name: 'Size', yAxisIndex: 1 }),
				],
			}
			if (this.candles == true) {
				bones.series.splice(0, 1, ecbones.candlestick({ name: 'OHLC', barMaxWidth: 4 }))
			}
			return bones
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(2, [] as Array<ECharts.DataPoint>)
			quotes.forEachFast((v, i) => {
				if (this.candles == true) data[0].push({ value: [v.lastStamp, v.open, v.close, v.low, v.high] });
				else data[0].push({ value: [v.lastStamp, v.lastPrice] });
				let opacity = 0.25
				let color = utils.COLORS_500.bluegrey
				let prev = quotes[i - 1]
				if (prev && v.lastPrice < prev.lastPrice) color = utils.COLORS_500.red;
				if (prev && v.lastPrice > prev.lastPrice) {
					color = utils.COLORS_500.green
					opacity = opacity + 0.1
				}
				data[1].push({ value: [v.lastStamp, v.size], itemStyle: { normal: { color, opacity } } })
			})
			return data
		},
	},



	/*████  Trade Size  ████*/
	{
		id: 'trds',
		dname: 'Trade Size',
		category: 'calcs',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				xAxis: [
					ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Trade Size' }),
				],
				yAxis: [
					ecbones.yAxis({ gridIndex: gridIndex + 1 }),
					ecbones.yAxis({ gridIndex: gridIndex + 1, blank: true }),
				],
				series: [
					ecbones.bar({ name: 'Trade Flow Size', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.bluegrey, stack: 'trds', z: 9 }),
					ecbones.bar({ name: 'Trade Size', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 2, color: utils.COLORS_500.bluegrey, opacity: 0.3, stack: 'trds' }),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(2, [] as Array<ECharts.DataPoint>)
			quotes.forEachFast(function(v) {
				if (v.tradeBuySize == 0 && v.tradeSellSize == 0) {
					data[0].push({ value: [v.lastStamp, null] })
				} else {
					let color = utils.COLORS_500.bluegrey
					if (v.tradeFlowSize < 0) color = utils.COLORS_500.red;
					if (v.tradeFlowSize > 0) color = utils.COLORS_500.green;
					data[0].push({ value: [v.lastStamp, Math.abs(v.tradeFlowSize)], itemStyle: { normal: { color } } })
				}
				data[1].push({ value: [v.lastStamp, v.tradeSize] })
			})
			return data
		},
	},

	/*████  Trade Volume  ████*/
	{
		id: 'trdv',
		dname: 'Trade Volume',
		category: 'calcs',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				xAxis: [
					ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Trade Volume', tick: false }),
				],
				yAxis: [
					ecbones.yAxis({ gridIndex: gridIndex + 1, scale: false }),
					ecbones.yAxis({ gridIndex: gridIndex + 1, blank: true }),
				],
				series: [
					ecbones.line({ name: 'Trade Flow Volume', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, z: 9 }),
					ecbones.line({ name: 'Buy Volume', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 2, width: 1, dotted: true, color: utils.COLORS_700.green }),
					ecbones.line({ name: 'Sell Volume', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 2, width: 1, dotted: true, color: utils.COLORS_700.red }),
				],
				visualMap: [ecbones.visualMap([seriesIndex])],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(3, [] as Array<ECharts.DataPoint>)
			quotes.forEachFast(function(v) {
				data[0].push({ value: [v.lastStamp, v.tradeFlowVolume] })
				data[1].push({ value: [v.lastStamp, v.tradeBuyVolume] })
				data[2].push({ value: [v.lastStamp, v.tradeSellVolume] })
			})
			return data
		},
	},



	/*████  Bid Ask Price  ████*/
	{
		id: 'baps',
		dname: 'Bid Ask Price',
		category: 'calcs',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				series: [
					ecbones.line({ name: 'Ask Price', dotted: true, width: 1, color: utils.COLORS_500.green }),
					ecbones.line({ name: 'Bid Price', dotted: true, width: 1, color: utils.COLORS_500.red }),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(2, [] as Array<ECharts.DataPoint>)
			quotes.forEachFast(function(v) {
				data[0].push({ value: [v.lastStamp, v.askPrice] })
				data[1].push({ value: [v.lastStamp, v.bidPrice] })
			})
			return data
		},
	},

	/*████  Bid Ask Spread  ████*/
	{
		id: 'bass',
		dname: 'Bid Ask Spread',
		category: 'calcs',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				series: [
					ecbones.line({ name: 'Ask Spread', dashed: true, width: 1, color: utils.COLORS_500.green }),
					ecbones.line({ name: 'Bid Spread', dashed: true, width: 1, color: utils.COLORS_500.red }),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(2, [] as Array<ECharts.DataPoint>)
			quotes.forEachFast(function(v) {
				data[0].push({ value: [v.lastStamp, v.askSpread] })
				data[1].push({ value: [v.lastStamp, v.bidSpread] })
			})
			return data
		},
	},

	/*████  Bid Ask Size  ████*/
	{
		id: 'bas',
		dname: 'Bid Ask Size',
		category: 'calcs',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				xAxis: [
					ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Bid Ask Size' }),
				],
				yAxis: [
					ecbones.yAxis({ gridIndex: gridIndex + 1 }),
					ecbones.yAxis({ gridIndex: gridIndex + 1, blank: true }),
				],
				series: [
					ecbones.bar({ name: 'BA Flow Size', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.bluegrey, stack: 'bas', z: 9 }),
					ecbones.bar({ name: 'BA Size', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 2, color: utils.COLORS_500.bluegrey, opacity: 0.3, stack: 'bas' }),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(2, [] as Array<ECharts.DataPoint>)
			quotes.forEachFast(function(v) {
				let color = utils.COLORS_500.bluegrey
				if (v.bidAskFlowSizeAccum < 0) color = utils.COLORS_500.red;
				if (v.bidAskFlowSizeAccum > 0) color = utils.COLORS_500.green;
				data[0].push({ value: [v.lastStamp, Math.abs(v.bidAskFlowSizeAccum)], itemStyle: { normal: { color } } })
				data[1].push({ value: [v.lastStamp, v.askSizeAccum + v.bidSizeAccum] })
			})
			return data
		},
	},

	/*████  Bid Ask Volume  ████*/
	{
		id: 'bav',
		dname: 'Bid Ask Volume',
		category: 'calcs',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				xAxis: [
					ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Bid Ask Volume', tick: false }),
				],
				yAxis: [
					ecbones.yAxis({ gridIndex: gridIndex + 1, scale: false }),
					ecbones.yAxis({ gridIndex: gridIndex + 1, blank: true }),
				],
				series: [
					ecbones.line({ name: 'BA Flow Volume', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, z: 9 }),
					ecbones.line({ name: 'Ask Volume', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 2, width: 1, dotted: true, color: utils.COLORS_700.green }),
					ecbones.line({ name: 'Bid Volume', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 2, width: 1, dotted: true, color: utils.COLORS_700.red }),
				],
				visualMap: [ecbones.visualMap([seriesIndex])],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(3, [] as Array<ECharts.DataPoint>)
			quotes.forEachFast(function(v) {
				data[0].push({ value: [v.lastStamp, v.bidAskFlowVolume] })
				data[1].push({ value: [v.lastStamp, v.askVolume] })
				data[2].push({ value: [v.lastStamp, v.bidVolume] })
			})
			return data
		},
	},



	// /*████  Noise Removal  ████*/
	// {
	// 	id: 'nrm',
	// 	dname: 'Noise Removal',
	// 	category: 'clarity',
	// 	single: true,
	// 	settings: [
	// 		{
	// 			id: 'period', dname: 'Period', type: 'number', step: 1, defaults: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], value: 16,
	// 			desc: 'Adjusts the smoothness of the curve.',
	// 		},
	// 	],
	// 	bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
	// 		return {
	// 			series: [
	// 				ecbones.line({ name: 'Noise Removal', color: utils.COLORS_500.orange }),
	// 			],
	// 		}
	// 	},
	// 	data: function(quotes, cquote) {
	// 		let period = this.settings[0].value
	// 		let tdata = quotes.mapFast(v => [v.lastStamp, v.close])
	// 		tdata = shared.smoother(tdata, period)
	// 		return [tdata.mapFast((v, i) => { return { value: [quotes[i].lastStamp, v[1]] } })]
	// 	},
	// },



	/*████  Sandbox  ████*/
	{
		id: 'sbox',
		dname: 'Sandbox',
		category: 'imagination',
		autoedit: true,
		settings: [
			{ id: 'against', dname: 'Input Data Field', type: 'select', autocomplete: true },
			{ id: 'smas', dname: 'Simple Moving Averages', type: 'select', multi: true, value: [], defaults: shared.clone(shared.EWMAS.SMAS) },
			{ id: 'slps', dname: 'Slopes', type: 'select', multi: true, value: [], defaults: shared.clone(shared.EWMAS.SLPS) },
			{ id: 'nrms', dname: 'Noise Removals', type: 'select', multi: true, value: [], defaults: [2, 4, 8, 16, 32, 64, 128, 256] },
			{ id: 'type', dname: 'Chart Type', type: 'select', defaults: [{ text: 'Line Chart', value: 'line' }, { text: 'Scatter Plot', value: 'scatter' }, { text: 'Bar Graph', value: 'bar' }], value: 'line' },
		],
		init: function(source) {
			let against = this.settings.find(v => v.id == 'against')
			let skips = shared.clone(shared.SKIP_KEYS) as Array<keyof LiveQuote>
			skips = skips.concat(shared.EWMAS.RMAP as any)
			skips = skips.concat(<Array<keyof LiveQuote>>['wbstatusStamp', 'lastStamp', 'stamp'] as any)
			if (source == 'lives') {
				// skips = skips.concat([''])
				// against.value = 'lastPrice'
			}
			if (source == 'yahoo') {
				// skips = skips.concat(['lastPrice'])
				// against.value = 'close'
			}
			let rmap = shared.clone(source == 'lives' ? shared.RMAP.LIVES : shared.RMAP.HISTS) as Array<keyof LiveQuote>
			rmap = rmap.filter(v => skips.indexOf(v) == -1)
			rmap = rmap.concat(<Array<keyof CalcQuote>>['volumeOsc'] as any)
			against.defaults = _.orderBy(rmap.mapFast(v => ({ text: _.startCase(v), value: v })), ['text'], ['asc'])
		},
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			let against = this.settings.find(v => v.id == 'against')
			let name = against.value ? against.defaults.find(v => v.value == against.value).text : 'Sandbox'
			this.dname = name

			let type = this.settings.find(v => v.id == 'type').value
			let bones = {
				xAxis: [ecbones.xAxis({ gridIndex: gridIndex + 1, name })],
				yAxis: [ecbones.yAxis({ gridIndex: gridIndex + 1 })],
				series: [ecbones[type]({ name, xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.bluegrey })]
			} as ECharts.Options

			let colors = Object.keys(utils.COLORS_500)
			let smas = this.settings.find(v => v.id == 'smas')
			let smasds = smas.defaults as Array<number>
			let smasvs = _.orderBy(smas.value) as Array<number>
			smasvs.forEachFast(function(v) {
				bones.series.push(ecbones.line({ name: 'SMA (' + v + ')', width: 1.5, color: utils.COLORS_500[colors[smasds.indexOf(v)]], xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1 }))
			})

			let slps = this.settings.find(v => v.id == 'slps')
			let slpsds = slps.defaults as Array<number>
			let slpsvs = _.orderBy(slps.value) as Array<number>
			if (slpsvs.length > 0) {
				bones.xAxis.push(ecbones.xAxis({ gridIndex: gridIndex + 2, name: name + ' - Slopes' }))
				bones.yAxis.push(ecbones.yAxis({ gridIndex: gridIndex + 2 }))
			}
			slpsvs.forEachFast(function(v) {
				bones.series.push(ecbones.line({ name: 'Slope (' + v + ')', width: 1.5, color: utils.COLORS_500[colors[slpsds.indexOf(v)]], xAxisIndex: xAxisIndex + 2, yAxisIndex: yAxisIndex + 2 }))
			})

			colors = colors.reverse().splice(2)
			let nrms = this.settings.find(v => v.id == 'nrms')
			let nrmsds = nrms.defaults as Array<number>
			let nrmsvs = _.orderBy(nrms.value) as Array<number>
			nrmsvs.forEachFast(function(v) {
				bones.series.push(ecbones.line({ name: 'NRM (' + v + ')', width: 1.5, color: utils.COLORS_500[colors[nrmsds.indexOf(v)]], xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1 }))
			})

			// console.log('bones', bones)

			return bones
		},
		data: function(quotes, cquote) {
			let dlength = 1
			let smas = _.orderBy(this.settings.find(v => v.id == 'smas').value) as Array<number>
			dlength += smas.length
			let slps = _.orderBy(this.settings.find(v => v.id == 'slps').value) as Array<number>
			dlength += slps.length
			let nrms = _.orderBy(this.settings.find(v => v.id == 'nrms').value) as Array<number>
			dlength += nrms.length
			let data = shared.prefilledArray(dlength, [] as Array<ECharts.DataPoint>)
			let key = this.settings.find(v => v.id == 'against').value
			if (!key) return data;

			if (key == 'volumeOsc') {
				quotes.forEachFast(function(quote) {
					quote.volumeOsc = shared.calcOscChange(quote.volume, cquote.avgVolume)
				})
			}

			dlength = 1
			let stdquotes = shared.standardize(quotes.mapFast(v => v[key])).mapFast((v, i) => [i, v])
			quotes.forEachFast(function(v, i) {
				data[0].push({ value: [v.lastStamp, v[key]] })
				let ii = 1
				smas.forEachFast(function(sma) {
					let smadata = data[ii]
					ii++
					let prev = smadata[smadata.length - 1]
					if (!prev) {
						smadata.push({ value: [v.lastStamp, v[key]] })
					} else {
						let mean = ss.addToMean(prev.value[1], sma, v[key])
						smadata.push({ value: [v.lastStamp, mean] })
					}
				})
				slps.forEachFast(function(slp) {
					let slpdata = data[ii]
					ii++
					// let slice = quotes.slice(i - slp, i)
					let slice = stdquotes.slice(i - slp, i)
					if (slice.length == 0) {
						slpdata.push({ value: [v.lastStamp, null] })
					} else {
						// let regdata = slice.mapFast((v, i) => [i, v[key]])
						// let regdata = shared.standardize(slice.mapFast(v => v[key])).mapFast((v, i) => [i, v])
						let linear = ecstat.regression('linear', slice)
						slpdata.push({ value: [v.lastStamp, linear.parameter.gradient] })
					}
				})
			})
			dlength += smas.length
			dlength += slps.length

			let tdata = quotes.mapFast(v => [v.lastStamp, v[key]])
			nrms.forEachFast(function(nrm, i) {
				data[dlength + i] = shared.smoother(tdata, nrm).mapFast((v, i) => { return { value: [quotes[i].lastStamp, v[1]] } })
			})
			dlength += nrms.length

			return data
		},
	},



	/*████  Parabolic Stop & Reverse  ████*/
	{
		id: 'psar',
		dname: 'Parabolic Stop & Reverse',
		category: 'trends',
		helpurl: 'http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:parabolic_sar',
		settings: [
			{
				id: 'against', dname: 'Input Data Fields', type: 'select', value: 'high:low',
				defaults: [
					{ text: 'High/Low Price', value: 'high:low' },
					{ text: 'Bid/Ask Price', value: 'askPrice:bidPrice', lives: true },
					{ text: 'Bid/Ask Spread', value: 'askSpread:bidSpread', lives: true },
				],
			},
			{
				id: 'step', dname: 'Step', type: 'number', step: 0.001, defaults: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1], value: 0.02,
				desc: 'SAR sensitivity can be adjusted with the Step.',
			},
			{
				id: 'max', dname: 'Max Step', type: 'number', step: 0.01, defaults: [0.1, 0.2, 0.3, 0.5, 1], value: 0.2,
				desc: 'Increasing the Step ensures that the Maximum Step will be hit quicker when a trend develops.',
			},
		],
		init: function(source) {
			let against = this.settings.find(v => v.id == 'against')
			against.defaults.removeFast(v => v.lives == true && source != 'lives')
			against.value = against.defaults[0].value
		},
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				series: [
					ecbones.scatter({ name: 'PSAR', z: 9, symbol: 'circle' }),
					ecbones.line({ name: 'Up Trend', color: utils.COLORS_500.green, z: 9 }),
					ecbones.line({ name: 'Down Trend', color: utils.COLORS_500.red, z: 9 }),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(3, [] as Array<ECharts.DataPoint>)

			let against = this.settings.find(v => v.id == 'against')
			let fields = (against.value as string).split(':')
			let input = { high: [], low: [] }
			let step = this.settings.find(v => v.id == 'step')
			input[step.id] = step.value
			let max = this.settings.find(v => v.id == 'max')
			input[max.id] = max.value
			quotes.forEachFast(function(v) {
				input.high.push(v[fields[0]])
				input.low.push(v[fields[1]])
			})

			let psar = ti.psar(input as any)
			psar.forEachFast(function(value, i) {
				let quote = quotes[i]
				data[1][i] = { value: [quote.lastStamp, null] }
				data[2][i] = { value: [quote.lastStamp, null] }

				let prevtrend = ''
				let prev = quotes[i - 1]
				if (prev) {
					if (psar[i - 1] < prev.close) prevtrend = 'up';
					if (psar[i - 1] > prev.close) prevtrend = 'down';
				}
				let nexttrend = ''
				let next = quotes[i + 1]
				if (next) {
					if (psar[i + 1] < next.close) nexttrend = 'up';
					if (psar[i + 1] > next.close) nexttrend = 'down';
				}
				let trend = ''
				if (value < quote.close) trend = 'up';
				if (value > quote.close) trend = 'down';
				if (!trend) trend = prevtrend;
				if (!trend) trend = nexttrend;

				if (trend == prevtrend || trend == nexttrend) {
					if (trend == 'up') data[1][i] = { value: [quote.lastStamp, value] };
					if (trend == 'down') data[2][i] = { value: [quote.lastStamp, value] };
				} else {
					let color = trend == 'up' ? utils.COLORS_500.green : utils.COLORS_500.red
					data[0].push({ value: [quote.lastStamp, value], name: shared.capitalize(trend) + ' Trend', itemStyle: { normal: { color } } })
				}

			})
			return data
		},
	},



	// /*████  Volume Regression  ████*/
	// {
	// 	id: 'vreg',
	// 	dname: 'Volume Regression',
	// 	category: 'experiment',
	// 	single: true,
	// 	sources: ['yahoo'],
	// 	bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
	// 		return {
	// 			xAxis: [
	// 				ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Volume Regression' }),
	// 			],
	// 			yAxis: [
	// 				ecbones.yAxis({ gridIndex: gridIndex + 1 }),
	// 			],
	// 			series: [
	// 				ecbones.line({ name: 'Regression', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.bluegrey }),
	// 				ecbones.line({ name: 'Quadratic', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.pink }),
	// 			],
	// 		}
	// 	},
	// 	data: function(quotes, cquote) {
	// 		let data = shared.prefilledArray(2, [] as Array<ECharts.DataPoint>)

	// 		let times = {} as { [time: string]: Array<number> }

	// 		let accu = 0
	// 		let today = 0
	// 		let avgvolume = cquote.avgVolume
	// 		quotes.forEachFast(function(quote, i) {
	// 			if (quote.size == 0) return;
	// 			let day = shared.moment(quote.lastStamp).dayOfYear()
	// 			if (day != today) {
	// 				today = day
	// 				accu = 0
	// 			}
	// 			accu += quote.size
	// 			let time = shared.moment(quote.lastStamp).format('h:mma')
	// 			if (!Array.isArray(times[time])) times[time] = [];
	// 			times[time].push(accu / avgvolume)
	// 		})

	// 		let first: number
	// 		let stamps = quotes.mapFast(v => v.lastStamp)
	// 		let tstart = shared.moment().startOf('day').valueOf()
	// 		let qstart = shared.moment(quotes[0].lastStamp).startOf('day').valueOf()
	// 		Object.keys(times).forEachFast(function(time, i) {
	// 			let mstart = shared.moment(time, 'h:mma').valueOf()
	// 			let diff = mstart - tstart
	// 			let diffstamp = qstart + diff
	// 			let avg = _.mean(times[time])
	// 			let index = utils.array_closest(stamps, qstart + diff)
	// 			if (!first) first = index;
	// 			data[0].push({ value: [quotes[index].lastStamp, avg] })
	// 		})

	// 		let stddata = data[0].filter(v => !!v.value[1]).mapFast(function(v, i) {
	// 			console.log('i', i)
	// 			return [i, v.value[1]]
	// 		})
	// 		console.log('stddata', stddata)
	// 		let quadratic = ecstat.regression('polynomial', stddata, 2) as EChartsStat.RegressionResult
	// 		console.log('quadratic', quadratic)
	// 		quadratic.points.forEachFast(function(point, i) {
	// 			data[1].push({ value: [quotes[first + i].lastStamp, point[1]] })
	// 		})
	// 		// quadratic.points.forEachFast((v, i) => data[5].push({ value: [alls[i][0], v[1]] }))

	// 		return data
	// 	},
	// },



	/*████  Volume Progress  ████*/
	{
		id: 'vprg',
		dname: 'Volume Progress',
		category: 'experiment',
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				xAxis: [
					ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Volume Progress Values' }),
					ecbones.xAxis({ gridIndex: gridIndex + 2, name: 'Volume Progress Osc' }),
				],
				yAxis: [
					ecbones.yAxis({ gridIndex: gridIndex + 1 }),
					ecbones.yAxis({ gridIndex: gridIndex + 2 }),
				],
				series: [
					ecbones.line({ name: 'Volume', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.bluegrey }),
					ecbones.line({ name: 'Realistic', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.pink }),
					ecbones.line({ name: 'Volume Osc', xAxisIndex: xAxisIndex + 2, yAxisIndex: yAxisIndex + 2, color: utils.COLORS_500.bluegrey }),
					ecbones.line({ name: 'Realistic Osc', xAxisIndex: xAxisIndex + 2, yAxisIndex: yAxisIndex + 2, color: utils.COLORS_500.pink }),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(4, [] as Array<ECharts.DataPoint>)

			quotes.forEachFast(function(quote) {
				let range = shared.calcRealisticStampRange(quote.lastStamp, cquote.realParameter)
				let progress = cquote.avgVolume * range
				data[0].push({ value: [quote.lastStamp, quote.volume] })
				data[1].push({ value: [quote.lastStamp, progress] })
				data[2].push({ value: [quote.lastStamp, shared.calcOscChange(quote.volume, cquote.avgVolume)] })
				data[3].push({ value: [quote.lastStamp, shared.calcOscChange(quote.volume, progress)] })
			})

			return data
		},
	},



	/*████  Forecast  ████*/
	{
		id: 'fc',
		dname: 'Forecast',
		category: 'backtest',
		sources: ['lives'],
		single: true,
		backtestable: true,
		notes: [
			{ id: 'linearExp' },
			{ id: 'linearSlope' },
			{ id: 'linearIntercept' },
			{ id: 'linearChange' },
			{ id: 'quadraticExp' },
			{ id: 'quadraticFirstRoot' },
			{ id: 'quadraticSecondRoot' },
			{ id: 'quadraticIntercept' },
			{ id: 'sampleSkewness' },
			{ id: 'interquartileRange' },
			{ id: 'linearCorrelation' },
			{ id: 'quadraticCorrelation' },
		],
		settings: [
			{ id: 'pastticks', dname: 'Past Ticks', type: 'number', step: 10, defaults: [16, 32, 64, 128, 256, 512, 1024], value: 128 },
			{ id: 'futureticks', dname: 'Future Ticks', type: 'number', step: 5, defaults: [16, 32, 64, 128, 256, 512, 1024], value: 32 },
			{ id: 'degree', dname: 'Degree', type: 'number', step: 4, defaults: [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], value: 16 },
			{ id: 'smooth', dname: 'Smooth', type: 'number', step: 4, defaults: [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], value: 8 },
		],
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return ecbones.bkBones({
				xAxis: [
					ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Standardized' }),
				],
				yAxis: [
					ecbones.yAxis({ gridIndex: gridIndex + 1 }),
				],
				series: [
					ecbones.line({ name: 'Pasts', z: 19, color: utils.COLORS_500.orange }),
					ecbones.line({ name: 'Futures', z: 19, color: utils.COLORS_500.purple }),
					ecbones.line({ name: 'Past Stds', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.orange }),
					ecbones.line({ name: 'Future Stds', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.purple }),
					ecbones.line({ name: 'Linear', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.pink }),
					ecbones.line({ name: 'Quadratic', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.blue }),
				],
			}, gridIndex + 2, xAxisIndex + 2, yAxisIndex + 2, seriesIndex + 6, !_.isEmpty(this.bkquotes), this.notes)
		},
		data: function(quotes, cquote) {
			let data = [] as Array<Array<ECharts.DataPoint>>
			let nfutures = this.settings[1].value
			let degree = this.settings[2].value
			let smooth = this.settings[3].value

			if (this.bkindex == -2) this.bkindex = this.settings[0].value;
			if (this.bkindex == -1) this.bkindex = quotes.length - 1;
			let lasti = _.findLastIndex(quotes, v => _.isFinite(v.lastStamp))
			if (this.bkindex > lasti) this.bkindex = lasti;
			if (this.bkindex < degree) this.bkindex = degree;

			if (this.bkindex - this.settings[0].value <= 0) this.settings[0].value = this.bkindex;
			if (this.settings[0].value < degree) this.settings[0].value = degree;
			let pastticks = this.settings[0].value

			let i: number, len = this.settings.length
			for (i = 0; i < len; i++) {
				if (!_.isFinite(this.settings[i].value)) return [];
			}

			let strat = shared.stratForecast(quotes, {
				bkindex: this.bkindex, pastticks, nfutures, degree, smooth,
			})
			data = data.concat(strat.data)

			Object.keys(strat).forEachFast(k => {
				let note = this.notes.find(v => v.id == k)
				if (!note) return;
				// if (k == 'linearChange') return note.value = utils.formatNumber(strat[k], 2) + '%';
				note.value = strat[k]
			})

			return ecbones.bkData(data, quotes, this.bkquotes, this.notes)
		},
		runBacktest: function(quotes) {
			let tstart = Date.now()
			let pastticks = this.settings[0].value
			let nfutures = this.settings[1].value
			let degree = this.settings[2].value
			let smooth = this.settings[3].value
			let bkindex = pastticks
			let nids = this.notes.mapFast(v => v.id)
			this.bkquotes = []
			let i: number, len = quotes.length
			for (i = bkindex; i < len; i++) {
				let quote = quotes[i]
				let strat = shared.stratForecast(quotes, {
					bkindex: i, pastticks, nfutures, degree, smooth,
				})
				let prev = this.bkquotes[this.bkquotes.length - 1]; if (!prev) prev = {} as any;
				let bkquote = { lastStamp: quote.lastStamp, bkindex: i, action: strat.action, prevAction: prev.action, notes: {} } as BacktestQuote
				ecbones.bkQuoteNotes(bkquote, strat, nids, this.notes)
				this.bkquotes.push(bkquote)
			}
			this.bkbenchmark = Date.now() - tstart
			return this.bkquotes
		},
	},



	/*████  Actions  ████*/
	{
		id: 'acts',
		dname: 'Actions',
		category: 'broker',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				series: [
					ecbones.scatter({ name: 'Actions', z: 9, width: 2.5, symbol: 'circle' }),
					ecbones.line({ name: 'Buy', color: utils.COLORS_500.green, z: 9, width: 2.5 }),
					ecbones.line({ name: 'Sell', color: utils.COLORS_500.red, z: 9, width: 2.5 }),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(3, [] as Array<ECharts.DataPoint>)
			quotes.forEachFast(function(quote, i) {
				data[1][i] = { value: [quote.lastStamp, null] }
				data[2][i] = { value: [quote.lastStamp, null] }
				if (!quote.action) return;
				let prev = quotes[i - 1]; if (!prev) prev = {};
				let next = quotes[i + 1]; if (!next) next = {};
				if (quote.action == prev.action || quote.action == next.action) {
					if (quote.action == 'buy') data[1][i] = { value: [quote.lastStamp, quote.lastPrice] };
					if (quote.action == 'sell') data[2][i] = { value: [quote.lastStamp, quote.lastPrice] };
				} else {
					data[0].push({ value: [quote.lastStamp, quote.lastPrice], name: _.startCase(quote.action), itemStyle: { normal: { color: quote.action == 'buy' ? utils.COLORS_500.green : utils.COLORS_500.red } } })
				}
			})
			return data
		},
	},

	/*████  IB Trading  ████*/
	{
		id: 'ibkr',
		dname: 'IB Trading',
		category: 'broker',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				xAxis: [
					ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Unrealized P/L %' }),
					ecbones.xAxis({ gridIndex: gridIndex + 2, name: 'Realized P/L' }),
				],
				yAxis: [
					ecbones.yAxis({ gridIndex: gridIndex + 1 }),
					ecbones.yAxis({ gridIndex: gridIndex + 2 }),
				],
				series: [
					ecbones.scatter({ name: 'Orders', z: 19, width: 8, symbol: 'arrow', outline: true }),
					ecbones.scatter({ name: 'Executions', z: 29, width: 4, symbol: 'diamond', outline: true }),
					ecbones.line({ name: 'Unrealized P/L %', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1 }),
					ecbones.line({ name: 'Realized P/L', xAxisIndex: xAxisIndex + 2, yAxisIndex: yAxisIndex + 2 }),
				],
				visualMap: [
					ecbones.visualMap([seriesIndex + 2]),
					ecbones.visualMap([seriesIndex + 3]),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(4, [] as Array<ECharts.DataPoint>)
			let stamps = quotes.mapFast(v => v.lastStamp)

			let orders = store.store.state.ib.orders.filter(v => v.symbol == cquote.symbol)
			orders.forEachFast(function(v) {
				if (v.createdAt < stamps[0] || v.createdAt > stamps[stamps.length - 1]) return;
				if (v.avgFillPrice == 0) return;
				let net = v.filled * v.avgFillPrice
				if (v.action == 'SELL') net = -net;
				let name = [
					'Order #' + v.orderId,
					'<span class="t-bold ' + (v.action == 'BUY' ? 'success--text--dbg' : 'error--text--dbg') + '">' + utils.humanPlusMinus(net, 2, true, false) + '</span>',
				]
				let quote = quotes[utils.array_closest(stamps, v.createdAt)]
				let symbolRotate = v.action == 'BUY' ? 0 : 180
				let color = v.action == 'BUY' ? utils.COLORS_500.green : utils.COLORS_500.red
				data[0].push({ value: [quote.lastStamp, quote.lastPrice], name: name as any, symbolRotate, itemStyle: { normal: { color } } })
			})

			let executions = store.store.state.ib.executions.filter(v => v.symbol == cquote.symbol)
			executions.forEachFast(function(v) {
				if (v.lastUpdate < stamps[0] || v.lastUpdate > stamps[stamps.length - 1]) return;
				let net = v.shares * v.price
				if (v.side == 'SLD') net = -net;
				let name = utils.humanPlusMinus(net, 2, true, false)
				let quote = quotes[utils.array_closest(stamps, v.createdAt)]
				let symbolRotate = v.side == 'BOT' ? 180 : 0
				let color = v.side == 'BOT' ? utils.COLORS_500.green : utils.COLORS_500.red
				data[1].push({ value: [quote.lastStamp, v.price], name: name as any, symbolRotate, itemStyle: { normal: { color } } })
			})

			quotes.forEachFast(function(v, i) {
				let pnl = utils.calcPercentChange(v.lastPrice, v.avgCost)
				data[2].push({ value: [v.lastStamp, pnl == 0 ? null : pnl] })
				// data[2].push({ value: [v.lastStamp, v.unrealizedPNL == 0 ? null : v.unrealizedPNL] })
				data[3].push({ value: [v.lastStamp, v.realizedPNL] })
			})

			return data
		},
	},



	/*████  Candlestick Patterns  ████*/
	{
		id: 'cstk',
		dname: 'Candlestick Patterns',
		category: 'patterns',
		single: true,
		helpurl: 'http://stockcharts.com/school/doku.php?id=chart_school:chart_analysis:candlestick_pattern_dictionary',
		settings: [
			{
				id: 'bullish', dname: 'Bullish Patterns', type: 'select', multi: true, value: [], color: 'success',
				defaults: ['BullishEngulfingPattern', 'DownsideTasukiGap', 'BullishHarami', 'BullishHaramiCross', 'MorningDojiStar', 'MorningStar', 'BullishMarubozu', 'PiercingLine', 'ThreeWhiteSoldiers'],
			},
			{
				id: 'bearish', dname: 'Bearish Patterns', type: 'select', multi: true, value: [], color: 'error',
				defaults: ['BearishEngulfingPattern', 'BearishHarami', 'BearishHaramiCross', 'EveningDojiStar', 'EveningStar', 'BearishMarubozu', 'ThreeBlackCrows'],
			},
		],
		init: function(source) {
			this.settings.forEachFast(v => {
				v.defaults = _.orderBy(v.defaults.mapFast(v => ({ text: _.startCase(v), value: v })), ['text'], ['asc'])
			})
		},
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return {
				series: [
					ecbones.scatter({ name: 'Bullish Patterns', width: 6, z: 9, symbol: 'triangle', color: utils.COLORS_500.green, outline: true }, { symbolOffset: [0, '-150%'] }),
					ecbones.scatter({ name: 'Bearish Patterns', width: 6, z: 9, symbol: 'triangle', color: utils.COLORS_500.red, outline: true, flip: true }, { symbolOffset: [0, '150%'] }),
				],
			}
		},
		data: function(quotes, cquote) {
			let data = shared.prefilledArray(2, [] as Array<ECharts.DataPoint>)
			let bullfilter = this.settings.find(v => v.id == 'bullish')
			console.log('bullfilter', JSON.stringify(bullfilter, null, 4))
			let bearfilter = this.settings.find(v => v.id == 'bearish')
			quotes.forEachFast(function(quote, i) {
				let input = {
					open: [quote.open],
					high: [quote.high],
					low: [quote.low],
					close: [quote.close],
				}
				if (quotes[i - 1]) {
					let prev = quotes[i - 1]
					input.open.unshift(prev.open)
					input.high.unshift(prev.high)
					input.low.unshift(prev.low)
					input.close.unshift(prev.close)
				}
				if (quotes[i - 2]) {
					let prev = quotes[i - 2]
					input.open.unshift(prev.open)
					input.high.unshift(prev.high)
					input.low.unshift(prev.low)
					input.close.unshift(prev.close)
				}
				let bullish = charts.candlestickPatterns(input, 'bullish', bullfilter.value)
				if (bullish.result) data[0].push({ value: [quote.lastStamp, quote.high], name: bullish.patterns as any });
				let bearish = charts.candlestickPatterns(input, 'bearish', bearfilter.value)
				if (bearish.result) data[1].push({ value: [quote.lastStamp, quote.low], name: bearish.patterns as any });
			})
			return data
		},
	},



	// /*████  Debug  ████*/
	// {
	// 	id: 'dbg',
	// 	dname: 'Debug',
	// 	category: 'developer',
	// 	single: true,
	// 	settings: [
	// 		{
	// 			id: 'period', dname: 'Period', type: 'number', step: 1, defaults: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], value: 16,
	// 			desc: 'Adjusts the smoothness of the curve.',
	// 		},
	// 	],
	// 	bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
	// 		return {
	// 			xAxis: [
	// 				ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Debug' }),
	// 			],
	// 			yAxis: [
	// 				ecbones.yAxis({ gridIndex: gridIndex + 1 }),
	// 			],
	// 			series: [
	// 				ecbones.line({ name: 'Debug', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, width: 2, color: utils.COLORS_500.blue }),
	// 			],
	// 		}
	// 	},
	// 	data: function(quotes, cquote) {
	// 		let period = this.settings[0].value
	// 		let tdata = quotes.mapFast(v => [v.lastStamp, v.close])
	// 		tdata = shared.smoother(tdata, period)
	// 		return [tdata.mapFast((v, i) => { return { value: [quotes[i].lastStamp, v[1]] } })]
	// 	},
	// },



	/*████  EWMAs  ████*/
	{
		id: 'eprc',
		dname: 'Price EWMAs',
		category: 'ewmas',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return ecbones.ewmaBones('Price', gridIndex, xAxisIndex, yAxisIndex)
		},
		data: function(quotes, cquote) {
			return ecbones.ewmaData('Price', quotes)
		},
	},
	{
		id: 'esiz',
		dname: 'Size EWMAs',
		category: 'ewmas',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return ecbones.ewmaBones('Size', gridIndex, xAxisIndex, yAxisIndex)
		},
		data: function(quotes, cquote) {
			return ecbones.ewmaData('Size', quotes)
		},
	},
	{
		id: 'etrs',
		dname: 'Trade Size EWMAs',
		category: 'ewmas',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return ecbones.ewmaBones('Trade Size', gridIndex, xAxisIndex, yAxisIndex)
		},
		data: function(quotes, cquote) {
			return ecbones.ewmaData('Trade Size', quotes)
		},
	},
	{
		id: 'etrv',
		dname: 'Trade Volume EWMAs',
		category: 'ewmas',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return ecbones.ewmaBones('Trade Volume', gridIndex, xAxisIndex, yAxisIndex)
		},
		data: function(quotes, cquote) {
			return ecbones.ewmaData('Trade Volume', quotes)
		},
	},
	{
		id: 'evlc',
		dname: 'Velocity EWMAs',
		category: 'ewmas',
		sources: ['lives'],
		single: true,
		bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
			return ecbones.ewmaBones('Velocity', gridIndex, xAxisIndex, yAxisIndex)
		},
		data: function(quotes, cquote) {
			return ecbones.ewmaData('Velocity', quotes)
		},
	},



	// /*████  Support & Resistance  ████*/
	// {
	// 	id: 'snr',
	// 	dname: 'Support & Resistance',
	// 	category: 'calcs',
	// 	sources: ['lives'],
	// 	single: true,
	// 	settings: [
	// 		{
	// 			id: 'grid', dname: 'Grid', type: 'number', step: 1, defaults: [5, 10, 15, 20, 25], value: 10,
	// 		},
	// 		{
	// 			id: 'threshold', dname: 'Threshold', type: 'number', step: 1, defaults: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50], value: 25,
	// 		},
	// 	],
	// 	bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
	// 		let grid = this.settings[0].value
	// 		let threshold = this.settings[1].value
	// 		let tdata = quotes.mapFast(v => [v.stamp, v.lastPrice])
	// 		let supports = utils.supports(tdata, grid, threshold)

	// 		let series = ecbones.line({ name: 'Support & Resistance', color: utils.COLORS_500.purple })
	// 		let mldata = []
	// 		supports.forEachFast(v => mldata.push({ yAxis: v }))
	// 		series.markLine = ecbones.markLine({ data: mldata })
	// 		console.log('series.markLine.data', series.markLine.data)
	// 		return { series: [series] }
	// 	},
	// 	data: function(quotes, cquote) {
	// 		// let grid = this.settings[0].value
	// 		// let threshold = this.settings[1].value
	// 		// let tdata = quotes.mapFast(v => [v.stamp, v.lastPrice])
	// 		// let supports = utils.supports(tdata, grid, threshold)
	// 		// console.log('supports', supports)
	// 		return [[]]
	// 	},
	// },



	// /*████  Bid Ask Spread  ████*/
	// {
	// 	id: 'basp',
	// 	dname: 'Bid Ask Spread',
	// 	category: 'calcs',
	// 	sources: ['lives'],
	// 	single: true,
	// 	bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
	// 		return {
	// 			xAxis: [
	// 				ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Bid Ask Spread' }),
	// 			],
	// 			yAxis: [
	// 				ecbones.yAxis({ gridIndex: gridIndex + 1 }),
	// 			],
	// 			series: [
	// 				ecbones.line({ name: 'Spread', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.lightblue, width: 2, z: 9 }),
	// 			]
	// 		}
	// 	},
	// 	data: function(quotes, cquote) {
	// 		let data = shared.prefilledArray(1, [] as Array<ECharts.DataPoint>)
	// 		quotes.forEachFast(function(v) {
	// 			data[0].push({ value: [v.lastStamp, v.askPrice - v.bidPrice] })
	// 		})
	// 		return data
	// 	},
	// },



	// /*████  Orders Filled  ████*/
	// {
	// 	id: 'ordf',
	// 	dname: 'Orders Filled',
	// 	category: 'calcs',
	// 	sources: ['lives'],
	// 	single: true,
	// 	bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
	// 		return {
	// 			xAxis: [
	// 				ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Orders Filled' }),
	// 			],
	// 			yAxis: [
	// 				ecbones.yAxis({ gridIndex: gridIndex + 1 }),
	// 			],
	// 			series: [
	// 				ecbones.line({ name: 'Ask Orders Filled', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.green, width: 2 }),
	// 				ecbones.line({ name: 'Bid Orders Filled', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.red, width: 2 }),
	// 			]
	// 		}
	// 	},
	// 	data: function(quotes, cquote) {
	// 		let data = shared.prefilledArray(2, [] as Array<ECharts.DataPoint>)
	// 		quotes.forEachFast(function(v) {
	// 			data[0].push({ value: [v.lastStamp, _.round(v.tradeBuySize / v.askSizeAccum, 2)] })
	// 			data[1].push({ value: [v.lastStamp, _.round(v.tradeSellSize / v.bidSizeAccum, 2)] })
	// 		})
	// 		return data
	// 	},
	// },



	// /*████  Volume Weighted Average Price  ████*/
	// {
	// 	id: 'vwap',
	// 	dname: 'Volume Weighted Average Price',
	// 	category: 'calcs',
	// 	sources: ['yahoo'],
	// 	single: true,
	// 	bones: function(quotes, gridIndex, xAxisIndex, yAxisIndex, seriesIndex, source) {
	// 		return {
	// 			xAxis: [
	// 				ecbones.xAxis({ gridIndex: gridIndex + 1, name: 'Volume Weighted Average Price' }),
	// 			],
	// 			yAxis: [
	// 				ecbones.yAxis({ gridIndex: gridIndex + 1 }),
	// 			],
	// 			series: [
	// 				ecbones.line({ name: 'VWAP', xAxisIndex: xAxisIndex + 1, yAxisIndex: yAxisIndex + 1, color: utils.COLORS_500.blue, width: 2 }),
	// 			]
	// 		}
	// 	},
	// 	data: function(quotes, cquote) {
	// 		let input = { high: [], low: [], close: [], volume: [], period: 10 }
	// 		quotes.forEachFast(function(v) {
	// 			input.high.push(v.high)
	// 			input.low.push(v.low)
	// 			input.close.push(v.close)
	// 			input.volume.push(v.size)
	// 		})
	// 		let vwap = ti.vwap(input as any)
	// 		console.log('vwap', vwap)
	// 		let data = vwap.mapFast((v, i) => { return { value: [quotes[i].lastStamp, v] } })
	// 		console.log('data', data)
	// 		return [data]
	// 	},
	// },



] as Array<Dataset>

Templates.forEachFast(function(template) {
	if (!Array.isArray(template.sources)) template.sources = [];

	if (Array.isArray(template.settings)) {
		template.settings.forEachFast(function(v) {
			// if (!v.value && Array.isArray(v.defaults)) v.value = v.defaults[0];
			// if (!v.type && v.value) v.type = typeof v.value;
			// if (!v.color) v.color = 'secondary';
		})
	}

	if (template.backtestable) {
		if (!Array.isArray(template.notes)) template.notes = [];
		template.notes = template.notes.concat([
			{ id: 'action' },
			// { id: 'benchmark', isbk: true },
			{ id: 'orders', isbk: true },
			{ id: 'fees', isbk: true },
			{ id: 'pnlHigh', isbk: true },
			{ id: 'pnlLow', isbk: true },
			{ id: 'pnlClose', isbk: true },
		] as Array<DatasetNote>)
		template.notes.forEachFast(function(note) {
			shared.repair(note, {
				isbk: false,
				graph: false,
				graphable: false,
				value: null,
			} as DatasetNote)
		})
	}

})


