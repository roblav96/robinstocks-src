//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')
import logger = require('../adapters/logger')

// import uws = require('uws')
import pevent = require('p-event')
import SocketIO = require('socket.io-client')
import http = require('./http')
import storage = require('./storage')





export function initSocket(symbols: Array<string>) {
	if (utils.isMaster() || _.isEmpty(symbols)) return;
	if (shared.marketState() == 'CLOSED' && process.PRODUCTION) return;



	// {
	// 	let ws = new uws('https://ws-api.iextrading.com/1.0/deep')
	// 	// let ws = new uws('ws://ws-api.iextrading.com/1.0/deep')
	// 	ws.on('ping', function () {
	// 		console.warn('ws ping')
	// 	})
	// 	ws.on('pong', function () {
	// 		console.warn('ws pong')
	// 	})
	// 	ws.on('open', function () {
	// 		console.warn('ws open')
	// 	})
	// 	ws.on('close', function () {
	// 		console.warn('ws close')
	// 	})
	// 	ws.on('message', message => {
	// 		console.log('ws message >')
	// 		eyes.inspect(message)
	// 	})
	// 	ws.on('error', function (error) {
	// 		console.error('ws error', error)
	// 	})
	// }

	// return

	// {
	// 	const socket = SocketIO('https://ws-api.iextrading.com/1.0/deep')

	// 	// Listen to the channel's messages
	// 	socket.on('message', message => console.log(message))

	// 	// Connect to the channel
	// 	socket.on('connect', () => {

	// 		// Subscribe to topics (i.e. appl,fb,aig+)
	// 		socket.emit('subscribe', JSON.stringify({ symbols: 'snap,fb,aig,amd' }))

	// 		// Unsubscribe from topics (i.e. aig+)
	// 		// socket.emit('unsubscribe', 'aig+')
	// 	})

	// 	// Disconnect from the channel
	// 	socket.on('disconnect', () => console.warn('disconnect'))
	// 	socket.on('error', (error) => console.error('error', error))

	// }

	// return





	// getBatch(symbols, ['system-event', 'trading-status', 'op-halt-status', 'ssr-status', 'security-event']).then(function(batch) {
	// 	Object.keys(batch).forEachFast(function(symbol) {
	// 		let response = batch[symbol]
	// 		let cquote = storage.calcquotes[symbol]
	// 		if (response['system-event']) {
	// 			cquote.systemEvent = response['system-event'].systemEvent
	// 		}
	// 		if (response['trading-status']) {
	// 			cquote.status = response['trading-status'].status
	// 			cquote.reason = response['trading-status'].reason
	// 		}
	// 		if (response['op-halt-status']) {
	// 			cquote.halted = response['op-halt-status'].isHalted
	// 		}
	// 		if (response['ssr-status']) {
	// 			cquote.ssr = response['ssr-status'].isSSR
	// 			cquote.ssrDetail = response['ssr-status'].detail
	// 		}
	// 		if (response['security-event']) {
	// 			cquote.securityEvent = response['security-event'].securityEvent
	// 		}
	// 	})
	// 	return Promise.resolve()
	// }).catch(function(error) { logger.error('initSocket > error', error) })

	const socket = SocketIO('https://ws-api.iextrading.com/1.0/deep')
	// , {
	// 	reconnectionDelayMax: 500,
	// 	reconnectionDelay: 250,
	// 	// transports: ['websocket', 'polling'],
	// })

	socket.on('message', function(message: IexEventMessage) {
		message = shared.safeParse(message)
		if (_.isEmpty(message.symbol)) return;
		if (_.isEmpty(message.data)) return;

		// console.log('message >')
		// eyes.inspect(message)

		// Object.keys(message.data).forEachFast(function(k) {
		// 	let v = message.data[k]
		// 	if (_.isString(v)) message.data[k] = v.trim();
		// })

		// // if (process.DEVELOPMENT) {
		// // 	console.log('iex message >')
		// // 	eyes.inspect(message)
		// // }

		let tocquote = { symbol: message.symbol.toUpperCase() } as CalcQuote
		// if (message.messageType == 'systemevent') {
		// 	tocquote.systemEvent = message.data.systemEvent
		// }
		// if (message.messageType == 'tradingstatus') {
		// 	tocquote.status = message.data.status
		// 	tocquote.reason = message.data.reason.trim()
		// 	tocquote.statusStamp = message.data.timestamp
		// }
		// if (message.messageType == 'ophaltstatus') {
		// 	tocquote.halted = message.data.isHalted
		// 	tocquote.haltedStamp = message.data.timestamp
		// }
		// if (message.messageType == 'ssr') {
		// 	tocquote.ssr = message.data.isSSR
		// 	tocquote.ssrDetail = message.data.detail.trim()
		// 	tocquote.ssrStamp = message.data.timestamp
		// }
		// if (message.messageType == 'securityevent') {
		// 	tocquote.securityEvent = message.data.securityEvent
		// }

		// storage.applyCalcQuote(tocquote, 'iex')

	})

	socket.on('connect', function() {
		console.info('iex connect > connected', symbols.length)

		symbols.forEachFast(function(symbol) {
			socket.emit('subscribe', JSON.stringify({
				symbols: [symbol.toLowerCase()],
				channels: ['tradingstatus', 'ophaltstatus', 'ssr'],
			}))
		})

		// socket.emit('subscribe', JSON.stringify({
		// 	symbols: 'firehose',
		// 	channels: ['deep'],
		// 	// channels: ['tradingstatus', 'ophaltstatus', 'ssr', 'securityevent'],
		// }))

		// let params = {
		// 	symbols: symbols.mapFast(v => v.toLowerCase()),
		// 	// channels: ['systemevent', 'tradingstatus', 'ophaltstatus', 'ssr', 'securityevent'],
		// 	channels: ['tradingstatus', 'ophaltstatus', 'ssr'],
		// } as any
		// console.warn('params >')
		// eyes.inspect(params)

		// // socket.emit('subscribe', params)
		// socket.emit('subscribe', JSON.stringify(params))
		// socket.emit('subscribe', symbols.join(',').toLowerCase())
		// socket.emit('subscribe', 'amd')
		// socket.emit('subscribe', JSON.stringify('amd'))

	})

	socket.on('disconnect', function(error) {
		// console.warn('disconnect error', error)
		if (shared.marketState() != 'REGULAR') return;
		console.error('iex disconnect > error', error)
	})

	socket.on('error', function(error) {
		// console.error('error error', error)
		if (shared.marketState() != 'REGULAR') return;
		console.error('iex error > error', error)
	})

	const cleanup = _.once(function() { socket.disconnect(); socket.close() })
	process.on('beforeExit', cleanup)
	process.on('exit', cleanup)

}





export function getBatch(symbols: Array<string>, types: Array<string>): Promise<IexBatchResponse> {
	if (!Array.isArray(symbols) || symbols.length == 0) return Promise.resolve({});
	if (!Array.isArray(types) || types.length == 0) return Promise.resolve({});

	// let types = ['quote', 'open-close', 'company', 'stats', 'peers', 'financials', 'earnings', 'splits', 'effective-spread']
	return Promise.resolve().then(function() {
		return http.get('https://api.iextrading.com/1.0/stock/market/batch', {
			symbols: symbols.join(','),
			types: types.join(','),
		}, { silent: true })

	}).catch(function(error) {
		logger.error('getBatch > error', utils.peRender(error));
		if (utils.isTimeoutError(error)) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_5).then(() => getBatch(symbols, types))
		}
		return Promise.resolve({})
	})
}



export function getSpreads(symbols: Array<string>): Promise<Array<IexEffectiveSpreadItem>> {
	if (!Array.isArray(symbols) || symbols.length == 0) return Promise.resolve([]);

	return Promise.resolve().then(function() {
		return http.get('https://api.iextrading.com/1.0/stock/market/batch', {
			symbols: symbols.join(','),
			types: ['effective-spread'],
		}, { silent: true })

	}).then(function(response: IexBatchResponse) {
		return Promise.resolve(Object.keys(response).mapFast(function(symbol) {
			return {
				symbol,
				spreads: response[symbol]['effective-spread'],
			} as IexEffectiveSpreadItem
		}))

	}).catch(function(error) {
		logger.error('getSpreads > error', utils.peRender(error));
		if (utils.isTimeoutError(error)) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_3).then(() => getSpreads(symbols))
		}
		return Promise.resolve([])
	})
}







































// // function onReady() {
// // 	if (utils.isMaster()) return;
// // 	if (process.DEVELOPMENT) return;
// // 	// if (process.DEVELOPMENT && !utils.isPrimaryNode()) return;

// // 	robinhood.getInstanceSymbols().then(initSocket)

// // }
// // process.ee3_private.once(shared.RKEY.SYS.READY, onReady)





// const rxBuffer = new rx.Subject<LiveQuote>()
// const rxSub = rxBuffer
// 	.buffer(rx.Observable.fromEvent(process.ee3_private, shared.RKEY.SYS.TICK_1))
// 	.filter(v => v.length > 0)
// 	.map(lquotes => shared.rxMergeBuffer(lquotes, 'nano', 'symbol', true))
// 	.subscribe(onLiveQuotes)
// function onLiveQuotes(lquotes: Array<LiveQuote>) {
// 	let coms = lquotes.map(function(lquote) {
// 		let rkey = shared.RKEY.CALCS + ':' + lquote.symbol
// 		return ['hmset', rkey, utils.tohset(lquote)]
// 	}) as RedisComs

// 	if (process.DEVELOPMENT) coms.splice(0);

// 	redis.pipelinecoms(coms).then(function(resolved) {
// 		utils.pipelineErrors(resolved)
// 	}).catch(function(error) {
// 		logger.error('onLiveQuotes > error', utils.peRender(error))
// 	})
// }






// export function iexToLiveQuote(message: IexTopsMessage): LiveQuote {
// 	if (_.isEmpty(message)) return message as any;

// 	let ilquote = {
// 		symbol: message.symbol.toUpperCase(),
// 		askPrice: message.askPrice,
// 		askSize: message.askSize,
// 		bidPrice: message.bidPrice,
// 		bidSize: message.bidSize,
// 	} as LiveQuote

// 	if (message.askPrice == 0) ilquote.askPrice = message.lastSalePrice;
// 	if (message.bidPrice == 0) ilquote.bidPrice = message.lastSalePrice;

// 	return ilquote
// }















// class Socket {

// 	socket = null as SocketIOClient.Socket

// 	constructor(
// 		public symbols: Array<string>,
// 	) {
// 		this.start()
// 	}

// 	restart() {
// 		this.stop()
// 		setTimeout(() => this.start(), 3000)
// 		console.error('iex.restart >', process.$instance)
// 	}

// 	stop() {
// 		if (this.socket) {
// 			this.socket.close()
// 			this.socket.disconnect()
// 			this.socket.removeAllListeners()
// 			this.socket = null
// 		}
// 	}

// 	start() {
// 		this.stop()

// 		this.socket = SocketIO('https://ws-api.iextrading.com/1.0/tops', {
// 			reconnectionDelayMax: 500,
// 			reconnectionDelay: 100,
// 			// timeout: Infinity,
// 		})

// 		this.socket.on('message', (message: IexTopsMessage) => {
// 			message = JSON.parse(message as any)
// 			let lquote = Shared.iexToCalcQuote(message)

// 			let lrkey = Shared.RKEY.LATEST + ':' + lquote.symbol
// 			// Ds.ds.event.emit(lrkey, shared.implode(Shared.RMAP.LATEST, lquote))
// 			let crkey = Shared.RKEY.CALCS + ':' + lquote.symbol
// 			// Ds.ds.event.emit(lrkey, shared.implode(Shared.RMAP.CALC, lquote))
// 			redis.pipeline()
// 				.hmset(lrkey, lquote)
// 				.hmset(crkey, lquote)
// 				.exec().then(function(resolved) {
// 					Utils.pipelineErrors(resolved)
// 					return Promise.resolve()
// 				})
// 		})

// 		this.socket.on('connect', () => {
// 			console.info('iex.connect > connected')
// 			this.socket.emit('subscribe', this.symbols.join(',').toLowerCase())
// 			// this.socket.emit('subscribe', 'firehose')
// 		})

// 		this.socket.on('disconnect', error => {
// 			console.error('iex.disconnect > error', error)
// 		})

// 		this.socket.on('error', error => {
// 			console.error('iex.error > error', error)
// 		})

// 	}

// }

