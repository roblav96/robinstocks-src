//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<GetLogsBody, GetLogsResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		let rkeys = Object.keys(shared.RKEY.LOGS).mapFast(key => shared.RKEY.LOGS[key]) as Array<string>
		if (Array.isArray(req.body.rkeys)) rkeys = req.body.rkeys;
		// let coms = rkeys.mapFast(rkey => ['zrange', rkey, -100, -1]) as RedisComs
		let coms = rkeys.mapFast(rkey => ['zrange', rkey, 0, -1]) as RedisComs
		return redis.main.pipelinecoms(coms)

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)
		res.send(resolved)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




