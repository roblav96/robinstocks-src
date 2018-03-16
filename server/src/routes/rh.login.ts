//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import security = require('../adapters/security')
import robinhood = require('../adapters/robinhood')



export = utils.restifyRoute<RhLoginBody, RhLoginResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		utils.validate(req.body, ['uname', 'pass'])
		return robinhood.login(req.body.uname, req.body.pass, req.body.mfa)

	}).then(function(response) {
		if (response.mfa_required == true) {
			return Promise.resolve({ mfa: true } as RhLoginResponse)
		}

		if (response.access_token && response.refresh_token) {
			return robinhood.checkToken(req.body.uname, response.access_token).then(function() {
				return security.login(req.body.uname, req.uuid, req.ip, req.conhash, response.access_token, response.refresh_token, response.expires_in)
			})
		}

		throw new errors.ServiceUnavailableError('No response from Robinhood.')

	}).then(function(results) {
		res.send(results)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})

