//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<{ symbols: Array<string> }, Array<SmallQuote>>(function(req, res, next) {

	Promise.resolve().then(function() {
		utils.validate(req.body, ['symbols'])

		let coms = req.body.symbols.mapFast(v => ['hmget', shared.RKEY.CALCS + ':' + v].concat(shared.RMAP.SMALLS)) as RedisComs
		return redis.calcs.pipelinecoms(coms)

	}).then(function(quotes) {
		utils.fixPipelineFast(quotes)
		res.send(quotes.mapFast(v => utils.fromhmget(v, shared.RMAP.SMALLS)))
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




