//

import * as Template from './order.sheet.html?style=./order.sheet.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
import nib from 'ib'
import SymbolToolbar from '../../ui/symbol.tbar/symbol.tbar'
import * as Snackbar from '../snackbar/snackbar'
import * as SymbolSearch from '../symbol.search/symbol.search'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as socket from '../../services/socket'
import * as http from '../../services/http'
import * as store from '../../services/store'
import * as ibstore from '../../services/ib.store'



export class module {
	show = false
	types = Object.keys(shared.IB_ORDER_TYPES).mapFast(k => ({ text: _.startCase(k), value: k }))
	tifs = Object.keys(shared.IB_TIME_IN_FORCES).mapFast(k => ({ text: _.startCase(k), value: k }))
	position = null as nib.Position
	symbol = ''
	orderId = NaN
	action = 'buy'
	totalQuantity = 0
	orderType = 'market'
	auxPrice = NaN
	lmtPrice = NaN
	tif = 'goodUntilCancelled'
	outsideRth = true
}

const blank = JSON.stringify(_.pick(new module(), ['symbol', 'orderId', 'action', 'totalQuantity', 'orderType', 'auxPrice', 'lmtPrice', 'tif', 'outsideRth', 'position']))
export function reset() {
	Object.assign(store.store.state.ordersheet, JSON.parse(blank))
}



@Template
@Vts.Component(<VueComponent>{
	name: 'OrderSheet',
	components: {
		'symbol-toolbar': SymbolToolbar,
	},
} as any)
export default class OrderSheet extends Avts.Mixin<Vue & ibstore.IbStoreMixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, utils.Mixin) {

	created() {

	}

	mounted() {
		// _.delay(() => this.$store.state.ordersheet.show = true, 1000)
	}

	beforeDestroy() {

	}



	get order() { return this.$store.state.ordersheet }

	@Vts.Watch('order.show') w_show = _.debounce(this._w_show, 300, { leading: false, trailing: true })
	_w_show(to: boolean, from: boolean) {
		if (to == true && _.isEmpty(this.order.symbol)) {
			if (this.$route.name == 'symbol' && this.$route.params.symbol) this.order.symbol = this.$route.params.symbol;
			else this.pickSymbol();
		}
		if (to == false) {
			socket.emitter.removeListener(this.socketCalcQuote)
			this.cquote = {} as any
			reset()
		}
	}

	show_type(type: string) {
		type = type.toLowerCase()
		let otype = this.order.orderType.toLowerCase()
		if (otype.indexOf('market') >= 0) return false;
		return otype.indexOf(type.toLowerCase()) >= 0
	}

	get is_buy() {
		return this.order.action == 'buy'
	}
	get v_color() {
		if (this.order.action == 'sell') return 'error';
		if (this.order.action == 'buy') return 'success';
		return 'white'
	}
	get submit_text() {
		return this.order.action + ' ' + this.order.totalQuantity + ' Shares of ' + this.order.symbol
	}
	get v_total() {
		let price = this.cquote.lastPrice || 0
		if (this.order.orderType.toLowerCase().indexOf('stop') >= 0) price = this.order.auxPrice;
		else if (this.order.orderType.toLowerCase().indexOf('limit') >= 0) price = this.order.lmtPrice;
		return '$' + utils.formatPrice(this.order.totalQuantity * price)
	}
	get v_cansubmit() {
		if (_.isEmpty(this.order)) return false;
		return _.isEmpty(this.order.action) || _.isEmpty(this.order.symbol) || _.get(this.order, 'totalQuantity') <= 0
	}

	pickSymbol() {
		SymbolSearch.pick().then(symbol => {
			if (!symbol) return;
			this.order.symbol = symbol
		})
	}

	reset() { reset() }

	busy = false
	submit() {
		if (this.busy) return;
		this.busy = true
		http.post<nib.Order, nib.Order>('/ib.submit.order',
			_.pick(this.order, ['symbol', 'orderId', 'action', 'totalQuantity', 'orderType', 'auxPrice', 'lmtPrice', 'tif', 'outsideRth']) as any,
			{ production: true },
		).then(response => {
			utils.vdestroyedSafety(this)
			Snackbar.rxItems.next({ message: `Order #${response.orderId} to ${response.action.toLowerCase()} ${response.totalQuantity} shares of ${response.symbol} was submitted successfully!`, color: 'info' })
			if (response.message) Snackbar.rxItems.next({ message: `[Order #${response.orderId} message]: ${response.message}`, color: 'warning' });
			this.order.show = false

		}).catch(error => {
			console.error('submit > error', error)

		}).then(() => {
			this.$nextTick(() => this.busy = false)
		})
	}



	get v_quantities() {
		if (_.isEmpty(this.cquote)) return [];
		let quantities = []
		let count = 6
		let max = 25000
		let min = _.max([100, _.floor(this.cquote.lastPrice)])
		if (this.order.action == 'sell' && this.order.position) {
			max = this.order.position.position
			min = 1
			count = _.min([count, max])
			let each = _.round((max - min) / (count - 1))
			let i: number, len = count
			for (i = 0; i < len; i++) {
				quantities.push(_.ceil(min + (each * i)))
			}
			quantities[quantities.length - 1] = max
		} else {
			let each = _.round((max - min) / (count - 1))
			let i: number, len = count
			for (i = 0; i < len; i++) {
				let cap = min + (each * i)
				quantities.push(_.ceil(cap / this.cquote.lastPrice))
			}
		}
		return quantities.reverse()
	}

	get v_stops() {
		if (_.isEmpty(this.cquote)) return [];
		let stops = [{
			text: '+10%', value: this.cquote.lastPrice + (this.cquote.lastPrice * 0.1),
		}, {
			text: '+5%', value: this.cquote.lastPrice + (this.cquote.lastPrice * 0.05),
		}, {
			text: '+2%', value: this.cquote.lastPrice + (this.cquote.lastPrice * 0.02),
		}, {
			text: '-2%', value: this.cquote.lastPrice - (this.cquote.lastPrice * 0.02),
		}, {
			text: '-5%', value: this.cquote.lastPrice - (this.cquote.lastPrice * 0.05),
		}, {
			text: '-10%', value: this.cquote.lastPrice - (this.cquote.lastPrice * 0.1),
		}]
		stops.forEachFast(v => v.value = _.round(v.value, 3))
		return stops
	}

	get v_limits() {
		if (_.isEmpty(this.cquote)) return [];
		let limits = [{
			text: '3x Ask', value: this.cquote.lastPrice + ((this.cquote.askSpread - this.cquote.lastPrice) * 3),
		}, {
			text: '2x Ask', value: this.cquote.lastPrice + ((this.cquote.askSpread - this.cquote.lastPrice) * 2),
		}, {
			text: 'Ask', value: this.cquote.askSpread,
		}, {
			text: 'Last Sale', value: this.cquote.lastPrice,
		}, {
			text: 'Bid', value: this.cquote.bidSpread,
		}, {
			text: '2x Bid', value: this.cquote.lastPrice - ((this.cquote.lastPrice - this.cquote.bidSpread) * 2),
		}, {
			text: '3x Bid', value: this.cquote.lastPrice - ((this.cquote.lastPrice - this.cquote.bidSpread) * 3),
		}]
		limits.forEachFast(v => v.value = _.round(v.value, 3))
		return limits
	}



	cquote = {} as CalcQuote

	@Vts.Watch('order.symbol')
	w_symbol(to: string, from: string) {
		socket.emitter.removeListener(this.socketCalcQuote)
		this.cquote = {} as any
		if (_.isEmpty(to)) return;

		let position = this.$store.state.ib.positions.find(v => v.symbol == to && v.position != 0)
		if (position) this.order.position = position;
		else this.order.position = null;

		http.post<{ symbols: Array<string> }, Array<CalcQuote>>('/calc.quotes', { symbols: [to] }).then(response => {
			if (this.order.show == false) return;
			response = response.mapFast(v => shared.explode(shared.RMAP.CALCS, v))
			this.cquote = response[0]
			if (!Number.isFinite(this.order.auxPrice)) this.order.auxPrice = this.cquote.lastPrice;
			if (!Number.isFinite(this.order.lmtPrice)) this.order.lmtPrice = this.cquote.lastPrice;
			socket.emitter.addListener(shared.RKEY.CALCS + ':' + this.cquote.symbol, this.socketCalcQuote)
		}).catch(error => {
			console.error('w_symbol > error', error)
		})

		// http.get<Array<nib.Position>>('/ib.positions').then(positions => {
		// 	this.order.position = positions.find(v => v.symbol == to && v.position != 0)
		// 	if (this.order.position) this.$nextTick(() => this.$forceUpdate());
		// 	// if (this.order.position) {
		// 	// 	if (_.isEmpty(this.order.action)) this.order.action = 'sell';
		// 	// 	if (this.order.action == 'sell') this.order.quantity = this.order.position.position;
		// 	// }
		// }).catch(error => {
		// 	console.error('w_symbol > error', error)
		// })
	}
	socketCalcQuote(cquote: CalcQuote) {
		cquote = shared.explode(shared.RMAP.CALCS, cquote as any)
		shared.merge(this.cquote, cquote)
	}



	// devInitOrder() {
	// 	this.action = 'buy'
	// 	this.symbol = 'AMD'
	// 	this.quantity = utils.math_randomInt(9, 99)
	// 	this.type = 'limit'
	// 	this.limit = 12.25 + _.round(_.random(0.05, 0.15))
	// 	this.tif = 'day'
	// 	this.rth = true
	// 	// this.submit()
	// }



}










