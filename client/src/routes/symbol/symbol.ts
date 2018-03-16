//

import * as Template from './symbol.html?style=./symbol.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import moment from 'moment'
import SymbolToolbar from '../../ui/symbol.tbar/symbol.tbar'
import * as SymbolSearch from '../../comps/symbol.search/symbol.search'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'
import * as ibstore from '../../services/ib.store'
import * as SymbolFundamentals from './symbol.fundamentals'
import * as SymbolChart from './symbol.chart'
import * as SymbolNews from './symbol.news'
import * as SymbolBacktest from './symbol.backtest'
import * as SymbolDebug from './symbol.debug'



const TABS = [{
	id: 'fundamentals',
	dname: 'Summary',
	icon: 'mdi-cash-100',
	component: SymbolFundamentals.default,
}, {
	id: 'chart',
	dname: 'Chart',
	icon: 'mdi-chart-line',
	component: SymbolChart.default,
}, {
	id: 'news',
	dname: 'News',
	icon: 'mdi-newspaper',
	component: SymbolNews.default,
}, {
	id: 'debug',
	dname: 'Debug',
	icon: 'mdi-bug',
	component: SymbolDebug.default,
}] as Array<BottomTabItem>



let components = utils.buildBottomTabs(TABS)
components['symbol-toolbar'] = SymbolToolbar

@Template
@Vts.Component(<VueComponent>{
	name: 'Symboll',

	components,

	beforeRouteEnter(to: VueRoute, from: VueRoute, next: VueRouteNext) {
		if (!to.params.symbol) {
			console.warn('beforeRouteEnter > !to.params.symbol')
			return next(false)
		}
		if (to.query.tab && TABS.find(v => v.id == to.query.tab)) return next();
		let route = utils.clone(to)
		let i = lockr.get('symbol.tab.index', 1)
		route.query.tab = TABS[i].id
		next(route)
	},

} as any)
export default class Symbol extends Avts.Mixin<Vue & ibstore.IbStoreMixin & SymbolSearch.Mixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, SymbolSearch.Mixin, utils.Mixin) {

	created() {
		this.syncSymbol(true)
	}

	mounted() {
		ibstore.initOrdersExecutions(this.symbol)
	}

	beforeDestroy() {
		ibstore.destroyOrdersExecutions()
		socket.emitter.removeListener(this.socketCalcQuote)
	}



	loading = true
	tabs = utils.clone(TABS)
	get index() {
		return this.tabs.findIndex(v => v.id == this.$route.query.tab)
	}
	set index(index: number) {
		lockr.set('symbol.tab.index', index)
		let query = Object.assign(utils.clone(this.$route.query), { tab: this.tabs[index].id })
		this.$router.replace({ query })
	}
	@Vts.Watch('$route')
	w_$route(to: VueRoute, from: VueRoute) {
		if (!to.query.tab || to.params.symbol != from.params.symbol) {
			this.$router.replace({ query: utils.clone(from.query) })
		}
	}



	cquote = {} as CalcQuote
	@Vts.Watch('cquote', { deep: true })
	w_cquote(to: CalcQuote) {
		document.title = to.symbol + ' ' + utils.formatPrice(to.lastPrice) + ' (' + utils.humanPlusMinus(to.priceChange) + '%)'
	}

	get symbol() { return this.$route.params.symbol.toUpperCase() }
	@Vts.Watch('symbol')
	w_symbol(to: string, from: string) {
		this.syncSymbol()
	}

	syncSymbol(force = false) {
		if (this.loading && force == false) return;
		this.loading = true
		socket.emitter.removeListener(this.socketCalcQuote)

		return http.post<{ symbols: Array<string> }, Array<CalcQuote>>('/calc.quotes', { symbols: [this.symbol] }).then(response => {
			utils.vdestroyedSafety(this)
			response = response.mapFast(v => shared.explode(shared.RMAP.CALCS, v))
			this.cquote = response[0]
			socket.emitter.addListener(shared.RKEY.CALCS + ':' + this.symbol, this.socketCalcQuote)
			return Promise.resolve()

		}).catch(error => {
			console.error('syncSymbol > error', error)
			return Promise.resolve()

		}).then(() => {
			if (!utils.visDestroyed(this)) this.$nextTick(() => this.loading = false);
			return Promise.resolve()
		})
	}

	socketCalcQuote(cquote: CalcQuote) {
		cquote = shared.explode(shared.RMAP.CALCS, cquote)
		shared.merge(this.cquote, cquote)
	}



}






