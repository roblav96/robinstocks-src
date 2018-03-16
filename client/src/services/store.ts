// 

import * as Avts from 'av-ts'
import Vue from 'vue'
import Vuex from 'vuex'
import lockr from 'lockr'
import * as utils from './utils'
import * as shared from '../shared'
import * as scope from './scope'
import * as socket from './socket'
import * as http from './http'
import * as router from '../router'
import * as SymbolSearch from '../comps/symbol.search/symbol.search'
import * as OrderSheet from '../comps/order.sheet/order.sheet'
import * as IbStore from './ib.store'



class State {

	rhauthed = !!scope.rxRhToken.value
	marketOpen = false

	ordersheet = new OrderSheet.module()
	symbolsearch = new SymbolSearch.module()
	ib = new IbStore.module()

}
declare global { type StoreState = State }



export const store = new Vuex.Store<State>({
	strict: false,
	state: new State(),
})
// console.log('store.state', store.state)

scope.rxRhToken.subscribe(v => store.state.rhauthed = !!v)





// const StoragePlugin = function(store: Vuex.Store<State>) {
// 	// let vm = (store as any)._vm as Vue
// 	Object.keys(store.state).forEach(function(key) {
// 		if (['authed'].indexOf(key) != -1) return;
// 		store.state[key] = lockr.get('store.' + key, store.state[key])
// 		store.watch(function(state) { return state[key] }, function(to, from) {
// 			if (key == 'symbol') syncCompanyName(to);
// 			lockr.set('store.' + key, to)
// 		}, { deep: true })
// 	})
// }



// function syncCompanyName(symbol: string) {
// 	let cname = '...'
// 	let url = 'https://api.robinhood.com/instruments/?symbol=' + symbol
// 	http.get(url).then(function(response: RobinhoodPaginatedResponse<RobinhoodInstrument>) {
// 		cname = 'Invalid Symbol'
// 		if (response.results && response.results[0]) {
// 			let instrument = response.results[0]
// 			cname = (instrument.simple_name) ? instrument.simple_name : instrument.name
// 		}
// 	}).catch(function(error) {
// 		console.error('syncCompanyName > error', error)
// 		cname = 'Network Error...'
// 	}).then(function() {
// 		Store.state.cname = cname
// 	})
// }


