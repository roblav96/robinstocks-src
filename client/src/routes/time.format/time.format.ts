//

import * as Template from './time.format.html?style=./time.format.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import moment from 'moment'
import * as utils from '../../services/utils'
import * as shared from '../../shared'
import * as RouterIcon from '../../mixins/router.icon/router.icon'



@Template
@Vts.Component(<VueComponent>{
	name: 'TimeFormat',
} as any)
export default class TimeFormat extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	mounted() {
		this.$nextTick(() => this.stamp_input.focus())
	}



	history = lockr.get('time.format.history', [] as Array<string>)

	input = lockr.get('time.format.input', '')
	@Vts.Watch('input') w_input(input: string) { lockr.set('time.format.input', input) }

	get formatted() {
		let mstamp = shared.moment(!isNaN(this.input as any) ? Number.parseInt(this.input) : this.input)

		let valid = mstamp.isValid()
		if (!valid) return 'Invalid Date';

		this.history.unshift(this.input)
		this.history.splice(6)
		lockr.set('time.format.history', utils.clone(this.history))

		return utils.format_stamp(mstamp.valueOf(), true, true)
	}

	reset() {
		this.input = ''
		this.$nextTick(() => this.stamp_input.focus())
	}
	get stamp_input() { return this.$refs.stamp_input as Vue & HTMLInputElement }

}





