//

import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import * as utils from '../../services/utils'
import * as router from '../../router'



@Vts.Component(<VueComponent>{
	name: 'RouterIconMixin',
} as any)
export class Mixin extends Vue {

	routerdname = ''
	routericon = ''
	created() {
		let found = router.routes.find(v => v.name == this.$route.name)
		if (!found) return;
		this.routerdname = found.dname
		this.routericon = found.icon
	}

}


