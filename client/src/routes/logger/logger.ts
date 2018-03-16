//

import * as Template from './logger.html?style=./logger.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'
import * as charts from '../../services/charts'
import * as RouterIcon from '../../mixins/router.icon/router.icon'



@Template
@Vts.Component(<VueComponent>{
	name: 'Logger',
} as any)
export default class Logger extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	busy = true

	created() {
		this.buildChipMap()
		this.syncLogs()
	}

	mounted() {

	}

	beforeDestroy() {
		socket.emitter.removeListener(this.socketLog)
	}



	logs = [] as Array<LogItemExt>

	parseLog(item: LogItemExt) {
		item = shared.explode(shared.RMAP.LOGS, item as any)
		item.messages = JSON.parse(item.messages)
		item.id = utils.hash(item.instance.toString() + item.stamp.toString())
		let type = item.rkey.split(':').pop()
		item.type = utils.capitalizeWords(type.substring(0, type.length - 1))
		if (item.rkey == shared.RKEY.LOGS.PRIMARIES) item.type = 'Primary';
		if (item.rkey == shared.RKEY.LOGS.MASTERS) item.type = 'Master';
		item.moment = charts.xlabel(item.stamp, true)
		return item
	}

	syncLogs() {
		return http.post<GetLogsBody, GetLogsResponse>('/get.logger', {
			rkeys: null,
		}).then(response => {
			utils.vdestroyedSafety(this)
			response = response.map(vs => vs.map(v => this.parseLog(v as any)))
			this.pushLogs(_.flatten(response) as any)
			this.scrollToBottom()
			return Promise.resolve()

		}).catch(error => {
			console.error('syncLogs > error', error)
			return Promise.resolve()

		}).then(() => {
			Object.keys(shared.RKEY.LOGS).forEach((key) => {
				let rkey = shared.RKEY.LOGS[key] as string
				socket.emitter.addListener(rkey, this.socketLog)
			})
			this.$nextTick(() => this.busy = false)
		})
	}

	socketLog(item: LogItem) {
		this.pushLogs([this.parseLog(shared.safeParse(item as any))])
	}

	pushLogs(items: Array<LogItemExt>) {
		let el = document.getElementById('diag_main')
		let scrollTop = el.scrollTop
		let scrollHeight = el.scrollHeight - el.offsetHeight
		let doscroll = scrollTop > scrollHeight
		items = _.uniqBy(items, 'id')
		items.forEach((item) => {
			if (this.logs.find(v => v.id == item.id)) return;
			this.logs.push(item)
		})
		this.logs.sort(function(a, b) {
			let aa = (a.stamp * 100) + a.instance
			let bb = (b.stamp * 100) + b.instance
			return aa - bb
		})
		if (doscroll == true) this.scrollToBottom();
	}

	scrollToBottom(smooth = false) {
		this.$nextTick(function() {
			let el = document.getElementById('diag_main')
			el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
		})
	}

	showfab = false
	onScroll(evt: Event) {
		let el = evt.target as HTMLElement
		let scrollTop = el.scrollTop
		let scrollHeight = el.scrollHeight - el.offsetHeight
		this.showfab = scrollHeight > scrollTop
	}

	beforeEnter(el: HTMLElement) {
		if (this.busy) return;
		el.classList.add('animated', 'animated-faster', 'fadeIn')
	}
	afterEnter(el: HTMLElement) {
		el.classList.remove('animated', 'animated-faster', 'fadeIn')
	}

	chipmap: { [rkey: string]: string }
	buildChipMap() {
		this.chipmap = {}
		Object.keys(shared.RKEY.LOGS).forEach((key) => {
			let rkey = shared.RKEY.LOGS[key] as string
			if (rkey == shared.RKEY.LOGS.LOGS) {
				this.chipmap[rkey] = 'blue'
			} else if (rkey == shared.RKEY.LOGS.INFOS) {
				this.chipmap[rkey] = 'green'
			} else if (rkey == shared.RKEY.LOGS.WARNS) {
				this.chipmap[rkey] = 'orange'
			} else if (rkey == shared.RKEY.LOGS.ERRORS) {
				this.chipmap[rkey] = 'red'
			} else if (rkey == shared.RKEY.LOGS.PRIMARIES) {
				this.chipmap[rkey] = 'deep-purple'
			} else if (rkey == shared.RKEY.LOGS.MASTERS) {
				this.chipmap[rkey] = 'purple'
			}
		})
	}
	chipClass(item: LogItemExt) { return this.chipmap[item.rkey] }



	// google_blocked = null as boolean
	// get google_blocked_icon() {
	// 	let icon = 'cached'
	// 	if (this.google_blocked == true) icon = 'thumb_up';
	// 	if (this.google_blocked == false) icon = 'thumb_down';
	// 	return icon
	// }

	// syncDiag() {
	// 	return Http.get<GetDiagsResponse>('/get.diag').then(response => {
	// 		utils.destroyedSafety(this)
	// 		this.google_blocked = response[shared.RKEY.DIAG.GOOGLE_BLOCKED].indexOf('true') == -1
	// 		return Promise.resolve()

	// 	}).catch(error => {
	// 		console.error('syncDiag > error', error)
	// 		return Promise.resolve()
	// 	})
	// }



}






