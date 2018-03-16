//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')
import logger = require('../adapters/logger')

import moment = require('moment')
import pdelay = require('delay')
import pevent = require('p-event')
import pforever = require('p-forever')
import pqueue = require('p-queue')
import pall = require('p-all')
import cron = require('cron')
import ss = require('simple-statistics')
import rx = require('rxjs/Rx')
import mqtt = require('mqtt')
import qs = require('query-string')
import redis = require('../adapters/redis')
import socket = require('../adapters/socket')
import metrics = require('../adapters/metrics')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')
import yahoo = require('../adapters/yahoo')
import iex = require('../adapters/iex')
import webull = require('../adapters/webull')
import storage = require('../adapters/storage')
import ewmas = require('./ewmas')



function onReady() {
	if (process.PRODUCTION && utils.isMaster()) redis.lives.zadd(shared.RKEY.LIVES_RMAP, shared.now(), JSON.stringify(shared.RMAP.LIVES));

	if (utils.isMaster()) return;
	if (process.DEVELOPMENT) return;
	// if (process.DEVELOPMENT && !utils.isPrimary()) return;

	robinhood.getInstanceFullSymbols().then(function(fsymbols) {
		if (process.DEVELOPMENT) fsymbols = utils.devFsymbols(fsymbols);
		let symbols = fsymbols.mapFast(v => v.symbol)

		return storage.initSymbols(symbols).then(function() {
			return ewmas.initSymbols(symbols)
		}).then(function() {

			utils.readyLives = true

			initWebullMqtt(fsymbols)

			// iex.initSocket(symbols)

			return Promise.resolve()
		})

	}).catch(function(error) {
		logger.error('onReady > error', utils.peRender(error))
		return Promise.resolve()
	})

}
rx.Observable.fromEvent(process.ee3_private, process.PRODUCTION ? shared.RKEY.SYS.TICK_3 : shared.RKEY.SYS.TICK_1).filter(function() {
	return !!process.$marketStamps && !!utils.readyInstruments && !!utils.readyCalcs
}).take(1).subscribe(onReady)





function initWebullMqtt(fsymbols: Array<FullSymbol>) {
	if (utils.isMaster()) return;
	if (shared.marketState() == 'CLOSED' && process.PRODUCTION) return;

	const sdict = {} as { [tickerid: number]: string }
	const tids = [] as Array<number>

	fsymbols.forEachFast(function(v) {
		sdict[v.tickerid] = v.symbol
		tids.push(v.tickerid)
	})

	const client = mqtt.connect(null, {
		protocol: 'tcp',
		host: 'push.webull.com',
		port: 9018,
		username: http.wbdid,
		password: http.wbtoken,
		keepalive: 60,
	})

	const cleanup = _.once(function() { client.unsubscribe('ALL'); client.end(true) })
	process.on('beforeExit', cleanup)
	process.on('exit', cleanup)

	client.on('error', function(error) {
		logger.error('mqtt.client > error', utils.peRender(error as any))
	})

	client.on('connect', function() {
		console.info('mqtt.client > connected', fsymbols.length)

		let topic = {
			header: { did: http.wbdid, access_token: http.wbtoken, hl: 'en', locale: 'eng', os: 'android', osv: 'Android SDK: 25 (7.1.2)', ph: 'Google Pixel', ch: 'google_play', tz: 'America/New_York', ver: '3.5.1.13', app: 'stocks' },
			tickerIds: tids,
			type: '',
		} as any

		client.subscribe(JSON.stringify(Object.assign(topic, { type: '5' }))) // TICKER
		client.subscribe(JSON.stringify(Object.assign(topic, { type: '6' }))) // TICKER_DETAIL
		client.subscribe(JSON.stringify(Object.assign(topic, { type: '12' }))) // TICKER_STATUS
		client.subscribe(JSON.stringify(Object.assign(topic, { type: '13' }))) // TICKER_HANDICAP
		client.subscribe(JSON.stringify(Object.assign(topic, { type: '14' }))) // TICKER_BID_ASK
		client.subscribe(JSON.stringify(Object.assign(topic, { type: '15' }))) // TICKER_DEAL_DETAILS

	})

	client.on('reconnect', function() {
		if (shared.marketState() == 'REGULAR') logger.log('mqtt.client > reconnect');
	})
	client.on('close', function() {
		if (shared.marketState() == 'REGULAR') logger.warn('mqtt.client > close');
	})
	client.on('offline', function() {
		if (shared.marketState() == 'REGULAR') logger.error('mqtt.client > offline');
	})

	client.on('message', function(topic: WebullMqttTopic, message: WebullMqttMessage<WebullQuote>) {
		topic = qs.parse(topic as any)
		topic.tid = Number.parseInt(topic.tid as any)
		message = shared.safeParse(message.toString()) as any
		if (!message || !Array.isArray(message.data)) return;

		let tid = topic.tid
		let symbol = sdict[tid]

		let cquote = storage.calcquotes[symbol]
		if (!cquote) {
			logger.warn(symbol, '!cquote', JSON.stringify(topic), JSON.stringify(message))
			let lquote = storage.livequotes[symbol]
			if (!lquote) {
				logger.error(symbol, '!lquote', JSON.stringify(topic), JSON.stringify(message))
				return
			}
			storage.calcquotes[symbol] = Object.assign({}, lquote);
			cquote = storage.calcquotes[symbol]
		}

		let cskip = true
		let lskip = true

		if (message.type == '14') {
			utils.array_remove(message.data, function(v) {
				if (Array.isArray(v.bidList) && v.bidList.length == 0) return true;
				if (Array.isArray(v.askList) && v.askList.length == 0) return true;
				return Object.keys(v).length == 0
			})
		}
		if (message.data.length == 0) return;

		message.data.forEachFast(function(data) {
			utils.fixWebullQuote(data)
			data.tickerId = tid
			data.symbol = symbol
		})

		// console.log(symbol, 'message >')
		// eyes.inspect(message)



		if (message.type == '12') {
			message.data.forEachFast(function(wquote) {
				if (wquote.status && wquote.status != cquote.wbstatus) { cquote.wbstatus = wquote.status; cskip = false }
				if (wquote.status0 && wquote.status0 != cquote.wbstatus0) { cquote.wbstatus0 = wquote.status0; cskip = false }
				if (wquote.faStatus && wquote.faStatus != cquote.wbfastatus) { cquote.wbfastatus = wquote.faStatus; cskip = false }
				let lquote = storage.livequotes[symbol]
				if (cquote.wbstatus != lquote.wbstatus) cquote.wbstatusStamp = shared.now();
			})
		}



		if (['5', '6', '13'].indexOf(message.type) >= 0) {
			message.data.forEachFast(function(wquote) {
				if (wquote.tradeTime) {
					let laststamp = shared.moment(wquote.tradeTime).valueOf()

					let lastprice: number
					if (Number.isFinite(wquote.price) && wquote.price > 0) {
						if (wquote.tradeTime == wquote.mkTradeTime) lastprice = wquote.price;
						else if (wquote.tradeTime == wquote.mktradeTime) lastprice = wquote.price;
					}
					if (Number.isFinite(wquote.pPrice) && wquote.pPrice > 0) {
						if (wquote.tradeTime == wquote.faTradeTime) lastprice = wquote.pPrice;
					}

					if (laststamp > cquote.lastStamp) {
						cquote.lastStamp = laststamp
						cskip = false
						if (Number.isFinite(lastprice)) {
							if (lastprice != cquote.lastPrice) lskip = false;
							cquote.lastPrice = lastprice
						}
					}
				}

				if (Number.isFinite(wquote.volume)) {
					let volume = _.max([cquote.volume, wquote.volume, 0])
					if (volume > cquote.volume) { cskip = false; lskip = false }
					cquote.volume = volume
				}

				if (wquote.open && wquote.open != cquote.openPrice) { cquote.openPrice = wquote.open; cskip = false }
				if (wquote.close && wquote.close != cquote.closePrice) { cquote.closePrice = wquote.close; cskip = false }
				if (wquote.preClose && wquote.preClose != cquote.prevClose) { cquote.prevClose = wquote.preClose; cskip = false }
				// if (wquote.high && wquote.high != cquote.dayHigh) { cquote.dayHigh = wquote.high; cskip = false }
				// if (wquote.low && wquote.low != cquote.dayLow) { cquote.dayLow = wquote.low; cskip = false }
				if (wquote.fiftyTwoWkHigh && wquote.fiftyTwoWkHigh != cquote.yearHigh) { cquote.yearHigh = wquote.fiftyTwoWkHigh; cskip = false }
				if (wquote.fiftyTwoWkLow && wquote.fiftyTwoWkLow != cquote.yearLow) { cquote.yearLow = wquote.fiftyTwoWkLow; cskip = false }

				if (wquote.totalShares && wquote.totalShares != cquote.sharesOutstanding) { cquote.sharesOutstanding = wquote.totalShares; cskip = false }
				if (wquote.outstandingShares && wquote.outstandingShares != cquote.sharesFloat) { cquote.sharesFloat = wquote.outstandingShares; cskip = false }
				if (wquote.dealNum && wquote.dealNum != cquote.dealCount) { cquote.dealCount = wquote.dealNum; cskip = false }

				if (wquote.turnoverRate && wquote.turnoverRate != cquote.turnoverRate) { cquote.turnoverRate = wquote.turnoverRate; cskip = false }
				if (wquote.vibrateRatio && wquote.vibrateRatio != cquote.vibrateRatio) { cquote.vibrateRatio = wquote.vibrateRatio; cskip = false }
				if (wquote.yield && wquote.yield != cquote.yield) { cquote.yield = wquote.yield; cskip = false }

			})
		}



		if (message.type == '14') {
			message.data.forEachFast(function(wquote) {
				if (Number.isFinite(wquote.bid) && wquote.bid > 0) {
					cquote.bidSpread = _.min([cquote.bidSpread, cquote.bidPrice, wquote.bid])
					cquote.bidPrice = wquote.bid
					cskip = false
				}
				if (Number.isFinite(wquote.bidSize)) {
					cquote.bidSize = wquote.bidSize
					cquote.bidSizeAccum = _.sum([cquote.bidSizeAccum, wquote.bidSize])
					cquote.bidVolume = _.sum([cquote.bidVolume, wquote.bidSize])
					cskip = false
				}

				if (Number.isFinite(wquote.ask) && wquote.ask > 0) {
					cquote.askSpread = _.max([cquote.askSpread, cquote.askPrice, wquote.ask])
					cquote.askPrice = wquote.ask
					cskip = false
				}
				if (Number.isFinite(wquote.askSize)) {
					cquote.askSize = wquote.askSize
					cquote.askSizeAccum = _.sum([cquote.askSizeAccum, wquote.askSize])
					cquote.askVolume = _.sum([cquote.askVolume, wquote.askSize])
					cskip = false
				}
			})
		}



		if (message.type == '15') {
			message.data.forEachFast(function(wtrade: WebullTrade) {
				if (wtrade.tradeTime) {
					let laststamp = shared.moment(wtrade.tradeTime).valueOf()
					if (laststamp >= cquote.lastStamp) {
						cquote.lastStamp = laststamp
						cquote.lastPrice = wtrade.deal
					}
				}

				if (Number.isFinite(wtrade.volume)) {
					cquote.tradeCount = _.sum([cquote.tradeCount, 1])
					cquote.tradeSize = _.sum([cquote.tradeSize, wtrade.volume])
					cquote.tradeVolume = _.sum([cquote.tradeVolume, wtrade.volume])

					if (wtrade.tradeBsFlag == 'B') {
						cquote.tradeBuySize = _.sum([cquote.tradeBuySize, wtrade.volume])
						cquote.tradeBuyVolume = _.sum([cquote.tradeBuyVolume, wtrade.volume])
					} else if (wtrade.tradeBsFlag == 'S') {
						cquote.tradeSellSize = _.sum([cquote.tradeSellSize, wtrade.volume])
						cquote.tradeSellVolume = _.sum([cquote.tradeSellVolume, wtrade.volume])
					} else {
						cquote.volume = _.sum([cquote.volume, wtrade.volume])
					}

					cskip = false; lskip = false
				}

			} as any)
		}

		if (['5', '6', '13', '15'].indexOf(message.type) >= 0) {
			cquote.high = _.max([cquote.high, cquote.lastPrice])
			cquote.low = _.min([cquote.low, cquote.lastPrice])
			cquote.dayHigh = _.max([cquote.dayHigh, cquote.high])
			cquote.dayLow = _.min([cquote.dayLow, cquote.low])
		}

		if (!cskip) storage.calcsymbols[symbol]++;
		if (!lskip) storage.livesymbols[symbol]++;

	})

}





new cron.CronJob({
	/*----------  3:52 AM Weekdays  ----------*/
	cronTime: utils.cronTime('52 03 * * 1-5'),
	start: process.PRODUCTION,
	onTick: function() {
		redis.lives.recyclezrange(shared.RKEY.LIVES, 1)
		redis.lives.recyclezrange(shared.RKEY.LIVES_TINYS, 1)
		redis.lives.recyclezrange(shared.RKEY.LIVES_TINYS_5M, 1)
		redis.lives.recyclezrange(shared.RKEY.LIVES_MINUTES, 1)
		redis.lives.recyclezrange(shared.RKEY.LIVES_RMAP, 1)
	},
	timeZone: 'America/New_York',
	// runOnInit: process.DEVELOPMENT,
})






























