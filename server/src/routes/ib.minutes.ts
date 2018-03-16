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
import socket = require('../adapters/socket')
import storage = require('../adapters/storage')



export = utils.restifyRoute<{ date: string }, Array<IbMinute>>(function(req, res, next) {

	let date = req.body.date

	Promise.resolve().then(function() {
		utils.validate(req.body, ['date'])
		console.time('ib.minutes')

		let start = shared.moment(date).startOf('day').valueOf()
		let end = shared.moment(date).endOf('day').valueOf()
		return r.table('ib_minutes').between(start, end, { index: 'stamp' }).orderBy({
			index: r.desc('stamp')
		}).run()

	}).then(function(ibminutes: Array<IbMinute>) {

		console.log('ibminutes.length', ibminutes.length)

		console.timeEnd('ib.minutes')
		res.send(ibminutes)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})





