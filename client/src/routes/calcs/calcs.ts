//

import * as Template from './calcs.html?style=./calcs.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import chartist from 'chartist'
import pdelay from 'delay'
import pevent from 'p-event'
import pforever from 'p-forever'
import pqueue from 'p-queue'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as socket from '../../services/socket'
import * as http from '../../services/http'
import * as yahoo from '../../services/yahoo'
import * as ibstore from '../../services/ib.store'
import * as Snackbar from '../../comps/snackbar/snackbar'
import * as RouterIcon from '../../mixins/router.icon/router.icon'



@Template
@Vts.Component(<VueComponent>{
	name: 'Calcs',

	directives: {
		'chart': {
			inserted: function(el: any, binding, vnode, oldVnode) {
				el.slen = 0
				el.chart = new chartist.Line(el,
					{ series: [] },
					{
						axisX: {
							offset: 0,
							showLabel: false,
							showGrid: false,
							type: chartist.FixedScaleAxis,
						},
						axisY: {
							offset: 0,
							showLabel: false,
							showGrid: false,
						},
						chartPadding: { right: 0, left: 0, top: 2, bottom: 2 },
						fullWidth: true,
						showPoint: false,
						lineSmooth: false,
					},
				)
				{ (vnode.data.directives[0] as any).def.update(el, binding, vnode, oldVnode) }
			},
			update: function(el: any, binding, vnode, oldVnode) {
				let calcs = vnode.context as Calcs
				let symbol = binding.value as string
				let cquote = calcs.items.find(v => v.symbol == symbol)
				let quotes = calcs.sparks[symbol]
				if (!quotes || quotes.length == el.slen) return;
				el.slen = quotes.length
				let eods = []
				let prices = []
				quotes.forEachFast(function(v) {
					eods.push({ x: new Date(v.lastStamp), y: cquote.eodPrice })
					prices.push({ x: new Date(v.lastStamp), y: v.lastPrice })
				})
				el.chart.update({
					series: [
						{ className: 'ct-eods', data: eods },
						{ data: prices },
					]
				})
			},
			unbind(el: any, binding, vnode, oldVnode) {
				el.slen = 0
				el.chart.detach()
				el.chart = null
			},
		},
	},

} as any)
export default class Calcs extends Avts.Mixin<Vue & ibstore.IbStoreMixin & RouterIcon.Mixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, RouterIcon.Mixin, utils.Mixin) {

	created() {

	}

	mounted() {
		this.syncSortBy()
		// _.delay(() => this.showpicker = true, 1000)
		// Snackbar.rxItems.next({ message: 'Filters work in progress...', icon: 'mdi-sign-caution' })
	}

	beforeDestroy() {
		this.resync.cancel()
	}



	sortBy = lockr.get('calcs.sortBy', 'count')
	@Vts.Watch('sortBy') w_sortBy(sortBy: string) { lockr.set('calcs.sortBy', sortBy) }

	descending = lockr.get('calcs.descending', true)
	@Vts.Watch('descending') w_descending(descending: boolean) { lockr.set('calcs.descending', descending) }

	syncing = lockr.get('calcs.syncing', true)
	@Vts.Watch('syncing') w_syncing(syncing: boolean) {
		lockr.set('calcs.syncing', syncing)
		this.syncSortBy()
	}



	busy = true
	items = [] as Array<CalcQuote>
	sparks = {} as { [symbol: string]: Array<TinyQuote> }
	headers = ([
		{ key: 'count' },
		{ key: 'lastStamp' }, { key: 'priceChange' },
		{ key: 'volume' }, { key: 'avgVolume' },
		{ key: 'volumeOsc', pmcolor: true },
		{ key: 'volumeProgressOsc', pmcolor: true },
		{ key: 'tradeFlowVolume', pmcolor: true },
		{ key: 'marketCap' }, { key: 'sharesOutstanding' }, { key: 'sharesFloat' },
		// { key: 'velocity_ewma_5' },
		{ key: 'stamp' },
	] as Array<VueHeaderItem>).mapFast(h => {
		let k = h.key
		h.sortable = true
		h.text = _.startCase(k)
		if (k == 'lastStamp') h.text = 'Last Sale';
		else if (k == 'priceChange') h.text = 'Change';
		else if (k == 'tradeFlowVolume') h.text = 'Volume Flow';
		else if (k == 'volumeProgressOsc') h.text = 'Volume Prog';
		else if (k == 'sharesOutstanding') h.text = 'Shares Out';
		else if (k == 'stamp') h.text = 'Updated';
		return h
	})

	reqid = 0

	setSortBy(sortBy: string) {
		if (this.busy) return;
		this.busy = true
		let descending = this.descending
		if (this.sortBy == sortBy) descending = !descending;
		this.syncSortBy(sortBy, descending)
	}

	resync = _.debounce(this.syncSortBy, 3000, { leading: false, trailing: true })
	syncSortBy(sortBy = this.sortBy, descending = this.descending) {
		this.reqid++
		let reqid = this.reqid
		this.resync.cancel()
		return http.post<ScreenerBody, Array<CalcQuote>>('/screener', {
			sortBy, descending,
		}, { silent: false, production: false }).then<any>(items => {
			if (utils.visDestroyed(this) || this.reqid > reqid) return Promise.resolve();

			if (sortBy == null || items.length == 0) {
				this.items = items
				return Promise.resolve()
			}

			items = _.orderBy(items, [sortBy]).filter(v => _.isFinite(v[sortBy]))
			if (descending) items.reverse();

			return this.syncSparks(items.mapFast(v => v.symbol)).then(() => {
				if (utils.visDestroyed(this) || this.reqid > reqid) return Promise.resolve();
				this.items = items
				this.$nextTick(() => {
					this.sortBy = sortBy
					this.descending = descending
				})
				return Promise.resolve()
			})

		}).catch(error => {
			console.error('syncSortBy > error', error)
			return Promise.resolve()

		}).then(() => {
			if (utils.visDestroyed(this) || this.reqid > reqid) return Promise.resolve();
			this.$nextTick(() => {
				if (this.syncing) this.resync();
				this.busy = false
			})
			return Promise.resolve()
		})
	}

	syncSparks(symbols: Array<string>) {
		return http.post('/get.tinys5m', { symbols }, { silent: false, production: false }).then((response: Array<Array<any>>) => {
			response = response.mapFast(v => v.mapFast(vv => shared.explode(shared.RMAP.TINYS, vv)))
			this.sparks = {}
			response.forEachFast((v, i) => this.sparks[symbols[i]] = v)
			return Promise.resolve()
		}).catch(function(error) {
			console.error('syncSparks > error', error)
			return Promise.resolve()
		})
	}



	td_v(item: CalcQuote, k: string, i: number) {
		let v = item[k] as any
		if (v == null) return v;
		else if (k == 'priceChange') v = utils.humanPlusMinus(v) + '%';
		else if (k == 'count') v = utils.formatNumber(v, 0);
		else if (k.toLowerCase().indexOf('stamp') >= 0) v = utils.from_now(v);
		else v = utils.formatNumber(v, null, 1000);
		return v
	}



	onScrollY(event: MouseEvent) {
		let target = event.target as HTMLElement
		let theadY = Math.max(target.scrollTop - 24, 0)
		let el = document.querySelector('.calcs-route thead') as HTMLElement
		el.style.transform = 'translateY(' + theadY + 'px)'
	}

	onScrollX(event: MouseEvent) {
		let target = event.target as HTMLElement
		let theadX = target.scrollLeft
		let els = document.querySelectorAll('.calcs-route table .symbol-chip-btn')
		_.forEach(els, (el: HTMLElement) => el.style.transform = 'translateX(' + theadX + 'px)')
	}











	filtersearch = ''
	showpicker = false
	@Vts.Watch('showpicker') w_showpicker = _.debounce(this._w_showpicker, 300, { leading: false, trailing: true })
	_w_showpicker(to: boolean, from: boolean) {
		if (to == true) {
			document.getElementById('calcs_filter_search').focus()
		}
		if (to == false) {

		}
	}

	togglePicker() {
		if (process.PRODUCTION) {
			return Snackbar.rxItems.next({ message: 'Filters work in progress...', color: 'info' })
		}
		this.showpicker = !this.showpicker
		// if (!this.showpicker) this.showpicker = true;
	}



	get v_filters() {
		let skips = shared.clone(shared.SKIP_KEYS) as Array<keyof CalcQuote>
		skips = skips.concat(shared.EWMAS.RMAP as any)
		skips = skips.concat(<Array<keyof CalcQuote>>[
			'wbstatusStamp', 'lastStamp', 'stamp',
		])

		let rmap = shared.clone(shared.RMAP.CALCS) as Array<keyof CalcQuote>
		rmap = rmap.filter(v => skips.indexOf(v) == -1)

		let filters = rmap.mapFast(key => ({
			key,
			text: _.startCase(key),
			type: 'number',
		}))

		let search = utils.cleanSearch(this.filtersearch) || ''
		if (search.length > 0) {
			filters = filters.filter(v => utils.cleanSearch(v.text).indexOf(search) >= 0)
		}

		return _.orderBy(filters, ['text'], ['asc'])
	}





}





