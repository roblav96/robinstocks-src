//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')
import logger = require('../adapters/logger')

import cron = require('cron')
import rx = require('rxjs/Rx')
import redis = require('../adapters/redis')
import socket = require('../adapters/socket')
import robinhood = require('../adapters/robinhood')
import storage = require('../adapters/storage')



function onReady() {
	if (utils.isMaster()) return;
	if (process.DEVELOPMENT) return;
	// if (process.DEVELOPMENT && !utils.isPrimary()) return;

	new cron.CronJob({
		/*----------  Every Minute Weekdays  ----------*/
		cronTime: utils.cronTime('* * * * 1-5'),
		start: process.PRODUCTION,
		onTick: syncMinutes,
		timeZone: 'America/New_York',
		// runOnInit: process.DEVELOPMENT,
	})

}
rx.Observable.fromEvent(process.ee3_private, process.PRODUCTION ? shared.RKEY.SYS.TICK_3 : shared.RKEY.SYS.TICK_1).filter(function() {
	return !!process.$marketStamps && !!utils.readyInstruments && !!utils.readyCalcs && !!utils.readyLives
}).take(1).subscribe(onReady)





function syncMinutes() {
	if (utils.isMaster()) return;

	let symbols = Object.keys(storage.liveminutesymbols).filter(function(symbol) {
		return storage.liveminutesymbols[symbol] > 0
	}).mapFast(function(symbol) {
		storage.liveminutesymbols[symbol] = 0
		return symbol
	})

	if (shared.marketState() == 'CLOSED' && process.PRODUCTION) return;

	let end = shared.moment().startOf('minute').valueOf()
	if (process.DEVELOPMENT) {
		symbols = utils.devFsymbols().mapFast(v => v.symbol)
		let mend = shared.moment().startOf('day').add(9, 'hours').add(31, 'minutes')
		if (shared.moment().hour() <= 10) mend.subtract(1, 'day');
		end = mend.valueOf()
	}
	let start = shared.moment(end).subtract(1, 'minute').valueOf()
	// console.log('syncMinutes > start', shared.prettyStamp(start))
	// console.log('syncMinutes > end', shared.prettyStamp(end))

	if (symbols.length == 0) return;

	Promise.resolve().then(function() {
		let lcoms = symbols.mapFast(v => ['zrangebyscore', shared.RKEY.LIVES + ':' + v, start, end]) as RedisComs
		return redis.lives.pipelinecoms(lcoms)

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)

		let slquotes = symbols.mapFast(function(v, i) {
			let lquotes = resolved[i] as Array<LiveQuote>
			return lquotes.mapFast(v => shared.explode(shared.RMAP.LIVES, v) as LiveQuote)
		})

		let lcoms = [] as RedisComs
		symbols.forEachFast(function(symbol, i) {
			let lquotes = slquotes[i]
			if (_.isEmpty(lquotes)) return;

			// let cquote = storage.calcquotes[symbol]
			let mquote = Object.assign({}, lquotes[lquotes.length - 1]) as CalcQuote
			mquote.stamp = shared.now()
			mquote.lastStamp = start

			mquote.high = _.max(lquotes.mapFast(v => v.high))
			mquote.low = _.min(lquotes.mapFast(v => v.low))
			mquote.open = lquotes[0].open
			mquote.close = lquotes[lquotes.length - 1].close

			mquote.size = _.sum(lquotes.mapFast(v => v.size))
			mquote.tradeSize = _.sum(lquotes.mapFast(v => v.tradeSize))
			mquote.tradeBuySize = _.sum(lquotes.mapFast(v => v.tradeBuySize))
			mquote.tradeSellSize = _.sum(lquotes.mapFast(v => v.tradeSellSize))
			mquote.tradeFlowSize = _.sum([mquote.tradeBuySize, -mquote.tradeSellSize])
			mquote.tradeFlowVolume = _.sum([mquote.tradeBuyVolume, -mquote.tradeSellVolume])

			mquote.bidSizeAccum = _.sum(lquotes.mapFast(v => v.bidSizeAccum))
			mquote.askSizeAccum = _.sum(lquotes.mapFast(v => v.askSizeAccum))
			mquote.bidSpread = _.min(lquotes.mapFast(v => v.bidSpread).concat(lquotes.mapFast(v => v.bidPrice)))
			mquote.askSpread = _.max(lquotes.mapFast(v => v.askSpread).concat(lquotes.mapFast(v => v.askPrice)))
			mquote.bidAskSpread = _.subtract(mquote.askSpread, mquote.bidSpread)
			mquote.bidAskFlowSizeAccum = _.sum([mquote.askSizeAccum, -mquote.bidSizeAccum])
			mquote.bidAskFlowVolume = _.sum([mquote.askVolume, -mquote.bidVolume])

			let mimploded = shared.implodeFast(shared.RMAP.LIVES, mquote)
			let lmrkey = shared.RKEY.LIVES_MINUTES + ':' + symbol
			lcoms.push(['zadd', lmrkey, mquote.lastStamp as any, JSON.stringify(mimploded)])
			if (socket.hasSubscriber(lmrkey)) socket.emit(lmrkey, mimploded);

		})

		if (process.DEVELOPMENT) lcoms.splice(0);

		return redis.lives.pipelinecoms(lcoms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		})

	}).catch(function(error) {
		if (error) logger.error('syncMinutes > error', utils.peRender(error));
		return Promise.resolve()
	})
}








// new cron.CronJob({
// 	/*----------  3:52 AM Weekdays  ----------*/
// 	cronTime: utils.cronTime('52 03 * * 1-5'),
// 	start: process.PRODUCTION,
// 	onTick: function() {
// 		robinhood.recycleZrange(shared.RKEY.MINUTES, 3)
// 	},
// 	timeZone: 'America/New_York',
// })

// robinhood.flush(shared.RKEY.MINUTE.SYNC)
// robinhood.flush(shared.RKEY.MINUTES)





// function syncYquotes(symbols: Array<string>) {
// 	// return pevent(process.ee3, shared.RKEY.SYS.TICK_30).then(function() {
// 	return Promise.resolve().then(function() {
// 		return http.get('https://query1.finance.yahoo.com/v7/finance/quote', {
// 			symbols: symbols.join(','),
// 			formatted: false,
// 			lang: 'en-US',
// 			region: 'US',
// 			corsDomain: 'finance.yahoo.com',
// 		}, { silent: true })
// 	}).then(function(response: YahooQuoteResponse) {
// 		let yquotes = [] as Array<YahooQuote>
// 		if (response && response.quoteResponse) {
// 			if (Array.isArray(response.quoteResponse.result)) yquotes = response.quoteResponse.result;
// 			if (response.quoteResponse.error) logger.error('getQuotes > response.quoteResponse.error', response.quoteResponse.error);
// 		}
// 		let coms = [] as RedisComs
// 		symbols.forEach(function(symbol) {
// 			let yquote = yquotes.find(v => v && v.symbol == symbol)
// 			if (yquote) {
// 				yquote.marketState = yquote.marketState || 'CLOSED'
// 				yquote.stamp = Date.now()
// 				let yrkey = shared.RKEY.YH.QUOTES + ':' + symbol
// 				coms.push(['hmset', yrkey, utils.tohset(yquote)])
// 			}
// 		})
// 		if (process.DEVELOPMENT) coms.splice(0);
// 		return redis.pipelinecoms(coms).then(function(resolved) {
// 			utils.pipelineErrors(resolved)
// 			return Promise.resolve()
// 		})

// 	}).catch(function(error) {
// 		logger.error('syncLives redis.pipeline > error', utils.peRender(error))
// 		return Promise.resolve()
// 	})
// }








