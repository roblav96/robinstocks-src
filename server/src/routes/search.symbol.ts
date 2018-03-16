//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import Shared = require('../shared')
import Utils = require('../adapters/utils')

import Fuzzy = require('fuzzy')
import redis = require('../adapters/redis')
import Robinhood = require('../adapters/robinhood')



interface SbarRobinhoodInstrument extends RobinhoodInstrument {
	score: number
}

export const Route = Utils.restifyRoute<PostSearchSymbolRequest, PostSearchSymbolResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		Utils.validate(req.body, ['query'])
		return redis.main.keys(Shared.RKEY.RH.INSTRUMENTS + ':*')

	}).then(function(keys: Array<string>) {
		let coms = [] as RedisComs
		keys.forEach(v => coms.push(['hmget', v, 'symbol', 'name']))
		return redis.main.pipelinecoms(coms)

	}).then(function(instruments: Array<SbarRobinhoodInstrument>) {
		Utils.fixPipelineFast(instruments)
		instruments = <any>instruments.map(function(v) {
			return { symbol: v[0], name: v[1], }
		})

		let all = instruments.map(function(instrument) {
			let symbol = Shared.string_clean(instrument.symbol)
			let name = Shared.string_clean(instrument.name)
			let split = name.split(' ')
			split.splice(3)
			name = split.join(' ')
			return (symbol + ' ' + name).toLowerCase()
		})
		let query = req.body.query
		let results = [] as Array<SymbolSbarItem>
		let fuzzy = Fuzzy.filter(query, all)
		fuzzy.forEach((result, i) => {
			if (result.string.indexOf(query.toLowerCase()) == 0) {
				result.score = result.score * 128
			}
			if (result.string.indexOf(query.toLowerCase() + ' ') == 0) {
				result.score = result.score * 64
			}
			let split = result.string.split(' ')
			if (split[0].indexOf(query) != -1) {
				result.score = result.score * 32
			}
			if (split.indexOf(query) != -1) {
				result.score = result.score * 16
			}
			if (result.string.indexOf(query) != -1) {
				result.score = result.score * 8
			}
			let instrument = instruments[result.index]
			instrument.score = result.score
			results.push(<any>instrument)
		})
		results.sort((a, b) => b.score - a.score)
		results.forEach(v => delete v.score)
		results.splice(25)

		// 	let coms = [] as RedisComs
		// 	results.forEach(function(v) {
		// 		coms.push(['hmget', Robinhood.RKEY.QUOTES_LATEST + ':' + v.symbol,
		// 			'last_trade_price', 'last_extended_hours_trade_price', 'updated_at'
		// 		])
		// 	})
		// 	return redis.pipelinecoms(coms)

		// }).then(function(quotes: Array<RobinhoodQuote>) {
		// 	Utils.fixPipeline(quotes)
		// 	results.forEach(function(v, i) {
		// 		let ext = quotes[i][1]
		// 		v.last_trade_price = (ext) ? ext : quotes[i][0]
		// 		v.updated_at = quotes[i][2]
		// 	})
		// 	Utils.array_remove(results, v => !v.updated_at)

		res.send({ query, results })
		return next()

	}).catch(function(error) {
		return next(Utils.generateError(error))
	})

})

