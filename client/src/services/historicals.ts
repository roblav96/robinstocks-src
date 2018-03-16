// 

import _ from 'lodash'
import moment from 'moment'
import * as shared from '../shared'
import * as utils from './utils'
import * as http from './http'



export function getChart(symbol: string, range: string, interval: string) {
	let afterhours = YRanges.indexOf(range) <= 1 ? true : false
	return getYahooChart(symbol, range, interval, afterhours).then(function(yhquotes) {
		yhquotes.sort((a, b) => a.lastStamp - b.lastStamp)
		yhquotes.forEachFast(function(yhquote, i) {
			yhquote.size = yhquote.volume
			let prev = yhquotes[i - 1] ? yhquotes[i - 1].volume : 0
			yhquote.volume = prev + yhquote.size
			yhquote.lastPrice = yhquote.close
		})
		return Promise.resolve(yhquotes)
	})
}



export function prettyPeriod(period: string) {
	let n = Number.parseInt(period.replace(/[^0-9]/g, ''))
	let s = period.replace(/[0-9]/g, '')
	if (s == 'm') s = 'Minute';
	if (s == 'h') s = 'Hour';
	if (s == 'd') s = 'Day';
	if (s == 'wk') s = 'Week';
	if (s == 'mo') s = 'Month';
	if (s == 'y') s = 'Year';
	if (s == 'ytd') s = 'YTD';
	if (s == 'max') s = 'Max';
	if (n && n > 1) s = s + 's';
	if (!_.isFinite(n)) n = '' as any;
	return (n + ' ' + s).trim()
}

// export const YRanges = ['1d', '5d', '1mo', '3mo', '6mo', 'ytd', '1y', '2y', '5y', '10y', 'max']
export const YRanges = ['1d', '5d', '1mo', '3mo', '1y', '5y', 'max']
// export const YIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']
export const YIntervals = ['1m', '2m', '5m', '15m', '30m', '1h', '1d']

export const YFrames = {
	'1d': '2m',
	'5d': '15m',
	'1mo': '1h',
	'3mo': '1d',
	// '6mo': '1d',
	'ytd': '1d',
	'1y': '1d',
	'2y': '1wk',
	'5y': '1wk',
	'10y': '1mo',
	'max': '1mo',
} as { [range: string]: string }

function getYahooChart(symbol: string, range: string, interval: string, includePrePost: boolean): Promise<Array<HistQuote>> {
	let params = {
		range,
		interval,
		includePrePost,
		// corsDomain: 'finance.yahoo.com',
	} as any
	if (range == '1d' && shared.marketState().indexOf('PRE') == 0) {
		_.unset(params, 'range')
		let subs1 = shared.moment(process.$marketStamps.date).day() == 1 ? [3, 'days'] : [1, 'day']
		// let split = prettyPeriod(interval).split(' ')
		// let subs2 = [Number.parseInt(split[0]), split[1].toLowerCase()]
		// params.period1 = shared.moment(process.$marketStamps.closes).subtract(...subs1).subtract(...subs2).unix() - 1
		params.period1 = shared.moment(process.$marketStamps.am4).subtract(...subs1).unix()
		params.period2 = shared.moment(process.$marketStamps.pm8).unix()
	}
	return http.get('https://query1.finance.yahoo.com/v8/finance/chart/' + symbol, params).then(function(response: YahooChartResponse) {
		if (response.chart.error) return Promise.reject(response.chart.error.description);
		let results = [] as Array<HistQuote>
		let result = response.chart.result[0]
		let stamps = result.timestamp
		if (!stamps) return Promise.resolve(results);
		let quotes = result.indicators.quote[0]
		stamps.forEachFast(function(stamp, i) {
			if (!_.isFinite(quotes.close[i])) return;
			results.push({
				open: quotes.open[i],
				close: quotes.close[i],
				high: quotes.high[i],
				low: quotes.low[i],
				volume: quotes.volume[i],
				lastStamp: stamp * 1000, // yahoo doesnt know seconds
			} as HistQuote)
		})
		return Promise.resolve(results)
	})
}



const GFrames = {
	'1d': ['2d', '60'],
	'5d': ['6d', '300'],
	'1mo': ['20d', '900'],
	'3mo': ['3M', '1800'],
	'6mo': ['6M', '86400'],
	'ytd': ['YTD', '86400'],
	'1y': ['1Y', '86400'],
	'2y': ['2Y', '604800'],
	'5y': ['5Y', '604800'],
	'10y': ['10Y', '604800'],
	'max': ['40Y', '604800'],
} as { [range: string]: Array<string> }

function getGoogleChart(symbol: string, range: string): Promise<Array<HistQuote>> {
	let gframe = GFrames[range]
	return http.get('https://www.google.com/finance/getprices', {
		q: symbol,
		p: gframe[0],
		i: Number.parseInt(gframe[1]),
		sessions: 'ext_hours',
	}).then(function(response) {
		let gquotes = shared.parseGoogleChartCSV(response)
		return Promise.resolve(gquotes)
	})
}




