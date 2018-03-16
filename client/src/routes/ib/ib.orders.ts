//

import * as Template from './ib.orders.html?style=./ib.orders.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import nib from 'ib'
import Ib from './ib'
import * as Snackbar from '../../comps/snackbar/snackbar'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'
import * as ibstore from '../../services/ib.store'



@Template
@Vts.Component(<VueComponent>{
	name: 'IbOrders',
} as any)
export default class IbOrders extends Avts.Mixin<Vue & ibstore.IbStoreMixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, utils.Mixin) {

	get parent() { return this.$parent as Ib }

	created() {

	}

	mounted() {
		(this.$refs.ib_orders_search as HTMLElement).focus()
	}

	beforeDestroy() {
		
	}



	search = ''
	get orders() { return this.$store.state.ib.orders }
	get v_orders() {
		let search = utils.cleanSearch(this.search)
		if (!search) return this.orders;
		return this.orders.filter(v => utils.cleanSearch(v.symbol).indexOf(search) >= 0)
	}



	headers = [{
		text: 'Symbol',
		value: 'symbol',
		align: 'left',
	}, {
		text: 'Order',
		value: 'orderId',
		align: 'left',
	}, {
		text: 'Action',
		value: 'action',
		align: 'left',
	}, {
		text: 'Quantity',
		value: 'totalQuantity',
		align: 'left',
	}, {
		text: 'Type',
		value: 'orderType',
		align: 'left',
	}, {
		text: 'TIF',
		value: 'tif',
		align: 'left',
	}, {
		text: 'Stop',
		value: 'auxPrice',
		align: 'left',
	}, {
		text: 'Limit',
		value: 'lmtPrice',
		align: 'left',
	}, {
		text: 'Status',
		value: 'status',
		align: 'left',
	}, {
		text: 'Last Sale',
		value: 'lastPrice',
		align: 'left',
	}, {
		text: 'Created',
		value: 'createdAt',
		align: 'left',
	}, {
		text: 'Updated',
		value: 'stamp',
		align: 'left',
	}, {
		text: '',
		align: 'left',
		sortable: false,
	}] as Array<VueTableHeader>

	pagination = { sortBy: 'orderId', descending: true, page: 1, rowsPerPage: 25 } as VueTablePagination

	v_action(v: string) {
		return _.capitalize(v)
	}
	v_orderType(v: string) {
		let ks = Object.keys(shared.IB_ORDER_TYPES)
		let vs = _.values(shared.IB_ORDER_TYPES)
		return _.startCase(ks[vs.indexOf(v)])
	}
	v_tif(v: string) {
		let ks = Object.keys(shared.IB_TIME_IN_FORCES)
		let vs = _.values(shared.IB_TIME_IN_FORCES)
		return _.startCase(ks[vs.indexOf(v)])
	}
	v_filled(filled: number, quantity: number) {
		return (filled / quantity) * 100
	}
	v_ibstatus(status: string) {
		return _.startCase(status)
	}
	v_avgFillPrice(price: number) {
		if (!price || price == 0) return '';
		return '$' + utils.formatNumber(price, 2)
	}
	v_lmtPrice(price: number) {
		if (!price || price == 0) return '';
		return '$' + utils.formatNumber(price, 2)
	}
	v_status_chip(status: string) {
		status = status.toLowerCase()
		if (status == 'cancelled') return 'error--text';
		if (status == 'filled') return 'success--text';
		if (status == 'submitted') return 'info--text';
		if (status == 'presubmitted') return 'warning--text';
		return undefined
	}
	v_cancellable(status: string) {
		if (status == 'Filled') return false;
		if (status == 'Cancelled') return false;
		return true
	}
	v_color(status: string) {
		if (status == 'Filled') return 'success';
		if (status == 'Cancelled') return 'error';
		return 'info'
	}

	debugItem(order: nib.Order) {
		console.log('order', JSON.stringify(order, null, 4))
	}



}






