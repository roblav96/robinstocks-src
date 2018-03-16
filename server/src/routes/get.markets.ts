//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import r = require('../adapters/rethinkdb')
import redis = require('../adapters/redis')
import robinhood = require('../adapters/robinhood')



export = utils.restifyRoute<void, Array<MarketCalcQuote>>(function(req, res, next) {

	Promise.resolve().then(function() {
		let coms = shared.MARKETS_SYMBOLS.mapFast(v => ['hgetall', shared.RKEY.MARKET.CALCS + ':' + v])
		return redis.main.pipelinecoms(coms)

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)

		res.send(shared.MARKETS_SYMBOLS.mapFast(function(symbol, i) {
			return utils.fromhget(resolved[i]) as MarketCalcQuote
		}))
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})





// export const Route = Utils.restifyRoute<GetNewsBody, GetNewsResponse>(function(req, res, next) {

// 	Promise.resolve().then(function() {
// 		Utils.validate(req.body, ['symbol'])
// 		let rkey = Shared.RKEY.NEWS.ZLIST + ':' + req.body.symbol
// 		return redis.zrange(rkey, -50, -1)

// 	}).then(function(ids: Array<string>) {
// 		let coms = ids.map(id => ['hgetall', Shared.RKEY.NEWS.HASH + ':' + id])
// 		coms.push(['zrange', Shared.RKEY.DIAG.NEWS_TOPS + ':' + req.body.symbol, -250 as any, -1 as any])
// 		return redis.pipelinecoms(coms)

// 	}).then(function(nitems: Array<NewsItem>) {
// 		Utils.fixPipeline(nitems)

// 		let diags = <any>nitems.pop() as Array<TopNewsQuote>
// 		diags.sort((a, b) => b.stamp - a.stamp)

// 		nitems.forEach(v => {
// 			Shared.fix(v)
// 			if (v.tags) v.tags = JSON.parse(v.tags as any);
// 		})

// 		res.send({ nitems, diags })
// 		return next()

// 	}).catch(function(error) {
// 		return next(Utils.generateError(error))
// 	})

// })




