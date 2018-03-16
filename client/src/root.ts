//

import * as Template from './root.html?style=./root.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import Mmenu from './comps/mmenu/mmenu'
import Snackbar from './comps/snackbar/snackbar'
import SymbolSearch from './comps/symbol.search/symbol.search'
import OrderSheet from './comps/order.sheet/order.sheet'
import SymbolChip from './ui/symbol.chip/symbol.chip'



Vue.component('symbol-chip', SymbolChip)



@Template
@Vts.Component(<VueComponent>{
	name: 'Root',

	components: {
		'm-menu': Mmenu,
		'snackbar': Snackbar,
		'order-sheet': OrderSheet,
		'symbol-search': SymbolSearch,
	},

} as any)
export default class Root extends Vue {

	created() {

	}

	initing = true
	mounted() {
		setTimeout(() => this.initing = false, 100)
	}

	beforeDestroy() {

	}



}








