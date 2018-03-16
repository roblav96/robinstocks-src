//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')



export = utils.restifyRoute<{ symbols: Array<string> }, Array<any>>(function(req, res, next) {

	Promise.resolve().then(function() {
		utils.validate(req.body, ['symbols'])

		// let days = 0
		// let day = shared.moment().day()
		// if (day == 6) days = 1;
		// if (day == 0) days = 2;

		// let start = shared.moment().startOf('day').subtract(days, 'days').add(4, 'hours').valueOf()
		// let end = shared.moment(start).add(16, 'hours').valueOf()

		let end = shared.now()
		let start = process.$marketStamps.is_open && end >= process.$marketStamps.am4 ? process.$marketStamps.am4 : process.$prevMarketStamps.am4

		let livecoms = req.body.symbols.mapFast(v => ['zrangebyscore', shared.RKEY.LIVES_TINYS_5M + ':' + v, start, end]) as RedisComs
		return redis.lives.pipelinecoms(livecoms)

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)
		// resolved.forEachFast(function(v, i) {
		// 	console.log(req.body.symbols[i], 'v.length', v.length)
		// })
		res.send(resolved)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




