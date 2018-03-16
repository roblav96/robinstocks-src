//

import * as Template from './ib.html?style=./ib.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
import nib from 'ib'
import IbAccount from './ib.account'
import IbTradings from './ib.tradings'
import IbPositions from './ib.positions'
import IbOrders from './ib.orders'
import IbExecutions from './ib.executions'
import IbMinutes from './ib.minutes'
import * as Snackbar from '../../comps/snackbar/snackbar'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as RouterIcon from '../../mixins/router.icon/router.icon'
import * as socket from '../../services/socket'
import * as http from '../../services/http'
import * as ibstore from '../../services/ib.store'



const TABS = [{
	id: 'account',
	dname: 'Account',
	icon: 'mdi-account-card-details',
	component: IbAccount,
}, {
	id: 'tradings',
	dname: 'Trading',
	icon: 'mdi-lightbulb',
	component: IbTradings,
}, {
	id: 'positions',
	dname: 'Positions',
	icon: 'mdi-chart-pie',
	component: IbPositions,
}, {
	id: 'orders',
	dname: 'Orders',
	icon: 'mdi-tag-text-outline',
	component: IbOrders,
}, {
	id: 'executions',
	dname: 'Executions',
	icon: 'mdi-chart-gantt',
	component: IbExecutions,
}, {
	id: 'minutes',
	dname: 'Performance',
	icon: 'mdi-history',
	component: IbMinutes,
}] as Array<BottomTabItem>



@Template
@Vts.Component(<VueComponent>{
	name: 'Ib',
	components: utils.buildBottomTabs(TABS),

	beforeRouteEnter(to: VueRoute, from: VueRoute, next: VueRouteNext) {
		if (to.query.tab && TABS.find(v => v.id == to.query.tab)) return next();
		let route = utils.clone(to)
		let i = lockr.get('ib.tab.index', 0)
		route.query.tab = TABS[i].id
		next(route)
	},

} as any)
export default class Ib extends Avts.Mixin<Vue & ibstore.IbStoreMixin & RouterIcon.Mixin & utils.Mixin>(Vue, ibstore.IbStoreMixin, RouterIcon.Mixin, utils.Mixin) {

	created() {
		
	}

	mounted() {
		if (this.$store.state.ib.inited) this.dlstage++;
		if (this.$store.state.ib.isoes) this.dlstage++;
		ibstore.initOrdersExecutions().then(() => this.dlstage++)
		this.$forceUpdate() // keep it
	}

	beforeDestroy() {
		ibstore.destroyOrdersExecutions()
	}



	@Vts.Watch('$store.state.ib.inited') w_inited(to: boolean, from: boolean) {
		if (to == true) this.dlstage++;
	}
	@Vts.Watch('$store.state.ib.isoes') w_isoes(to: boolean, from: boolean) {
		if (to == true) this.dlstage++;
	}

	dlstage = 0
	get ready() { return this.dlstage >= 3 }

	tabs = utils.clone(TABS)
	get index() {
		let i = this.tabs.findIndex(v => v.id == this.$route.query.tab)
		return (i >= 0) ? i : 0
	}
	set index(index: number) {
		lockr.set('ib.tab.index', index)
		let query = Object.assign(utils.clone(this.$route.query), { tab: this.tabs[index].id })
		this.$router.replace({ query })
	}



	get account() { return this.$store.state.ib.account }
	get has_account() { return !_.isEmpty(this.account) }

	get v_equity() {
		return _.sum(this.$store.state.ib.smquotes.filter(v => v.position != 0).mapFast(v => v.position * v.lastPrice))
	}
	get v_equity_cost() {
		return _.sum(this.$store.state.ib.smquotes.filter(v => v.position != 0).mapFast(v => v.position * v.avgCost))
	}
	get v_total_realizedPNL() {
		return _.sum(this.$store.state.ib.smquotes.filter(v => v.realizedPNL != 0).mapFast(v => v.realizedPNL))
	}
	get v_total_unrealizedPNL() {
		return _.sum(this.$store.state.ib.smquotes.filter(v => v.unrealizedPNL != 0).mapFast(v => v.unrealizedPNL))
	}
	get v_total_unrealizedPNL_percent() {
		return utils.calcPercentChange(this.v_equity, this.v_equity_cost)
	}



}









