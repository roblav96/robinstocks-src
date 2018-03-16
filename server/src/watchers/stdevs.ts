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
import pdelay = require('delay')
import pevent = require('p-event')
import pforever = require('p-forever')
import pqueue = require('p-queue')
import ss = require('simple-statistics')
import redis = require('../adapters/redis')
import socket = require('../adapters/socket')
import metrics = require('../adapters/metrics')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')



// function onReady() {
// 	if (utils.isMaster()) return;
// 	if (process.DEVELOPMENT) return;
// 	// if (process.DEVELOPMENT && !utils.isPrimary()) return;

// 	if (process.PRODUCTION) return;

// 	pforever(syncStdevs)

// }
// rx.Observable.fromEvent(process.ee3_private, process.PRODUCTION ? shared.RKEY.SYS.TICK_3 : shared.RKEY.SYS.TICK_1).filter(function() {
// 	return !!process.$marketStamps && !!utils.readyInstruments && !!utils.readyCalcs
// }).take(1).subscribe(onReady)



// let ms_stddevs_histogram = new metrics.Histogram(shared.MS.ms_stdevs_histogram)



// function syncStdevs(): Promise<void> {
// 	let tstart = Date.now()
// 	let keys = utils.equalChunks(shared.RMAP.STDEVS, process.$instances)[process.$instance]

// 	return Promise.resolve().then(function() {
// 		if (shared.marketState() == 'CLOSED' && process.PRODUCTION) return Promise.reject(null);

// 		let coms = keys.mapFast(function(key) {
// 			let rkey = shared.RKEY.CALCS + ':' + shared.RKEY.SORTED + ':' + key
// 			return ['zrange', rkey, 0 as any, -1 as any, 'WITHSCORES']
// 		}) as RedisComs
// 		return redis.pipelinecoms(coms)

// 	}).then(function(resolveds: Array<Array<any>>) {
// 		utils.fixPipelineFast(resolveds)

// 		let cquotes = {} as Array<CalcQuote>
// 		keys.forEachFast(function(key, i) {
// 			let resolved = resolveds[i]
// 			Array(resolved.length / 2).forEachFast(function(v, i) {
// 				let symbol = resolved[(i * 2) + 0] as string
// 				if (!cquotes[symbol]) cquotes[symbol] = {} as any;
// 				let value = shared.safeParse(resolved[(i * 2) + 1])
// 				if (!Number.isFinite(value)) {
// 					console.error('syncStdevs >', symbol, key, '!_.isFinite', value)
// 					value = 0
// 				}
// 				cquotes[symbol][key] = value
// 			})
// 		})

// 		cquotes = Object.keys(cquotes).mapFast(symbol => Object.assign(cquotes[symbol], { symbol }))
// 		keys.forEachFast(function(key) {
// 			let vs = cquotes.mapFast(v => v[key])
// 			let stds = shared.standardize(vs)
// 			cquotes.forEachFast((v, i) => v[key] = stds[i])
// 		})

// 		let coms = cquotes.mapFast(v => ['hmset', shared.RKEY.STDEVS + ':' + v.symbol, utils.tohset(v)])

// 		if (process.DEVELOPMENT) coms.splice(0);

// 		return redis.pipelinecoms(coms).then(function(resolved) {
// 			utils.pipelineErrors(resolved)
// 			// ms_stddevs_histogram.update(Date.now() - tstart)
// 			return Promise.resolve()
// 		})

// 	}).catch(function(error) {
// 		if (error) logger.error('syncStdevs', JSON.stringify(keys), 'error', utils.peRender(error));
// 		return Promise.resolve()

// 	}).then(function() {
// 		// console.info('syncStdevs > done ' + (Date.now() - tstart) + 'ms')
// 		let tick = process.PRODUCTION ? shared.RKEY.SYS.TICK_30 : shared.RKEY.SYS.TICK_3
// 		return pevent(process.ee3_private, tick)
// 	})
// }







// new cron.CronJob({
// 	/*----------  3:52 AM Weekdays  ----------*/
// 	cronTime: utils.cronTime('52 03 * * 1-5'),
// 	start: process.PRODUCTION,
// 	onTick: function() {
// 		robinhood.flush(shared.RKEY.STDEVS)
// 	},
// 	timeZone: 'America/New_York',
// 	// runOnInit: process.DEVELOPMENT,
// })






// function syncStdDevs() {
// 	let tstart = Date.now()
// 	let keys = utils.chunks(shared.RMAP.STD_DEVS, process.$instances)[process.$instance]

// 	return Promise.resolve().then(function() {
// 		return robinhood.getAllSymbols()

// 	}).then(function(symbols) {
// 		let coms = symbols.mapFast(v => ['hmget', shared.RKEY.CALCS + ':' + v].concat(keys)) as RedisComs
// 		return redis.pipelinecoms(coms).then(function(cquotes: Array<CalcQuote>) {
// 			utils.fixPipelineFast(cquotes)

// 			cquotes = cquotes.mapFast((v, i) => {
// 				v = utils.fromhmget(v as any, keys)
// 				v.symbol = symbols[i]
// 				return v
// 			})
// 			return Promise.resolve(cquotes)
// 		})

// 	}).then(function(cquotes) {
// 		keys.forEachFast(function(key) {
// 			let vss = cquotes.mapFast(v => v[key]).filter(v => Number.isFinite(v))
// 			let stds = shared.standardize(vss)
// 			let ii = 0
// 			cquotes.forEachFast(function(cquote, i) {
// 				if (!Number.isFinite(vss[i])) return cquote[key] = null;
// 				cquote[key] = stds[ii]
// 				ii++
// 			})
// 		})

// 		let coms = cquotes.mapFast(v => ['hmset', shared.RKEY.STD_DEVS + ':' + v.symbol, utils.tohset(v)]) as RedisComs
// 		return redis.pipelinecoms(coms).then(function(resolved) {
// 			utils.pipelineErrors(resolved)
// 			ms_stddevs_histogram.update(Date.now() - tstart)
// 			return Promise.resolve()
// 		})

// 	}).catch(function(error) {
// 		if (error) logger.error('syncStdDevs > error', utils.peRender(error));
// 		return Promise.resolve()
// 	})
// }






















