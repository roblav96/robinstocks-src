//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import pevent = require('p-event')
import pall = require('p-all')
import redis = require('../adapters/redis')
import r = require('../adapters/rethinkdb')
import robinhood = require('../adapters/robinhood')
import storage = require('../adapters/storage')



export = utils.restifyRoute<any, any>(function(req, res, next) {

	let tstart = Date.now()
	console.log('migrate.storage > start')

	Promise.resolve().then(function() {
		if (!req.devsecretvalid) throw new errors.InvalidCredentialsError('You can not start migrations.');

		// 	return robinhood.getAllSymbols()
		// }).then(function(symbols) {
		// 	let chunks = utils.equalChunks(symbols, _.ceil(symbols.length / 128))
		// return pall(chunks.mapFast(v => () => eachCleanCalcQuotes(v)), { concurrency: 1 })

		// 	return redis.main.keys('ewmas:*')
		// }).then(function(keys: Array<string>) {
		// 	console.log('keys.length', keys.length)
		// 	let chunks = utils.equalChunks(keys, _.ceil(keys.length / 1024))
		// 	return pall(chunks.mapFast(v => function() {
		// 		return redis.main.pipelinecoms(v.mapFast(v => ['del', v]))
		// 	}), { concurrency: 1 })

	}).then(function() {
		console.info('migrate.storage > done ' + shared.getDuration(tstart))
		res.send('done')
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})



/*██████████████████████████████████████████
█            EWMAS TO RETHINKDB            █
██████████████████████████████████████████*/

function eachFlushEwmas(symbols: Array<string>): Promise<any> {
	console.log('eachFlushEwmas', symbols.length, JSON.stringify(symbols))

	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_01)

	}).then(function() {
		let coms = [] as RedisComs
		symbols.forEachFast(function(symbol) {
			shared.EWMAS.NAMES.forEachFast(function(name) {
				coms.push(['del', shared.RKEY.EWMAS + ':' + symbol + ':' + name])
				// coms.push(['hgetall', shared.RKEY.EWMAS + ':' + symbol + ':' + name])
			})
		})
		return redis.main.pipelinecoms(coms)

		// }).then(function(resolved) {
		// 	utils.fixPipelineFast(resolved)
		// 	resolved = resolved.mapFast(utils.fromhget)
		// 	let datas = []
		// 	let iii = 0
		// 	symbols.forEachFast(function(symbol, i) {
		// 		shared.EWMAS.NAMES.forEachFast(function(name) {
		// 			let data = resolved[iii]
		// 			data.symbol = symbol
		// 			data.name = name
		// 			datas.push(data)
		// 			iii++
		// 		})
		// 	})
		// 	return r.table('baks').insert(datas, { conflict: 'update' }).run()

	})

}



/*█████████████████████████████████████████
█            NEWS TO RETHINKDB            █
█████████████████████████████████████████*/

function eachNewsToRethinkdb(symbols: Array<string>): Promise<any> {
	console.log('eachNewsToRethinkdb', symbols.length, JSON.stringify(symbols))

	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_01)

		// }).then(function() {
		// 	let coms = symbols.mapFast(function(symbol, i) {
		// 		let rkey = shared.RKEY.NEWS.ZLIST + ':' + symbol
		// 		return ['zrange', rkey, -50, -1]
		// 	}) as RedisComs
		// 	return redis.main.pipelinecoms(coms)

		// }).then(function(resolved) {
		// 	utils.fixPipelineFast(resolved)
		// 	let coms = [] as RedisComs
		// 	symbols.forEachFast(function(symbol, i) {
		// 		let ids = resolved[i] as Array<string>
		// 		ids.forEachFast(function(id) {
		// 			let rkey = shared.RKEY.NEWS.ID + ':' + id
		// 			coms.push(['hgetall', rkey])
		// 		})
		// 	})
		// 	return redis.main.pipelinecoms(coms)

		// }).then(function(nitems: Array<NewsItem>) {
		// 	utils.fixPipelineFast(nitems)
		// 	nitems = nitems.mapFast(v => utils.fromhget(v)) as Array<NewsItem>
		// 	return r.table('news').insert(nitems, { conflict: 'update' }).run()

	})

}



/*█████████████████████████████████████████
█            CLEAN CALC QUOTES            █
█████████████████████████████████████████*/

function eachCleanCalcQuotes(symbols: Array<string>): Promise<any> {
	console.log('eachCleanCalcQuotes', symbols.length)

	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)

	}).then(function() {
		let ccoms = symbols.mapFast(v => ['hkeys', shared.RKEY.CALCS + ':' + v])
		return redis.calcs.pipelinecoms(ccoms)

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)

		let ccoms = symbols.mapFast(function(symbol, i) {
			let hdels = resolved[i] as Array<string>
			hdels = hdels.filter(v => shared.RMAP.CALCS.indexOf(v) == -1)
			return ['hdel', shared.RKEY.CALCS + ':' + symbol].concat(hdels)
		})
		return redis.calcs.pipelinecoms(ccoms.filter(v => v.length > 2))

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)
		return Promise.resolve()
	})

}



/*████████████████████████████████████████████████████████
█            APPLY LIVE QUOTES TO TINY QUOTES            █
████████████████████████████████████████████████████████*/

function eachTinyQuotesMigration(symbols: Array<string>): Promise<any> {
	console.log('eachTinyQuotesMigration', symbols.length)

	return Promise.resolve().then(function() {
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)

	}).then(function() {
		// let lcoms = symbols.mapFast(v => ['zrange', shared.RKEY.LIVES + ':' + v, -utils.backRange as any, -1 as any])
		let lcoms = symbols.mapFast(v => ['zrange', shared.RKEY.LIVES + ':' + v, -3 as any, -1 as any])
		return redis.lives.pipelinecoms(lcoms)

	}).then(function(resolved) {
		utils.fixPipelineFast(resolved)

		symbols.forEachFast(function(symbol, i) {
			let tquotes = utils.fromhget(resolved[i]) as Array<TinyQuote>
			tquotes = tquotes.mapFast(v => shared.explode(shared.RMAP.LIVES, v))
			console.log('tquotes >')
			eyes.inspect(tquotes)
		})

	})

}


