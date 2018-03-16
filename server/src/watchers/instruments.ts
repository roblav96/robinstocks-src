//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import utils = require('../adapters/utils')
import shared = require('../shared')
import logger = require('../adapters/logger')

import cron = require('cron')
import rx = require('rxjs/Rx')
import pdelay = require('delay')
import pall = require('p-all')
import pforever = require('p-forever')
import pqueue = require('p-queue')
import redis = require('../adapters/redis')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')
import webull = require('../adapters/webull')



function onReady() {

	robinhood.getInstanceSymbols().then(function(symbols) {
		if (Array.isArray(symbols) && symbols.length > 0) return utils.readyInstruments = true;
		logger.warn('getInstanceSymbols > !Array.isArray(symbols)')
		process.ee3_public.emit('syncInstruments')
	})

}

if (utils.isMaster()) {
	process.ee3_public.once('syncInstruments', syncInstruments)
} else {
	rx.Observable.fromEvent(process.ee3_private, shared.RKEY.SYS.TICK_1).filter(function() {
		return !!process.$marketStamps
	}).take(1).subscribe(onReady)
}





function getInstruments(url: string): Promise<string> {
	return Promise.resolve().then(function() {
		console.log('getInstruments', url)
		return http.get(url, null, { silent: true })

	}).then(function(response: RobinhoodPaginatedResponse<RobinhoodInstrument>) {
		if (!response) return Promise.resolve(null);

		let instruments = [] as Array<RobinhoodInstrument>
		response.results.forEachFast(function(instrument) {
			if (!instrument) return;
			shared.fixResponse(instrument)
			instrument.mic = _.compact(instrument.market.split('/')).pop()
			instrument.acronym = robinhood.marketacronyms[instrument.mic]

			let symbols = ['INDU', 'BUR', 'PDLB', 'EMD']
			let types = ['wrt', 'nyrs', 'unit', 'rlt', 'lp', 'tracking']
			if (
				instrument.state == 'active' &&
				instrument.tradability == 'tradable' &&
				instrument.tradeable == true &&
				_.isString(instrument.type) &&
				types.indexOf(instrument.type) == -1 &&
				symbols.indexOf(instrument.symbol) == -1 &&
				!Array.isArray(instrument.symbol.match(/\W+/))
			) {
				instruments.push(instrument)
			}
		})

		return pall(instruments.mapFast(v => () => webull.getTickerId(v.symbol, v.country, v.mic, v.acronym, v.name))).then(function(results) {

			let coms = [] as RedisComs
			instruments.forEachFast(function(instrument, i) {
				let result = results[i]
				if (_.isEmpty(result)) return;

				instrument.tickerid = result.tickerId
				instrument.ticker_name = result.tickerName
				instrument.tiny_name = result.tinyName
				instrument.stamp = shared.now()

				let irkey = shared.RKEY.RH.INSTRUMENTS + ':' + instrument.symbol
				coms.push(['hmset', irkey, utils.tohset(instrument)])
			})

			if (process.DEVELOPMENT) coms.splice(0);

			return redis.main.pipelinecoms(coms).then(function(resolved) {
				utils.pipelineErrors(resolved)
				return Promise.resolve(response.next)
			})
		})

	}).catch(function(error) {
		logger.error('getInstruments > error', utils.peRender(error))
		return Promise.resolve(url)
	})
}



function syncInstruments(): Promise<void> {
	if (!utils.isMaster()) return Promise.resolve();

	let tstart = Date.now()
	logger.master('syncInstruments > start')

	return Promise.resolve().then(function() {
		if (process.DEVELOPMENT) return Promise.resolve();
		return redis.main.rkeyflush(shared.RKEY.RH.INSTRUMENTS)

	}).then(function() {
		return pforever(function(url) {
			if (url) return getInstruments(url);
			return pforever.end
		}, 'https://api.robinhood.com/instruments/')

	}).then(syncSymbols).then(function() {
		logger.master('syncInstruments > done ' + shared.getDuration(tstart))
		process.ee3_private.emit(shared.RKEY.SYS.RESTART)
		return Promise.resolve()

	}).catch(function(error) {
		logger.error('syncInstruments > error', utils.peRender(error))
		return pdelay(1000).then(syncInstruments)
	})
}





function syncSymbols(): Promise<any> {
	if (!utils.isMaster()) return Promise.resolve();
	logger.master('syncSymbols > start')

	return redis.main.keys(shared.RKEY.RH.INSTRUMENTS + ':*').then(function(rkeys: Array<string>) {

		let irkeys = ['symbol', 'tickerid']
		let coms = rkeys.mapFast(v => ['hmget', v].concat(irkeys))
		return redis.main.pipelinecoms(coms).then(function(instruments: Array<RobinhoodInstrument>) {
			utils.fixPipelineFast(instruments)
			instruments = instruments.mapFast(v => utils.fromhmget(v as any, irkeys))
			instruments = _.orderBy(instruments, 'symbol')

			let fsymbols = instruments.mapFast(function(v) {
				return { symbol: v.symbol, tickerid: v.tickerid } as FullSymbol
			})

			let coms = [] as RedisComs
			coms.push(['set', shared.RKEY.RH.SYMBOLS, JSON.stringify(fsymbols.mapFast(v => v.symbol))])
			coms.push(['set', shared.RKEY.RH.SYMBOLS_LENGTH, JSON.stringify(fsymbols.length)])
			coms.push(['set', shared.RKEY.RH.SYMBOLS_FULL, JSON.stringify(fsymbols.mapFast(v => [v.symbol, v.tickerid]))])

			{
				([8, 16]).forEachFast(function(instances) {
					let chunks = Array.from(Array(instances), () => [] as Array<FullSymbol>)
					fsymbols.forEachFast((fullsymbol, i) => chunks[i % instances].push(fullsymbol))
					chunks.forEachFast(function(chunk, i) {
						let symbols = chunk.mapFast(v => v.symbol)
						coms.push(['set', shared.RKEY.RH.SYMBOLS + ':' + instances + ':' + i, JSON.stringify(symbols)])
						coms.push(['set', shared.RKEY.RH.SYMBOLS_LENGTH + ':' + instances + ':' + i, JSON.stringify(chunk.length)])
						coms.push(['set', shared.RKEY.RH.SYMBOLS_FULL + ':' + instances + ':' + i, JSON.stringify(chunk.mapFast(v => [v.symbol, v.tickerid]))])
					})
				})
			}

			return redis.main.pipelinecoms(coms)

		})

	}).then(function(resolved) {
		utils.pipelineErrors(resolved)
		logger.master('syncSymbols > done')
		return Promise.resolve()

	}).catch(function(error) {
		logger.error('syncSymbols > error', utils.peRender(error))
		return pdelay(1000).then(syncSymbols)
	})
}





if (utils.isMaster()) {

	new cron.CronJob({
		/*----------  3:40 AM Weekdays  ----------*/
		cronTime: utils.cronTime('40 03 * * 1-5'),
		start: process.PRODUCTION,
		onTick: syncInstruments,
		timeZone: 'America/New_York',
		// runOnInit: process.DEVELOPMENT,
	})

	// robinhood.flush(shared.RKEY.RH.SYMBOLS, false).then(function() {
	// 	// return syncSymbols()
	// })

}





// if (process.DEVELOPMENT && utils.isMaster()) {
// syncInstruments()
// getInstruments('https://api.robinhood.com/instruments/')
// let symbol = 'VOD'
// http.get('https://api.robinhood.com/instruments/?symbol=' + symbol).then(function(response: RobinhoodPaginatedResponse<RobinhoodInstrument>) {
// 	let instrument = response.results[0]
// 	shared.fixResponse(instrument)
// 	instrument.mic = _.compact(instrument.market.split('/')).pop()
// 	instrument.acronym = robinhood.marketacronyms[instrument.mic]
// 	return webull.getTickerId(instrument.symbol, instrument.country, instrument.mic, instrument.acronym, instrument.name)
// })
// }



















