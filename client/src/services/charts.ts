// 

import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import * as echarts from 'echarts'
import * as ti from 'technicalindicators'
import * as shared from '../shared'
import * as utils from './utils'
import * as http from './http'
import * as datasets from './datasets'



declare global {
	interface ChartBounds {
		start: number
		startValue: number
		end: number
		endValue: number
		needsupdate: boolean
	}
	interface LivesRangePicker {
		dstart: string
		tstart: string
		dend: string
		tend: string
	}
}





export function tooltipFormatter(params: Array<ECharts.TooltipParams>, opts = {} as {
	linkpointer?: boolean
	hidezeros?: boolean
	axishr?: boolean
	masterhr?: boolean
	uuidhr?: boolean
}): string {
	// console.log('tooltipFormatter', params)
	if (_.isEmpty(params)) return '';
	let first = _.first(params)
	params = _.orderBy(params, ['axisIndex', 'seriesIndex'], ['asc', 'asc'])
	let dataindex = params[0].dataIndex
	if (!opts.linkpointer) params = params.filter(v => v.axisIndex == first.axisIndex);
	let tips = '<div class="echart-tips caption">'
	let laststamp = Number.parseInt(params[0].axisValue)
	tips += '[' + dataindex + '] ' + xlabel(laststamp) + '<hr>'
	tips += '<table>'
	let didmaster = params[0].axisIndex > 0
	let axisindex = params[0].axisIndex
	let uuid = params[0].seriesId.split(':')[1]
	if (opts.hidezeros) {
		params = params.filter(function(param) {
			let value = Array.isArray(param.value) ? param.value[1] : param.value
			return !!value
		})
	}

	// if (params.length == 1) {
	// 	let param = params[0]
	// 	let value = (Array.isArray(param.value) ? param.value[1] : param.value) as number
	// 	if (!Number.isFinite(value)) return '';
	// }

	params.forEachFast(function(param) {
		// console.log('param', param)
		let value = (Array.isArray(param.value) ? param.value[1] : param.value) as number
		if (!Number.isFinite(value)) return;

		let psplit = param.seriesId.split(':')
		let pid = psplit[0]
		let puuid = psplit[1]
		if (opts.masterhr && param.seriesIndex >= 2 && !didmaster) {
			didmaster = true
			tips += '<tr class="axis-hr">'
		} else if (opts.axishr && param.axisIndex > axisindex) {
			tips += '<tr class="axis-hr">'
		} else if (opts.uuidhr && puuid != uuid && param.axisIndex == 0 && param.seriesIndex >= 2) {
			tips += '<tr class="axis-hr">'
			// tips += '<td width="1"></td><td width="1" class="pr-3"></td><td class="caption">[' + pid.toUpperCase().bold() + ']</td></tr><tr>'
		} else tips += '<tr>';
		axisindex = param.axisIndex
		uuid = puuid

		let precision = null as number
		let psname = shared.parseToId(param.seriesName, true)
		if (psname.indexOf('price') >= 0) precision = 2;
		if (psname.indexOf('size') >= 0) precision = 0;
		if (psname.indexOf('volume') >= 0) precision = 0;
		if (psname.indexOf('count') >= 0) precision = 0;
		if (psname.indexOf('ratio') >= 0) precision = 2;
		if (psname.indexOf('osc') >= 0) precision = 2;
		if (psname.indexOf('prog') >= 0) precision = 2;
		if (psname.indexOf('rate') >= 0) precision = 2;
		if (psname.indexOf('spread') >= 0) precision = 2;
		if (psname.indexOf('percent') >= 0) precision = 2;
		if (param.seriesName.indexOf('%') >= 0) precision = 2;

		if (param.seriesType == 'candlestick') {
			let vs = (param.value as any).mapFast(v => utils.formatNumber(v).bold()) as Array<string>
			vs.shift()
			vs.forEachFast(function(v, i) {
				if (i > 0) tips += '<tr>';
				tips += '<td width="1">' + (i == 3 ? param.marker : '') + '</td>'
				if (i == 0) tips += '<td width="1" class="pr-3">' + vs[0] + '</td>';
				if (i == 0) tips += '<td>Open</td>';
				if (i == 1) tips += '<td width="1" class="pr-3">' + vs[3] + '</td>';
				if (i == 1) tips += '<td>High</td>';
				if (i == 2) tips += '<td width="1" class="pr-3">' + vs[2] + '</td>';
				if (i == 2) tips += '<td>Low</td>';
				if (i == 3) tips += '<td width="1" class="pr-3">' + vs[1] + '</td>';
				if (i == 3) tips += '<td>Close</td>';
				if (i < 3) tips += '</tr>';
			})

		} else {
			tips += '<td width="1">' + param.marker + '</td>'
			let name = param.name && isNaN(param.name as any) ? param.name : param.seriesName
			let data = param.data as any
			if (data && data.name && isNaN(data.name)) {
				if (Array.isArray(data.name)) name = data.name.join('<br>') + '<br>';
				else name = data.name;
			}
			let vstr = utils.formatNumber(value, precision, 1000000)
			if (name.indexOf('Percent') >= 0 || name.indexOf('%') >= 0) {
				vstr += '％'
				name = name.replace('%', '％')
			}
			tips += '<td width="1" class="pr-3">' + vstr.bold() + '</td>'
			tips += '<td>' + name + '</td>';

		}
		tips += '</tr>'
	})
	tips += '</table></div>'
	// console.log('tips', tips)
	return tips
}





export function xlabel(stamp: number, fromnow = false, showtoday = false) {
	stamp = Number.parseInt(stamp as any)
	if (!Number.isFinite(stamp)) return '';
	let mstamp = shared.moment(stamp)
	let hour1ago = shared.moment().subtract(1, 'hour').valueOf()
	let today = shared.moment().startOf('day').valueOf()
	let yesterday = shared.moment().startOf('day').subtract(1, 'day').valueOf()
	let week1ago = shared.moment().startOf('day').subtract(1, 'week').valueOf()
	let month1ago = shared.moment().startOf('day').subtract(1, 'month').valueOf()
	let year1ago = shared.moment().startOf('day').subtract(1, 'year').valueOf()
	let ismidnight = mstamp.format('h:mm a') == '12:00 am'

	let label: string
	if (stamp >= today) {
		label = mstamp.format('h:mm:ss a')
		if (!fromnow || showtoday) label = 'Today @ ' + label;
	} else if (stamp >= yesterday) {
		label = 'Yesterday @ ' + mstamp.format('h:mm:ss a')
	} else if (stamp >= week1ago) {
		let format = ismidnight ? 'ddd, MMM D' : 'ddd, MMM D @ h:mm:ss a'
		label = mstamp.format(format)
	} else if (stamp >= month1ago) {
		let format = ismidnight ? 'ddd, MMM D' : 'ddd, MMM D @ h:mm a'
		label = mstamp.format(format)
	} else if (stamp >= year1ago) {
		let format = ismidnight ? 'ddd, MMM D' : 'ddd, MMM D @ h:mm a'
		label = mstamp.format(format)
	} else {
		label = mstamp.format('MMM D YYYY')
	}
	if (fromnow) label += ' (' + mstamp.fromNow() + ')';
	return label
}





// export function buildTiData(ds: datasets.Dataset, quotes: Array<FullQuote>, fn: string, tikeys: Array<string>, qkeys?: Array<string>, outkeys?: Array<string>) {
// 	if (Array.isArray(tikeys) && !Array.isArray(qkeys)) qkeys = utils.clone(tikeys);
// 	if (tikeys.length == 0) tikeys.push('values');
// 	if (qkeys.length == 0) qkeys.push(ds.against[0].value);
// 	let params = {} as any
// 	if (Array.isArray(ds.settings)) ds.settings.forEachFast(v => params[v.id] = v.value);
// 	tikeys.forEachFast((key, i) => params[key] = quotes.mapFast(quote => quote[qkeys[i]]))
// 	let results = ti[fn](params) as Array<any>
// 	let prefilled = shared.prefilledArray(quotes.length - results.length, null)
// 	let data = [] as Array<Array<any>>
// 	if (Array.isArray(outkeys)) outkeys.forEachFast(output => data.push(prefilled.concat(results.mapFast(v => v[output]))));
// 	else data.push(prefilled.concat(results));
// 	return data
// }





export function livesMlData(quotes: Array<FullQuote>) {
	let mldata = []
	if (quotes.length <= 1) return mldata;

	let start = shared.moment(quotes[0].lastStamp).valueOf()
	let end = shared.moment(quotes[quotes.length - 1].lastStamp).valueOf()
	let days = _.ceil(moment.duration(end - start).asDays())
	Array(days).forEachFast(function(v, i) {
		let sday = shared.moment(start).startOf('day').add(i, 'days').valueOf()
		mldata.push({ xAxis: shared.moment(sday).add(9, 'hours').add(30, 'minutes').valueOf() })
		mldata.push({ xAxis: shared.moment(sday).add(16, 'hours').valueOf() })
	})

	return mldata
}

export function yahooMlData(quotes: Array<FullQuote>, stamps: Array<number>, range: string) {
	let mldata = []
	if (quotes.length <= 1) return mldata;

	if (['1d', '5d', '1mo'].indexOf(range) >= 0) {
		let start = shared.moment(quotes[0].lastStamp).valueOf()
		let end = shared.moment(quotes[quotes.length - 1].lastStamp).valueOf()
		let days = _.ceil(moment.duration(end - start).asDays())
		Array(days).forEachFast((v, i) => {
			let stday = shared.moment(start).startOf('day').add(i, 'days').valueOf()
			let day = shared.moment(stday).day()
			if (day == 0 || day == 6) return;
			let am930 = shared.moment(stday).add(9, 'hours').add(30, 'minutes').valueOf()
			if (end < am930) return;
			mldata.push({ xAxis: am930 })
			if (range == '1mo') return;
			let pm4 = shared.moment(stday).add(16, 'hours').valueOf()
			if (end < pm4) return;
			mldata.push({ xAxis: pm4 })
		})
	}

	if (['3mo'].indexOf(range) >= 0) {
		let start = shared.moment(quotes[0].lastStamp).valueOf()
		let end = shared.moment(quotes[quotes.length - 1].lastStamp).valueOf()
		let weeks = _.ceil(moment.duration(end - start).asWeeks()) + 1
		Array(weeks).forEachFast((v, i) => {
			let stweek = shared.moment(start).startOf('week').add(i, 'weeks').valueOf()
			mldata.push({ xAxis: stweek })
		})
	}

	if (['1y'].indexOf(range) >= 0) {
		let start = shared.moment(quotes[0].lastStamp).valueOf()
		let end = shared.moment(quotes[quotes.length - 1].lastStamp).valueOf()
		let months = _.ceil(moment.duration(end - start).asMonths()) + 1
		Array(months).forEachFast((v, i) => {
			let stmonth = shared.moment(start).startOf('month').add(i, 'months').valueOf()
			mldata.push({ xAxis: stmonth })
		})
	}

	if (['5y', 'max'].indexOf(range) >= 0) {
		let start = shared.moment(quotes[0].lastStamp).valueOf()
		let end = shared.moment(quotes[quotes.length - 1].lastStamp).valueOf()
		let years = _.ceil(moment.duration(end - start).asYears())
		Array(years).forEachFast((v, i) => {
			let styear = shared.moment(start).startOf('year').add(i, 'years').valueOf()
			mldata.push({ xAxis: styear })
		})
	}

	// console.log('mldata', mldata)
	// mldata.forEachFast((v, i) => console.log(i, shared.prettyStamp(v.xAxis)))

	mldata.removeFast(function(v, i) {
		let ii = utils.array_closest(stamps, v.xAxis, 'min')
		if (i == 0 && ii == 0) return true;
		v.xAxis = ii
		return false
	})

	return mldata
}





export function candlestickPatterns(input: any, which: 'bullish' | 'bearish', filter = [] as Array<string>) {
	let results = { result: false, patterns: [] as Array<string> }
	let patterns = {
		bullish: ['BullishEngulfingPattern', 'DownsideTasukiGap', 'BullishHarami', 'BullishHaramiCross', 'MorningDojiStar', 'MorningStar', 'BullishMarubozu', 'PiercingLine', 'ThreeWhiteSoldiers'],
		bearish: ['BearishEngulfingPattern', 'BearishHarami', 'BearishHaramiCross', 'EveningDojiStar', 'EveningStar', 'BearishMarubozu', 'ThreeBlackCrows'],
	}[which]
	if (filter.length > 0) {
		let parsed = filter.mapFast(v => shared.parseToId(v, true))
		patterns = patterns.filter(v => parsed.indexOf(shared.parseToId(v, true)) >= 0)
	}
	results.result = patterns.reduce(function(state, pattern) {
		let result = ti[shared.parseToId(pattern, true)](input)
		if (result) results.patterns.push(_.startCase(pattern));
		return state || result
	}, false)
	return results
}










