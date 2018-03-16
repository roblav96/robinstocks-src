// 

import lockr from 'lockr'
import rx from 'rxjs/Rx'
import * as shared from '../shared'
import * as utils from './utils'



let uuid = lockr.get('scope.uuid', '')
if (!uuid) {
	uuid = ('web_' + utils.randomBytes()).substring(0, 32)
	lockr.set('scope.uuid', uuid)
}
export const rxUuid = new rx.BehaviorSubject(uuid)

export const rxXid = new rx.BehaviorSubject(lockr.get('scope.xid', ''))
rxXid.subscribe(v => lockr.set('scope.xid', v))

export const rxBytes = new rx.BehaviorSubject(lockr.get('scope.bytes', ''))
rxBytes.subscribe(v => lockr.set('scope.bytes', v))

export const rxToken = new rx.BehaviorSubject(lockr.get('scope.token', ''))
rxToken.subscribe(v => lockr.set('scope.token', v))

export const rxRhToken = new rx.BehaviorSubject(lockr.get('scope.rhtoken', ''))
rxRhToken.subscribe(v => lockr.set('scope.rhtoken', v))

/** ▶ client/server time diff */
export const rxTdiff = new rx.BehaviorSubject(lockr.get('scope.tdiff', 0))
rxTdiff.subscribe(v => lockr.set('scope.tdiff', v))



export function flushCredentials() {
	rxXid.next('')
	rxBytes.next('')
	rxToken.next('')
	rxRhToken.next('')
	rxTdiff.next(0)
}





// rxUuid.subscribe(v => Lockr.set('scope.bytes', v))
// if (!rxUuid.value) {
// 	new Finger().get(function(finger: string) {
// 		finger = ('ds_web_' + finger).substring(0, 32)
// 		Lockr.set('scope.uuid', finger)
// 		rxUuid.next(finger)
// 	})
// }

// export function initUuid() {
// 	// if (rxUuid.value) return;
// 	Promise.all([
// 		getFinger(),
// 		getIp(),
// 	]).then(function(resolved) {
// 		let finger = resolved[0]
// 		let ip = resolved[1]
// 		finger = ('' + finger).substring(0, 32)

// 		Lockr.set('scope.uuid', finger)
// 		rxUuid.next(finger)
// 	})
// }

// function getFinger(): Promise<string> {
// 	return new Promise(function(resolve) {
// 		new Finger().get(resolve)
// 	})
// }

// function getIp(): Promise<string> {
// 	return Http.get('/ip').catch(function(error) {
// 		console.error('getIp > error', error)
// 		return Utils.retryPromise().then(getIp)
// 	})
// }













