//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<GetMetricsBody, GetMetricsResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		let rkeys = Object.keys(shared.METRICS)
		if (req.body && Array.isArray(req.body.rkeys)) rkeys = req.body.rkeys;

		let coms = rkeys.mapFast(rkey => ['hgetall', rkey]) as RedisComs
		// coms.push(['get', shared.RKEY.NEWS.GBLOCKED + ':PRODUCTION'])
		return redis.metrics.pipelinecoms(coms).then(function(resolved: Array<MetricIdatas>) {
			utils.fixPipelineFast(resolved)

			// let gblocked = !!shared.safeParse(resolved.pop())

			let items = resolved.mapFast(function(idatas, i) {
				let key = rkeys[i].split(':').pop()
				return Object.assign({}, { idatas }, shared.METRICS[key]) as MetricItem
			})

			res.send({ items })
			return next()

		})

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




