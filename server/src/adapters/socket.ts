//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')
import logger = require('./logger')

import ee3 = require('eventemitter3')
import uws = require('uws')
import redis = require('./redis')



declare global {
	interface Socket extends uws {
		events: Array<string>
	}
}



let allevents = [] as Array<string>
function syncEvents(message) {
	message = shared.safeParse(message)
	if (!Array.isArray(message)) return;
	allevents = message
}
process.ee3_public.addListener('_socket.syncEvents', syncEvents)



export function hasSubscriber(event: string) {
	return allevents.indexOf(event) >= 0
}

export function emit<T>(event: string, data: T) {
	if (!hasSubscriber(event)) return;
	process.ee3_public.broadcast({ event, data })
}



if (utils.isMaster()) {

	const wss = new uws.Server({
		port: process.$port + 1,
		clientTracking: false,
	})

	process.ee3_private.addListener(shared.RKEY.BROADCAST, function(data: string) {
		let i = data.indexOf('|{"')
		let event = data.substring(0, i)
		let message = data.substring(i + 1)
		wss.clients.forEach(function(socket: Socket) {
			if (socket.events.indexOf(event) >= 0) socket.send(message);
		})
	})

	const syncEvents = function() {
		let events = [] as Array<string>
		wss.clients.forEach(function(socket: Socket) {
			events = events.concat(socket.events)
		})
		events = _.uniq(_.compact(events))
		process.ee3_public.emit('_socket.syncEvents', JSON.stringify(events))
	}

	wss.on('connection', function(socket: Socket) {
		if (!Array.isArray(socket.events)) socket.events = [];
		socket.on('message', function(message: SocketMessage) {
			message = shared.safeParse(message)
			if (message.action == 'ping') return socket.send('pong');
			if (message.action == 'sync') {
				socket.events = message.data
				syncEvents()
			}
		})
		socket.on('close', function(code, message) {
			syncEvents()
		})
	})

	wss.on('error', function(error) {
		logger.error('socket wss > error', utils.peRender(error as any))
	})

	const cleanup = _.once(function() { wss.removeAllListeners(); wss.close() })
	process.on('beforeExit', cleanup)
	process.on('exit', cleanup)

}





// const brokerport = process.$port - 2

// class BrokerEmitter {

// 	private ws = new uws('ws://localhost:' + ee3port + '/master')
// 	private ee3 = new ee3.EventEmitter()

// 	constructor() {
// 		this.ws.on('message', (message: SocketMessage) => {
// 			message = shared.safeParse(message)
// 			this.ee3.emit(message.event, message.data)
// 		})
// 	}

// 	emit(event: string, data?: any) {
// 		this.ws.send(JSON.stringify({ event, data } as SocketMessage))
// 	}

// 	once(event: string, fn: (data?: any) => void) {
// 		this.ee3.once(event, fn)
// 	}

// 	addListener(event: string, fn: (data?: any) => void) {
// 		this.ee3.addListener(event, fn)
// 	}

// 	removeListener(event: string, fn?: (data?: any) => void) {
// 		this.ee3.removeListener(event, fn)
// 	}

// 	removeAllListeners(event?: string) {
// 		this.ee3.removeAllListeners(event)
// 	}

// }
// process.ee3_public = new BrokerEmitter()





// if (!utils.isMaster()) {

// 	process.ee3_public.addListener(shared.RKEY.SOCKET, function(message: SocketMessage) {
// 		message = shared.safeParse(message)
// 		wss.clients.forEach(function(socket: Socket) {
// 			if (socket.events.indexOf(message.event) >= 0) {
// 				socket.send(JSON.stringify(message))
// 			}
// 		})
// 	})

// 	const wss = new uws.Server({
// 		port: wssport + process.$instance,
// 		clientTracking: true,
// 		// verifyClient: function(info, cb) { cb(true) },
// 	})

// 	wss.on('connection', function(socket: Socket) {
// 		if (!Array.isArray(socket.events)) socket.events = [];
// 		// if (process.DEVELOPMENT) console.log('connection');

// 		socket.on('message', function(message: SocketMessage) {
// 			message = shared.safeParse(message)
// 			if (message.action == 'ping') return socket.send('pong');
// 			if (message.action == 'sync') socket.events = message.data;
// 		})

// 	})

// 	wss.on('error', function(error) {
// 		logger.error('wss > error', utils.peRender(error as any))
// 	})

// 	cluster.worker.on('disconnect', function() {
// 		wss.removeAllListeners()
// 		wss.close()
// 	})

// }





// if (utils.isPrimaryNode()) {
// 	setTimeout(function() {
// 		console.log('ws.send')
// 		socket.send('eventz')
// 	}, 1000)
// }



// // let wschost = 'ws://' + host + ':' + port + '/ws'
// let wschost = 'ws://' + 'dev.robinstocks.com' + '/ws'
// export const ws = new uws(wschost, {

// })

// ws.on('open', function() {
// 	console.warn('open')
// 	// ws.send('This will be sent!')
// })

// ws.on('message', function(data) {
// 	console.info('ws.on message >')
// 	eyes.inspect(data)
// })

// ws.on('error', function(error) {
// 	console.error('ws > error', error)
// })




