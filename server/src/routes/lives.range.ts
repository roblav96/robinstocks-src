//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<GetLivesRangeBody, GetLivesRangeResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		utils.validate(req.body, ['symbol', 'start', 'end'])
		let rkey = req.body.minutes ? shared.RKEY.LIVES_MINUTES : shared.RKEY.LIVES
		let lrkey = rkey + ':' + req.body.symbol
		return redis.lives.zrangebyscore(lrkey, req.body.start, req.body.end)

	}).then(function(lquotes: Array<LiveQuote>) {
		res.send(lquotes)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




