//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import nib = require('ib')
import redis = require('../adapters/redis')
import ibgw = require('../adapters/ib.gateway')



export = utils.restifyRoute<nib.Order, nib.Order>(function(req, res, next) {

	let order = req.body

	Promise.resolve().then(function() {
		// if (!req.devsecretvalid) throw new errors.InvalidCredentialsError('You can not submit or modify IB orders.');

		if (order.orderType.toLowerCase().indexOf('market') >= 0) _.unset(order, 'outsideRth');

		order.action = shared.IB_ACTIONS[order.action]
		order.orderType = shared.IB_ORDER_TYPES[order.orderType]
		order.tif = shared.IB_TIME_IN_FORCES[order.tif]

		// if (order.orderType == 'limit') {
		// 	order.lmtPrice = order.lmtPrice
		// } else if (order.orderType == 'stop') {
		// 	order.auxPrice = order.auxPrice
		// } else if (order.orderType == 'stopLimit') {
		// 	order.auxPrice = order.auxPrice
		// 	order.lmtPrice = order.lmtPrice
		// }

		return ibgw.submitOrder(order)

	}).then(function(order) {
		res.send(order)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




