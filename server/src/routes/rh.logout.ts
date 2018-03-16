//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import security = require('../adapters/security')



export = utils.restifyRoute<void, void>(function(req, res, next) {

	Promise.resolve().then(function() {
		return security.logout(req.xid)

	}).then(function() {
		res.send()
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})



