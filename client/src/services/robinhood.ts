// 

import _ from 'lodash'
import ci from 'correcting-interval'
import lockr from 'lockr'
import pdelay from 'delay'
import * as shared from '../shared'
import * as utils from './utils'
import * as scope from './scope'
import * as http from './http'
import * as store from './store'





process.$marketStamps = lockr.get('process.$marketStamps', null)
store.store.state.marketOpen = shared.marketState() != 'CLOSED'

export function syncMarketHours(initing = false) {
	return getMarketHours(initing).then(function(hours) {
		process.$marketStamps = shared.buildMarketStamps(hours)
		lockr.set('process.$marketStamps', process.$marketStamps)
		store.store.state.marketOpen = shared.marketState() != 'CLOSED'
	})
}

let now = shared.now()
let end = shared.moment(now).endOf('minute').valueOf() - now
let rt = setTimeout(function() {
	clearTimeout(rt); rt = null;
	ci.setCorrectingInterval(syncMarketHours, 60000)
}, end)

function getMarketHours(initing = false): Promise<RobinhoodMarketHours> {
	let today = shared.moment().format('YYYY-MM-DD')
	let url = 'https://api.robinhood.com/markets/XNYS/hours/' + today + '/'
	return http.get(url, null, { silent: true, timeout: 3000 }).then(function(hours: RobinhoodMarketHours) {
		shared.fixResponse(hours)
		return Promise.resolve(hours)
	}).catch(function(error) {
		console.error('getMarketHours > error', error)
		if (initing == true) return pdelay(3000).then(() => getMarketHours(true));
	})
}



// export function syncToken() {
// 	return http.get('/rh.token').then(function(response) {
// 		scope.rxRhToken.next(response)
// 		return Promise.resolve()
// 	}).catch(function(error) {
// 		console.error('syncToken', error)
// 		return Promise.resolve()
// 	})
// }





