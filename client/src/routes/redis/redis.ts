//

import * as Template from './redis.html?style=./redis.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import Humanize from 'humanize-plus'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as charts from '../../services/charts'
import * as RouterIcon from '../../mixins/router.icon/router.icon'
import * as http from '../../services/http'



@Template
@Vts.Component(<VueComponent>{
	name: 'Redis',
} as any)
export default class Redis extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	mounted() {
		this.syncRedis()
	}

	beforeDestroy() {
		process.ee3.removeListener(shared.RKEY.SYS.TICK_3, this.syncInfo)
	}



	info = {} as any
	latdoctor = ''
	memdoctor = ''
	latency = [] as Array<Array<any>>
	slowlog = [] as Array<Array<any>>

	syncRedis() {
		http.post<void, GetRedisResponse>('/get.redis').then(response => {
			utils.vdestroyedSafety(this)
			this.setInfo(response.info)
			this.latdoctor = response.latdoctor
			this.memdoctor = response.memdoctor
			this.latency = response.latency
			this.slowlog = response.slowlog
			process.ee3.addListener(shared.RKEY.SYS.TICK_3, this.syncInfo)
		}).catch(error => {
			console.error('mounted > error', error)
		})
	}

	syncInfo() {
		http.post<{ justinfo: boolean }, GetRedisResponse>('/get.redis', { justinfo: true }, { silent: true }).then(response => {
			utils.vdestroyedSafety(this)
			this.setInfo(response.info)
		}).catch(error => {
			console.error('syncInfo > error', error)
		})
	}

	setInfo(info: any) {
		Object.keys(info).forEachFast(function(key) {
			if (key.indexOf('human') >= 0) return _.unset(info, key);
			let tokey = key.replace(/[_]/g, ' ')
			tokey = utils.capitalizeWords(tokey)
			// if (tokey.indexOf('Cmdstat') >= 0) {
			// 	tokey = tokey.replace('Cmdstat', '').trim()
			// 	if (tokey.indexOf('Usec Per Call') >= 0) tokey = tokey.replace('Usec Per Call', 'Duration Per Call').trim();
			// 	else if (tokey.indexOf('Usec') >= 0) tokey = tokey.replace('Usec', 'Duration').trim();
			// }
			info[tokey] = info[key]
			_.unset(info, key)
		})
		this.$set(this, 'info', info)
		// cmdstat_* usec is how many times they've been run, the number of microseconds it took to execute (total and avg per call)
	}



	v_key(k: string) {
		// let kid = shared.parseToId(k, true)
		if (k.indexOf('Cmdstat') >= 0) {
			k = k.replace('Cmdstat', '').trim()
			if (k.indexOf('Usec Per Call') >= 0) k = k.replace('Usec Per Call', 'Duration Per Call').trim();
			else if (k.indexOf('Usec') >= 0) k = k.replace('Usec', 'Total Duration').trim();
			// k = 'Cmd ' + k
		}
		return k
	}

	v_value(v: any, k: string) {
		let kid = shared.parseToId(k, true)
		if (kid.indexOf('cmdstat') >= 0 && !isNaN(v)) return utils.formatNumber(v / 1000) + 'ms';
		if (kid.indexOf('memory') >= 0 && !isNaN(v)) return Humanize.fileSize(v);
		if (kid.indexOf('bytes') >= 0 && !isNaN(v)) return Humanize.fileSize(v);
		if (kid.indexOf('allocated') >= 0 && !isNaN(v)) return Humanize.fileSize(v);
		if (kid.indexOf('lastsavetime') >= 0 && !isNaN(v)) return charts.xlabel(v * 1000, true, true);
		if (kid.indexOf('inseconds') >= 0 && !isNaN(v)) return utils.formatNumber(v, 0) + ' (' + moment.duration(-v, 'seconds').humanize(true) + ')';
		if (!isNaN(v)) return utils.formatNumber(v, 0);
		return v
	}



	// scrolling = false
	// resetscrolling = _.debounce(() => {
	// 	console.log('this', this)
	// 	// this.scrolling = false
	// }, 1000, { leading: false, trailing: true })
	// onScroll(event: UIEvent) {
	// 	console.log('this.scrolling', this.scrolling)
	// 	this.scrolling = true
	// 	this.resetscrolling()
	// }



}








