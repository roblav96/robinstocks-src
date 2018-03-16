//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import axios from 'axios'
import url = require('url')
import http = require('../adapters/http')



export = utils.restifyRoute<HttpRequestConfig, any>(function(req, res, next) {

	Promise.resolve().then(function() {
		utils.validate(req.body, ['method', 'url'])

		let purl = url.parse(req.body.url)
		if (!_.isString(purl.host)) throw new errors.PreconditionFailedError('Invalid url');

		let host = purl.host.split('.').splice(-2).join('.')
		let validhosts = [
			'robinhood.com',
			'yahoo.com',
			'webull.com',
			'stocks666.com',
		]
		if (validhosts.indexOf(host) == -1) {
			throw new errors.PreconditionFailedError('Invalid url')
		}

		// if (req.body.url.indexOf('localhost') >= 0) throw new errors.PreconditionFailedError('Invalid url');
		// if (req.body.url.indexOf('127.0.0.1') >= 0) throw new errors.PreconditionFailedError('Invalid url');
		// if (req.body.url.indexOf('robinstocks.com') >= 0) throw new errors.PreconditionFailedError('Invalid url');

		return axios.request(req.body).then(function({ data }) {
			res.send(data)
			return next()
		})

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})





