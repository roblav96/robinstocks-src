//

import * as Template from './snackbar.html?style=./snackbar.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
import nib from 'ib'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'



@Template
@Vts.Component(<VueComponent>{
	name: 'Snackbar',
} as any)
export default class Snackbar extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	items = [] as Array<SnackbarItem>

	created() {
		utils.set$rxSub(this.$rxSubs, 'items', rxItems.subscribe(item => {
			if (this.items.find(v => v.message == item.message)) return;
			item.id = utils.randomBytes(8)
			item.color = item.color || 'secondary'
			item.duration = item.duration || 5000
			item.timeout = _.delay(this.splice, item.duration, item.id)
			this.items.push(item)
		}))
	}

	splice(id: string) {
		let i = this.items.findIndex(v => v.id == id)
		if (i == -1) return;
		clearTimeout(this.items[i].timeout)
		this.items.splice(i, 1)
	}

	onmouseenter(id: string) {
		let item = this.items.find(v => v.id == id)
		if (!item) return;
		clearTimeout(item.timeout)
	}

}

declare global {
	interface SnackbarItem {
		id?: string
		message: string
		duration?: number
		timeout?: number
		color?: string
		icon?: string
	}
}

export const rxItems = new rx.Subject<SnackbarItem>()




