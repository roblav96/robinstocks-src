//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')
import logger = require('./logger')

import ioredis = require('ioredis')



declare global {
	type RedisInstance = Redis
	type RedisComs = Array<Array<string>>
	type RedisResolved = Array<Array<string>>
	interface RedisPublishEvent<T = any> {
		name: string
		data: T
	}
}



class Redis extends ioredis {

	static getOpts(poffset: number, name: string) {
		if (process.DEVELOPMENT && process.$redis.host == 'localhost') poffset = 0;

		let opts = Object.assign({
			db: 0,
			dropBufferSupport: true,
			connectionName: '[' + process.$instance + '][' + name.toUpperCase() + ']' + process.$env,
		} as ioredis.RedisOptions, process.$redis) as ioredis.RedisOptions
		opts.port += poffset

		if (process.PRODUCTION) {
			opts.path = '/var/run/redis_' + opts.port + '.sock'
			_.unset(opts, 'host')
			_.unset(opts, 'port')
		}

		return opts
	}



	constructor(
		private poffset: number,
		public name: string,
	) {
		super(Redis.getOpts(poffset, name))
		this.ping()
		process.ee3_private.addListener(shared.RKEY.SYS.TICK_10, () => this.ping())

		const cleanup = _.once(() => this.disconnect())
		process.on('beforeExit', cleanup)
		process.on('exit', cleanup)

	}



	pipelinecoms(coms: RedisComs): Promise<Array<any>> {
		let tstart = Date.now()
		if (process.DEVELOPMENT && this.name != 'main') {
			coms.forEachFast(v => {
				if (!v[1]) return;
				let namekey = v[1].split(':')[0]
				if (namekey.indexOf(this.name) == -1) console.warn(this.name, 'redis invalid >', v);
			})
		}
		return super.pipeline(coms).exec().then(function(resolved) {
			if (resolved.length > 0) {
				process.ee3_private.emit(shared.METRICS.redis_pipeline_meter.rkey, resolved.length)
				process.ee3_private.emit(shared.METRICS.redis_pipeline_histogram.rkey, Date.now() - tstart)
			}
			return Promise.resolve(resolved)
		})
	}



	rkeyflush(rkey: string, pattern = ':*') {
		if (!utils.isMaster()) return Promise.resolve();

		return this.keys(rkey + pattern).then((keys: Array<string>) => {
			if (process.DEVELOPMENT) {
				console.log('rkeyflush', rkey, keys.length, 'keys >')
				eyes.inspect(keys)
			}
			return this.pipelinecoms(keys.mapFast(v => ['del', v]))

		}).then(resolved => {
			utils.fixPipelineFast(resolved)
			logger.warn(this.name, 'redis rkeyflush', resolved.length, rkey)
			return Promise.resolve()

		}).catch(error => {
			logger.error(this.name, rkey, 'redis rkeyflush > error', utils.peRender(error))
			return Promise.resolve()
		})
	}



	recyclezrange(rkey: string, days: number, pattern = ':*') {
		if (!utils.isMaster()) return Promise.resolve();

		let day = shared.moment().day()
		days = days + _.max([days - day, 0])
		let stamp = shared.moment().subtract(days, 'days').valueOf()

		return this.keys(rkey + pattern).then((keys: Array<string>) => {
			if (process.DEVELOPMENT) {
				console.log('recyclezrange', rkey, keys.length, 'keys >')
				eyes.inspect(keys)
			}
			let coms = keys.mapFast(rkey => ['zremrangebyscore', rkey, '-inf', stamp as any])
			return this.pipelinecoms(coms)

		}).then(resolved => {
			utils.fixPipelineFast(resolved)
			logger.warn(this.name, 'redis recyclezrange', resolved.length, rkey, days, 'days ago')
			return Promise.resolve()

		}).catch(error => {
			logger.error(this.name, rkey, 'redis recyclezrange > error', utils.peRender(error))
			return Promise.resolve()
		})
	}



}



export const main = new Redis(0, 'main')
export const pub = new Redis(0, 'pub')
export const sub = new Redis(0, 'sub')
export const calcs = new Redis(1, 'calcs') // , [shared.RKEY.CALCS])
export const lives = new Redis(2, 'lives') // , [shared.RKEY.LIVES, shared.RKEY.LIVES_TINYS, shared.RKEY.LIVES_TINYS_5M])
export const ib = new Redis(3, 'ib') // , [shared.RKEY.IB.ACCOUNT.split(':')[0]])
export const metrics = new Redis(3, 'metrics') // , [shared.RKEY.MS])




