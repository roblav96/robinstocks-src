//

import * as Template from './symbol.chip.html?style=./symbol.chip.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'



@Template
@Vts.Component(<VueComponent>{
	name: 'SymbolChip',
} as any)
export default class SymbolChip extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	@Vts.Prop() symbol: string
	@Vts.Prop() small: boolean
	@Vts.Prop() clickthru: boolean
	@Vts.Prop() long: boolean

	get v_logo_url() {
		return process.$domain + '/api/logo/' + this.symbol
	}
	on_logo_error(evt: Event) {
		let el = evt.target as HTMLImageElement
		el.src = 'https://logo.clearbit.com/' + _.sample([
			'www.otcmarkets.com',
			'www.nyse.com',
			'www.nasdaq.com',
			'www.batstrading.com',
		])
	}

}










