//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')
import robinhood = require('../adapters/robinhood')



export = utils.restifyRoute<{ justinfo: boolean }, GetRedisResponse>(function(req, res, next) {

	let justinfo = req.body && req.body.justinfo

	Promise.resolve().then(function() {
		let coms = [
			['info', 'all'],
			['send_command', 'memory', 'stats'],
			['send_command', 'latency', 'doctor'],
			['send_command', 'memory', 'doctor'],
			['send_command', 'latency', 'latest'],
			['send_command', 'slowlog', 'get', '128'],
		] as RedisComs
		if (justinfo) coms.splice(2);
		return redis.main.pipelinecoms(coms)

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)

		let info = shared.parseRedisInfo(resolved[0])
		info = _.omit(info, ['tcp_port', 'arch_bits', 'run_id', 'role', 'redis_version', 'redis_mode', 'redis_git_sha1', 'redis_git_dirty', 'redis_build_id', 'process_id', 'os', 'multiplexing_api', 'mem_allocator', 'master_replid', 'gcc_version', 'executable', 'config_file', 'atomicvar_api'])
		let hit_rate = info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses)
		info.hit_rate_percent = _.round(hit_rate * 100)

		let memstats = resolved[1] as Array<any>
		memstats.forEachFast(function(v, i) {
			if (i % 2 == 1) return;
			let value = memstats[i + 1] as Array<any>
			if (!Array.isArray(value)) return info[_.snakeCase(memstats[i])] = value;
			value.forEachFast(function(vv, ii) {
				if (ii % 2 == 1) return;
				info[_.snakeCase(value[ii])] = value[ii + 1]
			})
		})
		shared.fixResponse(info)

		Object.keys(info).forEachFast(function(key) {
			let value = info[key]
			if (_.isString(value) && value.indexOf('=') >= 0 && value.indexOf(',') >= 0) {
				value.split(',').forEachFast(function(str) {
					let sp = str.split('=')
					info[key + '_' + sp[0]] = shared.safeParse(sp[1])
				})
				_.unset(info, key)
			}
		})

		if (justinfo) {
			res.send({ info } as GetRedisResponse)
			return next()
		}

		let latdoctor = resolved[2] as string
		latdoctor = latdoctor.replace(/[\n]/g, ' ')

		let memdoctor = resolved[3] as string
		memdoctor = memdoctor.replace(/[\n]/g, ' ')

		let latency = resolved[4] as Array<Array<any>>

		let slowlog = resolved[5] as Array<Array<any>>

		res.send({ info, latdoctor, memdoctor, latency, slowlog })
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




