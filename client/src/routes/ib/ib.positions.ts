//

import * as Template from './ib.positions.html?style=./ib.positions.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
import nib from 'ib'
import ss from 'simple-statistics'
import Ib from './ib'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as ibstore from '../../services/ib.store'



@Template
@Vts.Component(<VueComponent>{
	name: 'IbPositions',
} as any)
export default class IbPositions extends Avts.Mixin<Vue & ibstore.IbStoreMixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, utils.Mixin) {

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
		text: 'Shares',
		value: 'position',
		align: 'left',
	}, {
		text: 'Market Value',
		value: 'equity',
		align: 'left',
	}, {
		text: 'Unrealized P/L',
		value: 'unrealizedPNL',
		align: 'left',
	}, {
		text: 'Avg Cost',
		value: 'avgCost',
		align: 'left',
	}, {
		text: 'Last Sale',
		value: 'lastPrice',
		align: 'left',
	}, {
		text: 'Updated',
		value: 'positionStamp',
		align: 'left',
	}, {
		text: 'Actions',
		align: 'left',
		sortable: false,
	}] as Array<VueTableHeader>

	pagination = { sortBy: 'symbol', descending: false, rowsPerPage: -1 } as VueTablePagination

	get v_items() {
		let equity = this.parent.v_equity
		return this.$store.state.ib.smquotes.filter(v => v.position != 0).mapFast(smquote => {
			let symbol = smquote.symbol
			let item = Object.assign({}, smquote) as PositionItem
			item.equity = item.position * item.lastPrice
			item.unrealizedPNLpercent = utils.calcPercentChange(item.equity, item.position * item.avgCost)
			return item
		})
	}

	debugItem(position: PositionItem) {
		console.log('position', JSON.stringify(position, null, 4))
	}



}



