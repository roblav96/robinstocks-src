// 

import Vue from 'vue'
import VueRouter, { RouteConfig as VRouteConfig } from 'vue-router'
import _ from 'lodash'
import ci from 'correcting-interval'
import rx from 'rxjs/Rx'
import * as shared from './shared'
import * as utils from './services/utils'
import * as socket from './services/socket'
import * as scope from './services/scope'
import * as store from './services/store'
import * as http from './services/http'
import * as robinhood from './services/robinhood'
import * as IbStore from './services/ib.store'
import * as Snackbar from './comps/snackbar/snackbar'

import Root from './root'
import Login from './routes/login/login'
import Symbol from './routes/symbol/symbol'
import Logger from './routes/logger/logger'
import Metrics from './routes/metrics/metrics'
import TimeFormat from './routes/time.format/time.format'
import Calcs from './routes/calcs/calcs'
import Ib from './routes/ib/ib'
import Rh from './routes/rh/rh'
import Redis from './routes/redis/redis'
import Pensions from './routes/pensions/pensions'
import Markets from './routes/markets/markets'
import Profiling from './routes/profiling/profiling'
import System from './routes/system/system'
import Processes from './routes/processes/processes'



declare global {
	interface RouteConfig extends VRouteConfig {
		dname?: string
		icon?: string
		mmenu?: boolean
		category?: string
	}
	interface RouteSubject {
		to: string
		from: string
	}
}

export const routes = [

	{
		name: 'login',
		path: '/login',
		component: Login,
		dname: 'Robinhood Login',
		icon: 'mdi-verified',
		mmenu: false,
	},

	{
		name: 'ibkr',
		path: '/ibkr',
		component: Ib,
		dname: 'Interactive Brokers',
		icon: 'mdi-bank',
		mmenu: false,
	},

	{
		name: 'rh',
		path: '/rh',
		component: Rh,
		dname: 'Robinhood',
		icon: 'mdi-bank',
		mmenu: false,
	},

	{
		name: 'symbol',
		path: '/symbol/:symbol',
		component: Symbol,
		mmenu: false,
	},

	{
		name: 'calcs',
		path: '/calcs',
		component: Calcs,
		dname: 'Screener',
		icon: 'mdi-radar',
	},

	{
		name: 'markets',
		path: '/markets',
		component: Markets,
		dname: 'Markets',
		icon: 'mdi-earth',
	},

	// {
	// 	name: 'movements',
	// 	path: '/movements',
	// 	component: Movements,
	// 	dname: 'Movements',
	// 	icon: 'mdi-radar',
	// },

	{
		name: 'logger',
		path: '/logger',
		component: Logger,
		dname: 'Remote Console Logs',
		icon: 'mdi-console',
		mmenu: false,
		category: 'developer',
	},

	{
		name: 'metrics',
		path: '/metrics',
		component: Metrics,
		dname: 'Application Metrics',
		icon: 'mdi-gauge',
		mmenu: false,
		category: 'developer',
	},

	{
		name: 'system',
		path: '/system',
		component: System,
		dname: 'Hardware Information',
		icon: 'mdi-server-network',
		mmenu: false,
		category: 'developer',
	},

	{
		name: 'processes',
		path: '/processes',
		component: Processes,
		dname: 'System Processes',
		icon: 'mdi-sitemap',
		mmenu: false,
		category: 'developer',
	},

	{
		name: 'redis',
		path: '/redis',
		component: Redis,
		dname: 'Redis DB Diagnostics',
		icon: 'mdi-database',
		mmenu: false,
		category: 'developer',
	},

	{
		name: 'profiling',
		path: '/profiling',
		component: Profiling,
		dname: 'Function Profiling',
		// icon: 'mdi-record-rec',
		// icon: 'mdi-math-compass',
		icon: 'mdi-language-javascript',
		mmenu: false,
		category: 'developer',
	},

	{
		name: 'time.format',
		path: '/time.format',
		component: TimeFormat,
		dname: 'Time Format Debugger',
		icon: 'mdi-clock',
		mmenu: false,
		category: 'developer',
	},

	// {
	// 	name: 'pensions',
	// 	path: '/pensions',
	// 	component: Pensions,
	// 	dname: 'NE Pention Plan Index Funds',
	// 	icon: 'redeem',
	// },

	{
		path: '*',
		redirect: { name: 'calcs' },
	},

] as Array<RouteConfig>

export const router = new VueRouter({
	routes: routes,
	mode: 'history',
})

export const rxRoute = new rx.Subject<RouteSubject>()
router.afterEach(function(to, from) {
	let route = routes.find(v => v.name == to.name)
	if (route.dname) document.title = _.startCase(route.dname);
	rxRoute.next({ to: to.name, from: from.name })
})

Root.options.router = router
Root.options.store = store.store

rx.Observable.interval(100).filter(function() {
	return !!process.$marketStamps && !!socket.rxAlive.value
}).take(1).subscribe(function() {
	new Root().$mount('#root')
	IbStore.initIbStore()
})
robinhood.syncMarketHours(true)
// robinhood.syncToken()





let ee3ts = {} as { [topic: string]: number }
let ee3is = {} as { [topic: string]: number }
function ee3tick(topic: string, tick: number) {
	clearTimeout(ee3ts[topic]); ee3ts[topic] = null; _.unset(ee3ts, topic);
	ee3is[topic] = 0
	process.ee3.emit(topic, ee3is[topic])
	ci.setCorrectingInterval(function() {
		ee3is[topic]++
		process.ee3.emit(topic, ee3is[topic])
	}, tick * 1000)
}
Object.keys(shared.RKEY.SYS).filter(k => k.toLowerCase().indexOf('tick_') == 0).forEachFast(function(key) {
	let topic = shared.RKEY.SYS[key]
	let tick = shared.parseInt(key)
	if (key == 'TICK_01') tick = 0.1;
	if (key == 'TICK_025') tick = 0.25;
	if (key == 'TICK_05') tick = 0.5;
	let now = Date.now()
	let second = shared.moment(now).endOf('second').second()
	let addsec = tick - ((second + 1) % tick)
	let start = shared.moment(now).endOf('second').add(addsec, 'seconds').valueOf() - now + 1  // + 1 for execution latency
	ee3ts[topic] = _.delay(ee3tick, start, topic, tick)
})





window.onerror = function(message, filename, lineno, colno, error) {
	Snackbar.rxItems.next({ message, color: 'error' })
	return false
}

document.onerror = function (event) {
	Snackbar.rxItems.next({ message: event.message, color: 'warning' })
	console.warn('document.onerror > event', event)
	return false
}







