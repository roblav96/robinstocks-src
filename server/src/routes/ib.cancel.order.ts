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



export = utils.restifyRoute<{ orderId: number }, nib.Order>(function(req, res, next) {

	Promise.resolve().then(function() {
		// if (!req.devsecretvalid) throw new errors.InvalidCredentialsError('You can not cancel IB orders.');

		return ibgw.cancelOrder(req.body.orderId)

	}).then(function(order) {
		res.send(order)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})




