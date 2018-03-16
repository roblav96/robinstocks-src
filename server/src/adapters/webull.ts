//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import utils = require('../adapters/utils')
import shared = require('../shared')
import logger = require('../adapters/logger')

import mqtt = require('mqtt')
import qs = require('query-string')
import pdelay = require('delay')
import pforever = require('p-forever')
import pqueue = require('p-queue')
import pevent = require('p-event')
import pall = require('p-all')
import redis = require('../adapters/redis')
import http = require('../adapters/http')





export function getTickerId(symbol: string, country: string, mic: string, acronym: string, name: string): Promise<WebullSearchResult> {
	// console.info('getTickerId >', symbol, country, mic, acronym, name)
	let url = 'https://searchapi.stocks666.com/api/search/tickers2'
	let timeout = 5000
	return http.get(url, { keys: symbol }, { silent: true, timeout }).then(function(response) {
		if (_.isEmpty(response) || _.isEmpty(response.list)) return Promise.resolve(null);
		let results = response.list as Array<WebullSearchResult>

		results = results.filter(v => v && v.disSymbol.indexOf(symbol) == 0)

		let itags = utils.buildTags(name)
		results.forEachFast(v => v.match = _.intersection(itags, utils.buildTags(v.tickerName)).length)

		let result = results.find(v => v.match > 0 && v.disExchangeCode.indexOf(acronym) == 0 && v.regionAlias == country)
		if (!result) result = results.find(v => v.match > 0 && v.disExchangeCode.indexOf(acronym) == 0);
		if (!result) result = results.find(v => v.disExchangeCode.indexOf(acronym) == 0);
		if (!result) result = results.find(v => v.match > 0);
		if (!result) result = results.find(v => v.disSymbol == symbol && results.length == 1);
		if (!result) {
			logger.warn('getTickerId > !result', symbol, country, mic, acronym, name)
			return Promise.resolve(null)
		}
		return Promise.resolve(result)

	}).catch(function(error) {
		if (utils.isTimeoutError(error)) {
			if (process.DEVELOPMENT) console.warn('getTickerId timeout > ' + timeout + 'ms >', symbol);
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1).then(() => getTickerId(symbol, country, mic, acronym, name))
		}
		logger.error('getTickerId >', symbol, '> error', utils.peRender(error))
		return Promise.resolve(null)
	})
}





export function getFastQuotes(fsymbols: Array<FullSymbol>): Promise<Array<WebullFastQuote>> {
	let chunks = utils.equalChunks(fsymbols, _.ceil(fsymbols.length / 64))
	return pall(chunks.mapFast(v => () => eachFastQuotes(v))).then(function(resolved) {
		return Promise.resolve(_.flatten(resolved))
	})
}

function eachFastQuotes(fsymbols: Array<FullSymbol>): Promise<Array<WebullFastQuote>> {
	let tickerids = fsymbols.mapFast(v => v.tickerid)
	let url = 'https://quoteapi.stocks666.com/api/quote/tickerRealTimes'
	return http.get(url, { tickerIds: tickerids.join(',') }, { wbtoken: true, silent: true }).then(function(response: Array<WebullFastQuote>) {
		return Promise.resolve(fsymbols.mapFast(function(fullsymbol, i) {
			let wquote = response.find(v => v && v.tickerId == fullsymbol.tickerid) || {} as WebullFastQuote
			wquote.symbol = fullsymbol.symbol
			wquote.tickerId = fullsymbol.tickerid
			wquote.stamp = shared.now()
			utils.fixWebullQuote(wquote as any)
			return wquote
		}))
	}).catch(function(error) {
		logger.error('eachFastQuotes > error', utils.peRender(error));
		if (utils.isTimeoutError(error)) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1).then(() => eachFastQuotes(fsymbols))
		}
		return Promise.resolve([])
	})
}





export function getQuote(fsymbol: FullSymbol): Promise<WebullQuote> {
	return Promise.resolve().then(function() {
		let url = 'https://quoteapi.stocks666.com/api/quote/tickerRealTimes/' + fsymbol.tickerid
		return http.get(url, null, { silent: true })

	}).then(function(response: WebullQuote) {
		utils.fixWebullQuote(response)
		response.symbol = fsymbol.symbol
		response.tickerId = fsymbol.tickerid
		response.stamp = shared.now()
		return Promise.resolve(response)

	}).catch(function(error) {
		logger.error('getQuote ' + fsymbol.symbol + ' > error', utils.peRender(error));
		if (utils.isTimeoutError(error)) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1).then(() => getQuote(fsymbol))
		}
		return Promise.resolve(null)
	})
}





export function getCapitalFlow(fsymbol: FullSymbol): Promise<WebullCapitalFlowItem> {
	return Promise.resolve().then(function() {
		let url = 'https://securitiesapi.stocks666.com/api/wlas/capitalflow/ticker'
		return http.get(url, { tickerId: fsymbol.tickerid }, { silent: true })

	}).then(function(response: WebullCapitalFlowResponse) {
		if (!_.has(response, 'latest.item')) return Promise.resolve(null);
		let item = response.latest.item
		let date = _.isString(response.latest.date) ? response.latest.date : shared.now()
		item.date = shared.moment(date).format('YYYY-MM-DD')
		item.symbol = fsymbol.symbol
		item.tickerId = fsymbol.tickerid
		item.stamp = shared.now()
		return Promise.resolve(item)

	}).catch(function(error: AxiosError) {
		logger.error('getCapitalFlow ' + fsymbol.symbol + ' > error', utils.peRender(error as any));
		if (utils.isTimeoutError(error)) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1).then(() => getCapitalFlow(fsymbol))
		}
		return Promise.resolve(null)
	})
}







export const types = {
	MARKET_SECTOR: '1',
	MARKET_POSITIVE: '2',
	MARKET_DECLIE: '3',
	MARKET_TURNOVER_RATE: '4',
	MARKET_ETFS: '16',
	TICKER: '5',
	TICKER_DETAIL: '6',
	TICKER_MARKET_INDEX: '8',
	COMMODITY: '9',
	FOREIGN_EXCHANGE: '10',
	MARKET_VOLUME: '11',
	TICKER_STATUS: '12',
	TICKER_HANDICAP: '13',
	TICKER_BID_ASK: '14',
	TICKER_DEAL_DETAILS: '15',
}

export class WebullMqtt {

	client: mqtt.Client
	sdict = {} as { [tickerid: number]: string }
	tids = [] as Array<number>

	constructor(
		public fsymbols: Array<FullSymbol>,
		public types: Array<string>,
		public messagefn: (symbol: string, type: string, data: Array<any>) => void,
		public id = shared.hash(utils.getNano()),
		// public opts = {} as { id?: string, stopmaster?: boolean, stopclosed?: boolean },
	) {
		this.types = _.uniq(this.types)
		if (_.isEmpty(this.types)) return;

		this.tids = this.fsymbols.mapFast(v => {
			this.sdict[v.tickerid] = v.symbol
			return v.tickerid
		})

		this.client = mqtt.connect(null, {
			protocol: 'tcp',
			host: 'push.stocks666.com',
			port: 9018,
			username: http.wbdid,
			password: http.wbtoken,
			keepalive: 60,
		})

		this.client.on('error', error => {
			logger.error('[' + this.id + '] webull mqtt > error', utils.peRender(error as any))
		})

		this.client.on('connect', () => {
			console.info('[' + this.id + '] webull mqtt > connected', this.fsymbols.length)
			let topic = {
				header: { did: http.wbdid, access_token: http.wbtoken, hl: 'en', locale: 'eng', os: 'android', osv: 'Android SDK: 25 (7.1.2)', ph: 'Google Pixel', tz: 'America/New_York', ver: '3.4.1.17' },
				tickerIds: this.tids,
				type: '',
			} as any
			this.types.forEachFast(v => this.client.subscribe(JSON.stringify(Object.assign(topic, { type: v }))))
		})

		this.client.on('reconnect', () => {
			if (shared.marketState() == 'REGULAR') logger.log('[' + this.id + '] webull mqtt > reconnect');
		})
		this.client.on('close', () => {
			if (shared.marketState() == 'REGULAR') logger.warn('[' + this.id + '] webull mqtt > close');
		})
		this.client.on('offline', () => {
			if (shared.marketState() == 'REGULAR') logger.error('[' + this.id + '] webull mqtt > offline');
		})

		this.client.on('message', (topic: any, message: any) => this.onmessage(topic, message))

		process.on('beforeExit', () => this.cleanup())
		process.on('exit', () => this.cleanup())

	}

	onmessage(topic: WebullMqttTopic, message: WebullMqttMessage) {
		topic = qs.parse(topic as any)
		topic.tid = _.parseInt(topic.tid as any)
		message = shared.safeParse(message.toString()) as any
		if (_.isEmpty(message) || _.isEmpty(message.data) || !Array.isArray(message.data)) return;

		let type = topic.type
		if (type == '14') _.remove(message.data, v => _.isEmpty(v.askList) && _.isEmpty(v.bidList));
		if (_.isEmpty(message.data)) return;

		let tickerid = topic.tid
		let symbol = this.sdict[tickerid]
		message.data.forEachFast(function(data: WebullQuote) {
			utils.fixWebullQuote(data)
			data.tickerId = tickerid
			data.symbol = symbol
		})

		this.messagefn(symbol, message.type, message.data)
	}

	cleanup() {
		if (_.isEmpty(this.client)) return;
		this.client.unsubscribe('ALL')
		this.client.end(true)
		this.client = null
		_.unset(this, 'client')
	}

}














// if (utils.isMaster()) {

// 	let item = {
// 		"tickerId": 913256135,
// 		"exchangeId": 96,
// 		"symbol": "AAPL",
// 		"tradeTime": "2017-10-20T23:59:53.857+0000",
// 		"faTradeTime": "2017-10-20T23:59:53.857+0000",
// 		"mktradeTime": "2017-10-20T20:00:00.000+0000",
// 		"open": "157.05",
// 		"preClose": "155.98",
// 		"close": "156.25",
// 		"price": "156.25",
// 		"pPrice": "156.24",
// 		"pChange": "-0.0100",
// 		"pChRatio": "-0.0001",
// 		"limitUp": "0.0000",
// 		"limitDown": "0.0000",
// 		"avg": "156.98",
// 		"preChange": "-3.78",
// 		"change": "0.27",
// 		"preChangeRatio": "-0.0237",
// 		"changeRatio": "0.0017",
// 		"high": "157.75",
// 		"low": "155.96",
// 		"vibrateRatio": "0.0115",
// 		"volume": "7647922",
// 		"avgVolume": "5117281",
// 		"avgVol10D": "20078940",
// 		"dealNum": "80730.00",
// 		"turnoverRate": "0.0015",
// 		"marketValue": "807066875000.00",
// 		"negMarketValue": "806417650468.75",
// 		"pe": "17.68",
// 		"forwardPe": "17.32",
// 		"totalShares": "5165228000",
// 		"outstandingShares": "5161072963",
// 		"targetPrice": "173.00",
// 		"eps": "8.82",
// 		"fiftyTwoWkHigh": "164.94",
// 		"fiftyTwoWkLow": "104.09",
// 		"fiftyTwoWkHighCalc": "164.94",
// 		"fiftyTwoWkLowCalc": "104.09",
// 		"dividend": "2.520",
// 		"yield": "0.0162",
// 		"ask": "0.0000",
// 		"bid": "0.0000",
// 		"yrHigh": "144.89",
// 		"yrLow": "143.01",
// 		"askList": [],
// 		"bidList": [],
// 		"status": "A",
// 		"utcOffset": "America/New_York",
// 		"timeZone": "EDT",
// 		"regionId": 6,
// 		"regionAlias": "US",
// 		"projPe": "17.32",
// 		"projEps": 9.005500,
// 		"projDps": 2.366200,
// 		"projProfit": 47342.284200,
// 		"projSales": 227520.419100,
// 		"projLtGrowthRate": 12.370000,
// 		"lfHigh": 144.8900,
// 		"lfLow": 143.0100,
// 		"currency": "USD",
// 		"lotSize": 1,
// 		"nextEarningDay": "2017-11-02 20:00:00",
// 		"baNum": "1",
// 		"dataStatus": 1
// 	}
// 	shared.fixResponse(item)
// 	process.dtsgen('item', item)

// }





















// function syncWebull() {
// 	if (utils.isMaster()) return;
// 	// if (!utils.isPrimary()) return;

// 	return robinhood.getInstanceSymbols().then(function(symbols) {

// 		let coms = symbols.mapFast(v => ['hget', shared.RKEY.RH.INSTRUMENTS + ':' + v, 'country'])
// 		return redis.pipelinecoms(coms).then(function(resolved) {
// 			utils.fixPipelineFast(resolved)

// 			let instruments = symbols.mapFast((symbol, i) => { return { symbol, country: shared.safeParse(resolved[i]) } as RobinhoodInstrument })
// 			let queue = new pqueue({ concurrency: 1 }) as PQueue
// 			instruments.forEachFast(v => queue.add(() => searchWebull(v)))
// 			return queue.onIdle()

// 		}).then(function() {
// 			console.info('syncWebull > done')
// 		})

// 	}).catch(function(error) {
// 		console.error('syncWebull > error', utils.peRender(error))
// 	})
// }

// function getWebullTickerId(instrument: RobinhoodInstrument): Promise<number> {
// 	let symbol = instrument.symbol
// 	let url = 'https://searchapi.webull.com/api/search/tickers2'
// 	// let url = 'https://searchapi.webull.com/api/search/tickers2'
// 	return http.get(url, { keys: symbol }, { silent: true }).then(function(response) {
// 		let results = response.list as Array<any>
// 		if (_.isEmpty(results)) {
// 			console.warn(symbol, 'isEmpty(results)')
// 			return Promise.resolve(NaN)
// 		}

// 		let resut = results.find(v => v.tickerSymbol == symbol && v.regionAlias == instrument.country)
// 		if (!resut) resut = results.find(v => v.tickerSymbol == symbol);
// 		if (!resut) {
// 			console.warn(symbol, '!resut')
// 			return Promise.resolve(NaN)
// 		}
// 		if (!Number.isFinite(resut.tickerId)) {
// 			console.warn(symbol, '!Number.isFinite(resut.tickerId)')
// 			return Promise.resolve(NaN)
// 		}
// 		return Promise.resolve(resut.tickerId)
// 		// return redis.hset(shared.RKEY.CALCS + ':' + symbol, 'webullId', JSON.stringify(resut.tickerId))

// 	}).catch(function(error) {
// 		console.error('searchWebull > error', utils.peRender(error))
// 		return Promise.resolve(NaN)
// 	})
// }























