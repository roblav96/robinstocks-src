//

import * as Template from './symbol.search.html?style=./symbol.search.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import * as Snackbar from '../../comps/snackbar/snackbar'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as store from '../../services/store'
import * as yahoo from '../../services/yahoo'



declare global {
	interface SymbolSearchHistoryItem {
		symbol: string
		stamp: number
	}
	interface SymbolSearchItem extends SymbolSearchHistoryItem {
		name: string
		type: string
		lastPrice: number
		prevClose: number
		priceChange: number
		lastStamp: number
	}
}

export class module {
	show = false
	history = lockr.get('symbol.search.history', [] as Array<SymbolSearchHistoryItem>)
}

export const pushHistory = _.debounce(function(symbol: string) {
	if (_.isEmpty(symbol)) return;
	store.store.state.symbolsearch.history.unshift({ symbol, stamp: shared.now() })
	store.store.state.symbolsearch.history = _.uniqBy(_.compact(store.store.state.symbolsearch.history), 'symbol').splice(0, 50)
}, 300, { leading: false, trailing: true })



@Template
@Vts.Component(<VueComponent>{
	name: 'SymbolSearch',
} as any)
export default class SymbolSearch extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	created() {

	}

	mounted() {
		// _.delay(() => this.$store.state.ordersheet.show = true, 300)
	}

	beforeDestroy() {

	}



	get symbolsearch() { return this.$store.state.symbolsearch }

	@Vts.Watch('$route') w_$route(to: VueRoute, from: VueRoute) {
		if (this.symbolsearch.show == true) this.close();
		if (to.name == 'symbol' && to.params.symbol) pushHistory(to.params.symbol.toUpperCase());
	}

	@Vts.Watch('symbolsearch.history') w_history(history: Array<SymbolSearchHistoryItem>) { lockr.set('symbol.search.history', history) }

	@Vts.Watch('symbolsearch.show') w_show = _.debounce(this._w_show, 300, { leading: false, trailing: true })
	_w_show(to: boolean, from: boolean) {
		if (to == true) {
			let el = document.getElementById('ss_query_input') as HTMLInputElement
			el.focus()
			el.setSelectionRange(0, el.value.length)
			window.addEventListener('keydown', this.onkeydown)
			if (!this.query) {
				this.query = 'chips'
				this.w_query.cancel()
			}
			this.syncQuery()
		}
		if (to == false) {
			let el = document.getElementById('ss_chips_scroll') as HTMLInputElement
			el.scrollLeft = 0
			this.w_query.cancel()
			window.removeEventListener('keydown', this.onkeydown)
			process.ee3.emit('symbol.search.pick')
		}
	}

	close() {
		this.symbolsearch.show = false
	}



	focused = 0
	busy = false

	items = lockr.get('symbol.search.items', [] as Array<SymbolSearchItem>)
	@Vts.Watch('items') w_items(items: Array<SymbolSearchItem>) { lockr.set('symbol.search.items', items) }

	query = lockr.get('symbol.search.query', 'chips')
	@Vts.Watch('query') w_query = _.debounce(this._w_query, 100, { leading: false, trailing: true })
	_w_query(query: string) {
		lockr.set('symbol.search.query', query)
		this.syncQuery()
	}

	syncQuery() {
		if (this.query.length == 0) {
			this.items = []
			this.busy = false
			this.w_query.cancel()
			return
		}
		if (this.busy) {
			this.w_query.cancel()
			this.w_query(this.query)
			return
		}
		this.busy = true

		http.get('https://api.robinhood.com/instruments/', { query: this.query }, { silent: true }).then((response: RobinhoodPaginatedResponse<RobinhoodInstrument>) => {
			utils.vdestroyedSafety(this)
			_.remove(response.results, function(v, i) {
				let symbols = ['INDU', 'BUR', 'PDLB', 'EMD']
				let types = ['wrt', 'nyrs', 'unit', 'rlt', 'lp', 'tracking']
				return (
					v.state == 'active' &&
					v.tradability == 'tradable' &&
					v.tradeable == true &&
					_.isString(v.type) &&
					types.indexOf(v.type) == -1 &&
					symbols.indexOf(v.symbol) == -1 &&
					!_.isArray(v.symbol.match(/\W+/))
				) == false
			})

			let symbols = response.results.mapFast(v => v.symbol)
			if (symbols.length == 0) return Promise.reject(null);

			let items = response.results.mapFast(function(v) {
				shared.fixResponse(v)
				return { symbol: v.symbol, type: _.capitalize(v.type), name: v.name, stamp: shared.now() } as SymbolSearchItem
			})

			return yahoo.getQuotes(symbols).then(yquotes => {
				utils.vdestroyedSafety(this)
				yquotes.forEachFast(yquote => {
					let item = items.find(vv => vv.symbol == yquote.symbol)
					if (!item) return;
					let cquote = yahoo.ycQuoteFast(yquote)
					cquote.stamp = shared.now()
					cquote.priceChange = utils.calcPercentChange(cquote.lastPrice, cquote.prevClose)
					shared.merge(item, cquote)
				})

				this.items = items

				this.$nextTick(function() {
					let el = document.getElementById('ss_table_scroll')
					el.scrollTop = 0
				})
			})

		}).catch((error) => {
			if (error) console.error('syncQuery > error', error);
		}).then(() => {
			utils.vdestroyedSafety(this)
			this.$nextTick(() => this.busy = false)
		})

	}

	submit(symbol: string) {
		if (this.query.length == 0 || this.items.length == 0) return;
		if (symbol == this.query && this.busy) return this.choose(this.query);
		let item = this.items[this.focused]
		this.choose(item.symbol)
	}

	choose(symbol: string) {
		symbol = symbol.toUpperCase()
		process.ee3.emit('symbol.search.pick', symbol)
		pushHistory(symbol)
		this.close()
	}



	onkeydown(evt: KeyboardEvent) {
		if (evt.keyCode == 27) {
			/*=====  esc  ======*/
			evt.preventDefault()
			this.close()
		} else if ((evt.keyCode === 114 || (evt.metaKey && evt.keyCode === 70))) {
			/*=====  ctrl + f  ======*/
			let el = document.getElementById('ss_query_input') as HTMLInputElement
			if (!el) return;
			evt.preventDefault()
			el.focus()
			el.setSelectionRange(0, el.value.length)
		}
	}

}



export function pick(): Promise<string> {
	setTimeout(() => store.store.state.symbolsearch.show = true, 100)
	return new Promise(function(resolve, reject) {
		process.ee3.once('symbol.search.pick', resolve)
	})
}



@Vts.Component(<VueComponent>{
	name: 'SymbolSearchMixin',
} as any)
export class Mixin extends Vue {

	mounted() {
		window.addEventListener('keydown', this.onkeyboard)
	}

	beforeDestroy() {
		window.removeEventListener('keydown', this.onkeyboard)
	}

	onkeyboard(evt: KeyboardEvent) {
		if ((evt.keyCode === 114 || (evt.metaKey && evt.keyCode === 70)) && this.$store.state.symbolsearch.show == false) {
			/*=====  ctrl + f  ======*/
			this.pickSymbol()
			evt.preventDefault()
		}
	}

	pickSymbol() {
		pick().then(symbol => {
			if (!symbol) return;
			this.$router.push({ name: 'symbol', params: { symbol } })
		})
	}

}










