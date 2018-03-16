//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')
import logger = require('./logger')

import axios from 'axios'
import qs = require('querystring')
import url = require('url')



export const wbdid = '1234'
export const wbtoken = '1234'

axios.defaults.timeout = 10000

function request(config: HttpRequestConfig): Promise<any> {
	return Promise.resolve().then(function() {

		let purl = url.parse(config.url)
		if (_.isEmpty(config.headers)) config.headers = {};
		if (!Number.isFinite(config.timeout)) config.timeout = axios.defaults.timeout;

		// let silent = process.PRODUCTION || config.silent != false
		let silent = process.PRODUCTION || config.silent == true
		if (silent != true) console.info('▶ ' + config.method + ' ' + config.url + ' ▶', _.truncate(JSON.stringify(config.params || config.data || {}), { length: 64 }));

		Object.assign(config.headers, {
			'Host': purl.host,
			'Accept': '*/*',
			'Accept-Encoding': 'deflate, gzip',
			'Connection': 'keep-alive',
		})

		if (purl.host.indexOf('api.robinhood.com') >= 0) {
			// config.headers[] = 'application/json; charset=utf-8'
			if (config.rhtoken) config.headers['Authorization'] = 'Bearer ' + config.rhtoken;
			if (config.data && config.rhqsdata == true) config.data = qs.stringify(config.data);
		}

		if (purl.host.indexOf('stocks666.com') >= 0 || purl.host.indexOf('webull.com') >= 0) {
			// if (purl.host.indexOf('webull.com') >= 0) {
			// config.url = config.url.replace('webull.com', 'stocks666.com')
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

		return axios.request(config).then(function({ data }) {
			return Promise.resolve(data)
		})

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





// export function getDelay() {
// 	let count = (Number.isFinite(ms_axios_errors_meter.sums.count)) ? ms_axios_errors_meter.sums.count : 0
// 	let m1 = (Number.isFinite(ms_axios_errors_meter.sums.m1)) ? ms_axios_errors_meter.sums.m1 : 0
// 	let exp = 1
// 	let rate = Math.pow(m1, exp)
// 	let delay = rate * 1000
// 	delay = Math.round(delay)
// 	console.log('count', _.round(count), 'm1', _.round(m1), 'rate', _.round(rate), 'delay', delay)
// 	return delay
// }



// export function getDelay() {
// 	let count = (Number.isFinite(ms_axios_errors_meter.sums.count)) ? ms_axios_errors_meter.sums.count : 0
// 	let m1 = (Number.isFinite(ms_axios_errors_meter.sums.m1)) ? ms_axios_errors_meter.sums.m1 : 0
// 	let exp = 1
// 	let by = 5000
// 	let rate = Math.pow(1 + m1, exp)
// 	let delay = (rate * by) - by
// 	delay = Math.round(delay)
// 	console.log('count', _.round(count), 'm1', _.round(m1), 'rate', _.round(rate), 'delay', delay)
// 	return delay
// }








































