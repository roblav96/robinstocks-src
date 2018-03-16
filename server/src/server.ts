// 

Array.prototype.forEachFast = function(fn) {
	let i: number, len = this.length
	for (i = 0; i < len; i++) {
		let v = this[i]
		fn(v, i, this)
	}
}
Array.prototype.mapFast = function(fn) {
	let i: number, len = this.length
	let array = new Array(len)
	for (i = 0; i < len; i++) {
		let v = this[i]
		array[i] = fn(v, i, this)
	}
	return array
}
Array.prototype.filterFast = function(fn) {
	let array = []
	let i: number, len = this.length
	for (i = 0; i < len; i++) {
		let v = this[i]
		if (fn(v, i, this)) array.push(v);
	}
	return array
}
Array.prototype.findFast = function(fn) {
	let i: number, len = this.length
	for (i = 0; i < len; i++) {
		let v = this[i]
		if (fn(v, i, this)) return v;
	}
}
Array.prototype.removeFast = function(fn) {
	let i: number, len = this.length
	for (i = len; i--;) {
		let v = this[i]
		if (fn(v, i, this)) this.splice(i, 1);
	}
}



import 'source-map-support/register'
import os = require('os')
import cluster = require('cluster')



process.setMaxListeners(12)
process.$instances = os.cpus().length
process.$instance = cluster.isWorker ? Number.parseInt(cluster.worker.id as any) - 1 : -1
let argvi = process.argv.findIndex(v => v == '$env') + 1
process.$env = process.argv[argvi] as any
process.DEVELOPMENT = process.$env == 'DEVELOPMENT'
if (process.DEVELOPMENT) process.$port = 3337;
process.PRODUCTION = process.$env == 'PRODUCTION'
if (process.PRODUCTION) process.$port = 11169;
process.$host = 'localhost'
process.$platform = 'server'
process.CLIENT = process.$platform == 'client' as any
process.SERVER = process.$platform == 'server' as any
process.$dname = 'Robinstocks'
process.$version = '0.0.1'

process.$redis = {
	host: '192.34.85.234',
	port: 6379,
}

// if (process.DEVELOPMENT) process.$redis = { host: 'localhost', port: 6379, password: null };

process.$rethinkdb = {
	host: '192.34.85.234',
	port: 28015,
	db: 'robinstocks',
}

process.$prevMarketStamps = null
process.$marketStamps = null
process.$nextMarketStamps = null

process.$stack = null
process.env.NODE_HEAPDUMP_OPTIONS = 'nosignal'

if (process.DEVELOPMENT) {
	const dtsgen = require('dts-gen')
	const clipboardy = require('clipboardy')
	process.dtsgen = function(name, value) {
		let results = dtsgen.generateIdentifierDeclarationFile(name, value)
		clipboardy.write(results).then(function() {
			console.info('coppied >', name)
		}).catch(function(error) {
			console.error('clipboardy.write > error', error)
		})
	}
}

process.on('uncaughtException', function(error: any) {
	if (clc && logger && utils) {
		console.error(clc.bold.redBright('/*==========  UNCAUGHT EXCEPTION  ==========*/'))
		logger.error('uncaughtException > error', utils.peRender(error))
	} else console.error('uncaughtExceptions > error', error);
})

process.on('unhandledRejection', function(error) {
	if (clc && logger && utils) {
		console.error(clc.bold.redBright('/*==========  UNHANDLED REJECTION  ==========*/'))
		logger.error('unhandledRejection > error', utils.peRender(error))
	} else console.error('unhandledRejection > error', error);
})





process.$dometrics = true
// if (process.PRODUCTION) process.$dometrics = false;
if (process.DEVELOPMENT) process.$dometrics = false;
if (process.$dometrics) {
	const appmetrics = require('appmetrics')
	appmetrics.configure({
		applicationID: process.$instances + ':' + process.$instance + ':' + process.$dname,
		mqtt: 'off',
		profiling: 'off',
	})
	appmetrics.start()
}





import rolex = require('rolex')
import cron = require('cron')
import ci = require('correcting-interval')
import ee3 = require('eventemitter3')

declare global {
	namespace NodeJS {
		interface Process {
			ee3_private: ee3.EventEmitter
			ee3_public: PublicEmitter
		}
	}
}
process.ee3_private = new ee3.EventEmitter()

import eyes = require('eyes')
const eOpts = (eyes as any).defaults as eyes.EyesOptions
eOpts.maxLength = 65536
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import fs = require('fs')
import path = require('path')
import rx = require('rxjs/Rx')
import uws = require('uws')
import shared = require('./shared')

require('debug-trace')()
console.format = function(c) {
	let stack = process.$stack
	if (!stack) {
		stack = new Error().stack.toString()
		stack = stack.replace(/^([^\n]*?\n){2}((.|\n)*)$/gmi, '$2').split('\n')[2].trim()
	}
	let fullpath = stack.split('/').pop()
	if (!fullpath) fullpath = c.filename + ':' + c.getLineNumber();
	let file = fullpath.split('.ts:')[0]
	let i = (fullpath.indexOf('.ts:') == -1) ? 0 : 1
	let line = fullpath.split('.ts:')[i].split(':')[0]
	let header = '[' + process.$instance + ']' + '[' + clc.bold(file.toUpperCase()) + ':' + line + ']'
	let format = (process.PRODUCTION) ? 'hh:mm:ss:SSS a @ ddd, MMM DD YYYY' : 'hh:mm:ss:SSS'
	let time = shared.moment().format(format)
	let cString: string
	if (c.method == 'log') {
		cString = clc.blue(time) + header
	} else if (c.method == 'info') {
		cString = clc.green(time) + header
	} else if (c.method == 'warn') {
		cString = clc.yellowBright('=============================== WARN ================================\n') + clc.yellow(time) + header
	} else if (c.method == 'error') {
		cString = clc.redBright('=============================== ERROR ================================\n') + clc.red(time) + header
	}
	return '\n \n' + clc.underline(cString) + '\n'
}

import utils = require('./adapters/utils')





/*===================================
=            EE3 PRIVATE            =
===================================*/

let ee3ts = {} as { [topic: string]: NodeJS.Timer }
let ee3is = {} as { [topic: string]: number }
function ee3start(topic: string, tick: number) {
	ee3ts[topic].unref(); clearTimeout(ee3ts[topic]); ee3ts[topic] = null; _.unset(ee3ts, topic);
	ee3is[topic] = 0
	process.ee3_private.emit(topic, ee3is[topic])
	ci.setCorrectingInterval(function() {
		ee3is[topic]++
		process.ee3_private.emit(topic, ee3is[topic])
	}, tick * 1000)
}
Object.keys(shared.RKEY.SYS).forEachFast(function(key) {
	if (key.toLowerCase().indexOf('tick_') != 0) return;
	let topic = shared.RKEY.SYS[key]
	let tick = shared.parseInt(key)
	if (key == 'TICK_01') tick = 0.1;
	if (key == 'TICK_025') tick = 0.25;
	if (key == 'TICK_05') tick = 0.5;
	let now = Date.now()
	let second = shared.moment(now).endOf('second').second()
	let addsec = tick - ((second + 1) % tick)
	let next = shared.moment(now).endOf('second').add(addsec, 'seconds').valueOf() - now + 1  // + 1 for execution latency
	let start = next + utils.instanceSecs(tick)
	ee3ts[topic] = _.delay(ee3start, start, topic, tick) as any
})





/*==================================
=            EE3 PUBLIC            =
==================================*/

const pubport = process.$port - 1

if (utils.isMaster()) {

	const wss = new uws.Server({
		path: 'master',
		port: pubport,
		clientTracking: false,
	})

	wss.on('connection', function(socket: Socket) {
		socket.on('message', function(message: string) {
			if (message == 'ping') return socket.send('pong');
			if (message.indexOf(shared.RKEY.BROADCAST + '|') == 0) {
				process.ee3_private.emit(shared.RKEY.BROADCAST, message.substring(shared.RKEY.BROADCAST.length + 1))
				return
			}
			wss.clients.forEach(function(socket: Socket) { socket.send(message) })
		})
	})

	const cleanup = _.once(function() { wss.removeAllListeners(); wss.close() })
	process.on('beforeExit', cleanup)
	process.on('exit', cleanup)

	let i: number, len = os.cpus().length
	for (i = 0; i < len; i++) { cluster.fork() }
	cluster.on('disconnect', function(worker) {
		logger.warn('cluster disconnect >', worker.id)
		process.ee3_public.emit(shared.RKEY.SYS.RESTART)
	})
	cluster.on('exit', function(worker, code, signal) {
		logger.error('cluster exit >', worker.id, code, signal)
		process.ee3_public.emit(shared.RKEY.SYS.RESTART)
	})

}

class PublicEmitter {

	private ws = new uws('ws://localhost:' + pubport + '/master')
	private ee3 = new ee3.EventEmitter()

	constructor() {
		this.ws.on('message', (message: SocketMessage) => {
			if (message == 'pong') return;
			message = shared.safeParse(message)
			this.ee3.emit(message.event, message.data)
		})
		process.ee3_private.addListener(shared.RKEY.SYS.TICK_5, () => this.ws.send('ping'))
	}

	broadcast(message: SocketMessage) {
		this.ws.send(shared.RKEY.BROADCAST + '|' + message.event + '|' + JSON.stringify(message))
	}

	emit(event: string, data?: any) {
		this.ws.send(JSON.stringify({ event, data } as SocketMessage))
	}

	once(event: string, fn: (data?: any) => void) {
		this.ee3.once(event, fn)
	}

	addListener(event: string, fn: (data?: any) => void) {
		this.ee3.addListener(event, fn)
	}

	removeListener(event: string, fn?: (data?: any) => void) {
		this.ee3.removeListener(event, fn)
	}

	removeAllListeners(event?: string) {
		this.ee3.removeAllListeners(event)
	}

}
process.ee3_public = new PublicEmitter()





/*===============================
=            RESTART            =
===============================*/

new cron.CronJob({
	/*----------  3:59:59 AM Weekdays  ----------*/
	cronTime: utils.cronTime('59 59 03 * * 1-5'),
	start: process.PRODUCTION,
	onTick: function() {
		if (!utils.isMaster()) return;
		process.ee3_private.emit(shared.RKEY.SYS.RESTART)
	},
	timeZone: 'America/New_York',
})

new cron.CronJob({
	/*----------  8:30 PM Weekdays  ----------*/
	cronTime: utils.cronTime('30 20 * * 1-5'),
	start: process.PRODUCTION,
	onTick: function() {
		if (!utils.isMaster()) return;
		process.ee3_private.emit(shared.RKEY.SYS.RESTART)
	},
	timeZone: 'America/New_York',
})

if (utils.isMaster()) {
	const restart = _.once(function() {
		// if (process.DEVELOPMENT) return;
		logger.warn('restart')
		logger.flush().then(() => process.exit(0))
	})
	process.ee3_private.once(shared.RKEY.SYS.RESTART, restart)
	process.ee3_public.once(shared.RKEY.SYS.RESTART, restart)
}





/*==============================
=            SERVER            =
==============================*/

import redis = require('./adapters/redis')
import logger = require('./adapters/logger')
import './adapters/socket'
// import './adapters/web.socket'
import './adapters/metrics'
import './adapters/http'
import './adapters/robinhood'
import './adapters/yahoo'
import './adapters/webull'
import './adapters/iex'
import './adapters/ib.gateway'
import './adapters/ib.trader'
import './adapters/storage'
import './watchers/hours'
import './watchers/instruments'
import './watchers/calcs'
import './watchers/markets'
import './watchers/lives'
import './watchers/ewmas'
import './watchers/news'
import './watchers/syncs'
import './watchers/minutes'
import './watchers/wakatime'
// import './watchers/stdevs'
// import './watchers/slopes'
// import './watchers/eods'
import security = require('./adapters/security')





/*===============================
=            RESTIFY            =
===============================*/

const server = restify.createServer()

server.opts(/.*/, utils.restifyRoute(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'))
	res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'))
	res.send(200)
	return next()
}))

server.use(utils.restifyRoute(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'))
	res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'))
	return next()
}))

server.get('/api/logo/:symbol', require('./routes/logo'))

server.use(restify.plugins.fullResponse())
server.use(restify.plugins.bodyParser())
server.use(restify.plugins.queryParser())

server.post('/api/proxy', require('./routes/proxy'))



server.use(utils.restifyRoute(function(req, res, next) {

	Promise.resolve().then(function() {
		if (!req.route) throw new errors.NotFoundError('Undefined request route');

		req.uuid = shared.parseToId(req.headers['x-uuid'])
		if (!req.uuid) throw new errors.PreconditionFailedError('Missing x-uuid header');
		if (req.uuid.length != 32) throw new errors.LengthRequiredError('Invalid x-uuid length');
		if (req.headers['x-xid']) req.xid = req.headers['x-xid'];
		if (req.headers['x-bytes']) req.bytes = shared.parseToId(req.headers['x-bytes']);
		if (req.headers['x-token']) req.token = req.headers['x-token'];
		req.platform = req.headers['x-platform']
		req.appversion = req.headers['x-version']
		req.ip = utils.getIp(req)
		req.conhash = security.getConnectionHash(req.headers)
		req.devsecretvalid = req.headers['x-dev-secret'] == 'FREE BITCOIN'

		// let limit = 8192
		// let len = req.getContentLength()
		// if (len > limit) throw new errors.RequestEntityTooLargeError('Request body exceeds ' + limit + ', ' + len.toString() + ' was your request size');

		if (shared.isBad(req.body)) req.body = {};

		if (process.DEVELOPMENT && !req.query.silent) {
			let body = '{}'
			try {
				if (!_.isEmpty(req.body)) {
					body = JSON.stringify(req.body)
				} else if (!_.isEmpty(req.params)) {
					body = JSON.stringify(req.params)
				}
				body = body.substring(0, 128) + '...'
			} catch (error) {
				console.error(utils.peRender(error))
			}
			console.info(clc.bold('▶ ' + req.method + ' ' + req.route.path + ' ▶ ') + body)
		}

		return redis.main.hgetall(shared.RKEY.SYS.SECURITY + ':' + req.xid)

	}).then(function(sdoc: SecurityDoc) {

		req.sdoc = sdoc
		req.admin = req.sdoc.admin
		req.moderator = req.sdoc.moderator
		req.authed = false
		if (req.token && req.sdoc && Object.keys(req.sdoc).length > 0) {
			let split = req.token.split('.')
			req.token = split[0]
			let stamp = Number.parseInt(split[1])
			let tdiff = Date.now() - stamp
			if (tdiff > 60000) { // 1min
				throw new errors.RequestExpiredError('Token has expired by ' + (tdiff / 1000) + ' seconds')
			}
			let tok = security.getHmacToken({
				uuid: req.uuid,
				bytes: req.bytes,
				ip: req.ip,
				conhash: req.conhash,
				date: req.sdoc.date,
				prime: req.sdoc.prime,
			} as SecurityDoc, true)
			req.authed = tok == req.token
			if (req.authed == true) req.rhtoken = req.sdoc.rhtoken;
		}

		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

}))





/*=====  DIAGNOSTICS  ======*/
server.post('/api/get.logger', require('./routes/get.logger'))
server.post('/api/get.metrics', require('./routes/get.metrics'))
server.post('/api/get.metrics.lives', require('./routes/get.metrics.lives'))
server.post('/api/get.redis', require('./routes/get.redis'))
server.get('/api/get.profiling', require('./routes/get.profiling'))
server.post('/api/get.system', require('./routes/get.system'))

/*=====  QUOTES  ======*/
server.post('/api/migrate.storage', require('./routes/migrate.storage'))
server.post('/api/lives.range', require('./routes/lives.range'))
server.get('/api/get.markets', require('./routes/get.markets'))
server.post('/api/get.news', require('./routes/get.news'))
server.post('/api/calc.quotes', require('./routes/calc.quotes'))
server.post('/api/tiny.quotes', require('./routes/tiny.quotes'))
server.post('/api/small.quotes', require('./routes/small.quotes'))
server.post('/api/minutes.range', require('./routes/minutes.range'))
server.post('/api/screener', require('./routes/screener'))
server.post('/api/get.tinys5m', require('./routes/get.tinys5m'))

/*=====  IB  ======*/
server.post('/api/ib.get', require('./routes/ib.get'))
server.post('/api/ib.submit.order', require('./routes/ib.submit.order'))
server.post('/api/ib.cancel.order', require('./routes/ib.cancel.order'))
server.post('/api/ib.minutes', require('./routes/ib.minutes'))
server.post('/api/ib.liquidate', require('./routes/ib.liquidate'))
server.post('/api/ib.toggle.trading', require('./routes/ib.toggle.trading'))

// /*=====  RH  ======*/
// server.post('/api/rh.login', require('./routes/rh.login'))
// server.get('/api/rh.token', utils.restifyRoute(function(req, res, next) {
// 	res.send(req.rhtoken)
// 	return next()
// }))

// /*=====  AUTHED  ======*/
// server.use(utils.restifyRoute(function(req, res, next) {
// 	if (req.authed != true || !req.rhtoken) {
// 		return next(new errors.UnauthorizedError(`Login required to access "${req.route.path}"`))
// 	}
// 	return next()
// }))

// server.post('/api/rh.logout', require('./routes/rh.logout'))





server.on('uncaughtException', function(req: RestifyRequest, res: RestifyResponse, route: restify.Route, error: any) {
	console.error(clc.bold.redBright('/*==========  RESTIFY UNCAUGHT EXCEPTION  ==========*/'))
	logger.error('restify uncaughtException', utils.peRender(error))
	res.send(new errors.InternalServerError(error.message))
})

server.on('after', function(req: RestifyRequest, res: RestifyResponse, route: restify.Route, error: any) {

	if (res && res.statusCode == 302) return;

	// if (error && !req.route) {
	if (error) {
		let name = _.get(req, 'route.name') as string
		if (['postapigetsystem'].indexOf(name) == -1) {
			console.error(clc.bold.redBright('/*==========  RESTIFY AFTER ERROR  ==========*/'))
			logger.error('restify after > ' + req.method + ' ' + name, utils.peRender(error))
		}
	}

	if (req.route) {
		if (process.DEVELOPMENT && !req.query.silent && req.method != 'OPTIONS') {
			let body = res._body
			try {
				body = JSON.stringify(body)
				body = body.substring(0, 128) + '...'
			} catch (e) { }
			let color: string = (error) ? 'red' : 'bold'
			console.info(clc[color]('◀ ' + req.method + ' ' + req.route.path + ' ◀ ') + body)
		}
		if (req.uuid && req.route.name) {
			redis.main.del('rte:' + req.uuid + ':' + req.route.name)
		}
	}

})





if (utils.isMaster()) {
	console.log(clc.bold('Forking x' + clc.bold.redBright(os.cpus().length) + ' clusters...'))
} else {
	rx.Observable.fromEvent(process.ee3_private, shared.RKEY.SYS.TICK_025).filter(function() {
		return !!process.$marketStamps
	}).take(1).subscribe(function() {
		server.listen(process.$port, process.$host, function() {
			if (utils.isPrimary()) {
				let host = 'robinstocks.com'
				if (process.DEVELOPMENT) host = process.$host + ':' + process.$port;
				logger.primary('\n' +
					clc.bold.underline(process.$dname) + '\n' +
					'v' + process.$version + '\n' +
					clc.bold(process.$env) + '\n' +
					clc.bold.green('@') + host + '\n' +
					'/*===============================================\n' +
					'=========           ' + clc.bold(shared.moment().format('hh:mm:ss')) + '           ==========\n' +
					'===============================================*/'
				)
			}
			utils.readyListening = true
		})
	})
}


