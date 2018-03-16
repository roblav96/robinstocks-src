// 

import Vue from 'vue'
import * as Vts from 'vue-property-decorator'
import _ from 'lodash'
import rx from 'rxjs/Rx'
import pdelay from 'delay'
import pevent from 'p-event'
import pforever from 'p-forever'
import nib from 'ib'
import * as shared from '../shared'
import * as utils from './utils'
import * as http from './http'
import * as socket from './socket'
import * as store from './store'
import * as router from '../router'
import * as Snackbar from '../comps/snackbar/snackbar'



export class module {
	inited = false
	isoes = false
	account = {} as nib.Account
	positions = [] as Array<nib.Position>
	smquotes = [] as Array<SmallQuote>
	orders = [] as Array<nib.Order>
	executions = [] as Array<nib.Execution>
	tradings = [] as Array<string>
}



export function initIbStore() {
	return Promise.resolve().then(function() {
		return http.post<GetIbBody, GetIbResponse>('/ib.get', {
			account: true,
			positions: true,
			tradings: true,
		}, { silent: true })

	}).then(function(response) {
		store.store.state.ib.account = _.omitBy(response.account, (v, k) => Array.isArray(k.match(/\W+/))) as any
		socket.emitter.addListener(shared.RKEY.IB.ACCOUNT, socketAccount)
		store.store.state.ib.positions = response.positions.filter(v => v.position != 0)
		socket.emitter.addListener(shared.RKEY.IB.POSITIONS, socketPositions)
		store.store.state.ib.tradings = response.tradings
		socket.emitter.addListener(shared.RKEY.CALCS_TRADING, socketTrading)
		return doSyncSmallQuotes(true)

	}).then(function() {
		store.store.state.ib.inited = true
		return Promise.resolve()

	}).catch(function(error) {
		console.error('initIbStore > error', error)
		return pdelay(3000).then(() => initIbStore())
	})
}



function socketAccount(account: nib.Account) {
	account = _.omitBy(account, (v, k) => Array.isArray(k.match(/\W+/))) as any
	Object.assign(store.store.state.ib.account, account)
}



function socketPositions(positions: Array<nib.Position>) {
	positions.forEachFast(function(position) {
		let found = store.store.state.ib.positions.find(v => v && v.symbol == position.symbol)
		if (found) Object.assign(found, position);
		else store.store.state.ib.positions.push(position);
	})
	syncSmallQuotes()
}



function socketTrading(smquote: SmallQuote) {
	smquote = shared.explode(shared.RMAP.SMALLS, smquote)
	let index = store.store.state.ib.tradings.indexOf(smquote.symbol)
	if (smquote.liveTrading == true && index == -1) store.store.state.ib.tradings.push(smquote.symbol);
	if (smquote.liveTrading == false && index >= 0) store.store.state.ib.tradings.splice(index, 1);
	syncSmallQuotes()
}



export const syncSmallQuotes = _.throttle(doSyncSmallQuotes, 1000, { leading: false, trailing: true })
export function doSyncSmallQuotes(force = false) {
	if (force == true) syncSmallQuotes.cancel();

	let symbols = store.store.state.ib.positions.filter(v => v.position != 0).mapFast(v => v.symbol)
	symbols = symbols.concat(store.store.state.ib.orders.mapFast(v => v.symbol))
	symbols = symbols.concat(store.store.state.ib.executions.mapFast(v => v.symbol))
	symbols = symbols.concat(store.store.state.ib.tradings)
	// if (router.router.currentRoute.name == 'symbol') {
	// 	symbols.push(router.router.currentRoute.params.symbol.toUpperCase())
	// }
	symbols = _.uniq(_.compact(symbols))

	let from = _.orderBy(store.store.state.ib.smquotes.mapFast(v => v.symbol))
	let to = _.orderBy(symbols)
	if (
		force != true &&
		from.length > 0 &&
		symbols.length == from.length &&
		JSON.stringify(to) == JSON.stringify(from)
	) {
		return
	}

	return http.post<{ symbols: Array<string> }, Array<SmallQuote>>('/small.quotes', { symbols }, { silent: true }).then(function(response) {
		socket.emitter.removeListener(socketSmallQuote)
		response.forEachFast(v => socket.emitter.addListener(shared.RKEY.CALCS_SMALLS + ':' + v.symbol, socketSmallQuote))
		store.store.state.ib.smquotes = response
		return Promise.resolve()

	}).catch(function(error) {
		console.error('doSyncSmallQuotes > error', error)
		syncSmallQuotes()
		return Promise.resolve()
	})
}

const rxSmquotes = new utils.rxBuffer<SmallQuote>('symbol', 1000, function(smquotes) {
	smquotes.forEachFast(function(smquote) {
		let found = store.store.state.ib.smquotes.find(v => v && v.symbol == smquote.symbol)
		if (found) Object.assign(found, smquote);
		else store.store.state.ib.smquotes.push(smquote);
	})
})

function socketSmallQuote(smquote: SmallQuote) {
	rxSmquotes.next(shared.explode(shared.RMAP.SMALLS, smquote))
}





export function initOrdersExecutions(symbol?: string) {
	return http.post<GetIbBody, GetIbResponse>('/ib.get', {
		symbol,
		orders: true,
		executions: true,
	}).then(function(response) {
		socket.emitter.removeListener(socketOrders)
		socket.emitter.removeListener(socketExecutions)
		store.store.state.ib.orders = response.orders
		socket.emitter.addListener(shared.RKEY.IB.ORDERS, socketOrders)
		store.store.state.ib.executions = response.executions
		socket.emitter.addListener(shared.RKEY.IB.EXECUTIONS, socketExecutions)
		return doSyncSmallQuotes(true)
	}).then(function() {
		store.store.state.ib.isoes = true
		return Promise.resolve()
	}).catch(function(error) {
		console.error('initOrdersExecutions > error', error)
	})
}

export function destroyOrdersExecutions() {
	socket.emitter.removeListener(socketOrders)
	store.store.state.ib.orders.splice(0)
	socket.emitter.removeListener(socketExecutions)
	store.store.state.ib.executions.splice(0)
	syncSmallQuotes()
	store.store.state.ib.isoes = false
}

function socketOrders(orders: Array<nib.Order>) {
	if (!store.store.state.ib.isoes) return socket.emitter.removeListener(socketOrders);
	orders.forEachFast(function(order) {
		let found = store.store.state.ib.orders.find(v => v && v.orderId == order.orderId)
		if (found) Object.assign(found, order);
		else store.store.state.ib.orders.push(order);
	})
	syncSmallQuotes()
}

function socketExecutions(executions: Array<nib.Execution>) {
	if (!store.store.state.ib.isoes) return socket.emitter.removeListener(socketExecutions);
	executions.forEachFast(function(execution) {
		let found = store.store.state.ib.executions.find(v => v && v.execId == execution.execId)
		if (found) Object.assign(found, execution);
		else store.store.state.ib.executions.push(execution);
	})
	syncSmallQuotes()
}





@Vts.Component(<VueComponent>{
	name: 'IbStoreMixin',
} as any)
export class IbStoreMixin extends Vue {

	ib_createOrder(action: string, symbol?: string) { return createOrder(action, symbol) }
	ib_modifyOrder(orderId: number) { return modifyOrder(orderId) }
	ib_cancelOrder(orderId: number) { return cancelOrder(orderId) }
	ib_toggleTrading(symbol: string) { return toggleTrading(symbol) }
	ib_liquidate() { return liquidate() }
	ib_toggleAllOff() { return toggleAllOff() }

	ib_symbol_orders(symbol: string) {
		return this.$store.state.ib.orders.filter(v => v.symbol == symbol)
	}
	ib_orders_count(symbol: string) {
		return this.ib_symbol_orders(symbol).length
	}

	ib_symbol_executions(symbol: string) {
		return this.$store.state.ib.executions.filter(v => v.symbol == symbol)
	}
	ib_commissions(symbol: string) {
		return _.sum(this.ib_symbol_executions(symbol).mapFast(v => v.commission))
	}

	ib_lastPrice(symbol: string) {
		let smquote = this.$store.state.ib.smquotes.find(v => v && v.symbol == symbol)
		return smquote ? smquote.lastPrice : NaN
	}
	ib_lastStamp(symbol: string) {
		let smquote = this.$store.state.ib.smquotes.find(v => v && v.symbol == symbol)
		return smquote ? smquote.lastStamp : NaN
	}

	get ib_executions_pnl() {
		return _.sum(this.$store.state.ib.executions.mapFast(v => v.realizedPNL))
	}

	ib_exchange_name(exchange: string) {
		if (exchange == 'DRCTEDGE') return 'CBOE';
		if (exchange == 'ISLAND') return 'NASDAQ';
		if (exchange == 'ARCA') return 'NYSE';
		return exchange
	}

}

export function createOrder(action: string, symbol?: string) {
	let order = store.store.state.ordersheet
	if (!symbol && router.router.currentRoute && router.router.currentRoute.name == 'symbol' && router.router.currentRoute.params.symbol) {
		symbol = router.router.currentRoute.params.symbol
	}
	if (symbol) {
		order.symbol = symbol
		let smquote = store.store.state.ib.smquotes.find(v => v && v.symbol == symbol)
		if (smquote) order.lmtPrice = fixPrice(smquote.lastPrice);
		let position = store.store.state.ib.positions.find(v => v && v.symbol == symbol)
		if (position) {
			if (action == 'sell') order.totalQuantity = position.position;
			order.position = position
		}
	}
	if (shared.marketState() != 'REGULAR') order.orderType = 'limit';
	order.action = action
	order.show = true
}

export function modifyOrder(orderId: number) {
	let order = store.store.state.ordersheet
	let exists = store.store.state.ib.orders.find(v => v.orderId == orderId)

	let symbol = exists.symbol
	order.symbol = symbol

	order.orderId = exists.orderId
	order.action = _.invert(shared.IB_ACTIONS)[exists.action]
	order.orderType = _.invert(shared.IB_ORDER_TYPES)[exists.orderType]
	order.tif = _.invert(shared.IB_TIME_IN_FORCES)[exists.tif]
	order.totalQuantity = exists.totalQuantity
	order.auxPrice = exists.auxPrice
	order.lmtPrice = exists.lmtPrice

	// console.log('order', JSON.stringify(order, null, 4))

	let position = store.store.state.ib.positions.find(v => v && v.symbol == symbol)
	if (position) order.position = position;
	else order.position = null;

	order.show = true
}

export function cancelOrder(orderId: number) {
	return http.post<{ orderId: number }, nib.Order>('/ib.cancel.order', { orderId }, { production: true }).then(function(response) {
		Snackbar.rxItems.next({ message: `Order #${response.orderId} to ${response.action.toLowerCase()} ${response.totalQuantity} shares of ${response.symbol} has been cancelled!`, color: 'warning' })
	}).catch(error => {
		console.error('cancelOrder > error', error)
	})
}

export function toggleTrading(symbol: string) {
	return http.post<{ symbol: string }>('/ib.toggle.trading', { symbol }, { production: true })
}

export function liquidate() {
	return http.post('/ib.liquidate', null, { production: true })
}

export function toggleAllOff() {
	return http.post<GetIbBody, GetIbResponse>('/ib.get', {
		tradings: true,
	}, { silent: true }).then(function(response) {
		let symbols = response.tradings
		return Promise.all(symbols.mapFast(v => toggleTrading(v)))
	})
}

export function fixPrice(price: number) {
	let precision = _.round(price * 10000) % 10 == 0 ? 2 : 4
	return _.round(price, precision)
}


