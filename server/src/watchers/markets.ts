//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')
import logger = require('../adapters/logger')

import uws = require('uws')
import ss = require('simple-statistics')
import pall = require('p-all')
import pevent = require('p-event')
import pforever = require('p-forever')
import redis = require('../adapters/redis')
import socket = require('../adapters/socket')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')
import yahoo = require('../adapters/yahoo')
import webull = require('../adapters/webull')



function onReady() {
	if (!utils.isMaster()) return;
	// if (process.PRODUCTION) return;
	if (process.DEVELOPMENT) return;

	pforever(syncMarketQuotes)

	// let coms = shared.MARKETS_SYMBOLS.mapFast(v => ['hgetall', shared.RKEY.MARKET.CALCS + ':' + v])
	// redis.main.pipelinecoms(coms).then(function(resolved) {
	// 	utils.fixPipelineFast(resolved)
	// 	shared.MARKETS_SYMBOLS.forEachFast(function(symbol, i) {
	// 		let mkcquote = utils.fromhget(resolved[i]) as MarketCalcQuote
	// 		shared.merge(mkcquote, shared.MARKETS.find(v => v.symbol == symbol))
	// 		mkcalcquotes[symbol] = Object.assign({}, mkcquote)
	// 	})
	// 	let types = [
	// 		webull.types.TICKER,
	// 		webull.types.TICKER_DETAIL,
	// 		webull.types.TICKER_STATUS,
	// 		webull.types.TICKER_HANDICAP,
	// 		webull.types.TICKER_BID_ASK,
	// 		webull.types.FOREIGN_EXCHANGE,
	// 	]
	// 	new webull.WebullMqtt(shared.MARKETS_FSYMBOLS, types, messagefn, 'mkt')
	// 	process.ee3_private.addListener(shared.RKEY.SYS.TICK_1, syncSocket)
	// 	return pforever(syncMarketQuotes)
	// })

}
process.ee3_private.once(shared.RKEY.SYS.READY, onReady)

// robinhood.flush(shared.RKEY.MARKET.CALCS)
// robinhood.flush(shared.RKEY.MARKET.LIVES)





// const mkcalcquotes = {} as { [symbol: string]: MarketCalcQuote }

// function applyMarketCalcQuote(tomkcquote: MarketCalcQuote): void {
// 	let symbol = tomkcquote.symbol
// 	let mkcquote = mkcalcquotes[symbol]

// 	mkcquote.lastStamp = _.max([mkcquote.lastStamp, tomkcquote.lastStamp])
// 	_.unset(tomkcquote, 'lastStamp')

// 	shared.merge(mkcquote, tomkcquote)
// 	mkcquote.stamp = shared.now()

// 	mkcquote.change = _.round(mkcquote.lastPrice - mkcquote.prevClose, 2)
// 	mkcquote.changePercent = _.round(shared.calcPercentChange(mkcquote.lastPrice, mkcquote.prevClose), 2)

// }





// function syncSocket() {
// 	let mkcquotes = shared.MARKETS_SYMBOLS.mapFast(v => mkcalcquotes[v])
// 	socket.emit(shared.RKEY.MARKET.CALCS, mkcquotes.mapFast(v => shared.implodeFast(shared.RMAP.MARKET_CALCS, v)))
// }

// function messagefn(symbol: string, type: string, data: Array<WebullQuote>) {
// 	// console.warn(type, symbol, 'messagefn data >')
// 	// eyes.inspect(data)
// 	let tomkcquote = { symbol } as MarketCalcQuote
// 	data.forEachFast(function(wquote: WebullQuote) {
// 		shared.merge(tomkcquote, utils.mkcQuoteFast(wquote))
// 	})
// 	applyMarketCalcQuote(tomkcquote)
// }

function syncMarketQuotes() {
	return Promise.resolve().then(function() {
		let proms = shared.MARKETS_FSYMBOLS.mapFast(v => () => webull.getQuote(v))
		let coms = shared.MARKETS_SYMBOLS.mapFast(v => ['hgetall', shared.RKEY.MARKET.CALCS + ':' + v])
		proms.push(() => redis.main.pipelinecoms(coms) as any)
		return pall(proms, { concurrency: 1 })

	}).then(function(wquotes) {
		let resolved = (wquotes as any).pop() as Array<MarketCalcQuote>
		utils.fixPipelineFast(resolved)
		resolved = resolved.mapFast(v => utils.fromhget(v))

		let mkcquotes = [] as Array<MarketCalcQuote>
		let coms = [] as RedisComs
		shared.MARKETS_SYMBOLS.forEachFast(function(symbol, i) {
			let wquote = wquotes.find(v => v && v.symbol == symbol)
			if (!wquote) return;

			let mkcquote = resolved[i]
			shared.merge(mkcquote, utils.mkcQuoteFast(wquote))
			shared.merge(mkcquote, shared.MARKETS.find(v => v.symbol == symbol))

			mkcquote.change = shared.math_round(mkcquote.lastPrice - mkcquote.prevClose, 2)
			mkcquote.changePercent = shared.math_round(shared.calcPercentChange(mkcquote.lastPrice, mkcquote.prevClose), 2)

			mkcquotes.push(mkcquote)

			let rkey = shared.RKEY.MARKET.CALCS + ':' + symbol
			coms.push(['hmset', rkey, utils.tohset(mkcquote)])
		})

		socket.emit(shared.RKEY.MARKET.CALCS, mkcquotes.mapFast(v => shared.implodeFast(shared.RMAP.MARKET_CALCS, v)))

		if (process.DEVELOPMENT) coms.splice(0);

		return redis.main.pipelinecoms(coms)

	}).then(function(resolved) {
		utils.pipelineErrors(resolved)
		return Promise.resolve()

	}).catch(function(error) {
		if (error) logger.error('syncMarketQuotes > error', utils.peRender(error));
		return Promise.resolve()

	}).then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_30)
	})
}











// function syncMarkets(first = false) {
// 	let symbols = shared.MARKETS.mapFast(v => v.symbol)
// 	let start = shared.moment().startOf('second').valueOf()

// 	return Promise.resolve().then(function() {
// 		if (first || shared.isWeekend()) return Promise.reject(null);

// 		let coms = symbols.mapFast(v => ['hgetall', shared.RKEY.MARKET.CALCS + ':' + v])
// 		return Promise.all([
// 			redis.pipelinecoms(coms),
// 			yahoo.getQuotes(symbols),
// 		])

// 	}).then(function(resolved) {
// 		let fmkquotes = resolved[0] as Array<MarketCalcQuote>
// 		utils.fixPipelineFast(fmkquotes)
// 		let yquotes = resolved[1]

// 		let coms = [] as RedisComs
// 		let mkquotes = symbols.mapFast(function(symbol, i) {
// 			let mkquote = Object.assign({}, shared.MARKETS[i])

// 			let yquote = yquotes.find(v => v && v.symbol == symbol) || {} as YahooQuote
// 			shared.merge(mkquote, utils.ycQuoteFast(yquote) as any)

// 			mkquote.type = yquote.quoteType
// 			mkquote.delay = yquote.exchangeDataDelayedBy
// 			mkquote.prevClose = yquote.regularMarketPreviousClose
// 			mkquote.change = _.round(mkquote.lastPrice - mkquote.prevClose, 2)
// 			mkquote.changePercent = _.round(shared.calcPercentChange(mkquote.lastPrice, mkquote.prevClose), 2)
// 			mkquote.stamp = start

// 			let fmkquote = utils.fromhget(fmkquotes[i]) as MarketCalcQuote
// 			if (_.isEmpty(fmkquote)) shared.repair(fmkquote, mkquote);
// 			shared.repair(mkquote, fmkquote)

// 			if (mkquote.lastStamp > fmkquote.lastStamp && mkquote.lastPrice != fmkquote.lastPrice) {
// 				let imploded = shared.implodeFast(shared.RMAP.MARKET_LIVES, mkquote)
// 				let lrkey = shared.RKEY.MARKET.LIVES + ':' + symbol
// 				coms.push(['zadd', lrkey, mkquote.stamp as any, JSON.stringify(imploded)])
// 				socket.emit(lrkey, imploded)
// 				coms.push(['zremrangebyrank', lrkey, 0 as any, -360 as any])
// 			}

// 			let crkey = shared.RKEY.MARKET.CALCS + ':' + symbol
// 			coms.push(['hmset', crkey, utils.tohset(mkquote)])

// 			return mkquote
// 		})

// 		socket.emit(shared.RKEY.MARKET.CALCS, mkquotes.mapFast(v => shared.implodeFast(shared.RMAP.MARKET_CALCS, v)))

// 		if (process.DEVELOPMENT) coms.splice(0);

// 		return redis.pipelinecoms(coms)

// 	}).then(function(resolved) {
// 		utils.pipelineErrors(resolved)
// 		return Promise.resolve()

// 	}).catch(function(error) {
// 		if (error) logger.error('syncMarkets > error', utils.peRender(error));
// 		return Promise.resolve()

// 	}).then(function() {
// 		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_10)
// 	})
// }



// class Streamer extends yahoo.YahooStreamer {

// 	keys = Object.keys(yahoo.STREAM_KEYS_MAIN)

// 	onStreamQuotes(squotes: Array<StreamQuote>) {
// 		console.log('squotes >')
// 		eyes.inspect(squotes)
// 	}

// }





// function wsStockTwits() {
// 	let ws = new uws('wss://realtime.stocktwits.com/stream?symbols=ETH.X,BTC.X,DJIA,SPX,NDX')
// 	// let ws = new uws('wss://realtime.stocktwits.com/stream?symbols=GC_F')
// 	ws.on('message', message => {
// 		message = JSON.parse(message)
// 		if (message.type == 'heartbeat') return;
// 		console.log('message >')
// 		eyes.inspect(message)
// 	})
// }







