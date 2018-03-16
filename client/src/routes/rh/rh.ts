//

import * as Template from './rh.html?style=./rh.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
import RhAccount from './rh.account'
import * as Snackbar from '../../comps/snackbar/snackbar'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as RouterIcon from '../../mixins/router.icon/router.icon'
import * as socket from '../../services/socket'
import * as http from '../../services/http'



const TABS = [{
	id: 'account',
	dname: 'Account',
	icon: 'mdi-account-card-details',
	component: RhAccount,
}] as Array<BottomTabItem>



@Template
@Vts.Component(<VueComponent>{
	name: 'Rh',
	components: utils.buildBottomTabs(TABS),

	beforeRouteEnter(to: VueRoute, from: VueRoute, next: VueRouteNext) {
		if (to.query.tab && TABS.find(v => v.id == to.query.tab)) return next();
		let route = utils.clone(to)
		let i = lockr.get('rh.tab.index', 0)
		route.query.tab = TABS[i].id
		next(route)
	},

} as any)
export default class Rh extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	created() {

	}

	mounted() {
		
	}

	beforeDestroy() {
		
	}



	tabs = utils.clone(TABS)
	get index() {
		let i = this.tabs.findIndex(v => v.id == this.$route.query.tab)
		return (i >= 0) ? i : 0
	}
	set index(index: number) {
		lockr.set('rh.tab.index', index)
		let query = Object.assign(utils.clone(this.$route.query), { tab: this.tabs[index].id })
		this.$router.replace({ query })
	}






}




