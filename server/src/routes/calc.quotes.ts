//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<{ symbols: Array<string> }, Array<CalcQuote>>(function(req, res, next) {

	Promise.resolve().then(function() {
		utils.validate(req.body, ['symbols'])

		let ccoms = req.body.symbols.mapFast(v => ['hgetall', shared.RKEY.CALCS + ':' + v]) as RedisComs
		return redis.calcs.pipelinecoms(ccoms)

	}).then(function(cquotes: Array<CalcQuote>) {
		utils.fixPipelineFast(cquotes)
		res.send(cquotes.mapFast(v => shared.implodeFast(shared.RMAP.CALCS, utils.fromhget(v)) as any))
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




