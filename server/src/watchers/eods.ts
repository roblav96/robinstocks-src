//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')
import logger = require('../adapters/logger')

import axios from 'axios'
import qs = require('query-string')
import cron = require('cron')
import pdelay = require('delay')
import pforever = require('p-forever')
import pevent = require('p-event')
import rx = require('rxjs/Rx')
import redis = require('../adapters/redis')
import metrics = require('../adapters/metrics')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')



// function onReady() {
// 	if (utils.isMaster()) return;
// 	if (process.DEVELOPMENT) return;
// 	// if (process.DEVELOPMENT && !utils.isPrimaryNode()) return;

// 	if (process.PRODUCTION) return;

// 	new cron.CronJob({
// 		// /*----------  3:50 AM Weekdays  ----------*/
// 		cronTime: utils.cronTime('50 03 * * 1-5'),
// 		start: process.PRODUCTION,
// 		onTick: startEod,
// 		timeZone: 'America/New_York',
// 	})

// }
// process.ee3_private.once(shared.RKEY.SYS.READY, onReady)





// function startEod(): Promise<void> {
// 	if (utils.isMaster()) return Promise.resolve();
// 	logger.primary('startEod > start')
// 	return Promise.resolve().then(function() {
// 		global.gc()
// 		return syncEndOfDays()
// 	}).then(function() {
// 		global.gc()
// 		logger.primary('startEod > done')
// 		return Promise.resolve()
// 	})
// }





// function calcEndOfDays(next: number): Promise<any> {
// 	const LIMIT = 10
// 	return Promise.resolve().then(function() {
// 		if (process.DEVELOPMENT) return Promise.resolve();
// 		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1) as any

// 	}).then(function() {
// 		return robinhood.getInstanceSymbols()

// 	}).then(function(symbols) {
// 		let total = symbols.length
// 		let start = next * LIMIT
// 		symbols = symbols.slice(start, start + LIMIT)
// 		if (symbols.length == 0) return Promise.resolve(null);

// 		// if (process.DEVELOPMENT) symbols = utils.devFsymbols(symbols);
// 		if (process.DEVELOPMENT) logger.primary('calcEndOfDays', total - start, JSON.stringify(symbols));

// 		let coms = [] as RedisComs
// 		symbols.forEach(function(v) {
// 			coms.push(['hgetall', shared.RKEY.RH.HISTORICALS + ':day:' + v])
// 			coms.push(['hgetall', shared.RKEY.RH.HISTORICALS + ':week:' + v])
// 			coms.push(['hgetall', shared.RKEY.RH.HISTORICALS + ':year:' + v])
// 			coms.push(['hgetall', shared.RKEY.EODS + ':' + v])
// 			coms.push(['hgetall', shared.RKEY.CALCS + ':' + v])
// 			coms.push(['hgetall', shared.RKEY.YH.QUOTES + ':' + v])
// 			coms.push(['hgetall', shared.RKEY.RH.QUOTES + ':' + v])
// 			coms.push(['hgetall', shared.RKEY.RH.FUNDAMENTALS + ':' + v])
// 			coms.push(['hgetall', shared.RKEY.RH.INSTRUMENTS + ':' + v])
// 			// coms.push(['hgetall', shared.RKEY.STREAMS + ':' + v])
// 		})
// 		const COMS_LENGTH = coms.length / symbols.length
// 		coms.push(['hgetall', shared.RKEY.RH.HOURS])

// 		return redis.pipelinecoms(coms).then(function(resolved: Array<any>) {
// 			utils.fixPipelineFast(resolved)
// 			let markethours = utils.fromhget(resolved.pop())
// 			let dayhistoricals = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 0])) as Array<RobinhoodHistoricals>
// 			dayhistoricals = dayhistoricals.map(v => shared.explodeWithArrays(v, ['historicals']))
// 			let weekhistoricals = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 1])) as Array<RobinhoodHistoricals>
// 			weekhistoricals = weekhistoricals.map(v => shared.explodeWithArrays(v, ['historicals']))
// 			let yearhistoricals = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 2])) as Array<RobinhoodHistoricals>
// 			yearhistoricals = yearhistoricals.map(v => shared.explodeWithArrays(v, ['historicals']))
// 			let fromeodquotes = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 3])) as Array<EodQuote>
// 			let cquotes = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 4])) as Array<CalcQuote>
// 			let yquotes = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 5])) as Array<YahooQuote>
// 			let rquotes = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 6])) as Array<RobinhoodQuote>
// 			let fundamentals = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 7])) as Array<RobinhoodFundamentals>
// 			let instruments = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 8])) as Array<RobinhoodInstrument>
// 			// let squotes = symbols.map((v, i) => utils.fromhget(resolved[(i * COMS_LENGTH) + 9])) as Array<StreamQuote>

// 			let coms = [] as RedisComs
// 			symbols.forEach(function(symbol, i) {
// 				let dayhistorical = dayhistoricals[i]
// 				if (!dayhistorical) return logger.warn('!dayhistorical', symbol);
// 				let weekhistorical = weekhistoricals[i]
// 				let yearhistorical = yearhistoricals[i]
// 				let month1ago = shared.moment(_.last(yearhistorical.historicals).begins_at).subtract(1, 'month').valueOf()
// 				let monthhistorical = Object.assign({}, yearhistorical)
// 				monthhistorical.span = 'month'
// 				monthhistorical.historicals = yearhistorical.historicals.filter(v => new Date(v.begins_at).valueOf() >= month1ago)

// 				let cquote = cquotes[i]
// 				let fromeodquote = fromeodquotes[i]
// 				let yquote = yquotes[i]
// 				let ylquote = utils.ylQuoteFast(yquote)
// 				let rquote = rquotes[i]
// 				let rlquote = utils.rlQuoteFast(rquote)
// 				let fundamental = fundamentals[i]
// 				let instrument = instruments[i]
// 				// let squote = squotes[i]

// 				/*=====  SOURCE VOLUME DIFF  ======*/
// 				let rhdayvolume = _.sum(dayhistorical.historicals.map(v => v.volume))
// 				let srcvolumediff = ylquote.volume / rhdayvolume
// 				dayhistorical.historicals.forEach(v => v.volume = v.volume * srcvolumediff)
// 				weekhistorical.historicals.forEach(v => v.volume = v.volume * srcvolumediff)
// 				let dayhistoricalreg = dayhistorical.historicals.filter(v => v.session == 'reg')
// 				let dayhistoricalafhrs = dayhistorical.historicals.filter(v => v.session != 'reg')

// 				/*=====  EOD QUOTE  ======*/
// 				let eodquote = { symbol } as EodQuote
// 				eodquote.stamp = Date.now()
// 				// eodquote.squote = Object.assign({}, squote)
// 				eodquote.cquote = Object.assign({}, cquote)

// 				/*=====  YAHOO  ======*/
// 				eodquote.yhPreMarketPrice = yquote.preMarketPrice
// 				eodquote.yhPreMarketChange = yquote.preMarketChange
// 				eodquote.yhPreMarketChangePercent = yquote.preMarketChangePercent
// 				eodquote.yhRegularMarketPrice = yquote.regularMarketPrice
// 				eodquote.yhRegularMarketChange = yquote.regularMarketChange
// 				eodquote.yhRegularMarketChangePercent = yquote.regularMarketChangePercent
// 				eodquote.yhPostMarketPrice = yquote.postMarketPrice
// 				eodquote.yhPostMarketChange = yquote.postMarketChange
// 				eodquote.yhPostMarketChangePercent = yquote.postMarketChangePercent

// 				eodquote.yhRegularMarketOpen = yquote.regularMarketOpen
// 				eodquote.yhRegularMarketDayHigh = yquote.regularMarketDayHigh
// 				eodquote.yhRegularMarketDayLow = yquote.regularMarketDayLow
// 				eodquote.yhRegularMarketPreviousClose = yquote.regularMarketPreviousClose
// 				eodquote.yhRegularMarketVolume = yquote.regularMarketVolume

// 				eodquote.yhAverageDailyVolume3Month = yquote.averageDailyVolume3Month
// 				eodquote.yhAverageDailyVolume10Day = yquote.averageDailyVolume10Day
// 				eodquote.yhSharesOutstanding = yquote.sharesOutstanding
// 				eodquote.yhMarketCap = yquote.marketCap

// 				eodquote.yhFiftyTwoWeekLowChange = yquote.fiftyTwoWeekLowChange
// 				eodquote.yhFiftyTwoWeekLowChangePercent = yquote.fiftyTwoWeekLowChangePercent
// 				eodquote.yhFiftyTwoWeekHighChange = yquote.fiftyTwoWeekHighChange
// 				eodquote.yhFiftyTwoWeekHighChangePercent = yquote.fiftyTwoWeekHighChangePercent
// 				eodquote.yhFiftyTwoWeekLow = yquote.fiftyTwoWeekLow
// 				eodquote.yhFiftyTwoWeekHigh = yquote.fiftyTwoWeekHigh

// 				eodquote.yhFiftyDayAverage = yquote.fiftyDayAverage
// 				eodquote.yhFiftyDayAverageChange = yquote.fiftyDayAverageChange
// 				eodquote.yhFiftyDayAverageChangePercent = yquote.fiftyDayAverageChangePercent
// 				eodquote.yhTwoHundredDayAverage = yquote.twoHundredDayAverage
// 				eodquote.yhTwoHundredDayAverageChange = yquote.twoHundredDayAverageChange
// 				eodquote.yhTwoHundredDayAverageChangePercent = yquote.twoHundredDayAverageChangePercent
// 				eodquote.yhTrailingThreeMonthReturns = yquote.trailingThreeMonthReturns
// 				eodquote.yhTrailingThreeMonthNavReturns = yquote.trailingThreeMonthNavReturns

// 				eodquote.yhEarningsTimestamp = yquote.earningsTimestamp * 1000
// 				eodquote.yhEarningsTimestampStart = yquote.earningsTimestampStart * 1000
// 				eodquote.yhEarningsTimestampEnd = yquote.earningsTimestampEnd * 1000

// 				eodquote.yhEpsTrailingTwelveMonths = yquote.epsTrailingTwelveMonths
// 				eodquote.yhEpsForward = yquote.epsForward
// 				eodquote.yhPriceHint = yquote.priceHint
// 				eodquote.yhTrailingPE = yquote.trailingPE
// 				eodquote.yhForwardPE = yquote.forwardPE
// 				eodquote.yhPriceToBook = yquote.priceToBook
// 				eodquote.yhBookValue = yquote.bookValue

// 				/*=====  PREV EOD PRICE  ======*/
// 				eodquote.prevEodLastPrice = fromeodquote.eodLastPrice
// 				eodquote.eodLastPrice = cquote.lastPrice
// 				eodquote.eodLastPriceChange = cquote.lastPrice - fromeodquote.eodLastPrice
// 				eodquote.eodLastPriceChangePercent = shared.calcPercentChange(cquote.lastPrice, fromeodquote.eodLastPrice)

// 				/*=====  ROBINHOOD HISTORICALS  ======*/
// 				eodquote.rhDayPreviousClose = dayhistorical.previous_close_price

// 				let ihist: number, len = 4
// 				for (ihist = 0; ihist < len; ihist++) {
// 					let historicals: RobinhoodHistoricals
// 					if (ihist == 0) historicals = dayhistorical;
// 					else if (ihist == 1) historicals = weekhistorical;
// 					else if (ihist == 2) historicals = monthhistorical;
// 					else if (ihist == 3) historicals = yearhistorical;

// 					let rhopenprices = historicals.historicals.map(v => v.open_price)
// 					let rhhighprices = historicals.historicals.map(v => v.high_price)
// 					let rhlowprices = historicals.historicals.map(v => v.low_price)
// 					let rhcloseprices = historicals.historicals.map(v => v.close_price)
// 					let rhsizes = historicals.historicals.map(v => v.volume)
// 					let rhprices = rhopenprices.concat(rhhighprices).concat(rhlowprices).concat(rhcloseprices)
// 					let openprice = _.first(rhopenprices)
// 					let closeprice = _.last(rhcloseprices)
// 					let volume = _.sum(rhsizes)

// 					let which = shared.capitalize(historicals.span)
// 					eodquote['rh' + which + 'OpenPrice'] = openprice
// 					eodquote['rh' + which + 'HighPrice'] = _.max(rhprices)
// 					eodquote['rh' + which + 'LowPrice'] = _.min(rhprices)
// 					eodquote['rh' + which + 'ClosePrice'] = closeprice
// 					eodquote['rh' + which + 'Change'] = closeprice - openprice
// 					eodquote['rh' + which + 'ChangePercent'] = shared.calcPercentChange(closeprice, openprice)
// 					eodquote['rh' + which + 'AvgSize'] = _.mean(rhsizes)
// 					eodquote['rh' + which + 'Volume'] = volume

// 					let abspricemovement = 0
// 					historicals.historicals.forEach(v => abspricemovement = abspricemovement + Math.abs(v.close_price - v.open_price))
// 					eodquote['rh' + which + 'AbsPriceMovement'] = abspricemovement
// 					eodquote['rh' + which + 'AbsPriceMovementPercent'] = shared.calcPercentChange(openprice + abspricemovement, openprice)

// 					let pricemovementweighted = 0
// 					historicals.historicals.forEach(v => pricemovementweighted = pricemovementweighted + (shared.calcPercentChange(v.close_price, v.open_price) * v.volume))
// 					eodquote['rh' + which + 'PriceMovementWeighted'] = pricemovementweighted / volume

// 				}

// 				/*=====  AVERAGE VOLUMES  ======*/
// 				let weekdatehists = {} as { [date: string]: Array<RobinhoodHistorical> }
// 				weekhistorical.historicals.forEach(function(v) {
// 					let date = v.begins_at.split('T')[0]
// 					if (!Array.isArray(weekdatehists[date])) weekdatehists[date] = [];
// 					weekdatehists[date].push(v)
// 				})

// 				eodquote.avgSize5min1day = _.mean(dayhistorical.historicals.map(v => v.volume))
// 				eodquote.avgSize5min1week = _.mean(weekhistorical.historicals.map(v => v.volume))
// 				eodquote.avgSize1day1week = _.mean(Object.keys(weekdatehists).map(date => _.mean(weekdatehists[date].map(v => v.volume))))
// 				eodquote.avgSize1day1month = _.mean(monthhistorical.historicals.map(v => v.volume))

// 				/*=====  VOLUME QUOTES  ======*/
// 				let vquotes = [] as Array<EodVolumeQuote>
// 				dayhistorical.historicals.forEach(function(v, i) {
// 					let time = v.begins_at.split('T')[1]
// 					let stamp = new Date(v.begins_at).valueOf()
// 					vquotes.push({
// 						time,
// 						symbol,
// 						stamp,
// 						daySize: v.volume,
// 						dayVolume: null,
// 						weekSize: _.mean(weekhistorical.historicals.filter(v => v.begins_at.indexOf(time) >= 0 && Number.isFinite(v.volume)).map(v => v.volume)),
// 						weekVolume: null,
// 					})
// 				})
// 				vquotes.sort((a, b) => a.stamp - b.stamp)
// 				vquotes.forEach(function(v, i) {
// 					v.dayVolume = _.sum(vquotes.filter((vv, ii) => ii <= i && Number.isFinite(v.daySize)).map(v => v.daySize))
// 					if (Number.isFinite(v.weekSize)) {
// 						v.weekVolume = _.sum(_.compact(vquotes.filter((vv, ii) => ii <= i && Number.isFinite(v.weekSize)).map(v => v.weekSize)))
// 					} else v.weekVolume = null
// 					roundAllNumbers(v)
// 					coms.push(['hmset', shared.RKEY.CALC.EOD_VOLUMES + ':' + symbol + ':' + v.time, utils.tohset(v)])
// 				})

// 				/*=====  FINAL CLEANUP  ======*/
// 				roundAllNumbers(eodquote)
// 				coms.push(['hmset', shared.RKEY.EODS + ':' + symbol, utils.tohset(eodquote)])

// 			})

// 			if (process.DEVELOPMENT) coms.splice(0);

// 			return redis.pipelinecoms(coms).then(function(resolved) {
// 				utils.pipelineErrors(resolved)
// 				return Promise.resolve(next + 1)
// 			})
// 		})

// 	}).catch(function(error) {
// 		logger.error('calcEndOfDays > error', utils.peRender(error))
// 		return Promise.resolve(next)
// 	})
// }

// function syncEndOfDays(): Promise<any> {
// 	logger.primary('syncEndOfDays > start')
// 	return pforever(function(next: number) {
// 		if (Number.isFinite(next)) return calcEndOfDays(next);
// 		logger.primary('syncEndOfDays > done')
// 		return pforever.end
// 	}, 0)
// }

// function roundAllNumbers(item, precision = 4) {
// 	Object.keys(item).forEach(function(k) {
// 		let num = item[k]
// 		if (Number.isFinite(num)) item[k] = _.round(num, precision);
// 	})
// }





// let rhdayopenprices = dayhistorical.historicals.map(v => v.open_price)
// let rhdayhighprices = dayhistorical.historicals.map(v => v.high_price)
// let rhdaylowprices = dayhistorical.historicals.map(v => v.low_price)
// let rhdaycloseprices = dayhistorical.historicals.map(v => v.close_price)
// let rhdaysizes = dayhistorical.historicals.map(v => v.volume)
// let rhdayprices = rhdayopenprices.concat(rhdayhighprices).concat(rhdaylowprices).concat(rhdaycloseprices)
// let rhdayopen = _.first(rhdayopenprices)
// let rhdayclose = _.last(rhdaycloseprices)

// let eodquote = {}
// eodquote.rhDayOpenPrice = rhdayopen
// eodquote.rhDayHighPrice = _.max(rhdayprices)
// eodquote.rhDayLowPrice = _.min(rhdayprices)
// eodquote.rhDayClosePrice = rhdayclose
// eodquote.rhDayChange = rhdayclose - rhdayopen
// eodquote.rhDayChangePercent = shared.calcPercentChange(rhdayclose, rhdayopen)
// eodquote.rhDayAvgSize = _.mean(rhdaysizes)
// eodquote.rhDayVolume = _.sum(rhdaysizes)

// let daypricemovement = 0
// dayhistorical.historicals.forEach(v => daypricemovement = daypricemovement + Math.abs(v.close_price - v.open_price))
// eodquote.rhDayAbsPriceMovement = daypricemovement
// eodquote.rhDayAbsPriceMovementPercent = shared.calcPercentChange(rhdayclose + daypricemovement, rhdayclose)

// /*================================================
// =            THIS IS THE SECRET SAUCE            =
// ================================================*/
// let daypricemovementweighted = 0
// dayhistorical.historicals.forEach(v => daypricemovementweighted = daypricemovementweighted + (shared.calcPercentChange(v.close_price, v.open_price) * v.volume))
// eodquote.rhDayPriceMovementWeighted = daypricemovementweighted / eodquote.rhDayVolume
// /*=====  End of THIS IS THE SECRET SAUCE  ======*/











