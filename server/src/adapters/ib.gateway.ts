//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import utils = require('./utils')
import shared = require('../shared')
import logger = require('./logger')

import cron = require('cron')
import nib = require('ib')
import rx = require('rxjs/Rx')
import pdelay = require('delay')
import pevent = require('p-event')
import pqueue = require('p-queue')
import pall = require('p-all')
import ptimeout = require('p-timeout')
import redis = require('./redis')
import r = require('./rethinkdb')
import socket = require('./socket')
import storage = require('./storage')
import robinhood = require('./robinhood')
import ibtr = require('./ib.trader')



let ib: nib
// const clientId = 0
const clientId = 0 // { server: 0, desktop: 1, laptop: 2 }[process.env.SYSTEM] as number
const rxAlive = new rx.BehaviorSubject(false)
const rxValidId = new rx.BehaviorSubject(NaN)
const rxAcctId = new rx.BehaviorSubject('')
const rxAccount = new rx.BehaviorSubject({} as nib.Account)





function onReady() {
	if (!utils.isMaster()) return;
	// if (process.PRODUCTION) return;
	if (process.DEVELOPMENT) return;





	ib = new nib({
		clientId,
		host: process.PRODUCTION ? 'localhost' : '192.34.85.234',
		port: 4002,
	})

	ib.on('error', function(error, data = { id: -1, code: -1 }) {
		let iserror = error.message.toLowerCase().trim().indexOf('warn') == -1

		let codemessage = ERROR_CODES[data.code.toString()]
		if (codemessage) error.message = error.message + ' [TWS message]: ' + codemessage;
		error.message = error.message.trim().replace(/\s\s+/g, ' ').replace(/\n+/g, ' ')
		if (_.last(error.message) != '.') error.message += '.';

		if (data.code >= 2100 && data.code <= 2137) iserror = false;
		if (error.message.indexOf('data maintained') >= 0) iserror = false;
		if (error.message.indexOf('server is broken') >= 0) iserror = true;
		if (error.message.toLowerCase().indexOf('cancel') >= 0) iserror = false;

		if (data.id > 0) {
			error.message = '[Order #' + data.id + '] ' + error.message
			if (iserror) {
				let cancel = false
				if (error.message.indexOf('Duplicate order') >= 0) cancel = true;
				if (cancel) cancelOrder(data.id);
			}
		}

		process.ee3_private.emit('ib:' + data.id, {
			orderId: data.id, event: 'error', message: error.message, code: data.code, iserror,
		} as IbEventData)

		let level = iserror ? 'error' : 'warn'
		let render = iserror ? utils.peRender(error.message as any) : error.message
		logger[level](JSON.stringify(data), '\nib ' + level + ' >', render)

	})





	/*==============================
	=            RESULT            =
	==============================*/

	ib.on('result', function(event, args) {

		if ([
			'currentTime',
			// 'nextValidId',
			'managedAccounts',
			'accountSummary',
			'accountSummaryEnd',
			'accountDownloadEnd',
			'updateAccountValue',
			'updateAccountTime',

			'updatePortfolio',
			'position',
			'positionEnd',

			'orderStatus',
			'openOrder',
			'openOrderEnd',

			'commissionReport',
			'execDetails',
			'execDetailsEnd',

		].indexOf(event) >= 0) {
			return
		}

		if ([
			// 'currentTime',
			// 'nextValidId',
			// 'managedAccounts',
			// 'accountSummary',
			// 'accountSummaryEnd',
			// 'accountDownloadEnd',
			// 'updateAccountValue',
			// 'updateAccountTime',

			// 'updatePortfolio',
			// 'position',
			// 'positionEnd',

			// 'orderStatus',
			// 'openOrder',
			// 'openOrderEnd',

			// 'commissionReport',
			// 'execDetails',
			// 'execDetailsEnd',

		].indexOf(event) >= 0) {
			return console.log(clc.bold(event))
		}

		console.info(clc.bold(event) + ' >')
		eyes.inspect(args)

		// }).on('received', function(tokens, data) {
		// 	console.log('received >', 'tokens', tokens, 'data', data)

		// }).on('sent', function(tokens, data) {
		// 	console.log('sent >', 'tokens', tokens, 'data', data)

	})

	/*----------  End of RESULT  ----------*/





	/*==================================
	=            CONNECTION            =
	==================================*/

	ib.on('connected', function() {
		logger.info('ib connected')
		rxAlive.next(true)

	}).on('disconnected', function() {
		logger.warn('ib disconnected')
		rxAlive.next(false)

	}).on('server', function(version, connectionTime) {
		connectionTime = shared.string_insertAt(connectionTime, '-', 4)
		connectionTime = shared.string_insertAt(connectionTime, '-', 7)
		// console.info('ib server', 'version', version, '@', shared.prettyStamp(new Date(connectionTime).valueOf()))

	})

	/*----------  End of CONNECTION  ----------*/





	/*===============================
	=            ACCOUNT            =
	===============================*/

	// rxAcctId.filter(v => !!v).take(1).subscribe(function(acct) {
	// 	console.log(`subscribe(function(acct`)
	// 	ib.reqAccountUpdates(true, acct)
	// 	if (clientId == 0) ib.reqAutoOpenOrders(true);
	// })

	redis.ib.hgetall(shared.RKEY.IB.ACCOUNT).then(function(resolved) {
		let account = utils.fromhget(resolved) as nib.Account
		if (shared.isBad(account.EodNetLiquidation)) account.EodNetLiquidation = account.NetLiquidation;
		rxAccount.next(account)
	})

	rxAccount.filter(v => !_.isEmpty(v)).subscribe(_.throttle(function() {
		rxAccount.value.stamp = shared.now()
		socket.emit(shared.RKEY.IB.ACCOUNT, rxAccount.value)
		redis.ib.hmset(shared.RKEY.IB.ACCOUNT, utils.tohset(rxAccount.value))
	}, 100, { leading: false, trailing: true }))

	ib.on('managedAccounts', function(acct) {
		if (!acct) return;
		logger.info('ib managedAccounts', acct)
		rxAcctId.next(acct)
		ib.reqAccountUpdates(true, acct)
		ib.reqAccountSummary(randomId(), 'All', Object.keys(ACCOUNT_TAGS))
		ib.reqPositions()
		ib.reqAllOpenOrders()
		ib.reqExecutions(randomId(), {})
		if (clientId == 0) ib.reqAutoOpenOrders(true);

	}).on('accountDownloadEnd', function(acct) {

	}).on('updateAccountValue', function(k, v, unit, acct) {
		rxAccount.value[k] = fixAccountValue(v)
		rxAccount.next(rxAccount.value)

	}).on('updateAccountTime', function(stamp) {
		let to = shared.moment(shared.moment().format('YYYY-MM-DD') + ' ' + stamp).valueOf()
		let from = rxAccount.value.lastUpdate
		if (Number.isFinite(from) && to <= from) return;
		rxAccount.value.lastUpdate = to
		rxAccount.next(rxAccount.value)

	}).on('accountSummary', function(reqid, account, k, v, currency) {
		rxAccount.value[k] = fixAccountValue(v)
		rxAccount.next(rxAccount.value)

	}).on('accountSummaryEnd', function(reqid) {

	})

	/*----------  End of ACCOUNT  ----------*/





	/*=================================
	=            POSITIONS            =
	=================================*/

	ib.on('updatePortfolio', function(contract, position, marketPrice, marketValue, avgCost, unrealizedPNL, realizedPNL, acct) {
		let ibposition = { symbol: contract.symbol, position, marketPrice, marketValue, avgCost, unrealizedPNL, realizedPNL } as nib.Position
		rxPositions.next(ibposition)
		// console.info(clc.bold('updatePortfolio') + ' >')
		// eyes.inspect(ibposition)

	}).on('position', function(account, contract, position, avgCost) {
		let ibposition = { symbol: contract.symbol, position, avgCost } as nib.Position
		rxPositions.next(ibposition)
		// console.info(clc.bold('position') + ' >')
		// eyes.inspect(ibposition)

	}).on('positionEnd', function() {

	})

	/*----------  End of POSITIONS  ----------*/





	/*==============================
	=            ORDERS            =
	==============================*/

	ib.on('contractDetails', function(reqId, contract) {

	}).on('contractDetailsEnd', function(reqId) {

	})

	ib.on('nextValidId', function(orderId) {
		rxValidId.next(orderId)
	})

	ib.on('openOrder', function(orderId, contract, order, state) {
		order.symbol = contract.symbol
		order.rule80A = Number.parseFloat(order.rule80A as any)
		Object.assign(order, state)
		fixIb(order)
		if (order.status) order.active = ['Cancelled', 'Filled'].indexOf(order.status) == -1;
		// console.info(clc.bold('openOrder') + ' >')
		// eyes.inspect(order)

		process.ee3_private.emit('ib:' + orderId, { orderId, event: 'openOrder', order } as IbEventData)
		rxOrders.next(order)

	}).on('openOrderEnd', function() {

	})

	ib.on('orderStatus', function(orderId, status, filled, remaining, avgFillPrice, permId, parentId, lastFillPrice, clientId, whyHeld) {
		let ibstatus = { orderId, status, filled, remaining, avgFillPrice, permId, parentId, lastFillPrice, clientId, whyHeld } as nib.Status
		fixIb(ibstatus)
		if (ibstatus.status) ibstatus.active = ['Cancelled', 'Filled'].indexOf(ibstatus.status) == -1;
		// console.info(clc.bold('ibstatus') + ' >')
		// eyes.inspect(ibstatus)

		process.ee3_private.emit('ib:' + orderId, { orderId, event: 'orderStatus', ibstatus } as IbEventData)
		rxOrders.next(ibstatus as any)

	})

	/*----------  End of ORDERS  ----------*/





	/*==================================
	=            EXECUTIONS            =
	==================================*/

	ib.on('execDetails', function(reqId, contract, exec) {
		exec.symbol = contract.symbol
		exec.shares = Number.parseFloat(exec.shares as any)
		exec.time = exec.time.replace('  ', 'T').replace(/[:]/g, '')
		exec.lastUpdate = shared.moment(exec.time).valueOf()
		fixIb(exec)
		// console.info(clc.bold('execDetails') + ' >')
		// eyes.inspect(exec)

		process.ee3_private.emit('ib:' + exec.orderId, { orderId: exec.orderId, event: 'execDetails', exec } as IbEventData)
		rxExecutions.next(exec)

	}).on('execDetailsEnd', function(reqId) {

	})

	ib.on('commissionReport', function(report) {
		fixIb(report)
		// console.info(clc.bold('commissionReport') + ' >')
		// eyes.inspect(report)

		rxExecutions.next(report as any)

	})

	/*----------  End of EXECUTIONS  ----------*/





	process.ee3_private.addListener(shared.RKEY.SYS.TICK_10, function() {
		if (!ib || !rxAcctId.value) return;
		if (rxAlive.value == false) ib.connect();
		if (rxAlive.value == true) ib.reqCurrentTime();
	})

	const cleanup = _.once(function() { ib.disconnect(); ib = null })
	process.on('beforeExit', cleanup)
	process.on('exit', cleanup)

	ib.connect()

}
process.ee3_private.once(shared.RKEY.SYS.READY, onReady)





/*----------  BUFFERS  ----------*/

class ibBuffer<T = any> {

	private rxSubject = new rx.Subject<T>()
	private rxBuffer = new rx.Subject<void>()
	private rxThrottle = _.throttle(() => this.rxBuffer.next(), this.time, { leading: false, trailing: true })

	next(value: T) {
		this.rxSubject.next(value)
		this.rxThrottle()
	}

	constructor(
		private primarykey: string,
		private fn: (items: Array<T>) => void,
		private time = 10,
	) {

		this.rxSubject.map((item: any) => {
			item.nano = utils.getNano()
			item.stamp = shared.now()
			return item
		}).buffer(this.rxBuffer).filter(items => {
			// }).buffer(rx.Observable.interval(10)).filter(items => {
			return items.length > 0
		}).map(items => {
			return shared.rxMergeBuffer(items, 'nano', this.primarykey, true)
		}).subscribe(this.fn)
		// }).subscribe(items => {
		// 	// console.log('items >')
		// 	// eyes.inspect(items)
		// 	console.log(this.primarykey, 'items.length', items.length)
		// })

	}

}



const rxPositions = new ibBuffer<nib.Position>('symbol', function(positions) {
	Promise.resolve().then(function() {

		positions.forEachFast(function(position) {
			let cquote = {
				symbol: position.symbol,
				position: position.position,
				avgCost: position.avgCost,
				realizedPNL: position.realizedPNL,
				positionStamp: position.stamp,
			} as CalcQuote
			// if (shared.marketState() == 'REGULAR') cquote.realizedPNL = position.realizedPNL;
			storage.remoteCalcUpdate(cquote)
		})

		socket.emit(shared.RKEY.IB.POSITIONS, positions)

		return r.table('ib_positions').insert(positions, { conflict: 'update' }).run()

	}).catch(function(error) {
		logger.error('ib rxPositions > error', utils.peRender(error))
		return Promise.resolve()
	})

})



const rxOrders = new ibBuffer<nib.Order>('orderId', function(orders) {
	Promise.resolve().then(function() {

		let okeys = ['orderId', 'symbol', 'status', 'createdAt', 'cancelledAt', 'filledAt']
		let oids = orders.mapFast(v => v.orderId)
		return r.table('ib_orders').getAll(r.args(oids)).pluck(okeys as any).run()

	}).then(function(iborders: Array<nib.Order>) {

		orders.forEachFast(function(order, i) {
			shared.repair(order, iborders.find(v => v && v.orderId == order.orderId))

			if (!Number.isFinite(order.createdAt)) {
				order.createdAt = shared.now()
			}

			if (order.status == 'Inactive') {
				order.status = 'Cancelled'
			}

			if (order.status == 'Cancelled' && !Number.isFinite(order.cancelledAt)) {
				order.cancelledAt = shared.now()
			}

			if (order.status == 'Filled' && !Number.isFinite(order.filledAt)) {
				order.filledAt = shared.now()
			}

			order.active = ['Cancelled', 'Filled'].indexOf(order.status) == -1

		})

		socket.emit(shared.RKEY.IB.ORDERS, orders)

		return r.table('ib_orders').insert(orders, { conflict: 'update' }).run()

	}).catch(function(error) {
		logger.error('ib rxOrders > error', utils.peRender(error))
		return Promise.resolve()
	})

})



const rxExecutions = new ibBuffer<nib.Execution>('execId', function(executions) {
	Promise.resolve().then(function() {

		let ekeys = ['execId', 'symbol', 'createdAt']
		let eids = executions.mapFast(v => v.execId)
		return r.table('ib_executions').getAll(r.args(eids)).pluck(ekeys as any).run()

	}).then(function(ibexecutions: Array<nib.Execution>) {

		executions.forEachFast(function(execution, i) {
			shared.repair(execution, ibexecutions.find(v => v && v.execId == execution.execId))

			if (!Number.isFinite(execution.createdAt)) {
				execution.createdAt = shared.now()
			}

		})

		socket.emit(shared.RKEY.IB.EXECUTIONS, executions)

		return r.table('ib_executions').insert(executions, { conflict: 'update' }).run()

	}).catch(function(error) {
		logger.error('ib rxExecutions > error', utils.peRender(error))
		return Promise.resolve()
	})

})





/*----------  TRADING  ----------*/

interface IbEventData {
	orderId: number
	event: string
	iserror: boolean
	message: string
	code: number
	order: nib.Order
	ibstatus: nib.Status
	exec: nib.Execution
}

const queue = new pqueue({ concurrency: 1 })
if (utils.isMaster()) {
	process.ee3_private.once(shared.RKEY.SYS.READY, function onReady() {
		process.ee3_public.addListener('ib:submitOrder', (iborder: nib.Order) => queue.add(() => queueSubmitOrder(iborder)))
		process.ee3_public.addListener('ib:cancelOrder', (iborder: nib.Order) => queue.add(() => queueCancelOrder(iborder)))
	})
}

function aliveSafety(pubId: number, message = '') {
	if (!ib || rxAlive.value == false || !Number.isFinite(rxValidId.value)) {
		if (!ib) message = 'IB Gateway has not been initiated! ' + message;
		else if (rxAlive.value == false) message = 'IB Gateway is disconnected! ' + message;
		else if (!Number.isFinite(rxValidId.value)) message = 'ValidId is not ready! ' + message;
		process.ee3_public.emit('ib:' + pubId, { event: 'error', iserror: true, message: message.trim() } as IbEventData)
		return true
	}
	return false
}



function queueSubmitOrder(order: nib.Order) {
	return Promise.resolve().then(function() {
		if (aliveSafety(order.pubId, 'Order was NOT submitted!')) return Promise.resolve();

		if (Number.isFinite(order.auxPrice)) order.auxPrice = fixPrice(order.auxPrice);
		if (Number.isFinite(order.lmtPrice)) order.lmtPrice = fixPrice(order.lmtPrice);

		// console.log('queueSubmitOrder > order >')
		// eyes.inspect(order)

		let modifying = Number.isFinite(order.orderId)
		if (!modifying) order.orderId = rxValidId.value;

		Object.assign(order, {
			overridePercentageConstraints: true,
			transmit: true,
		} as nib.Order)

		return new Promise(function(resolve) {

			let message = null as string
			function resolver(data: IbEventData) {
				if (data.event == 'error' && data.iserror == false) {
					if (data.message) message = data.message;
					return
				}
				if (['openOrder', 'error'].indexOf(data.event) == -1) return;
				process.ee3_private.removeListener('ib:' + data.orderId, resolver)
				if (message && data.order) data.order.message = message;
				resolve(data)
			}
			process.ee3_private.addListener('ib:' + order.orderId, resolver)

			ib.placeOrder(order.orderId, ib.contract.stock(order.symbol), order)

		}).then(function(data: IbEventData) {
			if (data.iserror) {
				console.error('queueSubmitOrder (data.iserror) > order')
				eyes.inspect(order)
			}
			process.ee3_public.emit('ib:' + order.pubId, data)
			return new Promise(function(resolve) {
				rxValidId.skip(1).take(1).subscribe(resolve)
				ib.reqIds(1)
			}) as any
		})

	})
}

export function submitOrder(order: nib.Order): Promise<nib.Order> {
	return Promise.resolve().then(function() {
		utils.validate(order, ['symbol', 'action', 'totalQuantity', 'orderType', 'tif'])
		order.pubId = randomId()

		// console.log('submitOrder > order >')
		// eyes.inspect(order)

		let modifying = Number.isFinite(order.orderId)

		if (order.totalQuantity <= 0) {
			logger.error('(order.totalQuantity <= 0) order >')
			eyes.inspect(order)
			throw new errors.PreconditionFailedError('The order quantity (' + order.totalQuantity + ') must be greater than zero.')
		}

		if (!modifying && order.action == 'BUY') return Promise.resolve();

		let proms = [r.table('ib_positions').get(order.symbol).run()]
		if (modifying) proms.push(r.table('ib_orders').get(order.orderId).pluck(['orderId', 'symbol', 'status', 'orderType', 'totalQuantity'] as any).run());
		return Promise.all(proms).then(function(resolved) {

			let ibposition = resolved[0] as nib.Position
			if (!modifying && ibposition && order.action == 'SELL' && Number.isFinite(ibposition.position) && (ibposition.position - order.totalQuantity) < 0) {
				logger.error('(ibposition.position - order.totalQuantity) order >')
				eyes.inspect(order)
				throw new errors.PreconditionFailedError('The order quantity (' + order.totalQuantity + ') is greater than your current position of ' + ibposition.position + ' shares.')
			}

			if (modifying) {
				let iborder = resolved[1] as nib.Order
				if (_.isEmpty(iborder)) throw new errors.PreconditionFailedError(`Order #${order.orderId} does not exist!`);
				if (iborder.status == 'PendingCancel') throw new errors.PreconditionFailedError(`Order #${order.orderId} is pending cancellation.`);
				if (iborder.status == 'ApiCancelled') throw new errors.PreconditionFailedError(`Order #${order.orderId} has already been cancelled by the API.`);
				if (iborder.status == 'Cancelled') throw new errors.PreconditionFailedError(`Order #${order.orderId} is already cancelled.`);
				if (iborder.status == 'Filled') throw new errors.PreconditionFailedError(`Order #${order.orderId} has already been filled.`);
				if (order.orderType != iborder.orderType) throw new errors.PreconditionFailedError(`Can't change order #${order.orderId} type from "${iborder.orderType}" to "${order.orderType}".`);
			}

			return Promise.resolve()
		})

	}).then(function() {
		return new Promise(function(resolve) {
			process.ee3_public.once('ib:' + order.pubId, resolve)
			process.ee3_public.emit('ib:submitOrder', order)
		})

	}).then(function(data: IbEventData) {
		if (data.iserror) throw new errors.BadRequestError(data.message);
		return Promise.resolve(data.order)
	})
}



function queueCancelOrder(order: nib.Order) {
	return Promise.resolve().then(function() {
		if (aliveSafety(order.pubId, `Order #${order.orderId} was NOT cancelled!`)) return Promise.resolve();

		return new Promise(function(resolve) {
			process.ee3_private.once('ib:' + order.orderId, resolve)
			ib.cancelOrder(order.orderId)

		}).then(function(data: IbEventData) {
			if (data.code == 10147) { // not found
				return r.table('ib_orders').get(order.orderId).run().then(function(iborder: nib.Order) {
					if (_.isEmpty(iborder)) return Promise.resolve(data);
					iborder.status = 'Cancelled'
					iborder.cancelledAt = shared.now()
					iborder.active = false
					rxOrders.next(iborder)
					data.order = iborder
					return Promise.resolve(data)
				})
			}
			return Promise.resolve(data)

		}).then(function(data: IbEventData) {
			process.ee3_public.emit('ib:' + order.pubId, data)
			return Promise.resolve()
		})

	})
}

export function cancelOrder(orderId: number): Promise<nib.Order> {
	return Promise.resolve().then(function() {
		if (!Number.isFinite(orderId)) throw new errors.PreconditionFailedError('Invalid or missing order id!');

		return r.table('ib_orders').get(orderId).run()

	}).then(function(iborder: nib.Order) {
		if (_.isEmpty(iborder)) throw new errors.PreconditionFailedError(`Order #${orderId} does not exist!`);
		if (iborder.status == 'PendingCancel') throw new errors.PreconditionFailedError(`Order #${orderId} is pending cancellation.`);
		if (iborder.status == 'ApiCancelled') throw new errors.PreconditionFailedError(`Order #${orderId} has already been cancelled by the API.`);
		if (iborder.status == 'Cancelled') throw new errors.PreconditionFailedError(`Order #${orderId} is already cancelled.`);
		if (iborder.status == 'Filled') throw new errors.PreconditionFailedError(`Order #${orderId} has already been filled.`);

		let order = { orderId, pubId: randomId() } as nib.Order
		return new Promise(function(resolve) {
			process.ee3_public.once('ib:' + order.pubId, resolve)
			process.ee3_public.emit('ib:cancelOrder', order)
		})

	}).then(function(data: IbEventData) {
		if (data.iserror) throw new errors.BadRequestError(data.message);
		return r.table('ib_orders').get(data.orderId).run()
	})
}





/*----------  MINUTES  ----------*/

new cron.CronJob({
	/*----------  Every Minute Weekdays  ----------*/
	cronTime: utils.cronTime('* * * * 1-5'),
	start: process.PRODUCTION,
	onTick: syncMinutes,
	timeZone: 'America/New_York',
	// runOnInit: process.DEVELOPMENT,
})

function syncMinutes() {
	if (!utils.isMaster() || process.DEVELOPMENT) return;

	let end = shared.moment().startOf('minute').valueOf()
	let start = shared.moment(end).subtract(1, 'minute').valueOf()
	if (shared.marketState(start) == 'CLOSED') return;

	Promise.resolve().then(function() {
		return getIb({ start, end })

	}).then(function(response: IbMinute) {
		response.account = _.omitBy(response.account, (v, k) => Array.isArray(k.match(/\W+/))) as any
		response.positions = response.positions.filter(v => v.position != 0)
		response.orders = response.orders.mapFast(v => _.pick(v, ['orderId', 'symbol', 'action', 'orderType', 'totalQuantity', 'auxPrice', 'lmtPrice', 'avgFillPrice', 'filled', 'status', 'createdAt', 'cancelledAt', 'filledAt'])) as any
		response.executions = response.executions.mapFast(v => _.pick(v, ['execId', 'symbol', 'orderId', 'side', 'cumQty', 'shares', 'avgPrice', 'price', 'commission', 'realizedPNL', 'createdAt', 'lastUpdate'])) as any
		response.stamp = end
		return r.table('ib_minutes').insert(response, { conflict: 'replace' }).run()

	}).catch(function(error) {
		logger.error('ib syncMinutes > error', utils.peRender(error))
	})

}



new cron.CronJob({
	/*----------  3:52:30 AM Weekdays  ----------*/
	cronTime: utils.cronTime('30 52 03 * * 1-5'),
	start: true,
	onTick: startDay,
	timeZone: 'America/New_York',
})
function startDay() {
	if (!utils.isMaster() || process.DEVELOPMENT) return;

	let tstart = Date.now()
	logger.master('ib startDay > start')
	Promise.resolve().then(function() {
		return getIb({ account: true })

	}).then(function(response) {
		let account = response.account
		account.EodNetLiquidation = account.NetLiquidation
		socket.emit(shared.RKEY.IB.ACCOUNT, account)
		return redis.ib.hmset(shared.RKEY.IB.ACCOUNT, utils.tohset(account))

	}).then(function() {
		logger.master('ib startDay > done ' + shared.getDuration(tstart))
		return Promise.resolve()

	}).catch(function(error) {
		logger.error('ib startDay > error', utils.peRender(error))
	})
}



new cron.CronJob({
	/*----------  8:01 PM Weekdays  ----------*/
	cronTime: utils.cronTime('01 20 * * 1-5'),
	start: process.PRODUCTION,
	onTick: endDay,
	timeZone: 'America/New_York',
})
function endDay() {
	if (!utils.isMaster() || process.DEVELOPMENT) return;

	let tstart = Date.now()
	logger.master('ib endDay > start')
	Promise.resolve().then(function() {
		return getIb({ account: true })

	}).then(function(response) {
		return r.table('ib_days').insert({
			account: _.omitBy(response.account, (v, k) => Array.isArray(k.match(/\W+/))),
			date: shared.moment().format('YYYY-MM-DD'),
			stamp: shared.now(),
		} as IbDay).run()

	}).then(function(response) {
		logger.master('ib endDay > done ' + shared.getDuration(tstart))
		return Promise.resolve()

	}).catch(function(error) {
		logger.error('ib endDay > error', utils.peRender(error))
	})
}





/*----------  UTILS  ----------*/

export function fixPrice(price: number) {
	let precision = _.round(price * 10000) % 10 == 0 ? 2 : 4
	return _.round(price, precision)
}

export function randomId() {
	let hr = process.hrtime()
	let nano = (hr[0] * 1000000000) + hr[1]
	return Number.parseInt(shared.hash(nano).slice(-6))
}

const INF_N = 1.7976931348623157e+308 as any
const INF_S = '1.7976931348623157e+308' as any

function fixAccountValue(v: string) {
	if (!isNaN(v as any)) v = Number.parseFloat(v) as any;
	else if (v == 'true') v = true as any;
	else if (v == 'false') v = false as any;
	if (v == INF_N || v == INF_S) v = null;
	if (typeof v == 'number' && !Number.isFinite(v)) v = null;
	return v
}

function fixIb(item: any) {
	Object.keys(item).forEachFast(function(k) {
		let v = item[k]
		if (v == INF_N || v == INF_S) item[k] = null; // delete item[k];
		if (typeof v == 'number' && !Number.isFinite(v)) item[k] = null;
	})
}

export function getIb(body = {} as GetIbBody) {
	let response = {} as GetIbResponse

	return Promise.resolve().then(function() {
		let reqing = _.pick(body, ['account', 'positions', 'orders', 'executions', 'tradings'] as any) as GetIbResponse
		let getall = _.isEmpty(reqing)
		let symbol = body.symbol

		if (!Number.isFinite(body.end)) body.end = shared.now();
		if (!Number.isFinite(body.start)) body.start = process.$marketStamps.is_open && body.end >= process.$marketStamps.am4 ? process.$marketStamps.am4 : process.$prevMarketStamps.am4;
		// console.log('body.start', shared.prettyStamp(body.start))

		let cltime = 'ib getIb ' + JSON.stringify(Object.keys(reqing))

		let proms = []

		if (getall || body.account == true) {
			proms.push(redis.ib.hgetall(shared.RKEY.IB.ACCOUNT))
		}

		if (getall || body.positions == true) {
			if (symbol) proms.push(r.table('ib_positions').getAll(symbol, { index: 'symbol' }).run());
			else proms.push(r.table('ib_positions').run());
		}

		if (getall || body.orders == true) {
			if (symbol) {
				proms.push(r.table('ib_orders').between([symbol, body.start], [symbol, body.end], { index: 'symbol-createdAt' }).run())
				proms.push(r.table('ib_orders').getAll([symbol, true], { index: 'symbol-active' }).run())
			} else {
				proms.push(r.table('ib_orders').between(body.start, body.end, { index: 'createdAt' }).run())
				proms.push(r.table('ib_orders').getAll(true, { index: 'active' }).run())
			}
		}

		if (getall || body.executions == true) {
			if (symbol) proms.push(r.table('ib_executions').between([symbol, body.start], [symbol, body.end], { index: 'symbol-createdAt' }).run());
			else proms.push(r.table('ib_executions').between(body.start, body.end, { index: 'createdAt' }).run());
		}

		if (getall || body.tradings == true) {
			proms.push(redis.calcs.smembers(shared.RKEY.CALCS_TRADING))
		}

		return Promise.all(proms).then(function(resolved) {

			if (getall || body.account == true) {
				response.account = utils.fromhget(resolved.shift())
			}

			if (getall || body.positions == true) {
				response.positions = _.orderBy(resolved.shift() as Array<nib.Position>, ['symbol'], ['asc'])
			}

			if (getall || body.orders == true) {
				response.orders = _.uniqBy(_.orderBy((resolved.shift() as Array<nib.Order>).concat(resolved.shift()), ['createdAt'], ['asc']), 'orderId')
			}

			if (getall || body.executions == true) {
				response.executions = _.orderBy(resolved.shift() as Array<nib.Execution>, ['createdAt'], ['asc'])
			}

			if (getall || body.tradings == true) {
				response.tradings = _.orderBy(resolved.shift() as Array<string>)
			}

			return Promise.resolve(response)

		})
	})
}





/*----------  MIGRATION  ----------*/

// function migration(): Promise<any> {
// 	if (!process.DEVELOPMENT || !utils.isMaster()) return;
// 	let tstart = Date.now()
// 	console.log('migration > start')
// 	return Promise.resolve().then(function() {
// 		{
// 			return Promise.all([redis.ib.rkeyflush(shared.RKEY.IB.ORDERS, false), redis.ib.rkeyflush(shared.RKEY.IB.ZMAP + ':' + shared.RKEY.IB.ORDERS, false)])
// 			// return Promise.all([redis.ib.rkeyflush(shared.RKEY.IB.EXECUTIONS, false), redis.ib.rkeyflush(shared.RKEY.IB.ZMAP + ':' + shared.RKEY.IB.EXECUTIONS, false)])
// 		}
// 	}).then(function() {
// 		{
// 			return r.table('ib_orders').getField('orderId').run()
// 			// return r.table('ib_executions').getField('execId').run()
// 		}
// 	}).then(function(ids: Array<number>) {
// 		let chunks = utils.equalChunks(ids, _.ceil(ids.length / 128))
// 		return pall(chunks.mapFast(v => () => eachmigrations(v)), { concurrency: 1 })
// 	}).then(function() {
// 		console.log('migration > done ' + shared.getDuration(tstart))
// 		return Promise.resolve()
// 	}).catch(function(error) {
// 		console.error('migration > error', utils.peRender(error))
// 		return Promise.resolve()
// 	})
// }

// function eachmigrations(ids: Array<number>): Promise<any> {
// 	console.log('eachmigrations', JSON.stringify(ids))
// 	return Promise.resolve().then(function() {
// 		{
// 			return r.table('ib_orders').getAll(r.args(ids)).run()
// 			// return r.table('ib_executions').getAll(r.args(ids)).run()
// 		}
// 	}).then(function(items: Array<any>) {
// 		{
// 			items.forEachFast(v => rxOrders.next(v))
// 			// items.forEachFast(v => rxExecutions.next(v))
// 		}
// 		return Promise.resolve()
// 	})
// }





/*----------  FLUSH  ----------*/

// function flush() {
// 	if (!utils.isMaster()) return;
// 	Promise.all([
// 		robinhood.flush(shared.RKEY.IB.ACCOUNT, false),
// 		robinhood.flush(shared.RKEY.IB.POSITIONS, false),
// 		robinhood.flush(shared.RKEY.IB.ORDERS, false),
// 		robinhood.flush(shared.RKEY.IB.EXECUTIONS, false),
// 		r.table('ib_positions').delete().run(),
// 		r.table('ib_orders').delete().run(),
// 		r.table('ib_executions').delete().run(),
// 		r.table('ib_minutes').delete().run(),
// 	]).then(function() {
// 		console.warn('ib flush > done')
// 	})
// }
// flush()





/*----------  ENUMS  ----------*/

const ACCOUNT_TAGS = {
	AccountType: 'AccountType',
	NetLiquidation: 'NetLiquidation',
	TotalCashValue: 'TotalCashValue',
	SettledCash: 'SettledCash',
	AccruedCash: 'AccruedCash',
	BuyingPower: 'BuyingPower',
	EquityWithLoanValue: 'EquityWithLoanValue',
	PreviousDayEquityWithLoanValue: 'PreviousDayEquityWithLoanValue',
	GrossPositionValue: 'GrossPositionValue',
	RegTEquity: 'RegTEquity',
	RegTMargin: 'RegTMargin',
	SMA: 'SMA',
	InitMarginReq: 'InitMarginReq',
	MaintMarginReq: 'MaintMarginReq',
	AvailableFunds: 'AvailableFunds',
	ExcessLiquidity: 'ExcessLiquidity',
	Cushion: 'Cushion',
	FullInitMarginReq: 'FullInitMarginReq',
	FullMaintMarginReq: 'FullMaintMarginReq',
	FullAvailableFunds: 'FullAvailableFunds',
	FullExcessLiquidity: 'FullExcessLiquidity',
	LookAheadNextChange: 'LookAheadNextChange',
	LookAheadInitMarginReq: 'LookAheadInitMarginReq',
	LookAheadMaintMarginReq: 'LookAheadMaintMarginReq',
	LookAheadAvailableFunds: 'LookAheadAvailableFunds',
	LookAheadExcessLiquidity: 'LookAheadExcessLiquidity',
	HighestSeverity: 'HighestSeverity',
	DayTradesRemaining: 'DayTradesRemaining',
	Leverage: 'Leverage',
}

const ERROR_CODES = {
	'1100': `Connectivity between IB and the TWS has been lost. Your TWS/IB Gateway has been disconnected from IB servers. This can occur because of an internet connectivity issue, a nightly reset of the IB servers, or a competing session.`,
	'1101': `Connectivity between IB and TWS has been restored- data lost.* The TWS/IB Gateway has successfully reconnected to IB's servers. Your market data requests have been lost and need to be re-submitted.`,
	'1102': `Connectivity between IB and TWS has been restored- data maintained. The TWS/IB Gateway has successfully reconnected to IB's servers. Your market data requests have been recovered and there is no need for you to re-submit them.`,
	'1300': `TWS socket port has been reset and this connection is being dropped. Please reconnect on the new port - <port_num> The port number in the TWS/IBG settings has been changed during an active API connection.`,
	'2100': `New account data requested from TWS. API client has been unsubscribed from account data. The TWS only allows one IBApi.EClient.reqAccountUpdates request at a time. If the client application attempts to subscribe to a second account without canceling the previous subscription, the new request will override the old one and the TWS will send this message notifying so.`,
	'2101': `Unable to subscribe to account as the following clients are subscribed to a different account. If a client application invokes IBApi.EClient.reqAccountUpdates when there is an active subscription started by a different client, the TWS will reject the new subscription request with this message.`,
	'2102': `Unable to modify this order as it is still being processed. If you attempt to modify an order before it gets processed by the system, the modification will be rejected. Wait until the order has been fully processed before modifying it. See Placing Orders for further details.`,
	'2103': `A market data farm is disconnected. Indicates a connectivity problem to an IB server. Outside of the nightly IB server reset, this typically indicates an underlying ISP connectivity issue.`,
	'2104': `Market data farm connection is OK A notification that connection to the market data server is ok. This is a notification and not a true error condition, and is expected on first establishing connection.`,
	'2105': `A historical data farm is disconnected. Indicates a connectivity problem to an IB server. Outside of the nightly IB server reset, this typically indicates an underlying ISP connectivity issue.`,
	'2106': `A historical data farm is connected. A notification that connection to the market data server is ok. This is a notification and not a true error condition, and is expected on first establishing connection.`,
	'2107': `A historical data farm connection has become inactive but should be available upon demand. Whenever a connection to the historical data farm is not being used because there is not an active historical data request, the connection will go inactive in IB Gateway. This does not indicate any connectivity issue or problem with IB Gateway. As soon as a historical data request is made the status will change back to active.`,
	'2108': `A market data farm connection has become inactive but should be available upon demand. Whenever a connection to our data farms is not needed, it will become dormant. There is nothing abnormal nor wrong with your client application nor with the TWS. You can safely ignore this message.`,
	'2109': `Order Event Warning: Attribute "Outside Regular Trading Hours" is ignored based on the order type and destination. PlaceOrder is now processed. Indicates the outsideRth flag was set for an order for which there is not a regular vs outside regular trading hour distinction`,
	'2110': `Connectivity between TWS and server is broken. It will be restored automatically. Indicates a connectivity problem between TWS or IBG and the IB server. This will usually only occur during the IB nightly server reset; cases at other times indicate a problem in the local ISP connectivity.`,
	'2137': `Cross Side Warning This warning message occurs in TWS version 955 and higher. It occurs when an order will change the position in an account from long to short or from short to long. To bypass the warning, a new feature has been added to IB Gateway 956 (or higher) and TWS 957 (or higher) so that once can go to Global Configuration > Messages and disable the "Cross Side Warning".`,
	'501': `Already Connected.	Your client application is already connected to the TWS.`,
	'502': `Couldn't connect to TWS. Confirm that "Enable ActiveX and Socket Clients" is enabled and connection port is the same as "Socket Port" on the TWS "Edit->Global Configuration...->API->Settings" menu.	When you receive this error message it is either because you have not enabled API connectivity in the TWS and/or you are trying to connect on the wrong port. Refer to the TWS' API Settings as explained in the error message. See also Connection`,
	'503': `The TWS is out of date and must be upgraded.	Indicates TWS or IBG is too old for use with the current API version. Can also be triggered if the TWS version does not support a specific API function.`,
	'504': `Not connected.	You are trying to perform a request without properly connecting and/or after connection to the TWS has been broken probably due to an unhandled exception within your client application.`,
	'100': `Max rate of messages per second has been exceeded.	The client application has exceeded the rate of 50 messages/second. The TWS will likely disconnect the client application after this message.`,
	'101': `Max number of tickers has been reached.	The current number of active market data subscriptions in TWS and the API altogether has been exceeded. This number is calculated based on a formula which is based on the equity, commissions, and quote booster packs in an account. Active lines can be checked in Tws using the Ctrl-Alt-= combination`,
	'102': `Duplicate ticker ID. A market data request used a ticker ID which is already in use by an active request.`,
	'103': `Duplicate order ID.	An order was placed with an order ID that is less than or equal to the order ID of a previous order from this client`,
	'104': `Can't modify a filled order. An attempt was made to modify an order which has already been filled by the system.`,
	'105': `Order being modified does not match original order.	An order was placed with an order ID of a currently open order but basic parameters differed (aside from quantity or price fields)`,
	'106': `Can't transmit order ID:	`,
	'107': `Cannot transmit incomplete order. Order is missing a required field.`,
	'109': `Price is out of the range defined by the Percentage setting at order defaults frame. The order will not be transmitted.	Price entered is outside the range of prices set in TWS or IB Gateway Order Precautionary Settings`,
	'110': `The price does not conform to the minimum price variation for this contract. An entered price field has more digits of precision than is allowed for this particular contract. Minimum increment information can be found on the IB Contracts and Securities Search page.`,
	'111': `The TIF (Tif type) and the order type are incompatible.	The time in force specified cannot be used with this order type. Please refer to order tickets in TWS for allowable combinations.`,
	'113': `The Tif option should be set to DAY for MOC and LOC orders.	Market-on-close or Limit-on-close orders should be sent with time in force set to 'DAY'`,
	'114': `Relative orders are valid for stocks only. This error is deprecated.`,
	'115': `Relative orders for US stocks can only be submitted to SMART, SMART_ECN, INSTINET, or PRIMEX. This error is deprecated.`,
	'116': `The order cannot be transmitted to a dead exchange.	Exchange field is invalid.`,
	'117': `The block order size must be at least 50.	`,
	'118': `VWAP orders must be routed through the VWAP exchange.	`,
	'119': `Only VWAP orders may be placed on the VWAP exchange.	When an order is routed to the VWAP exchange, the type of the order must be defined as 'VWAP'.`,
	'120': `It is too late to place a VWAP order for today.	The cutoff has passed for the current day to place VWAP orders.`,
	'121': `Invalid BD flag for the order. Check "Destination" and "BD" flag.	This error is deprecated.`,
	'122': `No request tag has been found for order:	`,
	'123': `No record is available for conid:	The specified contract ID cannot be found. This error is deprecated.`,
	'124': `No market rule is available for conid:	`,
	'125': `Buy price must be the same as the best asking price.	`,
	'126': `Sell price must be the same as the best bidding price.	`,
	'129': `VWAP orders must be submitted at least three minutes before the start time.	The start time specified in the VWAP order is less than 3 minutes after when it is placed.`,
	'131': `The sweep-to-fill flag and display size are only valid for US stocks routed through SMART, and will be ignored.	`,
	'132': `This order cannot be transmitted without a clearing account.	`,
	'133': `Submit new order failed.	`,
	'134': `Modify order failed.	`,
	'135': `Can't find order with ID =	An attempt was made to cancel an order not currently in the system.`,
	'136': `This order cannot be cancelled.	An attempt was made to cancel an order than cannot be cancelled, for instance because`,
	'137': `VWAP orders can only be cancelled up to three minutes before the start time.	`,
	'138': `Could not parse ticker request:	`,
	'139': `Parsing error:	Error in command syntax generated parsing error.`,
	'140': `The size value should be an integer:	The size field in the Order class has an invalid type.`,
	'141': `The price value should be a double:	A price field in the Order type has an invalid type.`,
	'142': `Institutional customer account does not have account info	`,
	'143': `Requested ID is not an integer number.	The IDs used in API requests must be integer values.`,
	'144': `Order size does not match total share allocation. To adjust the share allocation, right-click on the order and select â€œModify > Share Allocation.â€�	`,
	'145': `Error in validating entry fields -	An error occurred with the syntax of a request field.`,
	'146': `Invalid trigger method.	The trigger method specified for a method such as stop or trail stop was not one of the allowable methods.`,
	'147': `The conditional contract info is incomplete.	`,
	'148': `A conditional order can only be submitted when the order type is set to limit or market.	This error is deprecated.`,
	'151': `This order cannot be transmitted without a user name.	In DDE the user name is a required field in the place order command.`,
	'152': `The "hidden" order attribute may not be specified for this order.	The order in question cannot be placed as a hidden order. See- https://www.interactivebrokers.com/en/index.php?f=596`,
	'153': `EFPs can only be limit orders.	This error is deprecated.`,
	'154': `Orders cannot be transmitted for a halted security.	A security was halted for trading when an order was placed.`,
	'155': `A sizeOp order must have a user name and account.	This error is deprecated.`,
	'156': `A SizeOp order must go to IBSX	This error is deprecated.`,
	'157': `An order can be EITHER Iceberg or Discretionary. Please remove either the Discretionary amount or the Display size.	In the Order class extended attributes the fields 'Iceberg' and 'Discretionary' cannot`,
	'158': `You must specify an offset amount or a percent offset value.	TRAIL and TRAIL STOP orders must have an absolute offset amount or offset percentage specified.`,
	'159': `The percent offset value must be between 0% and 100%.	A percent offset value was specified outside the allowable range of 0% and 100%.`,
	'160': `The size value cannot be zero.	The size of an order must be a positive quantity.`,
	'161': `Cancel attempted when order is not in a cancellable state. Order permId =	An attempt was made to cancel an order not active at the time.`,
	'162': `Historical market data Service error message.	`,
	'163': `The price specified would violate the percentage constraint specified in the default order settings.	The order price entered is outside the allowable range specified in the Order Precautionary Settings of TWS or IB Gateway`,
	'164': `There is no market data to check price percent violations.	No market data is available for the specified contract to determine whether the specified price is outside the price percent precautionary order setting.`,
	'165': `Historical market Data Service query message.	There was an issue with a historical data request, such is no such data in IB's database. Note this message is not specific to the API.`,
	'166': `HMDS Expired Contract Violation.	Historical data is not available for the specified expired contract.`,
	'167': `VWAP order time must be in the future.	The start time of a VWAP order has already passed.`,
	'168': `Discretionary amount does not conform to the minimum price variation for this contract.	The discretionary field is specified with a number of degrees of precision higher than what is allowed for a specified contract.`,
	'200': `No security definition has been found for the request.	The specified contract does not match any in IB's database, usually because of an incorrect or missing parameter. The contract description specified for <Symbol> is ambiguous	Ambiguity may occur when the contract definition provided is not unique. For some stocks that has the same Symbol, Currency and Exchange, you need to specify the IBApi.Contract.PrimaryExch attribute to avoid ambiguity. Please refer to a sample stock contract here. For futures that has multiple multipliers for the same expiration, You need to specify the IBApi.Contract.Multiplier attribute to avoid ambiguity. Please refer to a sample futures contract here.`,
	'201': `Order rejected - Reason:	An attempted order was rejected by the IB servers.`,
	'202': `Order cancelled - Reason:	An active order on the IB server was cancelled`,
	'203': `The security <security> is not available or allowed for this account.	The specified security has a trading restriction with a specific account.`,
	'300': `Can't find EId with ticker Id:	An attempt was made to cancel market data for a ticker ID that was not associated with a current subscription. With the DDE API this occurs by clearing the spreadsheet cell.`,
	'301': `Invalid ticker action:	`,
	'302': `Error parsing stop ticker string:	`,
	'303': `Invalid action:	An action field was specified that is not available for the account. For most accounts this is only BUY or SELL. Some institional accounts also have the options SSELL or SLONG available.`,
	'304': `Invalid account value action:	`,
	'305': `Request parsing error, the request has been ignored.	The syntax of a DDE request is invalid.`,
	'306': `Error processing DDE request:	An issue with a DDE request prevented it from processing.`,
	'307': `Invalid request topic:	The 'topic' field in a DDE request is invalid.`,
	'308': `Unable to create the 'API' page in TWS as the maximum number of pages already exists.	An order placed from the API will automatically open a new page in classic TWS, however there are already the maximum number of pages open.`,
	'309': `Max number (3) of market depth requests has been reached. Note: TWS currently limits users to a maximum of 3 distinct market depth requests. This same restriction applies to API clients, however API clients may make multiple market depth requests for the same security.	`,
	'310': `Can't find the subscribed market depth with tickerId:	An attempt was made to cancel market depth for a ticker not currently active.`,
	'311': `The origin is invalid.	The origin field specified in the Order class is invalid.`,
	'312': `The combo details are invalid.	Combination contract specified has invalid parameters.`,
	'313': `The combo details for leg '<leg number>' are invalid. A combo leg was not defined correctly.`,
	'314': `Security type 'BAG' requires combo leg details.	When specifying security type as 'BAG' make sure to also add combo legs with details.`,
	'315': `Stock combo legs are restricted to SMART order routing.	Make sure to specify 'SMART' as an exchange when using stock combo contracts.`,
	'316': `Market depth data has been HALTED. Please re-subscribe.	You need to re-subscribe to start receiving market depth data again.`,
	'317': `Market depth data has been RESET. Please empty deep book contents before applying any new entries.	`,
	'319': `Invalid log level <log level>	Make sure that you are setting a log level to a value in range of 1 to 5.`,
	'320': `Server error when reading an API client request.	`,
	'321': `Server error when validating an API client request.	`,
	'322': `Server error when processing an API client request.	`,
	'323': `Server error: cause - s	`,
	'324': `Server error when reading a DDE client request (missing information).	Make sure that you have specified all the needed information for your request.`,
	'325': `Discretionary orders are not supported for this combination of exchange and order type.	Make sure that you are specifying a valid combination of exchange and order type for the discretionary order.`,
	'326': `Unable to connect as the client id is already in use. Retry with a unique client id.	Another client application is already connected with the specified client id.`,
	'327': `Only API connections with clientId set to 0 can set the auto bind TWS orders property.	`,
	'328': `Trailing stop orders can be attached to limit or stop-limit orders only.	Indicates attempt to attach trail stop to order which was not a limit or stop-limit.`,
	'329': `Order modify failed. Cannot change to the new order type.	You are not allowed to modify initial order type to the specific order type you are using.`,
	'330': `Only FA or STL customers can request managed accounts list.	Make sure that your account type is either FA or STL.`,
	'331': `Internal error. FA or STL does not have any managed accounts.	You do not have any managed accounts.`,
	'332': `The account codes for the order profile are invalid.	You need to check that the account codes you specified for your request are valid.`,
	'333': `Invalid share allocation syntax.	`,
	'334': `Invalid Good Till Date order	Check you order settings.`,
	'335': `Invalid delta: The delta must be between 0 and 100.	`,
	'336': `The time or time zone is invalid. The correct format is hh:mm:ss xxx where xxx is an optionally specified time-zone. E.g.: 15:59:00 EST Note that there is a space between the time and the time zone. If no time zone is specified, local time is assumed.	`,
	'337': `The date, time, or time-zone entered is invalid. The correct format is yyyymmdd hh:mm:ss xxx where yyyymmdd and xxx are optional. E.g.: 20031126 15:59:00 ESTNote that there is a space between the date and time, and between the time and time-zone.	`,
	'338': `Good After Time orders are currently disabled on this exchange.	`,
	'339': `Futures spread are no longer supported. Please use combos instead.	`,
	'340': `Invalid improvement amount for box auction strategy.	`,
	'341': `Invalid delta. Valid values are from 1 to 100. You can set the delta from the "Pegged to Stock" section of the Order Ticket Panel, or by selecting Page/Layout from the main menu and adding the Delta column.	`,
	'342': `Pegged order is not supported on this exchange.	You can review all order types and supported exchanges on the Order Types and Algos page.`,
	'343': `The date, time, or time-zone entered is invalid. The correct format is yyyymmdd hh:mm:ss xxx	`,
	'344': `The account logged into is not a financial advisor account.	You are trying to perform an action that is only available for the financial advisor account.`,
	'345': `Generic combo is not supported for FA advisor account.	`,
	'346': `Not an institutional account or an away clearing account.	`,
	'347': `Short sale slot value must be 1 (broker holds shares) or 2 (delivered from elsewhere).	Make sure that your slot value is either 1 or 2.`,
	'348': `Order not a short sale – type must be SSHORT to specify short sale slot.	Make sure that the action you specified is 'SSHORT'.`,
	'349': `Generic combo does not support "Good After" attribute.	`,
	'350': `Minimum quantity is not supported for best combo order.	`,
	'351': `The "Regular Trading Hours only" flag is not valid for this order.	`,
	'352': `Short sale slot value of 2 (delivered from elsewhere) requires location.	You need to specify designatedLocation for your order.`,
	'353': `Short sale slot value of 1 requires no location be specified.	You do not need to specify designatedLocation for your order.`,
	'354': `Not subscribed to requested market data.	You do not have live market data available in your account for the specified instruments. For further details please refer to Streaming Market Data.`,
	'355': `Order size does not conform to market rule.	Check order size parameters for the specified contract from the TWS Contract Details.`,
	'356': `Smart-combo order does not support OCA group.	Remove OCA group from your order.`,
	'357': `Your client version is out of date.	`,
	'358': `Smart combo child order not supported.	`,
	'359': `Combo order only supports reduce on fill without block(OCA).	`,
	'360': `No whatif check support for smart combo order.	Pre-trade commissions and margin information is not available for this type of order.`,
	'361': `Invalid trigger price.	`,
	'362': `Invalid adjusted stop price.	`,
	'363': `Invalid adjusted stop limit price.	`,
	'364': `Invalid adjusted trailing amount.	`,
	'365': `No scanner subscription found for ticker id:	Scanner market data subscription request with this ticker id has either been cancelled or is not found.`,
	'366': `No historical data query found for ticker id:	Historical market data request with this ticker id has either been cancelled or is not found.`,
	'367': `Volatility type if set must be 1 or 2 for VOL orders. Do not set it for other order types.	`,
	'368': `Reference Price Type must be 1 or 2 for dynamic volatility management. Do not set it for non-VOL orders.	`,
	'369': `Volatility orders are only valid for US options.	Make sure that you are placing an order for US OPT contract.`,
	'370': `Dynamic Volatility orders must be SMART routed, or trade on a Price Improvement Exchange.	`,
	'371': `VOL order requires positive floating point value for volatility. Do not set it for other order types.	`,
	'372': `Cannot set dynamic VOL attribute on non-VOL order.	Make sure that your order type is 'VOL'.`,
	'373': `Can only set stock range attribute on VOL or RELATIVE TO STOCK order.	`,
	'374': `If both are set, the lower stock range attribute must be less than the upper stock range attribute.	`,
	'375': `Stock range attributes cannot be negative.	`,
	'376': `The order is not eligible for continuous update. The option must trade on a cheap-to-reroute exchange.	`,
	'377': `Must specify valid delta hedge order aux. price.	`,
	'378': `Delta hedge order type requires delta hedge aux. price to be specified.	Make sure your order has delta attribute.`,
	'379': `Delta hedge order type requires that no delta hedge aux. price be specified.	Make sure you do not specify aux. delta hedge price.`,
	'380': `This order type is not allowed for delta hedge orders.	Limit, Market or Relative orders are supported.`,
	'381': `Your DDE.dll needs to be upgraded.	`,
	'382': `The price specified violates the number of ticks constraint specified in the default order settings.	`,
	'383': `The size specified violates the size constraint specified in the default order settings.	`,
	'384': `Invalid DDE array request.	`,
	'385': `Duplicate ticker ID for API scanner subscription.	Make sure you are using a unique ticker ID for your new scanner subscription.`,
	'386': `Duplicate ticker ID for API historical data query.	Make sure you are using a unique ticker ID for your new historical market data query.`,
	'387': `Unsupported order type for this exchange and security type.	You can review all order types and supported exchanges on the Order Types and Algos page.`,
	'388': `Order size is smaller than the minimum requirement.	Check order size parameters for the specified contract from the TWS Contract Details.`,
	'389': `Supplied routed order ID is not unique.	`,
	'390': `Supplied routed order ID is invalid.	`,
	'391': `The time or time-zone entered is invalid. The correct format is hh:mm:ss xxx	`,
	'392': `Invalid order: contract expired.	You can not place an order for the expired contract.`,
	'393': `Short sale slot may be specified for delta hedge orders only.	`,
	'394': `Invalid Process Time: must be integer number of milliseconds between 100 and 2000. Found:	`,
	'395': `Due to system problems, orders with OCA groups are currently not being accepted.	Check TWS bulletins for more information.`,
	'396': `Due to system problems, application is currently accepting only Market and Limit orders for this contract.	Check TWS bulletins for more information.`,
	'397': `Due to system problems, application is currently accepting only Market and Limit orders for this contract.	`,
	'398': `< > cannot be used as a condition trigger.	Please make sure that you specify a valid condition`,
	'399': `Order message error	`,
	'400': `Algo order error.	`,
	'401': `Length restriction.	`,
	'402': `Conditions are not allowed for this contract.	Condition order type does not support for this contract`,
	'403': `Invalid stop price.	The Stop Price you specified for the order is invalid for the contract`,
	'404': `Shares for this order are not immediately available for short sale. The order will be held while we attempt to locate the shares.	You order is held by the TWS because you are trying to sell a contract but you do not have any long position and the market does not have short sale available. You order will be transmitted once there is short sale available on the market`,
	'405': `The child order quantity should be equivalent to the parent order size.	This error is deprecated.`,
	'406': `The currency < > is not allowed.	Please specify a valid currency`,
	'407': `The symbol should contain valid non-unicode characters only.	Please check your contract Symbol`,
	'408': `Invalid scale order increment.	`,
	'409': `Invalid scale order. You must specify order component size.	ScaleInitLevelSize specified is invalid`,
	'410': `Invalid subsequent component size for scale order.	ScaleSubsLevelSize specified is invalid`,
	'411': `The "Outside Regular Trading Hours" flag is not valid for this order.	Trading outside of regular trading hours is not available for this security`,
	'412': `The contract is not available for trading.	`,
	'413': `What-if order should have the transmit flag set to true.	You need to set IBApi.Order.Transmit to TRUE`,
	'414': `Snapshot market data subscription is not applicable to generic ticks.	You must leave Generic Tick List to be empty when requesting snapshot market data`,
	'415': `Wait until previous RFQ finishes and try again.	`,
	'416': `RFQ is not applicable for the contract. Order ID:	`,
	'417': `Invalid initial component size for scale order.	ScaleInitLevelSize specified is invalid`,
	'418': `Invalid scale order profit offset.	ScaleProfitOffset specified is invalid`,
	'419': `Missing initial component size for scale order.	You need to specify the ScaleInitLevelSize`,
	'420': `Invalid real-time query.	This error is deprecated.`,
	'421': `Invalid route.	This error is deprecated.`,
	'422': `The account and clearing attributes on this order may not be changed.	`,
	'423': `Cross order RFQ has been expired. THI committed size is no longer available. Please open order dialog and verify liquidity allocation.	`,
	'424': `FA Order requires allocation to be specified.	This error is deprecated.`,
	'425': `FA Order requires per-account manual allocations because there is no common clearing instruction. Please use order dialog Adviser tab to enter the allocation.	This error is deprecated.`,
	'426': `None of the accounts have enough shares.	You are not able to enter short position with Cash Account`,
	'427': `Mutual Fund order requires monetary value to be specified.	This error is deprecated.`,
	'428': `Mutual Fund Sell order requires shares to be specified.	This error is deprecated.`,
	'429': `Delta neutral orders are only supported for combos (BAG security type).	`,
	'430': `We are sorry, but fundamentals data for the security specified is not available.	`,
	'431': `What to show field is missing or incorrect.	This error is deprecated.`,
	'432': `Commission must not be negative.	This error is deprecated.`,
	'433': `Invalid "Restore size after taking profit" for multiple account allocation scale order.	`,
	'434': `The order size cannot be zero.	`,
	'435': `You must specify an account.	The function you invoked only works on a single account`,
	'436': `You must specify an allocation (either a single account, group, or profile).	When you try to place an order with a Financial Advisor account, you must specify the order to be routed to either a single account, a group, or a profile.`,
	'437': `Order can have only one flag Outside RTH or Allow PreOpen.	This error is deprecated.`,
	'438': `The application is now locked.	This error is deprecated.`,
	'439': `Order processing failed. Algorithm definition not found.	Please double check your specification for IBApi.Order.AlgoStrategy and IBApi.Order.AlgoParams`,
	'440': `Order modify failed. Algorithm cannot be modified.	`,
	'441': `Algo attributes validation failed:	Please double check your specification for IBApi.Order.AlgoStrategy and IBApi.Order.AlgoParams`,
	'442': `Specified algorithm is not allowed for this order.	`,
	'443': `Order processing failed. Unknown algo attribute.	Specification for IBApi.Order.AlgoParams is incorrect`,
	'444': `Volatility Combo order is not yet acknowledged. Cannot submit changes at this time.	The order is not in a state that is able to be modified`,
	'445': `The RFQ for this order is no longer valid.	`,
	'446': `Missing scale order profit offset.	ScaleProfitOffset is not properly specified`,
	'447': `Missing scale price adjustment amount or interval.	ScalePriceAdjustValue or ScalePriceAdjustInterval is not specified properly`,
	'448': `Invalid scale price adjustment interval.	ScalePriceAdjustInterval specified is invalid`,
	'449': `Unexpected scale price adjustment amount or interval.	ScalePriceAdjustValue or ScalePriceAdjustInterval specified is invalid`,
	'507': `Bad Message Length (Java-only)	Indicates EOF exception was caught while reading from the socket. This can occur if there is an attempt to connect to TWS with a client ID that is already in use, or if TWS is locked, closes, or breaks the connection. It should be handled by the client application and used to indicate that the socket connection is not valid.`,
	'10000': `Cross currency combo error.	`,
	'10001': `Cross currency vol error.	`,
	'10002': `Invalid non-guaranteed legs.	`,
	'10003': `IBSX not allowed.	`,
	'10005': `Read-only models.	`,
	'10006': `Missing parent order.	The parent order ID specified cannot be found. In some cases this can occur with bracket orders if the child order is placed immediately after the parent order; a brief pause of 50 ms or less will be necessary before the child order is transmitted to TWS/IBG.`,
	'10007': `Invalid hedge type.	`,
	'10008': `Invalid beta value.	`,
	'10009': `Invalid hedge ratio.	`,
	'10010': `Invalid delta hedge order.	`,
	'10011': `Currency is not supported for Smart combo.	`,
	'10012': `Invalid allocation percentage	FaPercentage specified is not valid`,
	'10013': `Smart routing API error (Smart routing opt-out required).	`,
	'10014': `PctChange limits.	This error is deprecated`,
	'10015': `Trading is not allowed in the API.	`,
	'10016': `Contract is not visible.	This error is deprecated`,
	'10017': `Contracts are not visible.	This error is deprecated`,
	'10018': `Orders use EV warning.	`,
	'10019': `Trades use EV warning.	`,
	'10020': `Display size should be smaller than order size./td>	The display size should be smaller than the total quantity`,
	'10021': `Invalid leg2 to Mkt Offset API.	This error is deprecated`,
	'10022': `Invalid Leg Prio API.	This error is deprecated`,
	'10023': `Invalid combo display size API.	This error is deprecated`,
	'10024': `Invalid don't start next legin API.	This error is deprecated`,
	'10025': `Invalid leg2 to Mkt time1 API.	This error is deprecated`,
	'10026': `Invalid leg2 to Mkt time2 API.	This error is deprecated`,
	'10027': `Invalid combo routing tag API.	This error is deprecated`,
	'10090': `Part of requested market data is not subscribed. Indicates that some tick types requested require additional market data subscriptions not held in the account. This commonly occurs for instance if a user has options subscriptions but not the underlying stock so the system cannot calculate the real time greek values (other default ticks will be returned). Or alternatively, if generic tick types are specified in a market data request without the associated subscriptions.`,
} as { [code: string]: string }





/*----------  IB GATEWAY NOTES  ----------*/

// https://download2.interactivebrokers.com/installers/ibgateway/latest-standalone/ibgateway-latest-standalone-linux-x64.sh
// alias tvn='cd ~/Downloads/tvnjviewer-2.8.3-bin-gnugpl && java -jar tightvnc-jviewer.jar'
// Xvfb :0 -ac -screen 0 1024x768x24 &
// x11vnc -viewpasswd abc123 -passwd abc123 -display :0 -forever -ncache 10 -ncache_cr -shared -logappend /var/log/x11vnc.log -bg -noipv6
// DISPLAY=:0 ~/ibcontroller.paper/IBControllerGatewayStart.sh







/*----------  JUNK  ----------*/

// export function getIb(body = {} as GetIbBody) {
// 	let response = {} as GetIbResponse

// 	console.time('ib getIb')
// 	return Promise.resolve().then(function() {
// 		let reqing = _.omit(body, ['symbol', 'start', 'end'])
// 		let empty = _.isEmpty(reqing)

// 		if (!Number.isFinite(body.end)) body.end = shared.now();
// 		// if (!Number.isFinite(body.start)) body.start = process.$marketStamps.is_open && body.end >= process.$marketStamps.am4 ? process.$marketStamps.am4 : process.$prevMarketStamps.am4;
// 		if (!Number.isFinite(body.start)) body.start = shared.moment(process.$prevMarketStamps.am4).subtract(1, 'day').valueOf();

// 		let proms = []
// 		let coms1 = [] as RedisComs

// 		if (empty || body.account == true) {
// 			response.account = {} as any
// 			coms1.push(['hgetall', shared.RKEY.IB.ACCOUNT])
// 		}

// 		if (empty || body.positions == true) {
// 			response.positions = []
// 			coms1.push(['keys', shared.RKEY.IB.POSITIONS + ':*'])
// 		}

// 		if (empty || body.orders == true) {
// 			response.orders = []
// 			coms1.push(['zrangebyscore', shared.RKEY.IB.ZMAP + ':' + shared.RKEY.IB.ORDERS, body.start as any, body.end as any])
// 			coms1.push(['smembers', shared.RKEY.IB.ACTIVES])
// 		}

// 		if (empty || body.executions == true) {
// 			response.executions = []
// 			coms1.push(['zrangebyscore', shared.RKEY.IB.ZMAP + ':' + shared.RKEY.IB.EXECUTIONS, body.start as any, body.end as any])
// 		}

// 		proms.push(redis.ib.pipelinecoms(coms1))

// 		if (empty || body.tradings == true) {
// 			response.tradings = []
// 			proms.push(redis.calcs.smembers(shared.RKEY.CALCS_TRADING))
// 		}

// 		console.time('ib getIb coms1')
// 		return Promise.all(proms).then(function(resolveds1) {
// 			console.timeEnd('ib getIb coms1')

// 			if (resolveds1[1]) {
// 				response.tradings = resolveds1[1]
// 			}

// 			let resolved1 = resolveds1[0] as Array<any>
// 			utils.fixPipelineFast(resolved1)

// 			let coms2 = [] as RedisComs

// 			resolved1.forEachFast(function(resolve1: Array<string>, i) {
// 				let rkey = coms1[i][1]

// 				if (rkey.indexOf(shared.RKEY.IB.ACCOUNT) == 0) {
// 					Object.assign(response.account, utils.fromhget(resolve1))

// 				} else if (rkey.indexOf(shared.RKEY.IB.POSITIONS) == 0) {
// 					resolve1.forEachFast(v => coms2.push(['hgetall', v]))

// 				} else if (rkey.indexOf(shared.RKEY.IB.ZMAP + ':' + shared.RKEY.IB.ORDERS) == 0) {
// 					resolve1.forEachFast(v => coms2.push(['hgetall', shared.RKEY.IB.ORDERS + ':' + v.split(':')[0]]))

// 				} else if (rkey.indexOf(shared.RKEY.IB.ACTIVES) == 0) {
// 					resolve1.forEachFast(v => coms2.push(['hgetall', shared.RKEY.IB.ORDERS + ':' + v.split(':')[0]]))

// 				} else if (rkey.indexOf(shared.RKEY.IB.ZMAP + ':' + shared.RKEY.IB.EXECUTIONS) == 0) {
// 					resolve1.forEachFast(v => coms2.push(['hgetall', shared.RKEY.IB.EXECUTIONS + ':' + v.split(':')[0]]))

// 				}
// 			})

// 			console.time('ib getIb coms2')
// 			return redis.ib.pipelinecoms(coms2).then(function(resolved2) {
// 				console.timeEnd('ib getIb coms2')

// 				utils.fixPipelineFast(resolved2)

// 				resolved2.forEachFast(function(resolve2: Array<any>, i) {
// 					let rkey = coms2[i][1]

// 					if (rkey.indexOf(shared.RKEY.IB.POSITIONS) == 0) {
// 						response.positions.push(utils.fromhget(resolve2))

// 					} else if (rkey.indexOf(shared.RKEY.IB.ORDERS) == 0) {
// 						response.orders.push(utils.fromhget(resolve2))

// 					} else if (rkey.indexOf(shared.RKEY.IB.EXECUTIONS) == 0) {
// 						response.executions.push(utils.fromhget(resolve2))

// 					}
// 				})

// 				if (response.positions) response.positions = _.orderBy(response.positions, ['stamp'], ['desc']);
// 				if (response.orders) response.orders = _.uniqBy(_.orderBy(response.orders, ['createdAt'], ['desc']), 'orderId');
// 				if (response.executions) response.executions = _.orderBy(response.executions, ['createdAt'], ['desc']);

// 				console.timeEnd('ib getIb')
// 				return Promise.resolve(response)

// 			})
// 		})
// 	})
// }

// const syncInvalidOrders = _.throttle(function() {
// 	Promise.resolve().then(function() {
// 		return r.table('ib_orders').getAll('PreSubmitted', { index: 'status' }).run()
// 	}).then(function(orders: Array<nib.Order>) {
// 		let proms = []
// 		orders.forEachFast(function(order) {
// 			if (!Number.isFinite(order.orderId)) return;
// 			proms.push(cancelOrder(order.orderId))
// 		})
// 		return Promise.all(proms)
// 	}).catch(function(error) {
// 		if (error) logger.error('syncInvalidOrders > error', utils.peRender(error));
// 	})
// }, 1000, { leading: false, trailing: true })

// rxPositions.map(function(position) {
// 	{ (position as any).nano = utils.getNano() }
// 	position.stamp = shared.now()
// 	return position
// }).buffer(rx.Observable.interval(100)).filter(function(v) {
// 	return v.length > 0
// }).map(function(positions) {
// 	return shared.rxMergeBuffer(positions, 'nano', 'symbol', true)
// }).subscribe(function(positions) {
// 	r.table('ib_positions').insert(positions).run()
// 	socket.emit(shared.RKEY.IB.POSITIONS, positions)
// })

// const rxOrders = new rx.Subject<nib.Order>()
// rxOrders.map(function(order) {
// 	{ (order as any).nano = utils.getNano() }
// 	order.stamp = shared.now()
// 	return order
// }).buffer(rx.Observable.interval(100)).filter(function(v) {
// 	return v.length > 0
// }).map(function(orders) {
// 	return shared.rxMergeBuffer(orders, 'nano', 'orderId', true)
// }).subscribe(function(orders) {
// 	r.table('ib_orders').insert(orders).run()
// 	socket.emit(shared.RKEY.IB.ORDERS, orders)
// })

// const rxPositions = new rxBuffer<nib.Position>('symbol', function(tos) {
// 	// redis.ib.hmset(shared.RKEY.IB.POSITIONS, utils.tohset(shared.array2object(tos, 'symbol')))
// 	// socket.emit(shared.RKEY.IB.POSITIONS, tos)
// 	let symbols = tos.map(v => v.symbol)
// 	redis.ib.hmget(shared.RKEY.IB.POSITIONS, ...symbols).then(function(froms: Array<nib.Position>) {
// 		froms = froms.mapFast(v => v ? shared.safeParse(v) : v)
// 		let updates = [] as Array<string>

// 		symbols.forEachFast(function(symbol, i) {
// 			let from = froms[i]
// 			let to = tos[i]
// 			if (shared.compareSkip(from, to, ['stamp'])) return;
// 			updates.push(symbol)
// 		})
// 		if (updates.length == 0) return Promise.resolve();

// 		let inserts = updates.mapFast(v => tos.find(vv => vv.symbol == v))
// 		redis.ib.hmset(shared.RKEY.IB.POSITIONS, utils.tohset(shared.array2object(inserts, 'symbol')))
// 		socket.emit(shared.RKEY.IB.POSITIONS, inserts)
// 		// return r.table('ib_positions').insert(inserts).run()

// 	}).catch(error => {
// 		logger.error('rxPositions subscribe > error', error)
// 	})

// })

// const rxOrders = new rxBuffer<nib.Order>('orderId', function(tos) {
// 	let oids = tos.map(v => v.orderId)
// 	r.table('ib_orders').getAll(...oids).run().then(function(froms: Array<nib.Order>) {
// 		let updates = [] as Array<number>

// 		oids.forEachFast(function(orderId, i) {
// 			let from = froms.find(v => v && v.orderId == orderId)
// 			let to = tos[i]
// 			if (!from) to.created = shared.now();
// 			if (shared.compareSkip(from, to, ['stamp'])) return;
// 			updates.push(orderId)
// 		})
// 		if (updates.length == 0) return Promise.resolve();

// 		let inserts = updates.map(v => tos.find(vv => vv.orderId == v))
// 		socket.emit(shared.RKEY.IB.ORDERS, inserts)
// 		return r.table('ib_orders').insert(inserts, { conflict: 'update' }).run()

// 	}).catch(error => {
// 		logger.error('rxOrders subscribe > error', error)
// 	})
// })

// const rxExecutions = new rxBuffer<nib.Execution>('execId', function(tos) {
// 	let eids = tos.map(v => v.execId)
// 	r.table('ib_executions').getAll(...eids).run().then(function(froms: Array<nib.Execution>) {
// 		let updates = [] as Array<string>

// 		eids.forEachFast(function(execId, i) {
// 			let from = froms.find(v => v && v.execId == execId)
// 			let to = tos[i]
// 			if (!from) to.created = shared.now();
// 			if (shared.compareSkip(from, to, ['stamp'])) return;
// 			updates.push(execId)
// 		})
// 		if (updates.length == 0) return Promise.resolve();

// 		let inserts = updates.map(v => tos.find(vv => vv.execId == v))
// 		socket.emit(shared.RKEY.IB.EXECUTIONS, inserts)
// 		return r.table('ib_executions').insert(inserts, { conflict: 'update' }).run()

// 	}).catch(error => {
// 		logger.error('rxExecutions subscribe > error', error)
// 	})
// })


























































/*----------  PRIMARY  ----------*/

// let rkeyprimary = 'ib-primary'

// if (utils.isPrimary()) {
// 	process.pm2addListener(rkeyprimary, data => this[data.method](...data.args))
// }

// function toPrimary(method: string, args: IArguments) {
// 	// if (utils.isPrimary()) return false;
// 	process.ee3_public.emit(rkeyprimary, { method, args: Object.keys(args).map(k => args[k]) })
// 	// return true
// }












// class IB {

// 	private static rkeyprimary = 'ib.gateway'

// 	static session: ibsdk.Session
// 	static account: ibsdk.Account

// 	static open() {
// 		ibsdk.open({
// 			clientId: process.$instance,
// 			host: 'localhost',
// 			port: 4002,
// 			trace: function(event, data) {
// 				// console.log('trace > event', event)
// 			},
// 		}, function(error, session) {
// 			if (error) return logger.error('IB.open > error', utils.peRender(error));
// 			IB.init(session)
// 		})
// 	}

// 	static init(__session) {
// 		IB.session = __session

// 		IB.session.addListener('data', function(data) {
// 			console.log('IB.session > data', data)
// 		})
// 		IB.session.addListener('error', function(error) {
// 			logger.error('IB.session > error', error)
// 		})

// 		IB.session.addListener('connected', function() {
// 			logger.info('IB.session connected')
// 		})
// 		IB.session.addListener('disconnected', function() {
// 			logger.error('IB.session disconnected')
// 		})

// 		IB.session.addListener('ready', function() {
// 			logger.info('IB.session ready')
// 		})

// 		IB.account = IB.session.account()
// 		IB.account.addListener('load', IB.readyAccount)
// 	}

// 	static readyAccount() {
// 		let coms = [] as RedisComs

// 		coms.push(['hmset', shared.RKEY.IB.ACCOUNT, utils.tohset(IB.account.snapshot)])

// 		// utils.keys('IB.account.positions.snapshot', IB.account.positions.snapshot)
// 		// console.info('IB.account.positions.snapshot >')
// 		// eyes.inspect(IB.account.positions.snapshot)
// 		// process.dtsgen('session', session)

// 		// console.info('session.trades().snapshot >')
// 		// eyes.inspect(session.trades().snapshot)

// 		redis.ib.pipelinecoms(coms).then(function(resolved) {
// 			utils.pipelineErrors(resolved)
// 		}).catch(function(error) {
// 			console.error('IB.account redis > error', error)
// 		})

// 	}



// 	constructor() {
// 		if (!utils.isPrimary()) return;
// 		ds.rxAuthed.filter(v => v == true).take(1).subscribe(IB.open)
// 		process.pm2addListener(IB.rkeyprimary, data => this[data.method](...data.args))
// 	}

// 	toPrimary(method: string, args: IArguments) {
// 		if (utils.isPrimary()) return false;
// 		process.ee3_public.emit(IB.rkeyprimary, { method, args: Object.keys(args).map(k => args[k]) })
// 		return true
// 	}



// 	buy(opts: { symbol: string, quantity: number }) {
// 		if (this.toPrimary('buy', arguments)) return;

// 		console.info('opts >')
// 		eyes.inspect(opts)

// 		IB.session.securities(opts.symbol + ' stock', function(error, securities) {
// 			if (error) return logger.error('buy > error', utils.peRender(error));
// 			if (!Array.isArray(securities) || securities.length == 0) return logger.error('buy > error', '!Array.isArray(securities)');

// 			console.log('securities.length', securities.length)
// 			let security = securities[0]
// 			// console.log('security', security)
// 			// utils.keys('security', security)

// 			console.info('security.contract.summary >')
// 			eyes.inspect(security.contract.summary)

// 			// security.quote.query((error, quote) => {
// 			// 	if (error) return logger.error('quote > error', utils.peRender(error));
// 			// 	console.info('quote >')
// 			// 	eyes.inspect(quote)
// 			// })

// 			let order = security.order()
// 			order.buy(opts.quantity)
// 				.market()
// 				.goodUntilCancelled()
// 				.outsideRegularTradingHours()
// 				.transmit()

// 			console.log('order', order)
// 			// utils.keys('order', order)
// 			console.log('order.state', order.state)

// 		})

// 	}



// }

// const IBGateway = new IB()
// export = IBGateway



// if (process.$instance == 2) {
// 	setTimeout(function() {
// 		IBGateway.buy({ symbol: 'UVXY', quantity: 123 })
// 	}, 1000)
// }

































// class IbAccount {

// 	constructor(public account) {
// 		this.account.addListener('update', data => this.onUpdate(data))
// 	}

// 	onUpdate(data) {
// 		console.log('IbAccount > data', data)
// 	}

// 	cancel() {
// 		this.account.cancel()
// 	}

// }
























// let dts = dtsgen.generateModuleDeclarationFile('', ibsdk.open)
// console.log('dts', dts)
// let dts = dtsgen.generateIdentifierDeclarationFile('session', session)
// console.log('dts', dts)



