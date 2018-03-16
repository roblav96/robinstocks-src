//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import ss = require('simple-statistics')
import redis = require('../adapters/redis')
import robinhood = require('../adapters/robinhood')



export = utils.restifyRoute<ScreenerBody, Array<CalcQuote>>(function(req, res, next) {

	// if (process.DEVELOPMENT) console.time('sorted');
	const sortBy = req.body.sortBy
	const descending = !!req.body.descending
	const count = _.ceil(req.body.count || 25)
	const ckeys = _.uniq(['count', 'junk', sortBy])

	Promise.resolve().then(function() {
		utils.validate(req.body, ['sortBy', 'descending'])
		return robinhood.getAllSymbols()

	}).then(function(symbols) {
		let ccoms = symbols.mapFast(v => ['hmget', shared.RKEY.CALCS + ':' + v].concat(ckeys))
		return redis.calcs.pipelinecoms(ccoms).then(function(cquotes: Array<CalcQuote>) {
			utils.fixPipelineFast(cquotes)

			cquotes = symbols.mapFast(function(symbol, i) {
				let cquote = utils.fromhmget(cquotes[i] as any, ckeys) as CalcQuote
				cquote.symbol = symbol
				return cquote
			})

			let counts = cquotes.filterFast(v => v.count > 0).mapFast(v => v.count)
			if (counts.length == 0) return Promise.resolve([]);

			let avgcount = _.max([_.ceil(ss.harmonicMean(counts)), 5])
			cquotes.removeFast(v => !!v.junk || v.count < avgcount)

			cquotes = _.orderBy(cquotes, [sortBy], [descending ? 'desc' : 'asc'])
			cquotes.splice(count)

			return redis.calcs.pipelinecoms(cquotes.mapFast(v => ['hgetall', shared.RKEY.CALCS + ':' + v.symbol]))

		})

	}).then(function(cquotes: Array<CalcQuote>) {
		utils.fixPipelineFast(cquotes)

		res.send(cquotes.mapFast(utils.fromhget))
		// if (process.DEVELOPMENT) console.timeEnd('sorted');
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




