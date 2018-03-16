//

import * as Template from './symbol.backtest.html?style=./symbol.backtest.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import * as echarts from 'echarts'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'
import * as charts from '../../services/charts'
import * as ecbones from '../../services/ecbones'



@Template
@Vts.Component(<VueComponent>{
	name: 'SymbolBacktest',

	components: {

	},

} as any)
export default class SymbolBacktest extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	echart: echarts.ECharts

	created() {

	}

	mounted() {
		let el = document.getElementById('symbol_algorithm')
		this.echart = echarts.init(el as any, null, { width: el.offsetWidth, height: el.offsetHeight })
	}

	beforeDestroy() {

	}



}







