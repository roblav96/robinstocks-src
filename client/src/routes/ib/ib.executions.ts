//

import * as Template from './ib.executions.html?style=./ib.executions.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
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
	name: 'IbExecutions',
} as any)
export default class IbExecutions extends Avts.Mixin<Vue & ibstore.IbStoreMixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, utils.Mixin) {

	get parent() { return this.$parent as Ib }

	created() {

	}

	mounted() {
		(this.$refs.ib_executions_search as HTMLElement).focus()
	}

	beforeDestroy() {
		
	}



	search = ''
	get executions() { return this.$store.state.ib.executions }
	get v_executions() {
		let search = utils.cleanSearch(this.search)
		if (!search) return this.executions;
		return this.executions.filter(v => utils.cleanSearch(v.symbol).indexOf(search) >= 0)
	}



	headers = [{
		text: 'Symbol',
		value: 'symbol',
		align: 'left',
	}, {
		text: 'Side',
		value: 'side',
		align: 'left',
	}, {
		text: 'Exchange',
		value: 'exchange',
		align: 'left',
	}, {
		text: 'Shares',
		value: 'shares',
		align: 'left',
	}, {
		text: 'Realized P/L',
		value: 'realizedPNL',
		align: 'left',
	}, {
		text: 'Commissions',
		value: 'commission',
		align: 'left',
	}, {
		text: 'Last Sale',
		value: 'lastPrice',
		align: 'left',
	}, {
		text: 'Executed',
		value: 'lastUpdate',
		align: 'left',
	}, {
		text: 'Updated',
		value: 'stamp',
		align: 'left',
	}] as Array<VueTableHeader>

	pagination = { sortBy: 'lastUpdate', descending: true, rowsPerPage: 25 } as VueTablePagination

	v_side(side: string) {
		return side == 'BOT' ? 'Bought' : 'Sold'
	}
	v_qtybar(shares: number, cumQty: number) {
		return (shares / cumQty) * 100
	}

	customOrderBy(items: Array<nib.Execution>, sortkey: string, descending: boolean) {
		if (sortkey == 'lastUpdate') {
			return _.orderBy(items, [sortkey, 'cumQty'], [descending ? 'desc' : 'asc', 'desc'])
		}
		return _.orderBy(items, [sortkey], [descending ? 'desc' : 'asc'])
	}

	debugItem(execution: nib.Execution) {
		console.log('execution', JSON.stringify(execution, null, 4))
	}


}






