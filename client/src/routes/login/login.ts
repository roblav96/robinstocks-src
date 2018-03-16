//

import * as Template from './login.html?style=./login.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as scope from '../../services/scope'
import * as socket from '../../services/socket'
import * as RouterIcon from '../../mixins/router.icon/router.icon'



@Template
@Vts.Component(<VueComponent>{
	name: 'Login',
} as any)
export default class Login extends Avts.Mixin<Vue & RouterIcon.Mixin & utils.Mixin>(Vue, RouterIcon.Mixin, utils.Mixin) {

	created() {

	}

	mounted() {
		(this.$refs.uname_input as HTMLElement).focus()
	}

	beforeDestroy() {

	}



	uname = ''
	pass = ''
	busy = false
	mfa = ''
	ismfa = false

	get isDisabled() {
		return !(!!this.uname && !!this.pass)
	}

	login() {
		if (this.busy) return;
		if (this.isDisabled) return;
		this.busy = true

		return http.post<RhLoginBody, RhLoginResponse>('/rh.login', {
			uname: this.uname,
			pass: this.pass,
			mfa: this.mfa,
		}).then((response) => {
			utils.vdestroyedSafety(this)
			this.busy = false
			if (response.mfa) {
				this.ismfa = true
				this.$nextTick(() => (this.$refs.mfa_input as HTMLElement).focus())
				return Promise.resolve()
			}
			scope.rxXid.next(response.xid)
			scope.rxBytes.next(response.bytes)
			scope.rxToken.next(response.token)
			scope.rxRhToken.next(response.rhtoken)
			scope.rxTdiff.next(Date.now() - response.tstamp)
			this.$router.push({ name: 'rh' })
			return Promise.resolve()

		}).catch((error) => {
			console.error('login > error', error)
			return Promise.resolve()
		})
	}

	logout() {
		if (this.busy) return;
		this.busy = true
		
	}



}






