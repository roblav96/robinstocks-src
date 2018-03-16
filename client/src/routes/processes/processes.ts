//

import * as Template from './processes.html?style=./processes.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import moment from 'moment'
import humanize from 'humanize-plus'
import pdelay from 'delay'
import pevent from 'p-event'
import pforever from 'p-forever'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as RouterIcon from '../../mixins/router.icon/router.icon'



@Template
@Vts.Component(<VueComponent>{
	name: 'Processes',
} as any)
export default class Processes extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	created() {
		pforever(() => {
			if (utils.visDestroyed(this)) return pforever.end;
			return this.syncProcesses()
		})
	}

	mounted() {
		let el = this.$refs.processes_search as HTMLElement
		if (el && !!el.focus) el.focus();
	}

	beforeDestroy() {

	}



	syncProcesses() {
		return http.post<GetSystemBody, SystemInformationData>('/get.system', {
			processes: true,
		}, { silent: true, production: true }).then(response => {
			if (utils.visDestroyed(this)) return Promise.resolve();
			// console.log('response', shared.clone(response))
			response.processes.list = response.processes.list.filter(function(item) {
				return item.mem_rss > 1024
			})
			this.data = Object.assign({}, this.data, response)
			// return Promise.resolve()
			return pevent(process.ee3, shared.RKEY.SYS.TICK_1)

		}).catch(error => {
			console.error('syncProcesses > error', error)
			return pdelay(3000)
		})
	}



	data = lockr.get('processes.data', {} as SystemInformationData)
	@Vts.Watch('data') w_data(data: SystemInformationData) { lockr.set('processes.data', data) }

	get v_empty() { return _.isEmpty(this.data) }



	search = ''
	get v_processes() {
		let search = utils.cleanSearch(this.search)
		if (!search) return this.data.processes.list;
		return this.data.processes.list.filter(function(item) {
			let cleaned = utils.cleanSearch([item.pid, item.state, item.user, item.name, item.command].join(' '))
			return cleaned.indexOf(search) >= 0
		})
	}

	headers = ([
		{ text: 'PID', value: 'pid' },
		{ text: 'State', value: 'state' },
		{ text: 'User', value: 'user' },
		{ text: 'Name', value: 'name' },
		{ text: 'Virtual Memory', value: 'mem_vsz' },
		{ text: 'RSS Memory', value: 'mem_rss' },
		{ text: 'Memory %', value: 'pmem' },
		{ text: 'CPU %', value: 'pcpu' },
		{ text: 'CPU User %', value: 'pcpuu' },
		{ text: 'CPU System %', value: 'pcpus' },
		// { text: 'Started', value: 'started' },
		// { text: 'Stamp', value: 'stamp' },
		{ text: 'Started', value: 'stamp' },
		{ text: 'Command', value: 'command' },
	] as Array<VueTableHeader>).mapFast(function(header) {
		header.align = 'left'
		return header
	})

	pagination = { sortBy: 'mem_rss', descending: true, rowsPerPage: -1 } as VueTablePagination

	lastsortby = this.pagination.sortBy
	@Vts.Watch('pagination.descending', { deep: true }) w_pagination(to: boolean, from: boolean) {
		if (to == false && from == true && this.lastsortby != this.pagination.sortBy) {
			this.$nextTick(() => this.pagination.descending = true)
		}
		this.lastsortby = this.pagination.sortBy
		document.getElementById('processes_scroll').scrollTo({ top: 0, behavior: 'smooth' })
	}

	v_show_list() { return Array.isArray(_.get(this, 'data.processes.list')) }

	v_value(item: SystemInformationProcess, header: VueTableHeader) {
		let value = item[header.value]
		if (['mem_vsz', 'mem_rss'].indexOf(header.value) >= 0) return humanize.fileSize(value * 1024);
		if (['pmem', 'pcpu', 'pcpuu', 'pcpus'].indexOf(header.value) >= 0) return utils.formatNumber(value, 2);
		if (header.value == 'stamp') return utils.from_now(value);
		return value
	}

	onScrollY(event: MouseEvent) {
		let target = event.target as HTMLElement
		let el = document.querySelector('.processes-route thead') as HTMLElement
		el.style.transform = 'translateY(' + target.scrollTop + 'px)'
	}





}









