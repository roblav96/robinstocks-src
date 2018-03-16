//

import * as Template from './symbol.tbar.html?style=./symbol.tbar.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'



@Template
@Vts.Component(<VueComponent>{
	name: 'SymbolToolbar',
} as any)
export default class SymbolToolbar extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	@Vts.Prop() cquote: CalcQuote
	@Vts.Prop() syncstamp: boolean

	mounted() {
		// if (shared.isBad(this.syncstamp)) this.syncstamp = true;
		process.ee3.addListener(shared.RKEY.SYS.TICK_1, this.syncStamp)
	}

	beforeDestroy() {
		process.ee3.removeListener(shared.RKEY.SYS.TICK_1, this.syncStamp)
	}

	@Vts.Watch('syncstamp') w_syncstamp(to: boolean, from: boolean) {
		// console.log('syncstamp > to', to)
		process.ee3.removeListener(shared.RKEY.SYS.TICK_1, this.syncStamp)
		if (to == true && from == false) {
			process.ee3.addListener(shared.RKEY.SYS.TICK_1, this.syncStamp)
		}
	}

	lastStamp = 0
	syncStamp() {
		// console.log('syncStamp > this.syncstamp', this.syncstamp)
		if (this.syncstamp == false) {
			process.ee3.removeListener(shared.RKEY.SYS.TICK_1, this.syncStamp)
			return
		}
		if (_.isEmpty(this.cquote) || !_.isFinite(this.cquote.lastStamp)) return;
		this.lastStamp = this.cquote.lastStamp
		this.$forceUpdate()
	}

	get v_lastsize() {
		return this.cquote.size || this.cquote.lastSize || this.cquote.tradeSize || this.cquote.lastTradeSize
	}

}










