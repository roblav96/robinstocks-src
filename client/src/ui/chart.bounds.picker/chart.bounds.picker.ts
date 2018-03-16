//

import * as Template from './chart.bounds.picker.html?style=./chart.bounds.picker.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import Lockr from 'lockr'
import moment from 'moment'
import * as Utils from '../../services/utils'



@Template
@Vts.Component(<VueComponent>{
	name: 'ChartBoundsPicker',
} as any)
export default class ChartBoundsPicker extends Vue {

	@Vts.Prop() cbound: string
	@Vts.Prop() type: string

	value = this.cbound
	@Vts.Watch('value') w_value(value: string) { this.$emit('update:cbound', value) }

	get formatted() {
		if (this.type == 'time') return this.value;
		return moment(new Date(this.value)).utc().format('ddd, MMM D YYYY')
	}

}


