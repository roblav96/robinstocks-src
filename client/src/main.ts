// 

Array.prototype.forEachFast = function(fn) {
	let i: number, len = this.length
	for (i = 0; i < len; i++) {
		let v = this[i]
		fn(v, i, this)
	}
}
Array.prototype.mapFast = function(fn) {
	let i: number, len = this.length
	let array = new Array(len)
	for (i = 0; i < len; i++) {
		let v = this[i]
		array[i] = fn(v, i, this)
	}
	return array
}
Array.prototype.filterFast = function(fn) {
	let array = []
	let i: number, len = this.length
	for (i = 0; i < len; i++) {
		let v = this[i]
		if (fn(v, i, this)) array.push(v);
	}
	return array
}
Array.prototype.findFast = function(fn) {
	let i: number, len = this.length
	for (i = 0; i < len; i++) {
		let v = this[i]
		if (fn(v, i, this)) return v;
	}
}
Array.prototype.removeFast = function(fn) {
	let i: number, len = this.length
	for (i = len; i--;) {
		let v = this[i]
		if (fn(v, i, this)) this.splice(i, 1);
	}
}



process.$env = process.env.$env as any
process.DEVELOPMENT = process.$env == 'DEVELOPMENT'
process.PRODUCTION = process.$env == 'PRODUCTION'
process.$platform = 'client'
process.CLIENT = process.$platform == 'client' as any
process.SERVER = process.$platform == 'server' as any

process.$marketStamps = null

process.$domain = 'https://robinstocks.com'
// if (process.DEVELOPMENT) process.$domain = 'http://dev.robinstocks.com';
if (process.DEVELOPMENT) process.$domain = 'http://localhost:3337';
process.$version = '0.0.1'



// if (process.DEVELOPMENT) {
// 	const dtsgen = require('dts-gen')
// 	process.dtsgen = function(name, value) {
// 		let results = dtsgen.generateIdentifierDeclarationFile(name.replace(/\W+/g, '').trim().toLowerCase(), value)
// 		console.log('%cprocess.dtsgen > ' + name, 'color: blue; font-weight: bolder;', '\n\n', results)
// 	}
// }



// if (process.PRODUCTION) {
// 	let script = document.createElement('script')
// 	script.setAttribute('src', 'https://www.google.com/recaptcha/api.js?render=explicit')
// 	document.body.appendChild(script)
// }



import './theme.styl'
import 'animate.css'
import 'chartist/dist/chartist.min.css'
import 'chartist-plugin-tooltips/dist/chartist-plugin-tooltip.css'
// import 'billboard.js/dist/billboard.min.css'
import './styles.css'



import 'correcting-interval'
import ee3 from 'eventemitter3'
process.ee3 = new ee3.EventEmitter()

import Vue from 'vue'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import Vuetify from 'vuetify'

Vue.config.devtools = false
Vue.config.productionTip = false
Vue.config.performance = false
Vue.use(VueRouter)
Vue.use(Vuex)
Vue.use(Vuetify, {
	theme: {
		primary: '#21CE99',
		secondary: '#424242',
		accent: '#303030',
		info: '#42A5F5',
		warning: '#FFA000',
		error: '#F1563A',
		success: '#21CE99',
	}
})
// Vue.config.errorHandler = function(error, vm, info) {
// 	console.error('Vue.errorHandler > error', error)
// 	console.log('vm', vm)
// 	console.log('info', info)
// }



import 'chartist'
import 'chartist-plugin-tooltips'

import 'babel-polyfill' // for technicalindicators

import _ from 'lodash'
import moment from 'moment'
moment.updateLocale('en', {
	relativeTime: {
		future: 'in %s',
		past: '%s ago',
		s: '%ds',
		ss: '%ds',
		m: '%dm',
		mm: '%dm',
		h: '%dhr',
		hh: '%dhr',
		d: 'a day',
		dd: '%d days',
		M: 'a month',
		MM: '%d months',
		y: 'a year',
		yy: '%d years',
	}
})

moment.relativeTimeThreshold('s', 60)
moment.relativeTimeThreshold('m', 60)
moment.relativeTimeThreshold('h', 24)
moment.relativeTimeThreshold('d', 31)
moment.relativeTimeThreshold('M', 12)





require('./router')









// function calcRatio(a: number, b: number) {
// 	let ratio = a / b
// 	if (!_.isFinite(ratio)) ratio = 0;
// 	ratio++
// 	return ratio
// }
// { (global as any).calcRatio = calcRatio }





