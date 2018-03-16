//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<GetMinutesRangeBody, GetMinutesRangeResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		utils.validate(req.body, ['symbol', 'start', 'end'])
		let rkey = shared.RKEY.LIVES_MINUTES + ':' + req.body.symbol
		return redis.lives.zrangebyscore(rkey, req.body.start, req.body.end)

	}).then(function(mquotes: Array<LiveQuote>) {
		res.send(mquotes)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




