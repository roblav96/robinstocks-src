//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import axios from 'axios'
import cron = require('cron')
import url = require('url')
import logger = require('../adapters/logger')
import redis = require('../adapters/redis')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')



export = utils.restifyRoute(function(req, res, next) {

	const LOGO = 'https://logo.clearbit.com/' + _.sample([
		'www.otcmarkets.com',
		'www.nyse.com',
		'www.nasdaq.com',
		'www.batstrading.com',
	])

	let item = {} as LogoItem

	Promise.resolve().then(function() {
		if (!_.has(req, 'params.symbol') || !_.isString(req.params.symbol)) return Promise.reject(null);
		item.symbol = req.params.symbol.toUpperCase()
		return redis.main.hgetall(shared.RKEY.LOGOS + ':' + item.symbol)

	}).then(function(resolved: LogoItem) {
		Object.assign(item, utils.fromhget(resolved))
		if (item.logo) return Promise.resolve();

		let iexurl = 'https://api.iextrading.com/1.0/stock/' + item.symbol.toLowerCase() + '/company'
		return http.get(iexurl, null, { silent: true, timeout: 3000 }).then(function(response: IexCompany) {
			if (!response.website) return Promise.reject(null);

			let parsed = url.parse(response.website) || {}
			if (!_.isString(parsed.host)) return Promise.reject(null);

			item.website = parsed.host
			item.logo = 'https://logo.clearbit.com/' + parsed.host
			return axios.get(item.logo, { timeout: 3000 })

		}).catch(function(error) {
			if (utils.isTimeoutError(error)) return Promise.reject(null);
			item.logo = LOGO
			return Promise.resolve()

		}).then(function() {
			return redis.main.hmset(shared.RKEY.LOGOS + ':' + item.symbol, utils.tohset(item))
		})

	}).catch(function(error) {
		if (error) logger.error('GET logo > error', utils.peRender(error));
		item.logo = LOGO
		return Promise.resolve()

	}).then(function() {
		return res.redirect(item.logo, next)
	})

})





// new cron.CronJob({
// 	/*----------  Monthly  ----------*/
// 	cronTime: utils.cronTime('00 00 01 * *'),
// 	start: process.PRODUCTION && utils.isMaster(),
// 	onTick: function() {
// 		robinhood.getAllSymbols().then(function(symbols) {
// 			let coms = symbols.map(v => ['hdel', shared.RKEY.RH.INSTRUMENTS + ':' + v, 'logo', 'website'])
// 			return redis.pipelinecoms(coms).then(function(resolved: Array<any>) {
// 				console.warn('flushed', 'logo', 'count', resolved.length)
// 			})
// 		}).catch(function(error) {
// 			console.error('logo flush > error', error)
// 		})
// 	},
// 	timeZone: 'America/New_York',
// 	// runOnInit: process.DEVELOPMENT,
// })


