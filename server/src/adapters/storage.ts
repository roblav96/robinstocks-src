//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')
import logger = require('./logger')

import cron = require('cron')
import moment = require('moment')
import ss = require('simple-statistics')
import nib = require('ib')
import metrics = require('./metrics')
import redis = require('./redis')
import r = require('./rethinkdb')
import socket = require('./socket')
import ibtr = require('./ib.trader')
import ewmas = require('../watchers/ewmas')



export const calcquotes = {} as { [symbol: string]: CalcQuote }
export const livequotes = {} as { [symbol: string]: CalcQuote }
export const tinyquotes = {} as { [symbol: string]: Array<TinyQuote> }

export const calcsymbols = {} as { [symbol: string]: number }
export const livesymbols = {} as { [symbol: string]: number }
export const liveminutesymbols = {} as { [symbol: string]: number }
export const newssymbols = {} as { [symbol: string]: number }



const ms_storage_calcs = new metrics.Meter(shared.METRICS.storage_calcs)
const ms_storage_lives = new metrics.Meter(shared.METRICS.storage_lives)



export function initSymbols(symbols: Array<string>): Promise<void> {

	symbols.forEachFast(function(symbol) {
		calcsymbols[symbol] = 0
		livesymbols[symbol] = 0
		liveminutesymbols[symbol] = 0
		newssymbols[symbol] = 0
	})

	let ccoms = [] as RedisComs
	let lcoms = [] as RedisComs
	symbols.forEachFast(function(symbol) {
		ccoms.push(['hgetall', shared.RKEY.CALCS + ':' + symbol])
		lcoms.push(['zrange', shared.RKEY.LIVES + ':' + symbol, -1 as any, -1 as any])
		lcoms.push(['zrange', shared.RKEY.LIVES_TINYS + ':' + symbol, -shared.backRange as any, -1 as any])
	})
	return Promise.all([
		redis.calcs.pipelinecoms(ccoms),
		redis.lives.pipelinecoms(lcoms),
	]).then(function(resolveds) {
		resolveds.forEachFast(v => utils.fixPipelineFast(v))

		symbols.forEachFast(function(symbol, i) {
			let cquote = utils.fromhget(resolveds[0][i]) as CalcQuote
			cquote.symbol = symbol
			calcquotes[symbol] = Object.assign({}, cquote)

			let lquote = (utils.fromhget(resolveds[1][(i * 2) + 0]) || []) as CalcQuote
			lquote = shared.explode(shared.RMAP.LIVES, lquote[0] || {})
			Object.assign(cquote, lquote)
			livequotes[symbol] = Object.assign({}, cquote)

			let tquotes = utils.fromhget(resolveds[1][(i * 2) + 1]) as Array<TinyQuote>
			tinyquotes[symbol] = Array.isArray(tquotes) ? tquotes.mapFast(v => shared.explode(shared.RMAP.TINYS, v)) : []
		})

		process.ee3_private.addListener(shared.RKEY.SYS.TICK_1, syncQuotes)

		redis.sub.subscribe(...symbols.mapFast(v => shared.RKEY.CALCS_REMOTE + ':' + v))
		redis.sub.on('message', redisCalcUpdate)

		return Promise.resolve()
	})
}





function syncQuotes(i: number) {
	if (utils.isMaster()) return;

	let lchunks = utils.equalChunks(Object.keys(livesymbols), 10)[i % 10]
	let lsymbols = Object.keys(livesymbols).filter(function(symbol) {
		return lchunks.indexOf(symbol) >= 0 && livesymbols[symbol] > 0
	}).mapFast(function(symbol) {
		livesymbols[symbol] = 0
		return symbol
	})

	let csymbols = Object.keys(calcsymbols).filter(function(symbol) {
		return calcsymbols[symbol] > 0
	}).mapFast(function(symbol) {
		calcsymbols[symbol] = 0
		return symbol
	}).filter(function(symbol) {
		return lsymbols.indexOf(symbol) == -1
	})

	if (csymbols.length == 0 && lsymbols.length == 0) return;
	if (csymbols.length > 0) ms_storage_calcs.mark(csymbols.length);
	if (lsymbols.length > 0) ms_storage_lives.mark(lsymbols.length);

	Promise.resolve().then(function() {



		let ccoms = [] as RedisComs
		csymbols.forEachFast(function(symbol) {
			let cquote = calcquotes[symbol]
			let lquote = livequotes[symbol]

			cquote.stamp = shared.now()
			utils.applyCalcs(cquote)

			ewmas.sewmas[symbol].assign(cquote)

			if (cquote.liveTrading && process.PRODUCTION) {
				ibtr.orderAction(cquote)
			}

			if (process.DEVELOPMENT) {
				console.log(symbol, 'diff >')
				eyes.inspect(shared.difference(cquote, lquote))
			}

			let crkey = shared.RKEY.CALCS + ':' + symbol
			ccoms.push(['hmset', crkey, utils.tohset(shared.difference(cquote, lquote))])
			if (socket.hasSubscriber(crkey)) socket.emit(crkey, shared.implodeFast(shared.RMAP.CALCS, cquote));
			let csrkey = shared.RKEY.CALCS_SMALLS + ':' + symbol
			if (socket.hasSubscriber(csrkey)) socket.emit(csrkey, shared.implodeFast(shared.RMAP.SMALLS, cquote));

			newssymbols[symbol]++

		})



		let lcoms = [] as RedisComs
		let trdcoms = new utils.TradingComs()
		lsymbols.forEachFast(function(symbol) {
			let cquote = calcquotes[symbol]
			let lquote = livequotes[symbol]
			let tquotes = tinyquotes[symbol]

			if (cquote.lastStamp <= lquote.lastStamp) return;

			cquote.count = _.sum([cquote.count, 1])
			cquote.stamp = shared.now()
			utils.applyCalcs(cquote)

			let timploded = shared.implodeFast(shared.RMAP.TINYS, cquote)
			let trkey = shared.RKEY.LIVES_TINYS + ':' + symbol
			lcoms.push(['zadd', trkey, cquote.lastStamp as any, JSON.stringify(timploded)])
			if (socket.hasSubscriber(trkey)) socket.emit(trkey, timploded);

			tquotes.push(shared.explode(shared.RMAP.TINYS, timploded))
			tquotes.splice(0, _.max([tquotes.length - shared.backRange, 0]))
			utils.applySlopes(cquote, tquotes)

			if (_.isEmpty(lquote) || !Number.isFinite(lquote.lastPrice)) shared.merge(lquote, cquote);
			ewmas.sewmas[symbol].compute(cquote, lquote)

			if (cquote.liveTrading && process.PRODUCTION) {
				ibtr.orderAction(cquote)
			}

			shared.merge(lquote, cquote)
			trdcoms.push(cquote)

			let limploded = shared.implodeFast(shared.RMAP.LIVES, lquote)
			let lrkey = shared.RKEY.LIVES + ':' + symbol
			lcoms.push(['zadd', lrkey, lquote.lastStamp as any, JSON.stringify(limploded)])
			if (socket.hasSubscriber(lrkey)) socket.emit(lrkey, limploded);

			let mt5stamp = shared.moment(lquote.lastStamp).startOf('minute').valueOf()
			let t5start = shared.moment(mt5stamp).subtract(shared.moment(mt5stamp).minute() % 5, 'minutes').valueOf()
			let t5end = shared.moment(mt5stamp).add(5, 'minutes').valueOf()
			let t5rkey = shared.RKEY.LIVES_TINYS_5M + ':' + symbol
			lcoms.push(['zremrangebyscore', t5rkey, t5start as any, t5end as any])
			lcoms.push(['zadd', t5rkey, lquote.lastStamp as any, JSON.stringify(timploded)])
			if (socket.hasSubscriber(t5rkey)) socket.emit(t5rkey, timploded);

			let crkey = shared.RKEY.CALCS + ':' + symbol
			ccoms.push(['hmset', crkey, utils.tohset(cquote)])
			if (socket.hasSubscriber(crkey)) socket.emit(crkey, shared.implodeFast(shared.RMAP.CALCS, cquote));
			let csrkey = shared.RKEY.CALCS_SMALLS + ':' + symbol
			if (socket.hasSubscriber(csrkey)) socket.emit(csrkey, shared.implodeFast(shared.RMAP.SMALLS, cquote));

			cquote.bidSpread = cquote.bidPrice
			cquote.askSpread = cquote.askPrice

			cquote.open = cquote.lastPrice
			cquote.high = cquote.lastPrice
			cquote.low = cquote.lastPrice

			cquote.lastSize = cquote.size
			cquote.lastTradeSize = cquote.tradeSize
			cquote.lastVolume = cquote.volume
			cquote.lastTradeVolume = cquote.tradeVolume

			cquote.size = 0
			cquote.tradeCount = 0
			cquote.tradeSize = 0
			cquote.tradeBuySize = 0
			cquote.tradeSellSize = 0
			cquote.tradeFlowSize = 0
			cquote.bidSizeAccum = 0
			cquote.askSizeAccum = 0
			cquote.bidAskFlowSizeAccum = 0

			newssymbols[symbol]++

		})



		trdcoms.merge(ccoms)

		if (process.DEVELOPMENT) {
			// console.info('syncQuotes > ccoms.splice')
			ccoms.splice(0)
		}
		if (process.DEVELOPMENT) {
			// console.info('syncQuotes > lcoms.splice')
			lcoms.splice(0)
		}

		return Promise.all([
			redis.calcs.pipelinecoms(ccoms),
			redis.lives.pipelinecoms(lcoms),
		]).then(function(resolveds) {
			resolveds.forEachFast(v => utils.pipelineErrors(v))

			lsymbols.forEachFast(v => liveminutesymbols[v]++)

			return Promise.resolve()
		})

	}).catch(function(error) {
		logger.error('syncLiveQuotes > error', utils.peRender(error));
		return Promise.resolve()
	})

}







export function remoteCalcUpdate(cquote: Partial<CalcQuote>) {
	let symbol = cquote.symbol
	_.unset(cquote, 'symbol')
	return Promise.all([
		redis.calcs.hmset(shared.RKEY.CALCS + ':' + symbol, utils.tohset(cquote)),
		redis.pub.publish(shared.RKEY.CALCS_REMOTE + ':' + symbol, JSON.stringify(cquote)),
	]).then(() => Promise.resolve())
}

function redisCalcUpdate(channel: string, message: CalcQuote) {
	if (channel.indexOf(shared.RKEY.CALCS_REMOTE) != 0) return;
	message = shared.safeParse(message)

	let symbol = channel.split(':').pop()
	let cquote = calcquotes[symbol]

	shared.merge(cquote, message)
	calcsymbols[symbol]++

	if (Number.isFinite(message.position) && Number.isFinite(message.avgCost)) {
		cquote.unrealizedPNL = (cquote.lastPrice - cquote.avgCost) * cquote.position
	}

	if (_.isBoolean(message.liveTrading)) {
		if (message.liveTrading == true) redis.calcs.sadd(shared.RKEY.CALCS_TRADING, symbol);
		if (message.liveTrading == false) redis.calcs.srem(shared.RKEY.CALCS_TRADING, symbol);
		let ctrkey = shared.RKEY.CALCS_TRADING
		if (socket.hasSubscriber(ctrkey)) socket.emit(ctrkey, shared.implodeFast(shared.RMAP.SMALLS, cquote));
	}

	let crkey = shared.RKEY.CALCS + ':' + symbol
	if (socket.hasSubscriber(crkey)) socket.emit(crkey, shared.implodeFast(shared.RMAP.CALCS, cquote));
	let csrkey = shared.RKEY.CALCS_SMALLS + ':' + symbol
	if (socket.hasSubscriber(csrkey)) socket.emit(csrkey, shared.implodeFast(shared.RMAP.SMALLS, cquote));

}




