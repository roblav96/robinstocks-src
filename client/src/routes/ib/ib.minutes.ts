//

import * as Template from './ib.minutes.html?style=./ib.minutes.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
import nib from 'ib'
import Ib from './ib'
import * as Snackbar from '../../comps/snackbar/snackbar'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'
import * as ibstore from '../../services/ib.store'



@Template
@Vts.Component(<VueComponent>{
	name: 'IbMinutes',
} as any)
export default class IbMinutes extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	get parent() { return this.$parent as Ib }

	mounted() {
		this.syncMinutes()
	}

	beforeDestroy() {

	}



	syncMinutes() {
		http.post<{ date: string }, Array<IbMinute>>('/ib.minutes', {
			date: shared.moment().format('YYYY-MM-DD'),
		}).then(response => {
			utils.vdestroyedSafety(this)

			console.log('response', response)

		}).catch(function(error) {
			console.error('error', error)
		})
	}



}






