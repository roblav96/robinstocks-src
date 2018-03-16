//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import utils = require('./utils')
import shared = require('../shared')
import logger = require('./logger')

import cron = require('cron')
import nib = require('ib')
import uws = require('uws')
import rx = require('rxjs/Rx')
import pdelay = require('delay')
import pevent = require('p-event')
import pqueue = require('p-queue')
import pall = require('p-all')
import ptimeout = require('p-timeout')
import redis = require('./redis')
import r = require('./rethinkdb')
import socket = require('./socket')
import storage = require('./storage')
import ibgw = require('./ib.gateway')





export function orderAction(cquote: CalcQuote): Promise<any> {
	if (shared.marketState() == 'CLOSED') return Promise.resolve();
	// 	return Promise.resolve()
	// }

	return Promise.resolve().then(function() {
		return Promise.all([
			r.table('ib_positions').get(cquote.symbol).run(),
			r.table('ib_orders').getAll([cquote.symbol, true], { index: 'symbol-active' }).run(),
		])

	}).then(function(resolveds) {

		let ibposition = resolveds[0] as nib.Position
		let position = ibposition && Number.isFinite(ibposition.position) ? ibposition.position : 0
		if (position != cquote.position) {
			logger.error('orderAction > cquote.position != position', JSON.stringify(ibposition), JSON.stringify(_.pick(cquote, ['avgCost', 'position'])))
		}

		let iborders = _.orderBy(resolveds[1], ['orderId'], ['desc']) as Array<nib.Order>

		let proms = []

		let exists = iborders.shift()
		if (iborders.length > 0) iborders.forEachFast(v => proms.push(ibgw.cancelOrder(v.orderId)));



		let action = cquote.action
		if (!action || cquote.prevAction != action) return Promise.all(proms);
		// if (!action) return Promise.all(proms);
		// console.warn('ib orderAction', symbol, action)



		let order = {
			symbol: cquote.symbol,
			orderType: shared.IB_ORDER_TYPES['limit'],
			tif: shared.IB_TIME_IN_FORCES['goodUntilCancelled'],
			outsideRth: true,
		} as nib.Order



		if (exists && Number.isFinite(exists.orderId)) {
			if (exists.action != shared.IB_ACTIONS[action] || exists.orderType != order.orderType) {
				proms.push(ibgw.cancelOrder(exists.orderId))
				exists = null
			} else {
				Object.assign(order, exists)
				// if (action == 'sell') {
				// 	order.totalQuantity = cquote.position
				// }
			}
		}



		let limit = ibgw.fixPrice(cquote.lastPrice)
		// if (action == 'buy') limit = _.round(cquote.bidPrice, 4);
		// if (action == 'sell') limit = _.round(cquote.askPrice, 4);



		let submit = false

		if (!Number.isFinite(order.lmtPrice)) {
			order.lmtPrice = limit
		} else {
			if (order.lmtPrice != limit) {
				order.lmtPrice = limit
				submit = true
			}
		}

		if (!Number.isFinite(order.totalQuantity)) {

			if (action == 'buy') {
				let net = cquote.position * cquote.avgCost
				let maxnet = 10000
				if (net < maxnet * 0.95) {
					order.totalQuantity = _.floor((maxnet - net) / order.lmtPrice)
					submit = true
				}
			}

			if (action == 'sell' && cquote.position > 0) {
				order.totalQuantity = cquote.position
				submit = true
			}

		}



		if (submit) {
			// if (!exists) order.action = shared.IB_ACTIONS[action];
			order.action = shared.IB_ACTIONS[action]

			// if (action == 'sell' && order.totalQuantity <= 0) {
			if (order.totalQuantity <= 0) {
				if (exists && Number.isFinite(exists.orderId)) {
					proms.push(ibgw.cancelOrder(exists.orderId))
					exists = null
				}

			} else {
				order = _.pick(order, ['symbol', 'orderId', 'action', 'totalQuantity', 'orderType', 'auxPrice', 'lmtPrice', 'tif', 'outsideRth']) as any
				// console.log('ib orderAction order >'); eyes.inspect(order);
				proms.push(ibgw.submitOrder(order))

			}
		}

		return Promise.all(proms)

	}).catch(function(error) {
		if (error) logger.error('ib orderAction > error', utils.peRender(error));
		return Promise.resolve()
	})

}

























