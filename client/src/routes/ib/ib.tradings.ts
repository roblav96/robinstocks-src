//

import * as Template from './ib.tradings.html?style=./ib.tradings.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import pdelay from 'delay'
import pevent from 'p-event'
import pforever from 'p-forever'
import nib from 'ib'
import Ib from './ib'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as ibstore from '../../services/ib.store'



@Template
@Vts.Component(<VueComponent>{
	name: 'IbTradings',
} as any)
export default class IbTradings extends Avts.Mixin<Vue & ibstore.IbStoreMixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, utils.Mixin) {

	get parent() { return this.$parent as Ib }

	created() {

	}

	mounted() {

	}

	beforeDestroy() {
		
	}



	headers = [{
		text: 'Symbol',
		value: 'symbol',
		align: 'left',
	}, {
		text: 'Trading',
		value: 'liveTrading',
		align: 'left',
	}, {
		text: 'Orders',
		value: 'orders',
		align: 'left',
	}, {
		text: 'Realized P/L',
		value: 'realizedPNL',
		align: 'left',
	}, {
		text: 'Unrealized P/L',
		value: 'unrealizedPNL',
		align: 'left',
	}, {
		text: 'Commissions',
		value: 'commissions',
		align: 'left',
	}, {
		text: 'Last Sale',
		value: 'lastStamp',
		align: 'left',
	}, {
		text: 'Updated',
		value: 'stamp',
		align: 'left',
	}, {
		text: 'Actions',
		value: null,
		align: 'left',
		sortable: false,
	}] as Array<VueTableHeader>

	pagination = { sortBy: 'symbol', descending: false, rowsPerPage: -1 } as VueTablePagination

	customOrderBy(items: Array<TradingItem>, sortkey: string, descending: boolean) {
		return _.orderBy(items, ['liveTrading', sortkey], ['desc', descending ? 'desc' : 'asc'])
	}

	get v_items() {
		return this.$store.state.ib.smquotes.mapFast(smquote => {
			let symbol = smquote.symbol
			let item = Object.assign({}, smquote) as TradingItem

			item.orders = this.ib_orders_count(symbol)
			if (item.orders > 0) {
				let executions = this.ib_symbol_executions(symbol)
				item.commissions = _.sum(executions.mapFast(v => v.commission))
			}

			return item
		})
	}

	get v_total_commissions() {
		return _.sum(this.v_items.mapFast(v => v.commissions))
	}

	debugItem(trading: TradingItem) {
		console.log('trading', JSON.stringify(trading, null, 4))
	}



}



