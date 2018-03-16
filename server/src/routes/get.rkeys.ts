//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<GetRkeyBody, GetRkeyResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		utils.validate(req.body, ['rkey'])

		let coms = [] as RedisComs
		let rkey = req.body.rkey
		if (Array.isArray(req.body.symbols)) {
			req.body.symbols.forEachFast(v => coms.push(['hgetall', rkey + ':' + v]))
		} else {
			coms.push(['hgetall', rkey])
		}
		return redis.main.pipelinecoms(coms)

	}).then(function(items: Array<any>) {
		utils.fixPipelineFast(items)
		items = items.mapFast(v => utils.fromhget(v))
		res.send(items)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




