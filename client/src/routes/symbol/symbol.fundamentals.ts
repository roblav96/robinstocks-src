//

import * as Template from './symbol.fundamentals.html?style=./symbol.fundamentals.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'



@Template
@Vts.Component(<VueComponent>{
	name: 'SymbolFundamentals',

	components: {

	},

} as any)
export default class SymbolFundamentals extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	created() {

	}

	mounted() {

	}

	beforeDestroy() {

	}
	
	

}







