//

import * as Template from './pensions.html?style=./pensions.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import pdelay from 'delay'
import pevent from 'p-event'
import pforever from 'p-forever'
import pqueue from 'p-queue'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as socket from '../../services/socket'
import * as http from '../../services/http'
import * as yahoo from '../../services/yahoo'
import * as RouterIcon from '../../mixins/router.icon/router.icon'



@Template
@Vts.Component(<VueComponent>{
	name: 'Pensions',
} as any)
export default class Pensions extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	created() {
		this.summaries = []
		Promise.resolve().then(() => {
			let queue = new pqueue({ concurrency: 1 })
			let symbols = shared.FUNDS.mapFast(v => v.symbol)
			// let symbols = ['FLPSX']
			symbols.forEachFast(v => queue.add(() => this.addSummary(v)))
			return queue.onEmpty()
		}).then(() => this.syncSortBy())
	}

	mounted() {

	}

	beforeDestroy() {

	}



	sortkey = lockr.get('pensions.sortkey', 'symbol')
	@Vts.Watch('sortkey') w_sortkey(sortkey: string) { lockr.set('pensions.sortkey', sortkey) }

	bulls = lockr.get('pensions.bulls', true)
	@Vts.Watch('bulls') w_bulls(bulls: boolean) { lockr.set('pensions.bulls', bulls) }

	stdev = lockr.get('pensions.stdev', false)
	@Vts.Watch('stdev') w_stdev(stdev: boolean) { lockr.set('pensions.stdev', stdev) }

	items = [] as Array<any>

	summaries: Array<YahooFundSummary>
	addSummary(symbol: string) {
		return yahoo.getSummary(symbol).then(summary => {
			// console.log('summary', JSON.stringify(summary, null, 4))
			this.summaries.push(summary as any)
			return Promise.resolve()
		})
	}



	headers = ([
		{
			text: 'Fund Symbol',
			key: 'symbol',
			vif: false,
		},
		{
			text: 'YTD Return',
			key: 'ytdReturn',
			vpaths: ['defaultKeyStatistics.ytdReturn', 'summaryDetail.ytdReturn', 'fundPerformance.performanceOverview.ytdReturnPct'],
			vpercent: true,
		},
	] as Array<VueHeaderItem>).mapFast((h, i) => {
		if (h.sortable != false) h.sortable = true;
		h.stdev = true
		let k = h.key
		return h
	})



	syncSortBy() {
		let items = this.summaries.mapFast(summary => {
			let item = {} as any
			this.headers.forEachFast(header => {
				let key = header.key
				let vpaths = header.vpaths
				let value = summary[key]
				if (_.isArray(vpaths)) {
					let i: number, len = header.vpaths.length
					for (i = 0; i < len; i++) {
						value = _.get(summary, header.vpaths[i])
						if (shared.isGood(value) && !(_.isPlainObject(value) && _.isEmpty(value))) break;
					}
				}
				if (_.isPlainObject(value)) {
					if (shared.isGood(value.fmt)) value = value.fmt as any;
					else if (shared.isGood(value.longFmt)) value = value.longFmt as any;
					else if (shared.isGood(value.raw)) value = value.raw as any;
				}
				item[key] = value
			})
			return item
		})
		this.items = _.orderBy(items, [this.sortkey], [this.bulls ? 'desc' : 'asc'])
	}

	sortClick(header: VueHeaderItem) {
		if (header.sortable == false) return;
		if (this.sortkey == header.key) this.bulls = !this.bulls;
		else this.sortkey = header.key;
		this.syncSortBy()
	}



	v_column_color(key: string) {
		if (key == 'symbol') return;
		if (key != this.sortkey) return;
		return this.bulls ? 'column--success' : 'column--error'
	}


}






