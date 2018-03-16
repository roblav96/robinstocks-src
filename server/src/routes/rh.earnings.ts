//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import moment = require('moment')
import redis = require('../adapters/redis')
import Security = require('../adapters/security')
import Robinhood = require('../adapters/robinhood')


export const Route = utils.restifyRoute<RobinhoodEarningsRequest, RobinhoodEarningsResponse>(function(req, res, next) {

	Promise.resolve().then(function() {
		let symbols = req.body.symbols
		if (Array.isArray(symbols) != true) throw new errors.PreconditionFailedError(`"symbols" field must be Array<string>`);
		let date = req.body.date
		if (!date) throw new errors.PreconditionFailedError(`"date" field must be string`);

		let lenn = 4
		let dayofweek = moment().utcOffset(-4, true).format('dddd')
		if (dayofweek == 'Monday') lenn = 6;
		if (dayofweek == 'Tuesday') lenn = 5;

		let coms = [] as RedisComs
		let i: number, len = lenn
		for (i = 1; i < len; i++) {
			let day = moment(date).subtract(i, 'days').toISOString().split('T')[0]
			let rkey = shared.RKEY.RH.EARNINGS_DATE + ':' + day
			coms.push(['get', rkey])
		}

		return redis.main.pipelinecoms(coms).then(function(resolved: Array<any>) {
			// utils.fixPipeline(resolved)
			let sendi = symbols.map(v => { return { symbol: v } }) as Array<RobinhoodEarningItem>
			resolved.forEach(function(v) {
				if (Array.isArray(v)) sendi = sendi.concat(v);
			})

			let coms = [] as RedisComs
			sendi.forEach(function(item) {
				let irkey = shared.RKEY.RH.INSTRUMENTS + ':' + item.symbol
				coms.push(['hget', irkey, 'name'])
				let frkey = shared.RKEY.RH.FUNDAMENTALS + ':' + item.symbol
				coms.push(['hgetall', frkey])
				let lrkey = shared.RKEY.LIVES + ':' + item.symbol
				coms.push(['zrange', lrkey, -1 as any, -1 as any])
			})
			return redis.main.pipelinecoms(coms).then(function(resolved: Array<any>) {
				// utils.fixPipeline(resolved)

				sendi.forEach(function(item, i) {
					item.instrument = undefined
					let ii = i * 3
					item.name = resolved[ii]
					item.fundamentals = resolved[ii + 1] as RobinhoodFundamentals
					item.fundamentals.instrument = undefined
					item.fundamentals.description = undefined
					shared.fix(item.fundamentals)
					item.lquote = shared.explode(shared.RMAP.LIVES, resolved[ii + 2])
				})
				res.send(sendi)
				return next()

			})
		})

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})



// export const Route = utils.RestifyRoute<void, RobinhoodEarningsResponse>(function(req, res, next) {

// 	Promise.resolve().then(function() {
// 		let rkey = Robinhood.RKEY.EARNINGS_DATE + ':*'
// 		return redis.keys(rkey)

// 	}).then(function(keys: Array<string>) {
// 		let coms = [] as RedisComs
// 		keys.forEach(v => coms.push(['get', v]))
// 		return redis.pipelinecoms(coms)

// 	}).then(function(resolved: Array<Array<RobinhoodEarningItem>>) {
// 		utils.fixPipeline(resolved)

// 		let sendi = [] as Array<RobinhoodEarningItem>
// 		resolved.forEach(v => sendi = sendi.concat(v))
// 		res.send(sendi)
// 		return next()

// 	}).catch(function(error) {
// 		return next(utils.generateError(error))
// 	})

// })



// export const Route = utils.RestifyRoute<RobinhoodEarningsRequest, RobinhoodEarningsResponse>(function(req, res, next) {

// 	let sendi = {} as RobinhoodEarningsResponse

// 	Promise.resolve().then(function() {
// 		let rkey = Robinhood.RKEY.E_DATE + ':*'
// 		return redis.keys(rkey)

// 	}).then(function(keys: Array<string>) {
// 		let dates = keys.map(v => v.split(':').pop())

// 		let date = req.body.date
// 		if (!date) {
// 			sendi.dates = dates
// 			date = moment().utcOffset(-4, true).startOf('day').toISOString().split('T')[0]
// 		}
// 		if (dates.indexOf(date) == -1) {
// 			throw new errors.InvalidArgumentError('Invalid "date" field, ' + date)
// 		}

// 		let rkey = Robinhood.RKEY.E_DATE + ':' + date
// 		return redis.get(rkey)

// 	}).then(function(earnings: Array<RobinhoodEarningItem>) {
// 		sendi.items = JSON.parse(earnings as any)
// 		res.send(sendi)
// 		return next()

// 	}).catch(function(error) {
// 		return next(utils.generateError(error))
// 	})

// })




