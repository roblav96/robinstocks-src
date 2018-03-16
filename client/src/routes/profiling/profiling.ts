//

import * as Template from './profiling.html?style=./profiling.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import Humanize from 'humanize-plus'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as RouterIcon from '../../mixins/router.icon/router.icon'
import * as http from '../../services/http'



@Template
@Vts.Component(<VueComponent>{
	name: 'Profiling',
} as any)
export default class Profiling extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	search = ''
	items = [] as Array<ProfilingItem>

	get v_items() {
		let search = this.search.trim().toLowerCase()
		if (_.isEmpty(search)) return this.items;
		return this.items.filter(function(item) {
			return item.file.trim().toLowerCase().indexOf(search) >= 0 || item.name.trim().toLowerCase().indexOf(search) >= 0
		})
	}

	headers = [{
		text: 'Source',
		value: 'file',
		align: 'left',
		sortable: false,
	}, {
		text: 'Function',
		value: 'name',
		align: 'left',
		sortable: false,
	}, {
		text: 'Count',
		value: 'count',
		align: 'left',
		sortable: true,
	}, {
		text: 'Calls',
		value: 'calls',
		align: 'left',
		sortable: true,
	}] as Array<VueTableHeader>
	pagination = { sortBy: 'count', descending: true, rowsPerPage: -1 } as VueTablePagination

	mounted() {
		http.get<Array<ProfilingItem>>('/get.profiling').then(response => {
			utils.vdestroyedSafety(this)
			this.items = response
		}).catch(error => {
			console.error('mounted > error', error)
		})
	}



}








