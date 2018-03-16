//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import utils = require('../adapters/utils')
import shared = require('../shared')
import logger = require('../adapters/logger')

import cron = require('cron')
import cparser = require('cron-parser')
import moment = require('moment')
import pdelay = require('delay')
import pevent = require('p-event')
import pforever = require('p-forever')
import redis = require('../adapters/redis')
import http = require('../adapters/http')



// YAHOO
// PREPRE starts at 4:00am
// PRE starts at 9:00am
// POST ends at 6:00pm
// POSTPOST ends at 8:00pm



new cron.CronJob({
	/*----------  Hourly  ----------*/
	cronTime: utils.cronTime('00 * * * *'),
	start: utils.isMaster(),
	onTick: function() {
		if (!utils.isMaster()) return;
		getMarketHours().then(function(hours) {
			process.ee3_public.emit('$marketStamps', hours.mapFast(v => shared.buildMarketStamps(v)))
		})
	},
	timeZone: 'America/New_York',
	runOnInit: true,
})

process.ee3_public.addListener('$marketStamps', function(stamps: Array<MarketStamps>) {
	process.$marketStamps = stamps[0]
	process.$prevMarketStamps = stamps[1]
	process.$nextMarketStamps = stamps[2]
})

cachedMarketHours().then(function(hours) {
	process.$marketStamps = shared.buildMarketStamps(hours[0])
	process.$prevMarketStamps = shared.buildMarketStamps(hours[1])
	process.$nextMarketStamps = shared.buildMarketStamps(hours[2])
})



function getMarketHours(tries = 0): Promise<Array<RobinhoodMarketHours>> {
	if (tries >= 3) return cachedMarketHours();

	let today = shared.moment().format('YYYY-MM-DD')
	let url = 'https://api.robinhood.com/markets/XNYS/hours/' + today + '/'
	return http.get(url, null, { silent: true, timeout: 3000 }).then(function(hours: RobinhoodMarketHours) {
		shared.fixResponse(hours)

		return Promise.all([
			http.get(hours.previous_open_hours, null, { silent: true, timeout: 3000 }),
			http.get(hours.next_open_hours, null, { silent: true, timeout: 3000 }),
		]).then(function(resolved) {
			resolved.forEachFast(v => shared.fixResponse(v))
			let prevhours = resolved[0] as RobinhoodMarketHours
			let nexthours = resolved[1] as RobinhoodMarketHours

			return redis.main.pipelinecoms([
				['hmset', shared.RKEY.RH.HOURS, utils.tohset(hours)],
				['hmset', shared.RKEY.RH.PREV_HOURS, utils.tohset(prevhours)],
				['hmset', shared.RKEY.RH.NEXT_HOURS, utils.tohset(nexthours)],
			]).then(function(resolved) {
				utils.pipelineErrors(resolved)
				return Promise.resolve([hours, prevhours, nexthours])
			})
		})

	}).catch(function(error) {
		if (process.PRODUCTION) logger.error('getMarketHours > error', utils.peRender(error));
		tries++
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1).then(() => getMarketHours(tries))
	})
}



function cachedMarketHours(): Promise<Array<RobinhoodMarketHours>> {
	return redis.main.pipelinecoms([
		['hgetall', shared.RKEY.RH.HOURS],
		['hgetall', shared.RKEY.RH.PREV_HOURS],
		['hgetall', shared.RKEY.RH.NEXT_HOURS],
	]).then(function(resolved) {
		utils.fixPipelineFast(resolved)
		if (!resolved[0]) return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1).then(cachedMarketHours);
		return Promise.resolve(resolved.mapFast(v => utils.fromhget(v)))
	}).catch(function(error) {
		logger.error('cachedMarketHours > error', utils.peRender(error))
		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1).then(cachedMarketHours)
	})
}




