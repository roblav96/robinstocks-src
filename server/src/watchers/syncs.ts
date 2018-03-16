//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')
import logger = require('../adapters/logger')

import * as ecstat from 'echarts-stat/dist/ecStat'
import moment = require('moment')
import cron = require('cron')
import rx = require('rxjs/Rx')
import ss = require('simple-statistics')
import pdelay = require('delay')
import pevent = require('p-event')
import pforever = require('p-forever')
import pqueue = require('p-queue')
import pall = require('p-all')
import r = require('../adapters/rethinkdb')
import redis = require('../adapters/redis')
import storage = require('../adapters/storage')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')
import yahoo = require('../adapters/yahoo')
import webull = require('../adapters/webull')
import iex = require('../adapters/iex')



function onReady() {
	if (utils.isMaster()) return;
	if (process.PRODUCTION) return;
	if (process.DEVELOPMENT) return;
	// if (process.DEVELOPMENT && !utils.isPrimary()) return;

	// syncRobinhoodFundamentals()
	// backupcflows()
	// syncWebullQuotes()
	// syncCalcQuotes()
	// syncYahooSummaries()
	// syncIexItems()
	// syncEverything()

}
rx.Observable.fromEvent(process.ee3_private, process.PRODUCTION ? shared.RKEY.SYS.TICK_3 : shared.RKEY.SYS.TICK_1).filter(function() {
	return !!process.$marketStamps && !!utils.readyInstruments && !!utils.readyCalcs && !!utils.readyLives
}).take(1).subscribe(onReady)





function syncEverything() {
	if (utils.isMaster()) return Promise.resolve();
	let tstart = Date.now()
	logger.primary('syncEverything > start')
	return Promise.resolve().then(function() {
		return syncRobinhoodFundamentals()
	}).then(function() {
		return syncRobinhoodQuotes()
	}).then(function() {
		return syncYahooQuotes()
	}).then(function() {
		return syncIexItems()
	}).then(function() {
		return syncWebullQuotes()
	}).then(function() {
		return syncRobinhoodHistoricals()
	}).then(function() {
		return syncWebullCapitalFlows()
	}).then(function() {
		return syncCalcQuotes()
	}).then(function() {
		return syncYahooSummaries()
	}).then(function() {
		global.gc()
		logger.primary('syncEverything > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	})
}

function syncEvening() {
	if (utils.isMaster()) return Promise.resolve();
	let tstart = Date.now()
	logger.primary('syncEvening > start')
	return Promise.resolve().then(function() {
		return syncRobinhoodFundamentals()
	}).then(function() {
		return syncRobinhoodQuotes()
	}).then(function() {
		return syncYahooQuotes()
	}).then(function() {
		return syncIexItems()
	}).then(function() {
		return syncWebullQuotes()
	}).then(function() {
		return syncRobinhoodHistoricals()
	}).then(function() {
		return syncWebullCapitalFlows()
	}).then(function() {
		global.gc()
		logger.primary('syncEvening > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	})
}





function syncRobinhoodFundamentals(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncRobinhoodFundamentals > start')
	return robinhood.getInstanceSymbols().then(function(symbols) {
		let chunks = utils.equalChunks(symbols, _.ceil(symbols.length / 10))
		return pall(chunks.mapFast(v => () => eachRobinhoodFundamentals(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncRobinhoodFundamentals > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncRobinhoodFundamentals > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachRobinhoodFundamentals(symbols: Array<string>): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachRobinhoodFundamentals', JSON.stringify(symbols));
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
	}).then(function() {
		return robinhood.getFundamentals(symbols)
	}).then(function(fundamentals) {
		if (_.isEmpty(fundamentals)) return Promise.resolve();
		let coms = fundamentals.filter(v => !!v).mapFast(function(fundamental) {
			let rkey = shared.RKEY.RH.FUNDAMENTALS + ':' + fundamental.symbol
			return ['hmset', rkey, utils.tohset(fundamental)]
		}) as RedisComs
		return redis.main.pipelinecoms(coms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		})
	})
}





function syncRobinhoodQuotes(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncRobinhoodQuotes > start')
	return robinhood.getInstanceSymbols().then(function(symbols) {
		let chunks = utils.equalChunks(symbols, _.ceil(symbols.length / 128))
		return pall(chunks.mapFast(v => () => eachRobinhoodQuotes(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncRobinhoodQuotes > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncRobinhoodQuotes > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachRobinhoodQuotes(symbols: Array<string>): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachRobinhoodQuotes', JSON.stringify(symbols));
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
	}).then(function() {
		return robinhood.getQuotes(symbols)
	}).then(function(rquotes) {
		if (_.isEmpty(rquotes)) return Promise.resolve();
		let coms = rquotes.filter(v => !!v).mapFast(function(rquote) {
			let rkey = shared.RKEY.RH.QUOTES + ':' + rquote.symbol
			return ['hmset', rkey, utils.tohset(rquote)]
		}) as RedisComs
		return redis.main.pipelinecoms(coms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		})
	})
}





function syncYahooQuotes(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncYahooQuotes > start')
	return robinhood.getInstanceSymbols().then(function(symbols) {
		let chunks = utils.equalChunks(symbols, _.ceil(symbols.length / 128))
		return pall(chunks.mapFast(v => () => eachYahooQuotes(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncYahooQuotes > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncYahooQuotes > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachYahooQuotes(symbols: Array<string>): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachYahooQuotes', JSON.stringify(symbols));
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
	}).then(function() {
		return yahoo.getQuotes(symbols)
	}).then(function(yquotes) {
		if (_.isEmpty(yquotes)) return Promise.resolve();
		let coms = yquotes.filter(v => !!v).mapFast(function(yquote) {
			let rkey = shared.RKEY.YH.QUOTES + ':' + yquote.symbol
			return ['hmset', rkey, utils.tohset(yquote)]
		}) as RedisComs
		return redis.main.pipelinecoms(coms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		})
	})
}





function syncRobinhoodHistoricals(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncRobinhoodHistoricals > start')
	return robinhood.getInstanceSymbols().then(function(symbols) {
		let chunks = utils.equalChunks(symbols, _.ceil(symbols.length / 10))
		return pall(chunks.mapFast(v => () => eachRobinhoodHistoricals(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncRobinhoodHistoricals > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncRobinhoodHistoricals > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachRobinhoodHistoricals(symbols: Array<string>): Promise<any> {
	return Promise.resolve().then(function() {
		return pall(['day', 'week', 'year'].mapFast(v => () => eachRobinhoodHistoricalsSpan(symbols, v as any)), { concurrency: 1 })
	})
}

function eachRobinhoodHistoricalsSpan(symbols: Array<string>, span: RobinhoodHistoricalSpans): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachRobinhoodHistoricalsSpan', span, JSON.stringify(symbols));
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
	}).then(function() {
		return robinhood.getHistoricals(symbols, span)
	}).then(function(historicals) {
		if (_.isEmpty(historicals)) return Promise.resolve();
		let coms = historicals.filter(v => !!v).mapFast(function(historical) {
			shared.implodeArraysFast(historical.historicals)
			let rkey = shared.RKEY.RH.HISTORICALS + ':' + span + ':' + historical.symbol
			return ['hmset', rkey, utils.tohset(historical)]
		}) as RedisComs
		return redis.main.pipelinecoms(coms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		})
	})
}





function syncCalcQuotes(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncCalcQuotes > start')
	return robinhood.getInstanceSymbols().then(function(symbols) {
		if (process.DEVELOPMENT) symbols = utils.devFsymbols().mapFast(v => v.symbol);
		let chunks = utils.equalChunks(symbols, _.ceil(symbols.length / 16))
		return pall(chunks.mapFast(v => () => eachCalcQuotes(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncCalcQuotes > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncCalcQuotes > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachCalcQuotes(symbols: Array<string>): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachCalcQuotes', JSON.stringify(symbols));
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_01)

	}).then(function(resolved) {
		return redis.main.pipelinecoms(symbols.mapFast(function(symbol) {
			let rkey = shared.RKEY.RH.HISTORICALS + ':week:' + symbol
			return ['hget', rkey, 'historicals']
		}))

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)

		let ccoms = [] as RedisComs
		symbols.forEachFast(function(symbol, i) {
			let historicals = shared.safeParse(resolved[i]) as Array<RobinhoodHistorical>
			if (_.isEmpty(historicals)) return;

			shared.explodeArraysFast(historicals)
			historicals = historicals.filter(v => !!v && v.session == 'reg')

			let prices = [] as Array<number>
			historicals.forEachFast(function(v) {
				let price = Math.abs(shared.calcPercentChange(v.close_price, v.open_price))
				if (price != 0) prices.push(price);
			})
			let avgprice = _.round(_.mean(prices), 8)
			if (!Number.isFinite(avgprice)) avgprice = 0.1;

			let sizetimes = {} as { [time: string]: Array<number> }
			historicals.forEachFast(function(v) {
				let time = shared.moment(v.begins_at).format('h:mma')
				if (!Array.isArray(sizetimes[time])) sizetimes[time] = [];
				sizetimes[time].push(v.volume)
			})

			let accu = 0
			let accus = [] as Array<number>
			Object.keys(sizetimes).forEachFast(function(time, i) {
				let avgsize = _.round(_.mean(sizetimes[time]))
				accu += avgsize
				accus.push(accu)
			})
			accus.unshift(0)

			let stddata = accus.mapFast((v, i) => [i, v / accu])
			let quadratic = ecstat.regression('polynomial', stddata, 9) as EChartsStat.RegressionResult

			let cquote = storage.calcquotes[symbol]
			cquote.avgTickChange = avgprice
			cquote.realParameter = quadratic.parameter
			storage.calcsymbols[symbol]++

		})

		if (process.DEVELOPMENT) ccoms.splice(0);

		return redis.calcs.pipelinecoms(ccoms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		})

	})
}





function syncYahooSummaries(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncYahooSummaries > start')
	return robinhood.getInstanceSymbols().then(function(symbols) {
		return pall(symbols.mapFast(v => () => eachYahooSummary(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncYahooSummaries > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncYahooSummaries > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachYahooSummary(symbol: string): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachYahooSummary', symbol);
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1)
	}).then(function() {
		return yahoo.getSummary(symbol)
	}).then(function(summary) {
		if (_.isEmpty(summary)) return Promise.resolve();
		return r.table('yh_summaries').insert(summary, { conflict: 'replace' }).run()
	})
}





function syncWebullQuotes(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncWebullQuotes > start')
	return robinhood.getInstanceFullSymbols().then(function(fsymbols) {
		return pall(fsymbols.mapFast(v => () => eachWebullQuote(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncWebullQuotes > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncWebullQuotes > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachWebullQuote(fsymbol: FullSymbol): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachWebullQuote', fsymbol.symbol);
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
	}).then(function() {
		return webull.getQuote(fsymbol)
	}).then(function(wquote) {
		if (_.isEmpty(wquote)) return Promise.resolve();
		let rkey = shared.RKEY.WB.QUOTES + ':' + wquote.symbol
		return redis.main.hmset(rkey, utils.tohset(wquote)).then(() => Promise.resolve())
	})
}





function syncWebullCapitalFlows(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncWebullCapitalFlows > start')
	return robinhood.getInstanceFullSymbols().then(function(fsymbols) {
		return pall(fsymbols.mapFast(v => () => eachWebullCapitalFlow(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncWebullCapitalFlows > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncWebullCapitalFlows > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachWebullCapitalFlow(fsymbol: FullSymbol): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachWebullCapitalFlow', fsymbol.symbol);
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
	}).then(function() {
		return webull.getCapitalFlow(fsymbol)
	}).then(function(wcflow) {
		if (_.isEmpty(wcflow)) return Promise.resolve();
		return r.table('wb_cflows').insert(wcflow, { conflict: 'replace' }).run()
	})
}





function syncIexItems(): Promise<void> {
	global.gc()
	let tstart = Date.now()
	logger.primary('syncIexItems > start')
	return robinhood.getInstanceSymbols().then(function(symbols) {
		let chunks = utils.equalChunks(symbols, _.ceil(symbols.length / 16))
		return pall(chunks.mapFast(v => () => eachIexItems(v)), { concurrency: 1 })
	}).then(function() {
		logger.primary('syncIexItems > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('syncIexItems > error', utils.peRender(error))
		return Promise.resolve()
	})
}

function eachIexItems(symbols: Array<string>): Promise<void> {
	if (process.DEVELOPMENT) console.log('eachIexItems', JSON.stringify(symbols));
	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
	}).then(function() {
		return iex.getBatch(symbols, ['company', 'peers', 'quote', 'stats'])
	}).then(function(response) {
		if (_.isEmpty(response)) return Promise.resolve();
		let coms = Object.keys(response).mapFast(function(symbol) {
			let result = response[symbol]
			let iexitem = {} as IexItem
			shared.merge(iexitem, result.company)
			shared.merge(iexitem, result.stats)
			shared.merge(iexitem, result.quote)
			iexitem.peers = result.peers
			iexitem.symbol = symbol.toUpperCase()
			iexitem.stamp = shared.now()
			let rkey = shared.RKEY.IEX.ITEMS + ':' + iexitem.symbol
			return ['hmset', rkey, utils.tohset(iexitem)]
		}) as RedisComs
		return redis.main.pipelinecoms(coms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		})
	})
}







new cron.CronJob({
	/*----------  3:00 AM Weekdays  ----------*/
	cronTime: utils.cronTime('00 03 * * 1-5'),
	start: process.PRODUCTION,
	onTick: syncEverything,
	timeZone: 'America/New_York',
	// runOnInit: process.DEVELOPMENT,
})

new cron.CronJob({
	/*----------  8:01 PM Weekdays  ----------*/
	cronTime: utils.cronTime('02 20 * * 1-5'),
	start: process.PRODUCTION,
	onTick: syncEvening,
	timeZone: 'America/New_York',
	// runOnInit: process.DEVELOPMENT,
})














// function backupcflows(): Promise<void> {
// 	global.gc()
// 	let tstart = Date.now()
// 	console.log('backupcflows > start')
// 	return robinhood.getInstanceSymbols().then(function(symbols) {
// 		let chunks = _.chunk(symbols, 10)
// 		let queue = new pqueue({ concurrency: 1 }) as PQueue
// 		chunks.forEachFast(v => queue.add(() => eachbackupcflows(v)))
// 		return queue.onIdle()
// 	}).then(function() {
// 		console.log('backupcflows > done ' + shared.getDuration(tstart))
// 		return Promise.resolve()
// 	}).catch(function(error) {
// 		console.error('backupcflows > error', utils.peRender(error))
// 		return Promise.resolve()
// 	})
// }

// function eachbackupcflows(symbols: Array<string>): Promise<void> {
// 	if (process.DEVELOPMENT) console.log('eachbackupcflows', JSON.stringify(symbols));
// 	return Promise.resolve().then(function() {
// 		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
// 	}).then(function() {
// 		let coms = [] as RedisComs
// 		symbols.forEachFast(function(symbol) {
// 			coms.push(['hgetall', shared.RKEY.WB.CFLOWS + ':' + symbol])
// 		})
// 		return redis.pipelinecoms(coms)
// 	}).then(function(resolved) {
// 		utils.fixPipelineFast(resolved)
// 		if (_.isEmpty(resolved)) return Promise.resolve();
// 		let cflows = [] as Array<WebullCapitalFlowItem>
// 		symbols.forEachFast(function(symbol, i) {
// 			let cfdict = utils.fromhget(resolved[i]) as { [date: string]: WebullCapitalFlowItem }
// 			cflows = cflows.concat(Object.keys(cfdict).mapFast(k => cfdict[k]))
// 		})
// 		return r.table('wb_cflows').insert(cflows).run()
// 	})
// }

// robinhood.getInstanceSymbols().then(function(symbols) {
// 	console.log('onReady', symbols.length)
// 	let coms = [] as RedisComs
// 	symbols.forEachFast(function(symbol) {
// 		coms.push(['hgetall', shared.RKEY.WB.CFLOWS + ':' + symbol])
// 	})
// 	return redis.pipelinecoms(coms).then(function(resolved) {
// 		console.log('resolved', symbols.length)
// 		utils.fixPipelineFast(resolved)
// 		let cflows = [] as Array<WebullCapitalFlowItem>
// 		symbols.forEachFast(function(symbol, i) {
// 			let cfdict = utils.fromhget(resolved[i]) as { [date: string]: WebullCapitalFlowItem }
// 			cflows = cflows.concat(Object.keys(cfdict).mapFast(k => cfdict[k]))
// 		})
// 		return r.table('wb_cflows').insert(cflows).run()
// 	}).then(function() {
// 		console.warn('DONE', symbols.length)
// 	})
// }).catch(function(error) {
// 	console.error('onReady > error', utils.peRender(error))
// })


