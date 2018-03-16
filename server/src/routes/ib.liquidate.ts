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
import robinhood = require('../adapters/robinhood')
import ibgw = require('../adapters/ib.gateway')



export = utils.restifyRoute(function(req, res, next) {

	Promise.resolve().then(function() {
		if (!req.devsecretvalid) throw new errors.InvalidCredentialsError('You can not liquidate IB assets.');

		return redis.calcs.smembers(shared.RKEY.CALCS_TRADING)

	}).then(function(symbols: Array<string>) {
		let proms = symbols.mapFast(v => storage.remoteCalcUpdate({ symbol: v, liveTrading: false }))
		return Promise.all(proms)

	}).then(function() {
		return r.table('ib_orders').getAll(true, { index: 'active' }).run()

	}).then(function(iborders: Array<nib.Order>) {
		return Promise.all(iborders.mapFast(v => ibgw.cancelOrder(v.orderId)))

	}).then(function() {
		return r.table('ib_positions').filter(r.row('position').gt(0)).run()

	}).then(function(ibpositions: Array<nib.Position>) {
		if (shared.marketState() == 'REGULAR') {
			return Promise.all(ibpositions.mapFast(function(ibposition) {
				return ibgw.submitOrder({
					symbol: ibposition.symbol,
					action: shared.IB_ACTIONS['sell'],
					orderType: shared.IB_ORDER_TYPES['market'],
					totalQuantity: ibposition.position,
					tif: shared.IB_TIME_IN_FORCES['goodUntilCancelled'],
				} as nib.Order)
			})) as any
		}

		let coms = ibpositions.mapFast(v => ['hget', shared.RKEY.CALCS + ':' + v.symbol, 'bidSpread'])
		return redis.calcs.pipelinecoms(coms).then(function(resolved: Array<number>) {
			utils.fixPipelineFast(resolved)
			return Promise.all(ibpositions.mapFast(function(ibposition, i) {
				return ibgw.submitOrder({
					symbol: ibposition.symbol,
					action: shared.IB_ACTIONS['sell'],
					orderType: shared.IB_ORDER_TYPES['limit'],
					totalQuantity: ibposition.position,
					tif: shared.IB_TIME_IN_FORCES['goodUntilCancelled'],
					lmtPrice: shared.safeParse(resolved[i]),
					outsideRth: true,
				} as nib.Order)
			}))
		})

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





