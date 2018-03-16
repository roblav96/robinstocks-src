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
import moment = require('moment')
import rx = require('rxjs/Rx')
import pdelay = require('delay')
import pevent = require('p-event')
import pforever = require('p-forever')
import pqueue = require('p-queue')
import ss = require('simple-statistics')
import r = require('../adapters/rethinkdb')
import redis = require('../adapters/redis')
import socket = require('../adapters/socket')
import metrics = require('../adapters/metrics')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')
import yahoo = require('../adapters/yahoo')
import webull = require('../adapters/webull')
import storage = require('../adapters/storage')



function onReady() {
	if (process.DEVELOPMENT) return utils.readyCalcs = true;
	// if (process.DEVELOPMENT && !utils.isPrimary()) return utils.readyCalcs = true;

	syncCalcs().then(() => utils.readyCalcs = true)

}
process.ee3_private.once(shared.RKEY.SYS.READY, onReady)





function syncCalcs(action?: string): Promise<any> {
	if (utils.isMaster()) {
		if (process.DEVELOPMENT) return Promise.resolve();
		return redis.calcs.del(shared.RKEY.CALCS_TRADING)
	}

	let scount = 0
	let tstart = Date.now()
	let irkeys = ['id', 'simple_name', 'name', 'type', 'list_date', 'tickerid', 'mic', 'acronym', 'ticker_name', 'tiny_name']
	let frkeys = ['average_volume', 'market_cap', 'volume']
	let iikeys = ['latestVolume', 'avgTotalVolume', 'marketCap', 'companyName', 'sharesOutstanding', 'float', 'exchange', 'primaryExchange', 'industry', 'sector']

	return Promise.resolve().then(function() {
		return robinhood.getInstanceFullSymbols()

	}).then(function(fsymbols) {
		if (process.DEVELOPMENT) fsymbols = utils.devFsymbols(fsymbols);
		let symbols = fsymbols.mapFast(v => v.symbol)
		scount = symbols.length

		let coms = [] as RedisComs
		let ccoms = [] as RedisComs
		symbols.forEachFast(function(v) {
			coms.push(['hmget', shared.RKEY.RH.INSTRUMENTS + ':' + v].concat(irkeys))
			coms.push(['hmget', shared.RKEY.RH.FUNDAMENTALS + ':' + v].concat(frkeys))
			coms.push(['hmget', shared.RKEY.IEX.ITEMS + ':' + v].concat(iikeys))
			coms.push(['hgetall', shared.RKEY.WB.QUOTES + ':' + v])
			ccoms.push(['hgetall', shared.RKEY.CALCS + ':' + v])
		})

		return Promise.all([
			Promise.resolve(symbols),
			redis.main.pipelinecoms(coms),
			redis.calcs.pipelinecoms(ccoms),
			yahoo.getQuotes(symbols),
			webull.getFastQuotes(fsymbols),
			r.table('yh_summaries').getAll(r.args(symbols)).pluck(['symbol', 'defaultKeyStatistics'] as any).run(),
		])

	}).then(function(resolveds) {
		let symbols = resolveds[0]
		let mresolved = resolveds[1]
		utils.fixPipelineFast(mresolved)
		let cresolved = resolveds[2]
		utils.fixPipelineFast(cresolved)
		let yquotes = resolveds[3]
		let wfquotes = resolveds[4]
		let ysummarys = resolveds[5] as Array<YahooSummaryResult>

		let ccoms = [] as RedisComs
		let trdcoms = new utils.TradingComs()
		symbols.forEachFast(function(symbol, i) {
			// console.warn('syncCalcs symbol', symbol)
			let cquote = utils.fromhget(cresolved[i]) as CalcQuote
			cquote.symbol = symbol

			let yquote = yquotes.find(v => v && v.symbol == symbol) || {} as YahooQuote
			yquote.symbol = symbol
			let ycquote = utils.ycQuoteFast(yquote)

			let instrument = utils.fromhmget(mresolved[(i * 4) + 0], irkeys) as RobinhoodInstrument
			instrument.symbol = symbol

			let fundamentals = utils.fromhmget(mresolved[(i * 4) + 1], frkeys) as RobinhoodFundamentals
			fundamentals.symbol = symbol
			let rfcquote = utils.rfcQuoteFast(fundamentals)

			let iexitem = utils.fromhmget(mresolved[(i * 4) + 2], iikeys) as IexItem
			iexitem.symbol = symbol
			let icquote = utils.icQuoteFast(iexitem)

			let wquote = utils.fromhget(mresolved[(i * 4) + 3]) as WebullQuote
			let wfquote = wfquotes.find(v => v && v.symbol == symbol) || {} as WebullFastQuote
			if (wfquote) shared.merge(wquote, wfquote);
			wquote.symbol = symbol
			let wcquote = utils.wcQuoteFast(wquote)

			let ysummary = ysummarys.find(v => v && v.symbol == symbol)



			shared.repair(cquote, wcquote)
			shared.repair(cquote, ycquote)
			shared.repair(cquote, icquote)
			shared.repair(cquote, rfcquote)



			let reset = {
				stamp: shared.now(),
				count: 0, dealCount: 0, tradeCount: 0,
				size: 0, lastSize: 0,
				volume: 0, lastVolume: 0,
				tradeSize: 0, tradeVolume: 0,
				lastTradeSize: 0, lastTradeVolume: 0,
				tradeBuySize: 0, tradeSellSize: 0,
				tradeBuyVolume: 0, tradeSellVolume: 0,
				bidSizeAccum: 0, askSizeAccum: 0,
				bidVolume: 0, askVolume: 0,
				dayLow: cquote.lastPrice, dayHigh: cquote.lastPrice,
				eodPrice: cquote.lastPrice,
				avgVolume10Day: _.round(_.compact([yquote.averageDailyVolume10Day, wquote.avgVol10D, wquote.avgVolume, yquote.regularMarketVolume, wquote.volume])[0]),
				avgVolume3Month: _.round(_.compact([yquote.averageDailyVolume3Month, wquote.avgVol3M, wquote.avgVolume, yquote.regularMarketVolume, wquote.volume])[0]),
				open: cquote.lastPrice, high: cquote.lastPrice, low: cquote.lastPrice, close: cquote.lastPrice,
			} as CalcQuote

			reset.avgVolume = _.round(_.mean(_.compact([reset.avgVolume10Day, reset.avgVolume3Month])))

			shared.repair(cquote, reset)
			if (action == 'reset') {
				shared.merge(cquote, reset)
			}



			let repair = {
				action: '',
				prevAction: 'sell',
				liveTrading: false,
				position: 0,
				avgCost: 0,
				unrealizedPNL: 0,
				realizedPNL: 0,
				avgTickChange: 0.1,
				realParameter: [],
				wbstatusStamp: shared.now(),
				newsStamp: shared.now(),
				positionStamp: shared.now(),
			} as CalcQuote
			shared.repair(cquote, repair)



			let names = _.uniq(_.compact([instrument.simple_name, instrument.name, yquote.shortName, yquote.longName, iexitem.companyName]))
			let min = _.min(names.mapFast(v => v.length))
			let name = names.find(v => v.length == min) || names[0]
			cquote.name = shared.string_clean(name.replace('&amp;', ''))
			if (instrument.ticker_name) cquote.name = instrument.ticker_name;
			if (instrument.tiny_name) cquote.name = instrument.tiny_name;

			cquote.tickerId = instrument.tickerid
			cquote.rhid = instrument.id
			cquote.type = instrument.type
			cquote.mic = instrument.mic
			cquote.acronym = instrument.acronym
			if (instrument.list_date) cquote.listDate = shared.moment(new Date(instrument.list_date)).valueOf();
			cquote.country = _.compact([instrument.country, wquote.regionAlias])[0]
			if (cquote.country) cquote.country = cquote.country.toUpperCase();
			cquote.exchange = _.compact([iexitem.exchange, iexitem.primaryExchange])[0]

			cquote.sharesOutstanding = _.round(_.compact([wquote.totalShares, yquote.sharesOutstanding, iexitem.sharesOutstanding])[0]) || 0
			cquote.sharesFloat = _.round(_.compact([wquote.outstandingShares, _.get(ysummary, 'defaultKeyStatistics.floatShares'), iexitem.float])[0]) || 0

			cquote.stamp = shared.now()
			utils.applyCalcs(cquote)
			trdcoms.push(cquote)

			if (storage.calcquotes[symbol]) Object.assign(storage.calcquotes[symbol], cquote);

			let crkey = shared.RKEY.CALCS + ':' + symbol
			ccoms.push(['hmset', crkey, utils.tohset(cquote)])
			if (socket.hasSubscriber(crkey)) socket.emit(crkey, shared.implodeFast(shared.RMAP.CALCS, cquote));

			let csrkey = shared.RKEY.CALCS_SMALLS + ':' + symbol
			if (socket.hasSubscriber(csrkey)) socket.emit(csrkey, shared.implodeFast(shared.RMAP.SMALLS, cquote));

		})

		trdcoms.merge(ccoms)

		if (process.DEVELOPMENT) ccoms.splice(0);

		return redis.calcs.pipelinecoms(ccoms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		})

	}).catch(function(error) {
		if (error) logger.error('syncCalcs' + (action ? ' ' + action : '') + ' ' + scount + ' > error', utils.peRender(error));
		return Promise.resolve()

	}).then(function() {
		logger.info('syncCalcs' + (action ? ' ' + action : '') + ' ' + scount + ' > done ' + shared.getDuration(tstart))
		return Promise.resolve()
	})
}







new cron.CronJob({
	/*----------  3:52:30 AM Weekdays  ----------*/
	cronTime: utils.cronTime('30 52 03 * * 1-5'),
	start: process.PRODUCTION,
	onTick: function() { syncCalcs('reset') },
	timeZone: 'America/New_York',
})

// new cron.CronJob({
// 	/*----------  8:01 PM Weekdays  ----------*/
// 	cronTime: utils.cronTime('01 20 * * 1-5'),
// 	start: process.PRODUCTION,
// 	onTick: function() { syncCalcs('evening') },
// 	timeZone: 'America/New_York',
// })







// robinhood.flush(shared.RKEY.CALCS)
























