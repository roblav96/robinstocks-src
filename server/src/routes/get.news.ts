//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import redis = require('../adapters/redis')
import r = require('../adapters/rethinkdb')
import robinhood = require('../adapters/robinhood')
import news = require('../watchers/news')



export = utils.restifyRoute<RangesBody, Array<NewsItem>>(function(req, res, next) {

	const symbols = req.body.symbols
	const count = req.body.count || 100

	Promise.resolve().then(function() {
		utils.validate(req.body, ['symbols'])

		if (process.PRODUCTION) news.forceSyncSymbols(symbols);

		return (r.table('news').getAll(r.args(symbols), { index: 'symbol' }).orderBy(r.desc('published')).limit(count) as any).run()

	}).then(function(resolved: Array<NewsItem>) {
		res.send(resolved)
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




