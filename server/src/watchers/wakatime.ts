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
import r = require('../adapters/rethinkdb')
import http = require('../adapters/http')



const cookie = '__stripe_mid=3cde3991-8528-4fc2-a2be-233f301e396d; csrftoken=61f7525919ac4e889f6f249d3f5630fc9e9dbfbc; remember_token=0992a7df-d55f-43ed-934a-cf77c2ffb178|422508f4187572594967ea114088585fabf0d013265401d36dce5bf7356c1c893536809311c304e81af7632068db0c5044dcbdcf4d8c84f9606d7a3afda7ab7a; session=.eJwlj1luwzAMBe-i7xigFlKiL2NIXNqgaQLI9leQu9dADzBv3rzD5tP277Ae87Rb2O4a1tA1JRyNADISZug1DkQEAB4DSkfu1ZN0cR051iykFrVoG7WDQKLItfZaWhzRWFSgWc99CEGDSimqcCeii8_R7VJQIUhoBYlTLuEWZJ9-vH7sed2h6BUTcuQuxVpjJ0-FNTtSBhc21uFDLuw171_bNLc5bYb1eT4et3DuNv_DgDn1qr4ooi8lmy6cS1_Ea5XkPmJt18p5_G7765xie1jfn88fGSJV3A.DRP6xA._nbj0KJRWaYuGXPSYYOkHXb4rLM'

new cron.CronJob({
	/*----------  Hourly  ----------*/
	cronTime: utils.cronTime('01 * * * *'),
	start: utils.isMaster(),
	onTick: syncWakatime,
	timeZone: 'America/New_York',
	// runOnInit: process.DEVELOPMENT,
})

function syncWakatime() {
	if (!utils.isMaster()) return;
	// if (process.PRODUCTION) return;
	if (process.DEVELOPMENT) return;

	Promise.resolve().then(function() {
		let stamp = shared.moment().subtract(2, 'minutes').valueOf()
		let date = shared.moment(stamp).format('YYYY-MM-DD')
		let config = { headers: { cookie } } as HttpRequestConfig

		return Promise.all([
			http.get('https://wakatime.com/api/v1/users/current/summaries', {
				start: date, end: date, cache: false,
			}, config),
			http.get('https://wakatime.com/api/v1/users/current/durations', {
				date, cache: false,
			}, config),

		]).then(function(resolved) {
			let item = { date, stamp: shared.now(), summary: resolved[0], duration: resolved[1] }
			if (!item.summary) throw new errors.PreconditionFailedError('!item.summary');
			if (!item.duration) throw new errors.PreconditionFailedError('!item.duration');
			return r.table('wakatime').insert(item, { conflict: 'replace' }).run()

		})

	}).catch(function(error) {
		logger.error('syncWakatime > error', utils.peRender(error))
	})

}





