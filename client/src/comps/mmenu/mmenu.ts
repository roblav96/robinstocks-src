//

import * as Template from './mmenu.html?style=./mmenu.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as router from '../../router'
import * as ibstore from '../../services/ib.store'
import * as SymbolSearch from '../symbol.search/symbol.search'



@Template
@Vts.Component(<VueComponent>{
	name: 'Mmenu',
} as any)
export default class Mmenu extends Avts.Mixin<Vue & ibstore.IbStoreMixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, utils.Mixin) {

	created() {
		this.initClock()
	}

	mounted() {

	}

	beforeDestroy() {
		clearInterval(this.clockinterval)
	}



	@Vts.Watch('$route')
	w_$route(to: VueRoute, from: VueRoute) {
		let el = document.getElementById('mmenu_scroll')
		if (el.scrollTop == 0) return;
		el.scrollTo({ top: 0, behavior: 'smooth' })
	}
	onScrollY(event: MouseEvent) {
		/**
			TODO:
			- why this no work???
		**/
		console.log('onScrollY', event)
	}
	// onscroll = _.debounce(function() {
	// 	console.log('onscroll')
	// 	let el = document.getElementById('mmenu_scroll')
	// 	if (el.scrollTop == 0) return;
	// 	el.scrollTo({ top: 0, behavior: 'smooth' })
	// }, 3000, { leading: false, trailing: true })

	get rhauthed() { return this.$store.state.rhauthed }

	get routes() {
		return router.routes.filter(v => !!v.icon && v.mmenu != false && !v.category).mapFast(v => {
			return { name: v.name, dname: v.dname, icon: v.icon } as RouteConfig
		})
	}

	showdevmenu = false
	get devs() {
		return router.routes.filter(v => v.category == 'developer').mapFast(v => {
			return { name: v.name, dname: v.dname, icon: v.icon } as RouteConfig
		})
	}

	categoryActive(category: string) {
		let route = router.routes.find(v => v.name == this.$route.name)
		return route.category == category
	}



	pickSymbol() {
		SymbolSearch.pick().then(symbol => {
			if (!symbol) return;
			this.$router.push({ name: 'symbol', params: { symbol } })
		})
	}



	clock = ''
	clocksecs: number
	clocklast: number
	clockinterval: number
	setClock() {
		this.clock = moment(Date.now()).format('hh:mm:ss')
	}
	updateClock() {
		let last = Math.floor((Date.now() % this.clocksecs) / 500)
		if (this.clocklast == 1 && last == 0) {
			this.clocklast = last
			this.setClock()
		}
		if (this.clocklast == 0 && last == 1) {
			this.clocklast = last
		}
	}
	initClock() {
		this.setClock()
		this.clocksecs = moment.duration(1, 'second').asMilliseconds()
		this.clocklast = 0
		this.clockinterval = setInterval(this.updateClock, 100) as any
	}



}






