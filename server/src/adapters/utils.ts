// 

import cluster = require('cluster')
import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')

import * as ecstat from 'echarts-stat/dist/ecStat'
import moment = require('moment')
import nib = require('ib')
import ti = require('technicalindicators')
import ss = require('simple-statistics')
import rx = require('rxjs/Rx')
import ci = require('correcting-interval')
import reqIp = require('request-ip')
import anomaly = require('anomaly')
import shared = require('../shared')

export * from './errors'



export function devFsymbols(from = [] as Array<FullSymbol>, empty = false): Array<FullSymbol> {
	let to = [
		{ symbol: 'SPY', tickerid: 913243251 },
		{ symbol: 'BABA', tickerid: 913254558 },
		{ symbol: 'BAC', tickerid: 913254999 },
		{ symbol: 'AAPL', tickerid: 913256135 },
		{ symbol: 'AMD', tickerid: 913254235 },
		{ symbol: 'FB', tickerid: 913303928 },
		{ symbol: 'INTC', tickerid: 913257268 },
		{ symbol: 'MSFT', tickerid: 913323997 },
		{ symbol: 'GE', tickerid: 913255327 },
		{ symbol: 'MU', tickerid: 913324077 },
		{ symbol: 'SQ', tickerid: 913254798 },
		{ symbol: 'ROKU', tickerid: 925376726 },
		{ symbol: 'XNET', tickerid: 913255889 },
		{ symbol: 'DPW', tickerid: 913303773 },
		{ symbol: 'LFIN', tickerid: 925401791 },
		{ symbol: 'PXS', tickerid: 913253601 },
		{ symbol: 'ASTC', tickerid: 913254169 },
		{ symbol: 'CADC', tickerid: 913254240 },
		{ symbol: 'CHFS', tickerid: 913253381 },
		{ symbol: 'LEDS', tickerid: 913253344 },
		{ symbol: 'CREG', tickerid: 913254265 },
		{ symbol: 'ISZE', tickerid: 913247275 },
		{ symbol: 'WEXP', tickerid: 913246860 },
		{ symbol: 'GMFL', tickerid: 925348033 },
	] as Array<FullSymbol>
	return to
	// return from
	// return _.uniqBy(from.concat(to), 'symbol')
}

export let readyInstruments = isMaster()
export let readyListening = isMaster()
export let readyCalcs = isMaster()
export let readyLives = isMaster()

let tick = process.PRODUCTION ? shared.RKEY.SYS.TICK_3 : shared.RKEY.SYS.TICK_1
if (isMaster()) tick = shared.RKEY.SYS.TICK_025;
rx.Observable.fromEvent(process.ee3_private, tick).filter(function() {
	return !!process.$marketStamps && !!readyInstruments
}).take(1).subscribe(function() {
	process.ee3_private.emit(shared.RKEY.SYS.READY)
})





export function isPrimary() {
	return process.$instance == 0
}
export function isMaster() {
	return cluster.isMaster
}
export function isCaboose() {
	return process.$instance == process.$instances - 1
}

export function nextSecond(add = 0) {
	return shared.moment().endOf('second').add(add, 'seconds').valueOf()
}
export function tillNextSecond(add = 0) {
	return nextSecond(add) - shared.now()
}

// export function isEODing(): boolean {
// 	let now = shared.now()
// 	let stamps = process.$marketStamps
// 	if (_.isEmpty(stamps)) return null;
// 	if (stamps.is_open == false) return false;
// 	let m15 = 15 * 60000 // 15 minutes
// 	if (now >= (stamps.am4 - m15) && now < stamps.am415) return true;
// 	return false
// }

// export class Timeout {
// 	timer: NodeJS.Timer
// 	constructor(
// 		public fn: Function,
// 		private ms: number,
// 	) {
// 		this.timer = setTimeout(() => this.exec(), ms)
// 	}
// 	exec() {
// 		this.timer.unref()
// 		clearTimeout(this.timer)
// 		this.timer = null
// 		this.ms = null
// 		this.exec = null
// 		this.fn()
// 		this.fn = null
// 	}
// }

export function instanceMs(ms: number) {
	let instance = Math.max(process.$instance, 0)
	return _.round(instance * (ms / process.$instances))
}
export function instanceSecs(secs: number) {
	return instanceMs(secs * 1000)
}

export function dispersedMs(ms: number, i: number, length: number) {
	return _.round(i * (ms / length))
}
export function dispersedSecs(secs: number, i: number, length: number) {
	return dispersedMs(secs * 1000, i, length)
}

export function randomTimeout(lowseconds = 1, highseconds = 3) {
	return math_randomInt(lowseconds * 1000, highseconds * 1000)
}

export function toFixed(n: number, p = 2) {
	if (!Number.isFinite(n)) return n;
	return Number.parseFloat(n.toFixed(p))
}

export function parseBool(bool: any): boolean {
	if (typeof bool == 'undefined') return false;
	if (typeof bool == 'string' && ['undefined', 'null'].indexOf(bool) != -1) return false;
	let num = +bool
	return !isNaN(num) ? !!num : !!String(bool).toLowerCase().replace(<any>!!0, '')
}

export function pipelineErrors(resolved: Array<any>): void {
	if (!Array.isArray(resolved)) return;
	let i: number, len: number = resolved.length
	for (i = 0; i < len; i++) {
		let result = resolved[i]
		// if (Array.isArray(result)) {
		let error = result[0]
		if (error != null) {
			console.error(clc.red.bold('>>>> REDIS PIPELINE ERROR <<<<'))
			throw new Error(error)
		}
		// }
	}
}

export function fixPipelineFast(resolved: Array<any>) {
	if (!Array.isArray(resolved)) return;
	let i: number, len = resolved.length
	for (i = 0; i < len; i++) {
		let result = resolved[i]
		// if (Array.isArray(result)) {
		let error = result[0]
		if (error != null) {
			console.error(clc.red.bold('>>>> REDIS PIPELINE ERROR <<<<'))
			throw new Error(error)
		}
		resolved[i] = result[1]
		// }
	}
}

export function array_extract(items: Array<any>, prop: string): Array<any> {
	let extracted: Array<string> = []
	let i: number, len: number = items.length
	for (i = 0; i < len; i++) {
		extracted.push(items[i][prop])
	}
	return extracted
}

export function array_remove<T>(items: Array<T>, fn: (value: T, index: number) => boolean) {
	let i: number, len: number = items.length
	for (i = len; i--;) {
		if (fn(items[i], i)) items.splice(i, 1);
	}
}

export function clone<T = any>(item: T): T {
	return JSON.parse(JSON.stringify(item))
}

export function math_clamp(x: number, a: number, b: number) {
	return Math.min(Math.max(x, a), b)
}

export function math_randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function array_closest(items: Array<number>, find: number) {
	let index = items.map(k => Math.abs(<any>k - find))
	let min = Math.min.apply(Math, index)
	return index.indexOf(min)
	// return items[index.indexOf(min)]
}

/** ⟶ period: minutes, interval: seconds */
export function calcAlpha(period: number, interval: number) {
	return 1 - Math.exp(-(interval / (60 * period)))
}

export function equalChunks<T>(items: Array<T>, nchunks: number): Array<Array<T>> {
	let chunks = Array.from(Array(nchunks), v => []) as Array<Array<T>>
	items.forEachFast((v, i) => chunks[i % chunks.length].push(v))
	return chunks
}

export function getNano(): number {
	let hr = process.hrtime()
	return (hr[0] * 1000000000) + hr[1]
}

// export function array_nearest<T>(items: Array<T>, key: string, find: number) {
// 	let closest = items.map(()).sort((a, b) => Math.abs(find - a) - Math.abs(find - b))[0]
// 	return nums.indexOf(closest)
// }

// export function array_remove<T>(items: Array<T>, cb: (value: T, index: number) => boolean): Array<T> {
// 	let removed = [] as Array<T>
// 	let i: number, len: number = items.length
// 	for (i = len; i--;) {
// 		if (cb(items[i], i)) {
// 			removed.push(items.splice(i, 1)[0])
// 		}
// 	}
// 	return removed
// }





/*===================================
=            FAST QUOTES            =
===================================*/

export function rlQuoteFast(rquote: RobinhoodQuote): LiveQuote {
	if (_.isEmpty(rquote)) return rquote as any;

	let rlquote = {
		symbol: rquote.symbol,
		lastStamp: shared.moment(rquote.updated_at).valueOf()
	} as LiveQuote

	let state = shared.marketState(rlquote.lastStamp)
	if (state == 'REGULAR' && Number.isFinite(rquote.last_trade_price)) {
		rlquote.lastPrice = rquote.last_trade_price
	} else if (Number.isFinite(rquote.last_extended_hours_trade_price)) {
		rlquote.lastPrice = rquote.last_extended_hours_trade_price
	} else if (Number.isFinite(rquote.last_trade_price)) {
		rlquote.lastPrice = rquote.last_trade_price
	}

	if (Number.isFinite(rquote.ask_size)) rlquote.askSize = rquote.ask_size;
	if (Number.isFinite(rquote.ask_price)) {
		if (rquote.ask_price > 0) rlquote.askPrice = rquote.ask_price;
		else if (rquote.ask_price == 0 && Number.isFinite(rlquote.lastPrice)) rlquote.askPrice = rlquote.lastPrice;
	}
	if (Number.isFinite(rquote.bid_size)) rlquote.bidSize = rquote.bid_size;
	if (Number.isFinite(rquote.bid_price)) {
		if (rquote.bid_price > 0) rlquote.bidPrice = rquote.bid_price;
		else if (rquote.bid_price == 0 && Number.isFinite(rlquote.lastPrice)) rlquote.bidPrice = rlquote.lastPrice;
	}

	return rlquote
}

export function rcQuoteFast(rquote: RobinhoodQuote, rlquote: LiveQuote): CalcQuote {
	if (_.isEmpty(rquote)) return rquote as any;
	if (_.isEmpty(rlquote)) rlquote = rlQuoteFast(rquote);
	let rcquote = Object.assign({}, rlquote) as CalcQuote
	if (Number.isFinite(rquote.previous_close)) rcquote.prevClose = rquote.previous_close;
	return rcquote
}

export function rplQuoteFast(rprice: RobinhoodPrice): LiveQuote {
	if (_.isEmpty(rprice)) return rprice as any;
	return {
		symbol: rprice.symbol,
		lastPrice: rprice.price,
		size: rprice.size,
		lastStamp: shared.moment(rprice.updated_at).valueOf(),
	} as LiveQuote
}

export function rfcQuoteFast(fundamentals: RobinhoodFundamentals): CalcQuote {
	if (_.isEmpty(fundamentals)) return fundamentals as any;
	let cquote = { symbol: fundamentals.symbol } as CalcQuote
	if (Number.isFinite(fundamentals.volume)) cquote.volume = fundamentals.volume;
	if (Number.isFinite(fundamentals.average_volume)) cquote.avgVolume10Day = fundamentals.average_volume;
	if (Number.isFinite(fundamentals.average_volume)) cquote.avgVolume3Month = fundamentals.average_volume;
	if (Number.isFinite(fundamentals.market_cap)) cquote.marketCap = fundamentals.market_cap;
	return cquote
}

// export function ricQuoteFast(instrument: RobinhoodInstrument): CalcQuote {
// 	if (_.isEmpty(instrument)) return instrument as any;
// 	let cquote = { symbol: instrument.symbol } as CalcQuote
// 	if (_.isString(instrument.type)) cquote.type = instrument.type;
// 	if (_.isString(instrument.list_date)) cquote.listDate = shared.moment(instrument.list_date).valueOf();
// 	return cquote
// }



// export function ylQuoteFast(yquote: YahooQuote): LiveQuote {
// 	if (_.isEmpty(yquote)) return yquote as any;

// 	let ylquote = { symbol: yquote.symbol } as LiveQuote
// 	ylquote.lastStamp = _.max([yquote.postMarketTime, yquote.preMarketTime, yquote.regularMarketTime]) * 1000

// 	let state = shared.marketState(ylquote.lastStamp)
// 	if (state.indexOf('PRE') == 0 && Number.isFinite(yquote.preMarketPrice)) {
// 		ylquote.lastPrice = yquote.preMarketPrice
// 	} else if (state == 'REGULAR' && Number.isFinite(yquote.regularMarketPrice)) {
// 		ylquote.lastPrice = yquote.regularMarketPrice
// 	} else if (state.indexOf('POST') == 0 && Number.isFinite(yquote.postMarketPrice)) {
// 		ylquote.lastPrice = yquote.postMarketPrice
// 	} else {
// 		let lastPrices = _.compact([yquote.postMarketPrice, yquote.regularMarketPrice, yquote.preMarketPrice])
// 		if (Number.isFinite(lastPrices[0])) ylquote.lastPrice = lastPrices[0];
// 	}

// 	if (Number.isFinite(yquote.regularMarketVolume)) ylquote.volume = yquote.regularMarketVolume;

// 	if (Number.isFinite(yquote.askSize)) ylquote.askSize = yquote.askSize * 100;
// 	if (Number.isFinite(yquote.ask)) {
// 		if (yquote.ask > 0) ylquote.askPrice = yquote.ask;
// 		else if (yquote.ask == 0 && Number.isFinite(ylquote.lastPrice)) ylquote.askPrice = ylquote.lastPrice;
// 	}
// 	if (Number.isFinite(yquote.bidSize)) ylquote.bidSize = yquote.bidSize * 100;
// 	if (Number.isFinite(yquote.bid)) {
// 		if (yquote.bid > 0) ylquote.bidPrice = yquote.bid;
// 		else if (yquote.bid == 0 && Number.isFinite(ylquote.lastPrice)) ylquote.bidPrice = ylquote.lastPrice;
// 	}

// 	return ylquote
// }



// export function slQuoteFast(squote: StreamQuote, yquote: YahooQuote): LiveQuote {
// 	if (_.isEmpty(squote)) return squote as any;

// 	let slquote = { symbol: squote.symbol } as LiveQuote

// 	if (yquote) {
// 		yquote = _.pick(yquote, ['preMarketTime', 'regularMarketTime', 'postMarketTime']) as any
// 		slquote.lastStamp = _.max([yquote.preMarketTime, yquote.regularMarketTime, yquote.postMarketTime]) * 1000
// 		let state = shared.marketState(slquote.lastStamp)
// 		if (state.indexOf('PRE') == 0 && Number.isFinite(yquote.preMarketTime) && Number.isFinite(squote.pricerealtimeafterhours)) {
// 			slquote.lastPrice = squote.pricerealtimeafterhours
// 		} else if (state == 'REGULAR' && Number.isFinite(yquote.regularMarketTime) && Number.isFinite(squote.pricerealtime)) {
// 			slquote.lastPrice = squote.pricerealtime
// 		} else if (state.indexOf('POST') == 0 && Number.isFinite(yquote.postMarketTime) && Number.isFinite(squote.pricerealtimeafterhours)) {
// 			slquote.lastPrice = squote.pricerealtimeafterhours
// 		} else if (Number.isFinite(yquote.postMarketTime) && Number.isFinite(squote.pricerealtimeafterhours)) {
// 			slquote.lastPrice = squote.pricerealtimeafterhours
// 		} else if (Number.isFinite(yquote.regularMarketTime) && Number.isFinite(squote.pricerealtime)) {
// 			slquote.lastPrice = squote.pricerealtime
// 		} else if (Number.isFinite(squote.pricerealtimeafterhours)) {
// 			slquote.lastPrice = squote.pricerealtimeafterhours
// 		} else if (Number.isFinite(squote.pricerealtime)) {
// 			slquote.lastPrice = squote.pricerealtime
// 		}
// 	} else if (shared.marketState() == 'REGULAR' && Number.isFinite(squote.pricerealtime)) {
// 		slquote.lastPrice = squote.pricerealtime
// 	} else if (Number.isFinite(squote.pricerealtimeafterhours)) {
// 		slquote.lastPrice = squote.pricerealtimeafterhours
// 	} else if (Number.isFinite(squote.pricerealtime)) {
// 		slquote.lastPrice = squote.pricerealtime
// 	}

// 	if (Number.isFinite(squote.volume)) slquote.volume = squote.volume;

// 	if (Number.isFinite(squote.asksize)) slquote.askSize = squote.asksize;
// 	if (Number.isFinite(squote.ask)) {
// 		if (squote.ask > 0) slquote.askPrice = squote.ask;
// 		else if (squote.ask == 0 && Number.isFinite(slquote.lastPrice)) slquote.askPrice = slquote.lastPrice;
// 	}
// 	if (Number.isFinite(squote.bidsize)) slquote.bidSize = squote.bidsize;
// 	if (Number.isFinite(squote.bid)) {
// 		if (squote.bid > 0) slquote.bidPrice = squote.bid;
// 		else if (squote.bid == 0 && Number.isFinite(slquote.lastPrice)) slquote.bidPrice = slquote.lastPrice;
// 	}

// 	return slquote
// }

// export function scQuoteFast(squote: StreamQuote, slquote: LiveQuote): CalcQuote {
// 	if (_.isEmpty(squote)) return squote as any;
// 	let scquote = Object.assign({}, slquote) as CalcQuote
// 	if (Number.isFinite(squote.marketcap)) scquote.marketCap = squote.marketcap;
// 	return scquote
// }



export function ycQuoteFast(yquote: YahooQuote): CalcQuote {
	if (_.isEmpty(yquote)) return yquote as any;

	let ycquote = { symbol: yquote.symbol } as CalcQuote
	ycquote.lastStamp = _.max([yquote.postMarketTime, yquote.preMarketTime, yquote.regularMarketTime]) * 1000

	let state = shared.marketState(ycquote.lastStamp)
	if (state.indexOf('PRE') == 0 && Number.isFinite(yquote.preMarketPrice)) {
		ycquote.lastPrice = yquote.preMarketPrice
	} else if (state == 'REGULAR' && Number.isFinite(yquote.regularMarketPrice)) {
		ycquote.lastPrice = yquote.regularMarketPrice
	} else if (state.indexOf('POST') == 0 && Number.isFinite(yquote.postMarketPrice)) {
		ycquote.lastPrice = yquote.postMarketPrice
	} else {
		let lastPrices = _.compact([yquote.postMarketPrice, yquote.regularMarketPrice, yquote.preMarketPrice])
		if (Number.isFinite(lastPrices[0])) ycquote.lastPrice = lastPrices[0];
	}

	ycquote.volume = yquote.regularMarketVolume
	ycquote.marketCap = yquote.marketCap
	ycquote.sharesOutstanding = yquote.sharesOutstanding
	ycquote.avgVolume10Day = yquote.averageDailyVolume10Day
	ycquote.avgVolume3Month = yquote.averageDailyVolume3Month
	ycquote.openPrice = yquote.regularMarketOpen
	ycquote.prevClose = yquote.regularMarketPreviousClose
	// ycquote.yhtype = yquote.quoteType
	ycquote.messageBoardId = yquote.messageBoardId
	ycquote.dayHigh = yquote.regularMarketDayHigh
	ycquote.dayLow = yquote.regularMarketDayLow
	ycquote.yearHigh = yquote.fiftyTwoWeekHigh
	ycquote.yearLow = yquote.fiftyTwoWeekLow

	shared.object_compact(ycquote)
	return ycquote
}



export function icQuoteFast(iexitem: IexItem): CalcQuote {
	if (_.isEmpty(iexitem)) return iexitem as any;
	let icquote = { symbol: iexitem.symbol.toUpperCase() } as CalcQuote
	// icquote.volume = iexitem.latestVolume
	icquote.marketCap = iexitem.marketCap
	icquote.sharesOutstanding = iexitem.sharesOutstanding
	icquote.sharesFloat = iexitem.float
	icquote.industry = iexitem.industry
	icquote.sector = iexitem.sector
	shared.object_compact(icquote)
	return icquote
}



export function wcQuoteFast(wquote: WebullQuote): CalcQuote {
	if (_.isEmpty(wquote)) return wquote as any;

	let wcquote = {} as CalcQuote
	wcquote.symbol = wquote.symbol
	wcquote.tickerId = wquote.tickerId

	if (shared.isGood(wquote.tradeTime)) {
		wcquote.lastStamp = shared.moment(wquote.tradeTime).valueOf()
		if (Number.isFinite(wquote.price) && wquote.price > 0) {
			if (wquote.tradeTime == wquote.mkTradeTime) wcquote.lastPrice = wquote.price;
			else if (wquote.tradeTime == wquote.mktradeTime) wcquote.lastPrice = wquote.price;
		}
		if (Number.isFinite(wquote.pPrice) && wquote.pPrice > 0) {
			if (wquote.tradeTime == wquote.faTradeTime) wcquote.lastPrice = wquote.pPrice;
		}
	}

	wcquote.wbstatus = wquote.status
	wcquote.wbstatus0 = wquote.status0
	wcquote.wbfastatus = wquote.faStatus

	wcquote.volume = wquote.volume

	if (Number.isFinite(wquote.bid) && wquote.bid > 0) wcquote.bidPrice = wquote.bid;
	wcquote.bidSize = wquote.bidSize
	if (Number.isFinite(wquote.ask) && wquote.ask > 0) wcquote.askPrice = wquote.ask;
	wcquote.askSize = wquote.askSize

	wcquote.openPrice = wquote.open
	wcquote.closePrice = wquote.close
	wcquote.prevClose = wquote.preClose
	wcquote.dayHigh = wquote.high
	wcquote.dayLow = wquote.low
	wcquote.yearHigh = wquote.fiftyTwoWkHigh
	wcquote.yearLow = wquote.fiftyTwoWkLow

	wcquote.sharesOutstanding = wquote.totalShares
	wcquote.sharesFloat = wquote.outstandingShares
	wcquote.dealCount = wquote.dealNum

	wcquote.turnoverRate = wquote.turnoverRate
	wcquote.vibrateRatio = wquote.vibrateRatio
	wcquote.yield = wquote.yield

	shared.object_compact(wcquote)
	return wcquote
}

export function wcTradeQuoteFast(trade: WebullTrade): CalcQuote {
	if (_.isEmpty(trade)) return trade as any;

	let wcquote = {} as CalcQuote
	wcquote.symbol = trade.symbol
	wcquote.tickerId = trade.tickerId

	if (trade.tradeTime) wcquote.lastStamp = shared.moment(trade.tradeTime).valueOf();
	wcquote.lastPrice = trade.deal

	if (Number.isFinite(trade.volume)) {
		wcquote.tradeSize = trade.volume
		if (trade.tradeBsFlag == 'B') wcquote.tradeBuySize = trade.volume;
		if (trade.tradeBsFlag == 'S') wcquote.tradeSellSize = trade.volume;
	}

	shared.object_compact(wcquote)
	return wcquote
}

export function fixWebullQuote(wquote: WebullQuote): void {
	shared.fixResponse(wquote)
	if (Array.isArray(wquote.bidList) && wquote.bidList.length > 0) {
		wquote.bidList.forEachFast(v => shared.fixResponse(v))
		wquote.bid = _.mean(_.compact(wquote.bidList.mapFast(v => v.price)))
		wquote.bidSize = _.sum(wquote.bidList.mapFast(v => v.volume).concat(0))
	}
	_.unset(wquote, 'bidList')
	if (Array.isArray(wquote.askList) && wquote.askList.length > 0) {
		wquote.askList.forEachFast(v => shared.fixResponse(v))
		wquote.ask = _.mean(_.compact(wquote.askList.mapFast(v => v.price)))
		wquote.askSize = _.sum(wquote.askList.mapFast(v => v.volume).concat(0))
	}
	_.unset(wquote, 'askList')
}



export function mkcQuoteFast(wquote: WebullQuote): MarketCalcQuote {
	if (_.isEmpty(wquote)) return wquote as any;

	let mkcquote = {} as MarketCalcQuote
	mkcquote.symbol = wquote.symbol
	mkcquote.tickerId = wquote.tickerId

	if (shared.isGood(wquote.tradeTime)) {
		mkcquote.lastStamp = shared.moment(wquote.tradeTime).valueOf()
		// let state = shared.marketState(mkcquote.lastStamp)
		if (Number.isFinite(wquote.price) && wquote.price > 0) {
			if (wquote.tradeTime == wquote.mkTradeTime) mkcquote.lastPrice = wquote.price;
			else if (wquote.tradeTime == wquote.mktradeTime) mkcquote.lastPrice = wquote.price;
			// else if (state == 'REGULAR') mkcquote.lastPrice = wquote.price;
		}
		if (Number.isFinite(wquote.pPrice) && wquote.pPrice > 0) {
			if (wquote.tradeTime == wquote.faTradeTime) mkcquote.lastPrice = wquote.pPrice;
			// else if (state != 'REGULAR') mkcquote.lastPrice = wquote.pPrice;
		}
	}

	mkcquote.wbstatus = wquote.status
	mkcquote.wbstatus0 = wquote.status0

	mkcquote.volume = wquote.volume

	if (Number.isFinite(wquote.bid) && wquote.bid > 0) mkcquote.bidPrice = wquote.bid;
	mkcquote.bidSize = wquote.bidSize
	if (Number.isFinite(wquote.ask) && wquote.ask > 0) mkcquote.askPrice = wquote.ask;
	mkcquote.askSize = wquote.askSize

	mkcquote.openPrice = wquote.open
	mkcquote.closePrice = wquote.close
	mkcquote.prevClose = wquote.preClose
	mkcquote.dayHigh = wquote.high
	mkcquote.dayLow = wquote.low
	mkcquote.yearHigh = _.compact([wquote.fiftyTwoWkHigh, wquote.yrHigh, wquote.fiftyTwoWkHighCalc])[0]
	mkcquote.yearLow = _.compact([wquote.fiftyTwoWkLow, wquote.yrLow, wquote.fiftyTwoWkLowCalc])[0]

	mkcquote.turnoverRate = wquote.turnoverRate
	mkcquote.vibrateRatio = wquote.vibrateRatio

	shared.object_compact(mkcquote)
	return mkcquote
}















// const stopwords = ['about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can', 'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had', 'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'if', 'in', 'into', 'is', 'it', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must', 'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over', 'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were', 'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your', 'a', 'i']
const stopwords = ['a', 'able', 'about', 'above', 'abroad', 'according', 'accordingly', 'across', 'actually', 'adj', 'after', 'afterwards', 'again', 'against', 'ago', 'ahead', 'aint', 'all', 'allow', 'allows', 'almost', 'alone', 'along', 'alongside', 'already', 'also', 'although', 'always', 'am', 'amid', 'amidst', 'among', 'amongst', 'an', 'and', 'another', 'any', 'anybody', 'anyhow', 'anyone', 'anything', 'anyway', 'anyways', 'anywhere', 'apart', 'appear', 'appreciate', 'appropriate', 'are', 'arent', 'around', 'as', 'as', 'aside', 'ask', 'asking', 'associated', 'at', 'available', 'away', 'awfully', 'b', 'back', 'backward', 'backwards', 'be', 'became', 'because', 'become', 'becomes', 'becoming', 'been', 'before', 'beforehand', 'begin', 'behind', 'being', 'believe', 'below', 'beside', 'besides', 'best', 'better', 'between', 'beyond', 'both', 'brief', 'but', 'by', 'c', 'came', 'can', 'cannot', 'cant', 'cant', 'caption', 'cause', 'causes', 'certain', 'certainly', 'changes', 'clearly', 'cmon', 'co', 'co.', 'com', 'come', 'comes', 'concerning', 'consequently', 'consider', 'considering', 'contain', 'containing', 'contains', 'corresponding', 'could', 'couldnt', 'course', 'cs', 'currently', 'd', 'dare', 'darent', 'definitely', 'described', 'despite', 'did', 'didnt', 'different', 'directly', 'do', 'does', 'doesnt', 'doing', 'done', 'dont', 'down', 'downwards', 'during', 'e', 'each', 'edu', 'eg', 'eight', 'eighty', 'either', 'else', 'elsewhere', 'end', 'ending', 'enough', 'entirely', 'especially', 'et', 'etc', 'even', 'ever', 'evermore', 'every', 'everybody', 'everyone', 'everything', 'everywhere', 'ex', 'exactly', 'example', 'except', 'f', 'fairly', 'far', 'farther', 'few', 'fewer', 'fifth', 'first', 'five', 'followed', 'following', 'follows', 'for', 'forever', 'former', 'formerly', 'forth', 'forward', 'found', 'four', 'from', 'further', 'furthermore', 'g', 'get', 'gets', 'getting', 'given', 'gives', 'go', 'goes', 'going', 'gone', 'got', 'gotten', 'greetings', 'h', 'had', 'hadnt', 'half', 'happens', 'hardly', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hello', 'help', 'hence', 'her', 'here', 'hereafter', 'hereby', 'herein', 'heres', 'hereupon', 'hers', 'herself', 'hes', 'hi', 'him', 'himself', 'his', 'hither', 'hopefully', 'how', 'howbeit', 'however', 'hundred', 'i', 'id', 'ie', 'if', 'ignored', 'ill', 'im', 'immediate', 'in', 'inasmuch', 'inc', 'inc.', 'indeed', 'indicate', 'indicated', 'indicates', 'inner', 'inside', 'insofar', 'instead', 'into', 'inward', 'is', 'isnt', 'it', 'itd', 'itll', 'its', 'its', 'itself', 'ive', 'j', 'just', 'k', 'keep', 'keeps', 'kept', 'know', 'known', 'knows', 'l', 'last', 'lately', 'later', 'latter', 'latterly', 'least', 'less', 'lest', 'let', 'lets', 'like', 'liked', 'likely', 'likewise', 'little', 'look', 'looking', 'looks', 'low', 'lower', 'ltd', 'm', 'made', 'mainly', 'make', 'makes', 'many', 'may', 'maybe', 'maynt', 'me', 'mean', 'meantime', 'meanwhile', 'merely', 'might', 'mightnt', 'mine', 'minus', 'miss', 'more', 'moreover', 'most', 'mostly', 'mr', 'mrs', 'much', 'must', 'mustnt', 'my', 'myself', 'n', 'name', 'namely', 'nd', 'near', 'nearly', 'necessary', 'need', 'neednt', 'needs', 'neither', 'never', 'neverf', 'neverless', 'nevertheless', 'new', 'next', 'nine', 'ninety', 'no', 'nobody', 'non', 'none', 'nonetheless', 'noone', 'no-one', 'nor', 'normally', 'not', 'nothing', 'notwithstanding', 'novel', 'now', 'nowhere', 'o', 'obviously', 'of', 'off', 'often', 'oh', 'ok', 'okay', 'old', 'on', 'once', 'one', 'ones', 'ones', 'only', 'onto', 'opposite', 'or', 'other', 'others', 'otherwise', 'ought', 'oughtnt', 'our', 'ours', 'ourselves', 'out', 'outside', 'over', 'overall', 'own', 'p', 'particular', 'particularly', 'past', 'per', 'perhaps', 'placed', 'please', 'plus', 'possible', 'presumably', 'probably', 'provided', 'provides', 'q', 'que', 'quite', 'qv', 'r', 'rather', 'rd', 're', 'really', 'reasonably', 'recent', 'recently', 'regarding', 'regardless', 'regards', 'relatively', 'respectively', 'right', 'round', 's', 'said', 'same', 'saw', 'say', 'saying', 'says', 'second', 'secondly', 'see', 'seeing', 'seem', 'seemed', 'seeming', 'seems', 'seen', 'self', 'selves', 'sensible', 'sent', 'serious', 'seriously', 'seven', 'several', 'shall', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'since', 'six', 'so', 'some', 'somebody', 'someday', 'somehow', 'someone', 'something', 'sometime', 'sometimes', 'somewhat', 'somewhere', 'soon', 'sorry', 'specified', 'specify', 'specifying', 'still', 'sub', 'such', 'sup', 'sure', 't', 'take', 'taken', 'taking', 'tell', 'tends', 'th', 'than', 'thank', 'thanks', 'thanx', 'that', 'thatll', 'thats', 'thats', 'thatve', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'thence', 'there', 'thereafter', 'thereby', 'thered', 'therefore', 'therein', 'therell', 'therere', 'theres', 'theres', 'thereupon', 'thereve', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'thing', 'things', 'think', 'third', 'thirty', 'this', 'thorough', 'thoroughly', 'those', 'though', 'three', 'through', 'throughout', 'thru', 'thus', 'till', 'to', 'together', 'too', 'took', 'toward', 'towards', 'tried', 'tries', 'truly', 'try', 'trying', 'ts', 'twice', 'two', 'u', 'un', 'under', 'underneath', 'undoing', 'unfortunately', 'unless', 'unlike', 'unlikely', 'until', 'unto', 'up', 'upon', 'upwards', 'us', 'use', 'used', 'useful', 'uses', 'using', 'usually', 'v', 'value', 'various', 'versus', 'very', 'via', 'viz', 'vs', 'w', 'want', 'wants', 'was', 'wasnt', 'way', 'we', 'wed', 'welcome', 'well', 'well', 'went', 'were', 'were', 'werent', 'weve', 'what', 'whatever', 'whatll', 'whats', 'whatve', 'when', 'whence', 'whenever', 'where', 'whereafter', 'whereas', 'whereby', 'wherein', 'wheres', 'whereupon', 'wherever', 'whether', 'which', 'whichever', 'while', 'whilst', 'whither', 'who', 'whod', 'whoever', 'whole', 'wholl', 'whom', 'whomever', 'whos', 'whose', 'why', 'will', 'willing', 'wish', 'with', 'within', 'without', 'wonder', 'wont', 'would', 'wouldnt', 'x', 'y', 'yes', 'yet', 'you', 'youd', 'youll', 'your', 'youre', 'yours', 'yourself', 'yourselves', 'youve', 'z', 'zero']
export function string_minify(str: string) {
	str = str.replace(/[^a-zA-Z ]/g, ' ').replace(/\s\s+/g, ' ').toLowerCase().trim()
	return str.split(' ').filter(v => stopwords.indexOf(v) == -1).join(' ').trim()
}

export function buildId(id: string) {
	return shared.hash(string_minify(id).replace(/\s/g, '').trim())
}

export function buildTags(str: string, input = [] as Array<string>) {
	let tags = string_minify(str).split(' ')
	input.forEachFast(v => tags.push(...string_minify(v).split(' ')))
	return _.uniq(_.compact(tags)).filter(v => v && v.length > 2 && stopwords.indexOf(v) == -1)
}

export function toYcItem(ycmessage: YahooCanvasMessage, symbol: string) {
	let ycitem = {
		symbol,
		stamp: shared.now(),
		id: ycmessage.messageId,
		boardId: ycmessage.contextId,
		type: ycmessage.meta.type,
		created: ycmessage.meta.createdAt * 1000,
		authorId: ycmessage.meta.author.guid,
		authorName: ycmessage.meta.author.nickname,
		authorImage: ycmessage.meta.author.image.url,
		sentiment: ycmessage.meta.sentimentLabel,
		text: ycmessage.details.userText,
		tags: ycmessage.tags.mapFast(v => v.toUpperCase()),
		upVote: ycmessage.reactionStats.upVoteCount,
		downVote: ycmessage.reactionStats.downVoteCount,
		replies: [],
	} as YahooCommunityItem
	ycitem.calcTags = buildTags(ycmessage.details.userText)
	ycitem.calcUps = ycitem.upVote
	ycitem.calcDowns = ycitem.downVote
	ycitem.calcReplies = ycmessage.reactionStats.replyCount
	if (_.isString(ycmessage.replyId)) ycitem.replyId = ycmessage.replyId;
	if (Array.isArray(ycmessage.details.linkMessageDetails) && ycmessage.details.linkMessageDetails.length > 0) {
		let link = ycmessage.details.linkMessageDetails[0]
		ycitem.linkUrl = link.url
		ycitem.linkTitle = link.title
		ycitem.linkDesc = link.description
		if (link.attribution) {
			if (!ycitem.linkUrl) ycitem.linkUrl = link.attribution.source;
			ycitem.linkName = link.attribution.name
		}
		if (Array.isArray(link.coverImages) && link.coverImages.length > 0) ycitem.linkImage = link.coverImages[0].url;
	}
	return ycitem
}













export function applyCalcs(cquote: CalcQuote) {

	cquote.unrealizedPNL = (cquote.lastPrice - cquote.avgCost) * cquote.position

	cquote.bidAskSpread = _.subtract(cquote.askSpread, cquote.bidSpread)
	cquote.bidAskFlowSizeAccum = _.sum([cquote.askSizeAccum, -cquote.bidSizeAccum])
	cquote.bidAskFlowVolume = _.sum([cquote.askVolume, -cquote.bidVolume])

	cquote.close = cquote.lastPrice
	cquote.priceChange = shared.calcPercentChange(cquote.lastPrice, cquote.eodPrice)
	cquote.marketCap = shared.math_round(cquote.lastPrice * cquote.sharesOutstanding)

	cquote.size = _.subtract(cquote.volume, cquote.lastVolume)
	cquote.tradeFlowSize = _.sum([cquote.tradeBuySize, -cquote.tradeSellSize])
	cquote.tradeFlowVolume = _.sum([cquote.tradeBuyVolume, -cquote.tradeSellVolume])
	cquote.volumeOsc = shared.calcOscChange(cquote.volume, cquote.avgVolume)

	let realistic = shared.calcRealisticStampRange(cquote.lastStamp, cquote.realParameter)
	cquote.volumeProgressOsc = shared.calcOscChange(cquote.volume, cquote.avgVolume * realistic, undefined, cquote.symbol)

	cquote.junk = shared.isJunkQuote(cquote.lastPrice, cquote.volumeOsc, cquote.marketCap, cquote.listDate, cquote.avgVolume, cquote.sharesOutstanding, cquote.sharesFloat)

}



// export function applyExperiments(cquote: CalcQuote) {

// 	let realistic = shared.calcRealisticStampRange(cquote.lastStamp, cquote.realParameter)
// 	cquote.volumeProgressOsc = shared.calcOscChange(cquote.volume, cquote.avgVolume * realistic, undefined, cquote.symbol)

// }



export function applySlopes(cquote: CalcQuote, tquotes: Array<TinyQuote>) {
	let pastticks = 256
	let nfutures = 128
	let degree = 64
	let smooth = 32
	if (tquotes.length < pastticks) return;

	let strat = shared.stratForecast(tquotes, {
		pastticks, nfutures, degree, smooth,
	})
	if (!strat) return;

	cquote.prevAction = cquote.action

	Object.keys(strat).forEachFast(function(k) {
		if (shared.RMAP.LIVES.indexOf(k) == -1) return;
		cquote[k] = strat[k]
	})

}





export class TradingComs {
	sadd = ['sadd', shared.RKEY.CALCS_TRADING]
	srem = ['srem', shared.RKEY.CALCS_TRADING]
	push(cquote: CalcQuote) {
		if (cquote.liveTrading == true) this.sadd.push(cquote.symbol);
		else this.srem.push(cquote.symbol);
	}
	merge(coms: RedisComs) {
		if (this.sadd.length > 2) coms.push(this.sadd);
		if (this.srem.length > 2) coms.push(this.srem);
	}
}



// export function mergeSortedComs(cquotes: Array<CalcQuote>, coms: RedisComs): void {
// 	if (cquotes.length == 0) return;

// 	// console.time('mergeSortedComs x' + cquotes.length)

// 	let closed = shared.marketState() != 'CLOSED'

// 	shared.RMAP.SORTED.forEachFast(function(key, i) {
// 		let rkey = shared.RKEY.CALCS + ':' + shared.RKEY.SORTED + ':' + key
// 		let zrems = ['zrem', rkey]
// 		let zadds = ['zadd', rkey]

// 		cquotes.forEachFast(function(cquote, ii) {
// 			let symbol = cquote.symbol
// 			let value = cquote[key]
// 			if (!Number.isFinite(value)) return;

// 			zrems.push(symbol)
// 			if (cquote.junk) return;
// 			if (cquote.count <= 1 && closed) return;
// 			if (key.toLowerCase().indexOf('ratio') >= 0 && (value == 0 || value == 1 || value == 2)) return;

// 			value = _.round(value, 6)
// 			zadds.push(value)
// 			zadds.push(symbol)
// 		})
// 		coms.push(...[zrems, zadds].filter(v => v.length > 2))
// 	})

// 	// console.timeEnd('mergeSortedComs x' + cquotes.length)

// }















export const CRONS = [] as Array<string>
export function cronTime(cronTime: string) {
	CRONS.push(cronTime)
	return cronTime
}





// export function tohset(item: any) {
// 	if (!item) return {};
// 	let toitem = Object.assign({}, item) as any
// 	Object.keys(toitem).forEachFast(function(key) {
// 		let v = toitem[key]
// 		if (_.isUndefined(v)) v = null;
// 		toitem[key] = JSON.stringify(v)
// 	})
// 	return toitem
// }

// export function fromhget(item: any) {
// 	if (item == null) return {} as any;
// 	Object.keys(item).forEachFast(function(k) {
// 		let v = item[k] as any
// 		if (_.isString(v)) v = JSON.parse(v);
// 		if (v == null || (_.isNumber(v) && !Number.isFinite(v))) {
// 			return _.unset(item, k)
// 		}
// 		item[k] = v
// 	})
// 	return item
// }

export function tohset(item: any) {
	if (_.isEmpty(item)) return {} as any;
	let toitem = {} as any
	Object.keys(item).forEachFast(function(key) {
		let value = item[key]
		if (value == null) value = null;
		if (Number.isFinite(value)) value = _.round(value, 8);
		toitem[key] = JSON.stringify(value)
	})
	return toitem
}

export function fromhget(item: any) {
	if (_.isEmpty(item)) return {} as any;
	Object.keys(item).forEachFast(function(k) {
		item[k] = JSON.parse(item[k])
	})
	return item
}

export function fromhmget(values: Array<any>, keys: Array<string>) {
	if (!Array.isArray(values) || !Array.isArray(keys)) return {} as any;
	let item = {} as any
	values.forEachFast((v, i) => item[keys[i]] = v)
	return fromhget(item)
}








// export function isGoodArray<T>(values: Array<T>): boolean {
// 	return values.mapFast(value => isBad(value)).indexOf(true) == -1
// }
// export function isGoodObject<T>(object: T, keys: Array<string>): boolean {
// 	return keys.mapFast(function(key) {
// 		let value = object[key]
// 		return isBad(value)
// 	}).indexOf(true) == -1
// }
// export function badObjectKeys<T>(object: T, keys = Object.keys(object)): Array<string> {
// 	let bads = [] as Array<string>
// 	keys.forEachFast(function(key) {
// 		let value = object[key]
// 		if (isBad(value)) bads.push(key);
// 	})
// 	return bads
// }

// export function changedObjectKeys<T>(to: T, from: T, keys: Array<string>): T {
// 	if (_.isEmpty(to) || _.isEmpty(from)) return null;
// 	let changed = {} as T
// 	keys.forEachFast(function(key) {
// 		let tovalue = to[key]
// 		let fromvalue = from[key]
// 		if ((isGood(tovalue) || isGood(fromvalue)) && tovalue != fromvalue) changed[key] = tovalue;
// 	})
// 	return changed
// }











export class SMA {

	constructor(
		public period: number,
		public mean = null,
	) { }

	flush() {
		this.mean = null
	}

	data() {
		return this.mean
	}

	update(value: number) {
		if (!Number.isFinite(this.mean)) this.mean = value;
		this.mean = ss.addToMean(this.mean, this.period, value)
	}

}



export class Slope {

	constructor(
		public period: number,
		public slope = null,
	) {

	}

	flush() {
		this.slope = null
	}

	data() {
		return this.slope
	}

	update(stddata: Array<Array<number>>) {
		let slice = stddata.slice(stddata.length - this.period, stddata.length)
		if (slice.length < 2) return this.slope = null;
		let linear = ecstat.regression('linear', slice) as EChartsStat.RegressionResult<EChartsStat.LinearRegressionResult>
		this.slope = linear.parameter.gradient
	}

}



export class EWMA {

	private static calcAlpha(period: number, interval: number) {
		return 1 - Math.exp(-(interval / period))
	}

	private interval = 1
	private alpha = EWMA.calcAlpha(this.period * 60, this.interval)

	/** ⟶ period: minutes */
	constructor(
		public period: number,
		public sum = 0,
		public avg = -1,
	) {
		this.tick()
		process.ee3_private.addListener(shared.RKEY.SYS.TICK_1, () => this.tick())
	}

	flush() {
		this.sum = 0
		this.avg = -1
		this.tick()
	}

	data() {
		return {
			// period: this.period,
			rate: this.rate(),
			sum: this.sum,
			avg: this.avg,
		}
	}

	rate() {
		if (this.avg == -1) return 0;
		return this.avg * this.period * 60
	}

	update(value: number) {
		this.sum += value
	}

	tick() {
		let sum = this.sum
		let avg = sum / this.interval
		this.sum -= sum
		if (this.avg == -1) this.avg = avg;
		else this.avg += this.alpha * (avg - this.avg);
	}

}

// if (isMaster()) {
// 	let ewma = new EWMA(10, 1, 9.8142462362859089)
// 	process.ee3_private.addListener(shared.RKEY.SYS.TICK_1, function() {
// 		// ewma.update(1)
// 		let data = ewma.data()
// 		console.log('data >')
// 		eyes.inspect(data)
// 		// console.log('count', data.count, 'rate', _.round(data.rate, 2))
// 	})
// }







export class PublicEWMA extends EWMA {

	constructor(
		private rkey: string,
		period: number,
		tkey: string,
		sum?: number,
		avg?: number,
	) {
		super(period, sum, avg)
		process.ee3_public.addListener(this.rkey, n => super.update(n))
	}

	update(value: number) {
		process.ee3_public.emit(this.rkey, value)
	}

}







export class EMA {

	private ema: ti.EMA
	public value: number

	constructor(
		public period: number,
		private values = [] as Array<number>,
	) {
		let last = values.pop()
		this.ema = new ti.EMA({ period: this.period, values })
		this.value = this.ema.nextValue(last)
	}

	flush() {
		this.ema = new ti.EMA({ period: this.period, values: [] })
	}

	data() {
		return { result: this.ema.result }
	}

	update(value: number) {
		this.value = this.ema.nextValue(value)
	}

}














export class Anomaly {

	data = { mean: 0, trend: 0, stdev: 0, anomaly: 0 } as AnomalyData
	private detector = new anomaly({ returnType: 2, confidenceInterval: 2 })

	// constructor() { }

	update(value: number) {
		let data = this.detector.pushMeta(value)
		data.stdev = data.stddev
		_.unset(data, 'stddev')
		Object.assign(this.data, data)
		if (!Number.isFinite(this.data.anomaly)) this.data.anomaly = 0;
	}

	debug() {
		if (process.PRODUCTION) return;
		if (isPrimary()) console.log('anomaly >', clc.bold(_.round(this.data.stdev * 2) + 'ms'), '>', JSON.stringify({ stdev: _.round(this.data.stdev), mean: _.round(this.data.mean), trend: _.round(this.data.trend) } as AnomalyData));
	}

}

export class PublicAnomaly extends Anomaly {

	constructor(public rkey: string) {
		super()
		process.ee3_public.addListener(this.rkey, n => super.update(n))
	}

	update(value: number) {
		process.ee3_public.emit(this.rkey, value)
	}

}











export function restifyRoute<B = any, R = any>(route: (req: RestifyRequest<B>, res: RestifyResponse<R>, next: RestifyNext) => void) {
	return route
}

export function validate(body: any, keys: Array<string>): void {
	if (!body) throw new errors.PreconditionFailedError('Undefined request body');
	if (Object.keys(body).length == 0) throw new errors.PreconditionFailedError('Empty request body');
	keys.forEachFast(function(k) {
		if (body[k] == null) throw new errors.PreconditionFailedError(`Missing "${k}" field`);
	})
}

export function getIp(req: RestifyRequest) {
	let ip = reqIp.getClientIp(req)
	if (!ip) return ip;
	return ip.toLowerCase().replace(/[^0-9.]/g, '').trim()
}

export function sortAlphabetically(a: string, b: string) {
	let an = a.toLowerCase().trim().substring(0, 1)
	let bn = b.toLowerCase().trim().substring(0, 1)
	if (an < bn) return -1
	if (an > bn) return 1
	return 0
}

export function sortByStamp(a: any, b: any) {
	let adate = new Date(a.stamp).valueOf()
	let bdate = new Date(b.stamp).valueOf()
	return adate - bdate
}





// function requireDirectory(dir: string) {
// 	let dpath = path.join(__dirname, dir)
// 	fs.readdirSync(dpath).filter(function(file) {
// 		return file.slice(-3) == '.js'
// 	}).forEachFast(function(file) {
// 		console.log('file', file)
// 		let resolved = path.relative(dpath, file)
// 		console.log('resolved', resolved)
// 	})
// }
// requireDirectory('adapters')

const benches: any = {}
const mute: boolean = false
const filters: Array<string> = []
export function benchStart(id: string) {
	if (process.DEVELOPMENT && !mute && filters.indexOf(id) == -1) {
		let now = new Date().valueOf()
		benches[id] = {
			start: now,
			t: now,
		}
		console.log('bench > start', id)
	}
}
export function benchPing(id: string, name: string = '') {
	if (process.DEVELOPMENT && !mute && filters.indexOf(id) == -1 && benches[id]) {
		let bench = benches[id]
		let now = new Date().valueOf()
		let time = now - bench.t
		console.log('bench > ping', id, name, time)
		benches[id].t = now
	}
}
export function benchEnd(id: string) {
	if (process.DEVELOPMENT && !mute && filters.indexOf(id) == -1 && benches[id]) {
		let bench = benches[id]
		let now = new Date().valueOf()
		let time = now - bench.start
		console.log('bench > end', id, 'total', clc.bold(time))
		benches[id] = undefined
	}
}



export function keys(desc: string, obj: any) {
	console.log('\n' + clc.blue('/▼-▼-▼-▼-▼-▼  ' + clc.bold(desc) + '  ▼-▼-▼-▼-▼-▼/') + ' ')
	if (_.isUndefined(obj)) {
		console.log('\n' + clc.red('UNDEFINED'))
	} else if (_.isNull(obj)) {
		console.log('\n' + clc.red('NULL'))
	} else {
		let sendi: string = '\n'
		let fns: Array<string> = _.functionsIn(obj)
		let _fns: Array<string> = []
		let keys: Array<string> = _.difference(_.keysIn(obj), fns)
		let _keys: Array<string> = []

		{
			let i: number, len: number = keys.length
			for (i = 0; i < len; i++) {
				if (keys[i].charAt(0) == '_') {
					_keys.push(keys[i])
				}
			}
		}
		keys = _.difference(keys, _keys)

		{
			let i: number, len: number = keys.length
			if (len > 0) {
				sendi = sendi + '\n' + clc.blue('▼ PROPERTIES') + '\n'
			}
			for (i = 0; i < len; i++) {
				sendi = sendi + keys[i] + '\n'
			}
		}

		{
			let i: number, len: number = _keys.length
			if (len > 0) {
				sendi = sendi + '\n \n' + clc.blue('▼ _PROPERTIES') + '\n'
			}
			for (i = 0; i < len; i++) {
				sendi = sendi + _keys[i] + '\n'
			}
		}

		{
			let i: number, len: number = fns.length
			for (i = 0; i < len; i++) {
				if (fns[i].charAt(0) == '_') {
					_fns.push(fns[i])
				}
			}
		}
		fns = _.difference(fns, _fns)

		{
			let i: number, len: number = fns.length
			if (len > 0) {
				sendi = sendi + '\n \n' + clc.blue('▼ METHODS') + '\n'
			}
			for (i = 0; i < len; i++) {
				sendi = sendi + fns[i] + '()\n'
			}
		}

		{
			let i: number, len: number = _fns.length
			if (len > 0) {
				sendi = sendi + '\n \n' + clc.blue('▼ _METHODS') + '\n'
			}
			for (i = 0; i < len; i++) {
				sendi = sendi + _fns[i] + '()\n'
			}
		}

		console.log(sendi + '\n')
	}
	console.log('\n' + clc.blue('/▲-▲-▲-▲-▲-▲  ' + clc.bold(desc) + '  ▲-▲-▲-▲-▲-▲/') + '\n')
}





// export const YH_IDK_KEY = {
// 	a00: 'ask',
// 	a50: 'asksize',
// 	b00: 'bid',
// 	b60: 'bidsize',
// 	c10: 'change',
// 	c63: 'changerealtime',
// 	c64: 'disputedchangerealtimeafterhours',
// 	c85: 'changerealtimeafterhours',
// 	c86: 'percentchangerealtimeafterhours2',
// 	g53: 'daylow',
// 	h53: 'dayhigh',
// 	j10: 'marketcap',
// 	l10: 'lastsaleprice',
// 	l84: 'pricerealtime',
// 	l86: 'pricerealtimeafterhours',
// 	p20: 'percentchange',
// 	p43: 'percentchangerealtime',
// 	p44: 'percentchangerealtimeafterhours',
// 	t10: 'lastsaletime',
// 	t53: 'disputedtimestampforcommodities',
// 	t54: 'disputedtimestampforstocks',
// 	v53: 'volume',
// }

// // {
// // 	let YH_KEY_IDK = {}
// // 	Object.keys(YH_IDK_KEY).sort((a, b) => a - b).forEachFast(function(key) {
// // 		let v = YH_IDK_KEY[key]
// // 		YH_KEY_IDK[v] = key
// // 	})
// // 	console.log('YH_IDK_KEY', JSON.stringify(YH_IDK_KEY, null, 4))
// // 	console.log('YH_KEY_IDK', JSON.stringify(YH_KEY_IDK, null, 4))
// // }

// export const YH_KEY_IDK = {
// 	ask: 'a00',
// 	asksize: 'a50',
// 	bid: 'b00',
// 	bidsize: 'b60',
// 	change: 'c10',
// 	changerealtime: 'c63',
// 	disputedchangerealtimeafterhours: 'c64',
// 	changerealtimeafterhours: 'c85',
// 	percentchangerealtimeafterhours2: 'c86',
// 	daylow: 'g53',
// 	dayhigh: 'h53',
// 	marketcap: 'j10',
// 	lastsaleprice: 'l10',
// 	pricerealtime: 'l84',
// 	pricerealtimeafterhours: 'l86',
// 	percentchange: 'p20',
// 	percentchangerealtime: 'p43',
// 	percentchangerealtimeafterhours: 'p44',
// 	lastsaletime: 't10',
// 	disputedtimestampforcommodities: 't53',
// 	disputedtimestampforstocks: 't54',
// 	volume: 'v53',
// }













