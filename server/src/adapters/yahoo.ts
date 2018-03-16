//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')
import logger = require('./logger')

import * as Nstream from 'stream'
import * as Nhttp from 'http'
import axios from 'axios'
import fs = require('fs')
import trumpet = require('trumpet')
import jsonic = require('jsonic')
import cron = require('cron')
import pdelay = require('delay')
import pevent = require('p-event')
import pforever = require('p-forever')
import redis = require('../adapters/redis')
import http = require('../adapters/http')





export class YahooStreamer {

	private static onTrumpet(span, fn: (squotes: Array<StreamQuote>) => void) {
		let chunked = ''
		let rs = span.createReadStream() as fs.ReadStream
		rs.on('data', chunk => chunked += chunk)
		rs.on('end', () => {
			rs.unpipe()
			rs.removeAllListeners()
			rs = null

			let input = chunked.toString()
			let jsons = [] as Array<{ [symbol: string]: { [idk_key: string]: string } }>
			let sqmap = {} as { [symbol: string]: StreamQuote }

			let split = input.split('yfs_u1f(')
			split.shift()
			split.forEachFast(function(v) {
				let parsed = v.substring(0, v.indexOf(');}'))
				if (!parsed) return logger.error('YahooStreamer rs.on.end !parsed > v', v);
				jsons.push(jsonic(parsed))
			})

			jsons.forEachFast(function(item) {
				Object.keys(item).forEachFast(function(symbol, i) {
					if (i > 1) logger.warn('YahooStreamer i > 1', item);
					if (!sqmap[symbol]) sqmap[symbol] = {} as any;
					let data = item[symbol]
					Object.keys(data).forEachFast(function(skey) {
						let value = data[skey]
						if (!isNaN(value as any)) {
							value = Number.parseFloat(value) as any
						} else if (value.indexOf(',') >= 0) {
							value = Number.parseInt(value.split(',').join('')) as any
						} else if (skey == STREAM_KEYS_MAP['marketcap']) {
							let by = value.slice(-1).toUpperCase()
							let num = Number.parseFloat(value.slice(0, -1))
							if (by == 'T') num = num * 1000000000000;
							else if (by == 'B') num = num * 1000000000;
							else if (by == 'M') num = num * 1000000;
							else if (by == 'K') num = num * 1000;
							value = num as any
						}
						let key = STREAM_KEYS_ALL[skey]
						sqmap[symbol][key] = value
					})
				})
			})

			if (_.isEmpty(sqmap)) return;
			fn(Object.keys(sqmap).mapFast(function(symbol) {
				let squote = sqmap[symbol]
				squote.symbol = symbol
				return squote
			}))

		})
	}

	tr: Nstream.Duplex & { selectAll: any }
	req: Nhttp.IncomingMessage
	canceler: AxiosCanceler
	keys: Array<string>
	onStreamQuotes?(squotes: Array<StreamQuote>): void

	constructor(
		private symbols: Array<string>,
		private id: string,
	) {
		// if (shared.marketState() == 'CLOSED' && process.PRODUCTION) return;
		pforever(() => this.start())
	}

	initing = true
	resetiniting() { this.initing = false }
	_resetiniting = _.throttle(this.resetiniting, 1000, { leading: false, trailing: true })

	destroy() {
		this.initing = process.PRODUCTION
		this.canceler = null
		if (this.tr) {
			this.tr.unpipe()
			this.tr.removeAllListeners()
			this.tr.end()
			this.tr = null
		}
		if (this.req) {
			this.req.unpipe()
			this.req.removeAllListeners()
			this.req.destroy(new Error())
			this.req = null
		}
	}

	start(): Promise<any> {
		this.destroy()

		let now = shared.now()
		{
			/*----------  yahoo streamer api bugs out between 5:30am and 5:35am  ----------*/
			let start = shared.moment(now).startOf('day').add(5, 'hours').add(30, 'minutes').valueOf()
			let end = shared.moment(start).add(5, 'minutes').valueOf()
			if (now > start && now < end) return pdelay(end - now) as any;
		}
		{
			/*----------  yahoo streamer api bugs out between 6:30am and 6:35am  ----------*/
			let start = shared.moment(now).startOf('day').add(6, 'hours').add(30, 'minutes').valueOf()
			let end = shared.moment(start).add(5, 'minutes').valueOf()
			if (now > start && now < end) return pdelay(end - now) as any;
		}
		{
			/*----------  yahoo streamer api bugs out between 6:30pm and 6:40pm  ----------*/
			let start = shared.moment(now).startOf('day').add(18, 'hours').add(30, 'minutes').valueOf()
			let end = shared.moment(start).add(10, 'minutes').valueOf()
			if (now > start && now < end) return pdelay(end - now) as any;
		}
		{
			/*----------  yahoo streamer api bugs out between 7:30pm and 7:40pm  ----------*/
			let start = shared.moment(now).startOf('day').add(19, 'hours').add(30, 'minutes').valueOf()
			let end = shared.moment(start).add(10, 'minutes').valueOf()
			if (now > start && now < end) return pdelay(end - now) as any;
		}

		this.tr = trumpet()
		this.tr.selectAll('script', span => {
			if (this.initing) return this._resetiniting();
			YahooStreamer.onTrumpet(span, this.onStreamQuotes)
		})

		return axios.get('https://streamerapi.finance.yahoo.com/streamer/1.0', {
			headers: {
				'Host': 'streamerapi.finance.yahoo.com',
				'Accept': '*/*',
				'Accept-Encoding': 'deflate, gzip',
				'Connection': 'keep-alive',
			},
			params: {
				s: this.symbols.join(','),
				k: this.keys.join(','),
				callback: 'parent.yfs_u1f',
				mktmcb: 'parent.yfs_mktmcb',
				gencallback: 'parent.yfs_gencb',
				mu: 1,
				lang: 'en-US',
				region: 'US',
				localize: 0,
			},
			responseType: 'stream',
			cancelToken: new axios.CancelToken(canceler => this.canceler = canceler),
		}).then(({ data }) => {
			this.req = data
			console.info('[' + this.id + '] yahoo streamer > connected', this.symbols.length)

			return new Promise((resolve, reject) => {
				this.req.on('error', error => {
					logger.error('[' + this.id + '] yahoo streamer > req.on.error > error >', utils.peRender(error as any))
					resolve()
				})
				this.req.on('end', () => {
					logger.warn('[' + this.id + '] yahoo streamer > req.on.end')
					resolve()
				})
				this.req.pipe(this.tr)
			})

		}).catch(error => {
			if (error) logger.error('[' + this.id + '] yahoo streamer > Axios.catch > error >', utils.peRender(error));
			return Promise.resolve()

		}).then(() => {
			if (this.canceler) {
				this.canceler()
				this.canceler = null
			}
			this.destroy()
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_3)
		}).then(() => {
			return pdelay(_.random(1000, 5000))
		})
	}

}





// new cron.CronJob({
// 	/*----------  6:30 AM Weekdays  ----------*/
// 	cronTime: utils.cronTime('30 06 * * 1-5'),
// 	start: process.PRODUCTION,
// 	onTick: function() {
// 		process.ee3_private.emit(shared.RKEY.SYS.RESTART)
// 	},
// 	timeZone: 'America/New_York',
// })
// new cron.CronJob({
// 	/*----------  6:35 AM Weekdays  ----------*/
// 	cronTime: utils.cronTime('35 06 * * 1-5'),
// 	start: process.PRODUCTION,
// 	onTick: function() {
// 		process.ee3_private.emit(shared.RKEY.SYS.RESTART)
// 	},
// 	timeZone: 'America/New_York',
// })

// new cron.CronJob({
// 	/*----------  7:30 PM Weekdays  ----------*/
// 	cronTime: utils.cronTime('30 19 * * 1-5'),
// 	start: process.PRODUCTION,
// 	onTick: function() {
// 		process.ee3_private.emit(shared.RKEY.SYS.RESTART)
// 	},
// 	timeZone: 'America/New_York',
// })
// new cron.CronJob({
// 	/*----------  7:40 PM Weekdays  ----------*/
// 	cronTime: utils.cronTime('40 19 * * 1-5'),
// 	start: process.PRODUCTION,
// 	onTick: function() {
// 		process.ee3_private.emit(shared.RKEY.SYS.RESTART)
// 	},
// 	timeZone: 'America/New_York',
// })





export const STREAM_KEYS_MAIN = {
	a00: 'ask',
	a50: 'asksize',
	b00: 'bid',
	b60: 'bidsize',
	c10: 'change',
	c63: 'changerealtime',
	c64: 'disputedchangerealtimeafterhours',
	c85: 'changerealtimeafterhours',
	c86: 'percentchangerealtimeafterhours2',
	g53: 'daylow',
	h53: 'dayhigh',
	j10: 'marketcap',
	l10: 'lastsaleprice',
	l84: 'pricerealtime',
	l86: 'pricerealtimeafterhours',
	p20: 'percentchange',
	p43: 'percentchangerealtime',
	p44: 'percentchangerealtimeafterhours',
	t10: 'lastsaletime',
	t53: 'disputedtimestampforcommodities',
	t54: 'disputedtimestampforstocks',
	v53: 'volume',
}
export const STREAM_KEYS_OTHERS = {
	g00: 'daysrangelow',
	h00: 'daysrangehigh',
	v00: 'volume2',
	t50: 'ecnquotelasttime',
	t51: 'ecnexthourtime',
	l90: 'ecnquotelastvalue',
	l91: 'ecnexthourprice',
	c81: 'ecnquoteafterhourchangeabsolute',
	c60: 'ecnquotechangeabsolute',
	z02: 'ecnexthourchange',
	z08: 'ecnexthourchange',
	c82: 'ecnquoteafterhourchangepercent',
	p40: 'ecnquotechangepercent',
	p41: 'ecnexthourpercentchange',
	z09: 'ecnexthourpercentchange',
}
export const STREAM_KEYS_ALL = Object.assign({}, STREAM_KEYS_MAIN, STREAM_KEYS_OTHERS)
const STREAM_KEYS_MAP = _.invert(STREAM_KEYS_ALL) as { [key: string]: string }





export function getQuotes(symbols: Array<string>, fast = false): Promise<Array<YahooQuote>> {
	if (!Array.isArray(symbols) || symbols.length == 0) return Promise.resolve([]);

	let timeout = fast && process.PRODUCTION ? 500 : 1000
	return Promise.resolve().then(function() {
		return http.get('https://query1.finance.yahoo.com/v7/finance/quote', {
			symbols: symbols.join(','),
		}, { silent: true, timeout })

	}).then(function(response: YahooQuoteResponse) {
		if (_.get(response, 'quoteResponse.error')) return Promise.reject(JSON.stringify(response.quoteResponse.error));
		if (_.isEmpty(_.get(response, 'quoteResponse.result'))) return Promise.resolve([]);

		let yquotes = response.quoteResponse.result.filter(v => !!v)
		yquotes.forEachFast(function(yquote, i) {
			yquote.symbol = yquote.symbol.toUpperCase()
			yquote.stamp = shared.now()
		})
		return Promise.resolve(yquotes)

	}).catch(function(error) {
		if (utils.isTimeoutError(error)) {
			if (process.DEVELOPMENT) console.info('getQuotes timeout > ' + timeout + 'ms >', symbols.length, 'symbols');
			let tick = fast ? shared.RKEY.SYS.TICK_025 : shared.RKEY.SYS.TICK_1
			return pevent(process.ee3_private, tick).then(() => getQuotes(symbols, fast))
		}
		logger.error('getQuotes > error', utils.peRender(error));
		return Promise.resolve([])
	})
}



export function getSummary(symbol: string): Promise<YahooSummaryResult> {
	return Promise.resolve().then(function() {

		let modules = [
			// stocks
			'assetProfile', 'balanceSheetHistory', 'balanceSheetHistoryQuarterly', 'calendarEvents',
			'cashflowStatementHistory', 'cashflowStatementHistoryQuarterly', 'defaultKeyStatistics', 'earnings',
			'earningsHistory', 'earningsTrend', 'financialData', 'fundOwnership', 'incomeStatementHistory',
			'incomeStatementHistoryQuarterly', 'indexTrend', 'industryTrend', 'insiderHolders', 'insiderTransactions',
			'institutionOwnership', 'majorDirectHolders', 'majorHoldersBreakdown', 'netSharePurchaseActivity', 'price', 'quoteType',
			'recommendationTrend', 'secFilings', 'sectorTrend', 'summaryDetail', 'summaryProfile', 'symbol', 'upgradeDowngradeHistory',
			// funds
			'fundProfile', 'topHoldings', 'fundPerformance',
		]

		return http.get('https://query1.finance.yahoo.com/v10/finance/quoteSummary/' + symbol, {
			modules: modules.join(','),
			formatted: false,
		}, { silent: true })

	}).then(function(response: YahooSummaryResponse) {
		if (_.get(response, 'quoteSummary.error')) return Promise.reject(JSON.stringify(response.quoteSummary.error));
		if (_.isEmpty(_.get(response, 'quoteSummary.result'))) return Promise.resolve(null);

		let summary = response.quoteSummary.result[0]
		summary.symbol = symbol
		summary.stamp = shared.now()
		return Promise.resolve(summary)

	}).catch(function(error: AxiosError) {
		logger.error('getSummary ' + symbol + ' > error', utils.peRender(error as any));
		let status = _.get(error, 'response.status')
		if (utils.isTimeoutError(error) || status == 500 || status == 502) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_5).then(() => getSummary(symbol))
		}
		return Promise.resolve(null)
	})
}





export function getSparks(symbols: Array<string>): Promise<Array<Array<HistQuote>>> {
	if (!Array.isArray(symbols) || symbols.length == 0) return Promise.resolve([]);

	return Promise.resolve().then(function() {
		return http.get('https://query1.finance.yahoo.com/v7/finance/spark', {
			symbols: symbols.join(','),
			range: '1d',
			interval: '5m',
			includePrePost: true,
		}, { silent: true })

	}).then(function(response: YahooSparksResponse) {
		if (_.get(response, 'spark.error')) return Promise.reject(JSON.stringify(response.spark.error));
		if (_.isEmpty(_.get(response, 'spark.result'))) return Promise.resolve([]);

		return Promise.resolve(_.flatten(response.spark.result.mapFast(function({ response }) {
			return response.mapFast(function(response) {
				let results = [] as Array<HistQuote>
				let stamps = response.timestamp
				if (!stamps) return results;
				let quotes = response.indicators.quote[0]
				stamps.forEachFast(function(stamp, i) {
					if (!Number.isFinite(quotes.close[i])) return;
					results.push({
						close: quotes.close[i],
						stamp: stamp * 1000, // yahoo doesnt know seconds
					} as HistQuote)
				})
				return results
			})
		})))

	}).catch(function(error) {
		logger.error('getSparks ' + JSON.stringify(symbols) + ' > error', utils.peRender(error as any))
		return Promise.resolve([])
	})
}














