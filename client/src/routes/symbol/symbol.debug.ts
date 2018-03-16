//

import * as Template from './symbol.debug.html?style=./symbol.debug.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import Symbol from './symbol'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'
import * as charts from '../../services/charts'



@Template
@Vts.Component(<VueComponent>{
	name: 'SymbolDebug',
} as any)
export default class SymbolDebug extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	get parent() { return this.$parent as Symbol }
	get cquote() { return this.parent.cquote }
	get symbol() { return this.$route.params.symbol.toUpperCase() }

	created() {

	}

	mounted() {
		(this.$refs.symbol_debug_search as HTMLElement).focus()
	}

	beforeDestroy() {

	}



	search = ''
	get v_cquote() {
		let keys = Object.keys(this.cquote)
		let search = shared.parseToId(this.search, true)
		if (search) {
			keys = keys.filter(key => {
				let inkey = key.toLowerCase().indexOf(search) >= 0
				let invalue = shared.parseToId(JSON.stringify(this.cquote[key]), true).indexOf(search) >= 0
				return inkey || invalue
			})
		}
		return _.orderBy(keys.mapFast(key => {
			return { key, value: this.cquote[key] }
		}), ['key'])
	}

	v_value(k: string, v: any) {
		k = k.toLowerCase()
		if (k == 'tickerid') return v;
		if (k.indexOf('stamp') >= 0 || k.indexOf('time') >= 0 || k.indexOf('date') >= 0) {
			if ((v.toString() as string).length == 10) v = v * 1000;
			return charts.xlabel(v, true, true)
			// return this.format_stamp(v) + ' (' + this.from_now(v) + ')'
		}
		if (_.isNumber(v)) return this.format_number(v);
		return v
	}



	migrateStorage() {
		http.post('/migrate.storage').then(response => {
			console.log('response', response)
		}).catch(error => {
			console.error('migrateStorage > error', error)
		})
	}



}







