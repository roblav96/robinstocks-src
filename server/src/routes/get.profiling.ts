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



export = utils.restifyRoute<void, any>(function(req, res, next) {

	Promise.resolve().then(function() {
		return redis.main.hgetall(shared.RKEY.PROFILING + ':PRODUCTION')

	}).then(function(resolved: any) {
		resolved = utils.fromhget(resolved)

		let dict = {} as { [id: string]: ProfilingItem }
		Object.keys(resolved).forEachFast(function(k) {
			let sp = k.split(':')
			let id = sp[0]
			let type = sp[1]
			if (_.isEmpty(dict[id])) dict[id] = {} as any;
			let item = _.isPlainObject(resolved[k]) ? resolved[k] : { [type]: resolved[k] }
			Object.assign(dict[id], item)
		})

		let items = Object.keys(dict).mapFast(k => dict[k]) as Array<ProfilingItem>
		items.forEachFast(function(item) {
			if (_.isEmpty(item.name)) item.name = 'N/A';
			if (!Number.isFinite(item.count)) item.count = 0;
			if (!Number.isFinite(item.calls)) item.calls = 0;
		})

		res.send(items)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




