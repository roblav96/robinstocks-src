//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<{ lrkey: string }, Array<MetricData>>(function(req, res, next) {

	Promise.resolve().then(function() {
		let lrkey = req.body.lrkey
		return redis.metrics.zrange(lrkey, 0, -1).then(function(data: Array<MetricData>) {
			data = data.mapFast(v => shared.safeParse(v))
			res.send(data)
			return next()

		})

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




