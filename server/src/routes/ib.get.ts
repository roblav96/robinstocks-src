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
import http = require('../adapters/http')
import ibgw = require('../adapters/ib.gateway')



export = utils.restifyRoute<GetIbBody, GetIbResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		return ibgw.getIb(req.body)

	}).then(function(response) {
		res.send(response)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})





