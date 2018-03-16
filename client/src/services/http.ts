// 

import _ from 'lodash'
import qs from 'query-string'
import axios from 'axios'
import * as shared from '../shared'
import * as utils from './utils'
import * as Snackbar from '../comps/snackbar/snackbar'
import * as scope from './scope'



export const wbdid = '230f3935a9e64e428c789f0ba4899552'
export const wbtoken = '15f3a858c99-39cdfddfaf154ac8b4cc4fd6b962135c'

axios.defaults.timeout = 5000

function request(config: HttpRequestConfig): Promise<any> {
	return Promise.resolve().then(function() {

		if (!config.headers) config.headers = {};
		if (!_.isFinite(config.timeout)) config.timeout = axios.defaults.timeout;

		let silent = config.silent == true || process.PRODUCTION
		if (silent != true) console.log('%c▶ ' + config.method + ' ' + (config.production ? 'https://robinstocks.com/api' + config.url : config.url) + ' ▶', 'font-weight: 300;', _.truncate(JSON.stringify(config.params || config.data || {}), { length: 64 }));

		let isrobinhood = config.url.indexOf('https://api.robinhood.com') == 0
		if (isrobinhood) {
			if (config.rhtoken) config.headers['Authorization'] = 'Bearer ' + config.rhtoken;
			if (config.data && config.rhqsdata == true) config.data = qs.stringify(config.data);
		}

		let isyahoo = config.url.indexOf('finance.yahoo.com') >= 0
		if (isyahoo) {
			if (config.url.indexOf('https://query1.finance.yahoo.com') == 0) config.url = config.url.replace('https://query1.finance.yahoo.com', 'https://query' + _.random(1, 2) + '.finance.yahoo.com');
			if (config.url.indexOf('https://query2.finance.yahoo.com') == 0) config.url = config.url.replace('https://query2.finance.yahoo.com', 'https://query' + _.random(1, 2) + '.finance.yahoo.com');
		}

		let iswebull = config.url.indexOf('webull.com') >= 0
		if (iswebull) {
			config.url = config.url.replace('webull.com', 'stocks666.com')
			Object.assign(config.headers, {
				hl: 'en',
				locale: 'eng',
				os: 'android',
				osv: 'Android SDK: 25 (7.1.2)',
				ph: 'Google Pixel',
				ch: 'google_play',
				tz: 'America/New_York',
				ver: '3.5.1.13',
				app: 'stocks',
			})
			if (config.wbtoken) {
				Object.assign(config.headers, {
					did: wbdid,
					access_token: wbtoken,
					mcc: '311',
					mnc: '480',
				})
			}
		}

		let isproxy = config.url[0] != '/'
		let proxyconfig = isproxy ? shared.clone(config) : null

		if (!config.params) config.params = {};
		if (config.silent == true) config.params.silent = true;
		let domain = config.production ? 'https://robinstocks.com' : process.$domain
		config.baseURL = domain + '/api'
		Object.assign(config.headers, {
			'x-uuid': scope.rxUuid.value,
			'x-xid': scope.rxXid.value,
			'x-bytes': scope.rxBytes.value,
			'x-token': scope.rxToken.value + '.' + (Date.now() - scope.rxTdiff.value),
			'x-version': process.$version,
			'x-dev-secret': process.env.$devsecret,
			'x-platform': 'web',
		})

		if (isproxy) {
			// config.baseURL = 'https://robinstocks.com/api'
			config.url = '/proxy'
			config.data = proxyconfig
			config.method = 'POST'
		}

		return axios.request(config).then(function({ data }) {
			if (isrobinhood || iswebull) shared.fixResponse(data);
			// if (silent != true) console.log('%c◀ ' + config.method + ' ' + config.url + ' ◀', 'font-weight: 300;', _.truncate(JSON.stringify(data || {}), { length: 64 }));
			return Promise.resolve(data)
		})

	}).catch(function(error) {
		let message = error.message
		if (_.has(error, 'response.data.message')) message = error.response.data.message;
		let premessage = config.method + ' ' + config.url
		console.log('%c◀ ' + premessage + ' ◀', 'color: red; font-weight: bolder;', message) // '"' + message + '"')
		Snackbar.rxItems.next({ message: premessage + ' ▶ ' + message, color: 'error' })
		return Promise.reject(error)
	})
}

export function get<T = any>(url: string, params?: any, config = {} as HttpRequestConfig): Promise<T> {
	config.url = url
	config.method = 'GET'
	if (params) config.params = params;
	return request(config) as any
}

export function post<D = any, T = any>(url: string, data?: D, config = {} as HttpRequestConfig): Promise<T> {
	config.url = url
	config.method = 'POST'
	if (data) config.data = data;
	return request(config) as any
}




