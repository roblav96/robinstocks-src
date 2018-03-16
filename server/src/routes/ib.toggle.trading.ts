//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import nib = require('ib')
import r = require('../adapters/rethinkdb')
import redis = require('../adapters/redis')
import socket = require('../adapters/socket')
import storage = require('../adapters/storage')



export = utils.restifyRoute<{ symbol: string }>(function(req, res, next) {

	let symbol = req.body.symbol

	Promise.resolve().then(function() {
		// if (!req.devsecretvalid) throw new errors.InvalidCredentialsError('You can not toggle automated trading symbols.');
		utils.validate(req.body, ['symbol'])

		return redis.calcs.hget(shared.RKEY.CALCS + ':' + symbol, 'liveTrading')

	}).then(function(livetrading: boolean) {
		let cquote = { symbol, liveTrading: !shared.safeParse(livetrading) } as CalcQuote
		return storage.remoteCalcUpdate(cquote)

	}).then(function() {
		res.send()
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})



// function onReady() {
// 	if (utils.isMaster()) return;
// 	if (process.DEVELOPMENT) return;

// 	process.ee3_public.addListener(shared.RKEY.IB.TOGGLE_TRADING, function(symbol: string) {
// 		console.log('symbol', symbol)
// 		let cquote = storage.calcquotes[symbol]
// 		if (!cquote) return;
// 		console.warn(process.$instance, 'cquote >')
// 		cquote.liveTrading = !cquote.liveTrading
// 		redis.calcs.hset(shared.RKEY.CALCS + ':' + symbol, 'liveTrading', JSON.stringify(cquote.liveTrading))
// 		storage.calcsymbols[symbol]++
// 	})

// }
// process.ee3_private.once(shared.RKEY.SYS.READY, onReady)





