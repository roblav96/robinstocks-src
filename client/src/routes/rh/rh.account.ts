//

import * as Template from './rh.account.html?style=./rh.account.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import Rh from './rh'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'



@Template
@Vts.Component(<VueComponent>{
	name: 'RhAccount',
} as any)
export default class RhAccount extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	created() {

	}

	mounted() {
		
	}

	beforeDestroy() {
		
	}



}






























