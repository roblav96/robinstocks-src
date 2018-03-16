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
import rx = require('rxjs/Rx')
import redis = require('./redis')



class WebSocket {

	socket: uws

	connecting() { return !!this.socket && this.socket.readyState == this.socket.CONNECTING }
	ready() { return !!this.socket && this.socket.readyState == this.socket.OPEN }

	constructor(private address: string) {
		this.connect()
		process.ee3_private.addListener(shared.RKEY.SYS.TICK_3, () => this.connect())
		process.ee3_private.addListener(shared.RKEY.SYS.TICK_3, () => this.ping())
	}

	send(message: SocketMessage) {
		if (!this.ready()) return;
		this.socket.send(JSON.stringify(message))
	}

	ping() {
		this.send({ action: 'ping' })
	}

	connect() {
		if (this.connecting() || this.ready()) return;
		this.socket = new uws(this.address)
		this.socket.onopen = () => this.onopen()
		this.socket.onclose = () => this.onclose()
		this.socket.onmessage = event => this.onmessage(event)
		this.socket.onerror = error => this.onerror(error)
	}

	onopen() {
		console.info('websocket connected >', this.address)
		this.send({ action: 'sync', data: emitter.eventNames() })
	}

	onclose() {
		this.socket.close()
		this.connect()
	}

	onmessage(event: any) {
		if (event.data == 'pong') return;
		let message = shared.safeParse(event.data) as SocketMessage
		emitter.emit(message.event, message.data)
	}

	onerror(error: any) {
		console.error('websocket onerror > error', error)
	}

}

const sockets = [] as Array<WebSocket>
if (process.DEVELOPMENT && utils.isMaster()) sockets.push(new WebSocket('wss://robinstocks.com/ws'));



class WebSocketEmitter {

	private ee3 = new ee3.EventEmitter()

	eventNames() { return this.ee3.eventNames() as Array<string> }
	listeners(event: string) { return this.ee3.listeners(event) as Array<(data?: any) => void> }

	send(message: SocketMessage) {
		sockets.forEachFast(socket => socket.send(message))
	}

	private _sync = _.debounce(this.sync, 1, { leading: false, trailing: true })
	private sync() {
		this.send({ action: 'sync', data: this.eventNames() })
	}

	emit(event: string, data?: any) {
		this.ee3.emit(event, data)
	}

	addListener(event: string, fn: (data?: any) => void) {
		this.ee3.addListener(event, fn)
		this._sync()
	}

	removeListener(event_fn: string | Function) {
		if (_.isString(event_fn)) {
			this.ee3.removeListener(event_fn)
		}
		if (_.isFunction(event_fn)) {
			this.eventNames().forEachFast(ee3event => {
				let fns = this.listeners(ee3event)
				fns.forEachFast(fn => {
					if (fn == event_fn) this.ee3.removeListener(ee3event, event_fn as any);
				})
			})
		}
		this._sync()
	}

}
export const emitter = new WebSocketEmitter()
