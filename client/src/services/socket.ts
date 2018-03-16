// 

import _ from 'lodash'
import lockr from 'lockr'
import rx from 'rxjs/Rx'
import ee3 from 'eventemitter3'
import * as shared from '../shared'
import * as utils from './utils'
import * as Snackbar from '../comps/snackbar/snackbar'
import * as http from './http'
import * as scope from './scope'



export const rxAlive = new rx.BehaviorSubject(false)
function syncAlive() {
	let lives = _.uniq(sockets.mapFast(v => v.ready()))
	let alive = lives[0] || lives.length == 2
	if (rxAlive.value == alive) return;
	rxAlive.next(alive)
}



class Socket {

	socket: WebSocket

	connecting() { return !!this.socket && this.socket.readyState == this.socket.CONNECTING }
	ready() { return !!this.socket && this.socket.readyState == this.socket.OPEN }

	constructor(private address: string) {
		this.connect()
		// process.ee3.addListener(shared.RKEY.SYS.TICK_3, () => this.reconnect())
		process.ee3.addListener(shared.RKEY.SYS.TICK_3, () => this.ping())
	}

	send(message: SocketMessage) {
		if (!this.ready()) return;
		this.socket.send(JSON.stringify(message))
	}

	ping() {
		this.send({ action: 'ping' })
	}

	reconnect = _.throttle(this.connect, 1000, { leading: false, trailing: true })
	connect() {
		if (this.connecting() || this.ready()) return;
		this.socket = new WebSocket(this.address)
		this.socket.onopen = () => this.onopen()
		this.socket.onclose = () => this.onclose()
		this.socket.onmessage = event => this.onmessage(event)
		this.socket.onerror = error => this.onerror(error)
	}

	onopen() {
		console.info('socket connected >', this.address)
		syncAlive()
		emitter.resync()
		// this.send({ action: 'sync', data: emitter.eventNames() })
	}

	onclose() {
		this.socket.close()
		syncAlive()
		this.reconnect()
	}

	onmessage(event: MessageEvent) {
		if (event.data == 'pong') return;
		let message = shared.safeParse(event.data) as SocketMessage
		// console.log('socket message', message.event, message.data)
		emitter.emit(message.event, message.data)
	}

	onerror(error: Event) {
		console.error('socket onerror > error', error)
		Snackbar.rxItems.next({ message: 'WebSocket connection error ▶ ' + this.address, color: 'error' })
		syncAlive()
		this.reconnect()
	}

}

const sockets = [] as Array<Socket>
sockets.push(new Socket('wss://robinstocks.com/ws'))
if (process.DEVELOPMENT) sockets.push(new Socket('ws://localhost:3338/ws'));



class Emitter {

	private rxBuffer = new rx.Subject<any>()

	private ee3 = new ee3.EventEmitter()

	eventNames() { return this.ee3.eventNames() as Array<string> }
	listeners(event: string) { return this.ee3.listeners(event) as Array<(data?: any) => void> }

	send(message: SocketMessage) {
		sockets.forEachFast(socket => socket.send(message))
	}

	resync = _.throttle(this.sync, 10, { leading: false, trailing: true })
	sync() {
		this.send({ action: 'sync', data: this.eventNames() })
	}

	emit(event: string, data?: any) {
		this.ee3.emit(event, data)
	}

	addListener(event: string, fn: (data?: any) => void) {
		this.ee3.addListener(event, fn)
		this.resync()
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
		this.resync()
	}

}
export const emitter = new Emitter()







// setInterval(function () {
// 	console.log('emitter.eventNames()', emitter.eventNames())
// },1000)



// function wsCalcs(cquote: CalcQuote) {
// 	console.log('cquote', cquote)
// }

// setTimeout(function() {
// 	emitter.addListener('calcs:AMD', wsCalcs)
// }, 1000)

// setTimeout(function() {
// 	emitter.removeListener('calcs:AMD')
// 	// emitter.removeListener(wsCalcs)
// }, 1000)









// let socket: WebSocket

// connect()
// const _connect = _.throttle(connect, 300, { leading: false, trailing: true })
// function connect() {
// 	if (socket && socket.readyState == socket.OPEN) return;

// 	let address = process.$domain.replace('http', 'ws') + '/ws'
// 	socket = new WebSocket(address)

// 	socket.onopen = function(event) {
// 		console.log('connected')
// 		Object.keys(emitter.events).forEachFast(function(event) {
// 			socket.send(JSON.stringify({ action: 'subscribe', event }))
// 		})
// 	}

// 	socket.onclose = function(event) {
// 		// console.log('onclose', event)
// 		socket.close()
// 		setTimeout(connect, 250)
// 	}

// 	socket.onmessage = function(event) {
// 		if (event.data == 'pong') return;
// 		let message = JSON.parse(event.data) as { event: string, data: any }
// 		console.log('onmessage', message)
// 		emitter.events[message.event].fn(message.data)
// 	}

// 	socket.onerror = function(error) {
// 		if (socket.readyState == socket.CLOSED) return;
// 		console.error('onerror', error)
// 	}

// }

// setInterval(function() {
// 	if (socket.readyState == socket.OPEN) {
// 		socket.send(JSON.stringify({ action: 'ping' }))
// 	}
// }, 3000)



// const subs = lockr.get('socket.subs', [] as Array<string>)
// export function subscribe(name: string, cb: Function) {
// 	socket.send(JSON.stringify({ event: 'subscribe', name }))
// }





// class Socket {

// 	static address = process.$domain.replace('http', 'ws') + '/ws'
// 	static socket: WebSocket

// 	constructor() {

// 	}

// 	init() {
// 		Socket.socket = new WebSocket(Socket.address)

// 		Socket.socket.onopen = function(event) {
// 			// console.log('onopen', event)
// 		}
// 		Socket.socket.onclose = function(event) {
// 			// console.log('onclose', event)
// 			Socket.socket.close()
// 			Socket.socket = null
// 			_.delay(init, 250)
// 		}

// 		Socket.socket.onmessage = function(event) {
// 			console.log('onmessage', event)
// 		}

// 		Socket.socket.onerror = function(error) {
// 			console.error('onerror', error)
// 		}
// 	}

// }

// export const socket = new Socket()





