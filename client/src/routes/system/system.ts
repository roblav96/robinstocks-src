//

import * as Template from './system.html?style=./system.css'
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
	name: 'System',
} as any)
export default class System extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	created() {
		// this.syncSystem(true)
		pforever(first => {
			if (utils.visDestroyed(this)) return pforever.end;
			return this.syncSystem(first)
		}, true)
	}

	mounted() {

	}

	beforeDestroy() {

	}



	syncSystem(init: boolean) {
		return http.post<GetSystemBody, SystemInformationData>('/get.system', {
			init: init == true,
			sync: true,
			other: true,
			services: [
				'redis_6379', 'redis_6380', 'redis_6381', 'redis_6382', 'redis_6383',
				'rethinkdb ', 'robinstocks', 'ibcontroller-paper',
			],
		}, { silent: true, production: true }).then(response => {
			if (utils.visDestroyed(this)) return Promise.resolve(false);
			// console.log('response', shared.clone(response))
			this.data = Object.assign({}, this.data, response)
			return pevent(process.ee3, shared.RKEY.SYS.TICK_1).then(() => Promise.resolve(false))

		}).catch(error => {
			console.error('syncSystem > error', error)
			return pdelay(3000, init)
		})
	}



	data = lockr.get('system.data', {} as SystemInformationData)
	@Vts.Watch('data') w_data(data: SystemInformationData) { lockr.set('system.data', data) }

	get v_empty() { return _.isEmpty(this.data) }

	v_format_bytes(bytes: number, precision?: number) {
		let fs = humanize.fileSize(bytes)
		if (!Number.isFinite(precision)) return fs;
		let split = fs.split(' ')
		bytes = Number.parseFloat(split[0])
		return _.round(bytes, precision) + ' ' + split[1]
	}

	get v_blocks() { return this.data.blockDevices.filter(v => !!v.physical) }

	v_cpu_speed_range(v: number) { return shared.calcSlider(v, this.data.cpu.speedmin, this.data.cpu.speedmax) }
	v_temp_range(v: number) { return shared.calcSlider(v, 20, 80) }

	get v_show_io_sec() { return this.data.disksIO.tIO_sec != -1 }
	v_io_range(v: number) { return shared.calcSlider(v, 0, this.data.disksIO.tIO) }
	v_io_sec_range(v: number) { return shared.calcSlider(v, 0, this.data.disksIO.tIO_sec) }

	get v_show_fs_sec() { return this.data.fsStats.tx_sec != -1 }
	v_fs_range(v: number) { return shared.calcSlider(v, 0, this.data.fsStats.tx) }
	v_fs_sec_range(v: number) { return shared.calcSlider(v, 0, this.data.fsStats.tx_sec) }

	get v_show_net_sec() { return this.data.networkStats.rx_sec != -1 && this.data.networkStats.tx_sec != -1 }
	v_net_range(v: number) { return shared.calcSlider(v, 0, this.data.networkStats.rx + this.data.networkStats.tx) }
	v_net_sec_range(v: number) { return shared.calcSlider(v, 0, this.data.networkStats.rx_sec + this.data.networkStats.tx_sec) }

	v_mem_range(v: number) { return shared.calcSlider(v, 0, this.data.mem.total) }



}









