//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import Shared = require('../shared')
import Utils = require('../adapters/utils')



export const Route = Utils.restifyRoute<void, void>(function(req, res, next) {

	Promise.resolve().then(function() {
		// res.send(Utils.getIp(req))
		res.send()
		return next()

	}).catch(function(error) {
		return next(Utils.generateError(error))
	})

})



