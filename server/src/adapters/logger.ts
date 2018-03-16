//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')

import cron = require('cron')
import strip = require('cli-color/strip')
import redis = require('./redis')
import socket = require('./socket')



const buffered = [] as RedisComs

function log(rkey: string, ...messages) {
	let stack = utils.getStack()
	stack = stack.substring(0, stack.lastIndexOf(':'))
	let stamp = Date.now()
	let item: LogItem = {
		message: messages.mapFast(function(v) {
			if (!_.isString(v)) v = JSON.stringify(v);
			return strip(v)
		}).join(' ').trim(),
		messages: JSON.stringify(messages.mapFast(v => strip(v))),
		instance: process.$instance,
		rkey, stack, stamp,
	}
	let cmap = {
		[shared.RKEY.LOGS.LOGS]: 'log',
		[shared.RKEY.LOGS.INFOS]: 'info',
		[shared.RKEY.LOGS.WARNS]: 'warn',
		[shared.RKEY.LOGS.ERRORS]: 'error',
		[shared.RKEY.LOGS.PRIMARIES]: 'log',
		[shared.RKEY.LOGS.MASTERS]: 'log',
	}
	if (Object.keys(cmap).indexOf(rkey) != -1) {
		process.$stack = item.stack
		console[cmap[rkey]](...messages)
		process.$stack = null
	}
	let imploded = shared.implode(shared.RMAP.LOGS, item)
	socket.emit(rkey, imploded)
	if (process.DEVELOPMENT) return;
	buffered.push(['zadd', rkey, stamp as any, imploded])
	buffer()
}



const logger = {
	flush: function() {
		if (process.DEVELOPMENT) return Promise.resolve();
		let coms = buffered.splice(0)
		return redis.main.pipelinecoms(coms).then(function(resolved) {
			utils.pipelineErrors(resolved)
			return Promise.resolve()
		}).catch(function(error) {
			console.error('flush > error', utils.peRender(error))
			return Promise.resolve()
		})
	},
	log: function(...messages) { return log(shared.RKEY.LOGS.LOGS, ...messages) },
	info: function(...messages) { return log(shared.RKEY.LOGS.INFOS, ...messages) },
	warn: function(...messages) { return log(shared.RKEY.LOGS.WARNS, ...messages) },
	error: function(...messages) { return log(shared.RKEY.LOGS.ERRORS, ...messages) },
	primary: function(...messages) {
		if (!utils.isPrimary()) return;
		return log(shared.RKEY.LOGS.PRIMARIES, ...messages)
	},
	master: function(...messages) {
		if (!utils.isMaster()) return;
		return log(shared.RKEY.LOGS.MASTERS, ...messages)
	},
} as {
		flush: () => Promise<void>
		log: (...messages) => void
		info: (...messages) => void
		warn: (...messages) => void
		error: (...messages) => void
		primary: (...messages) => void
		master: (...messages) => void
		[rkey: string]: (...messages) => void
	}

Object.keys(shared.RKEY.LOGS).forEachFast(function(key) {
	let rkey = shared.RKEY.LOGS[key]
	logger[rkey] = function(...messages) { return log(rkey, ...messages) }
})
export = logger

const buffer = _.throttle(logger.flush, 5000, { leading: false, trailing: true })



new cron.CronJob({
	/*----------  2:59 AM Weekdays  ----------*/
	cronTime: utils.cronTime('59 02 * * 1-5'),
	start: process.PRODUCTION,
	onTick: function() {
		if (!utils.isMaster()) return;
		let stamp = shared.moment().subtract(1, 'day').valueOf()
		let coms = Object.keys(shared.RKEY.LOGS).mapFast(function(key) {
			return ['zremrangebyscore', shared.RKEY.LOGS[key], '-inf', stamp as any]
		}) as RedisComs
		redis.main.pipelinecoms(coms).then(function(resolved: Array<number>) {
			utils.fixPipelineFast(resolved)
			let count = _.sum(resolved.mapFast(v => Number.parseInt(v as any)))
			logger.warn('recycled', count, '"logger"')
		}).catch(function(error) {
			logger.error('recycleZrange "logger" > error', utils.peRender(error))
		})
	},
	timeZone: 'America/New_York',
})



/*=============================
=            REDIS            =
=============================*/

if (process.PRODUCTION) {
	Object.keys(redis).forEachFast(function(key) {
		const instance = redis[key] as RedisInstance
		if (!instance || !instance.on) return;
		instance.on('error', _.throttle(function(error) {
			logger.error('redis.' + instance.name + ' > error', utils.peRender(error));
		}, 3000, { leading: false, trailing: true }))
	})
}

function saveRedisInstances() {
	if (!utils.isMaster()) return;
	Object.keys(redis).forEachFast(function(key) {
		const instance = redis[key] as RedisInstance
		if (!instance || !instance.save) return;
		if (['pub', 'sub'].indexOf(instance.name) >= 0) return;
		instance.save().then(function(resolved) {
			logger.warn('redis.' + instance.name + '.save', resolved)
		}).catch(function(error) {
			logger.error('redis.' + instance.name + '.save > error', utils.peRender(error))
		})
	})
}

// new cron.CronJob({
// 	// before /etc/crontab reboot
// 	/*----------  1:45 AM Sunday  ----------*/
// 	cronTime: utils.cronTime('45 01 * * 00'),
// 	start: process.PRODUCTION,
// 	onTick: saveRedisInstances,
// 	timeZone: 'America/New_York',
// })

new cron.CronJob({
	/*----------  3:54 AM Weekdays  ----------*/
	cronTime: utils.cronTime('54 03 * * 1-5'),
	start: process.PRODUCTION,
	onTick: saveRedisInstances,
	timeZone: 'America/New_York',
})

new cron.CronJob({
	/*----------  8:15 PM Weekdays  ----------*/
	cronTime: utils.cronTime('15 20 * * 1-5'),
	start: process.PRODUCTION,
	onTick: saveRedisInstances,
	timeZone: 'America/New_York',
})




