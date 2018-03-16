// 

import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'
import moment from 'moment'
import rx from 'rxjs/Rx'
import humanize from 'humanize-plus'
import chartist from 'chartist'
import ts from 'timeseries-analysis'
import * as ss from 'simple-statistics'
import * as shared from '../shared'
import * as charts from './charts'



{ (global as any)._ = _ }
{ (global as any).moment = moment }
{ (global as any).ss = ss }
{ (global as any).ts = ts }

export const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || screen.width
export const screenWidthPixels = window.devicePixelRatio * screenWidth
export const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || screen.height
export const screenHeightPixels = window.devicePixelRatio * screenHeight

export function getMedian(nums: Array<number>) {
	if (!nums.length) return 0;
	let numbers = nums.slice(0).sort((a, b) => a - b)
	let middle = Math.floor(numbers.length / 2)
	let isEven = numbers.length % 2 === 0
	return isEven ? (numbers[middle] + numbers[middle - 1]) / 2 : numbers[middle]
}

export function shortenNumber(num: number, ticks = 0) {
	if (num / 10000 > 1) {
		num = num / 1000
		ticks++
		return shortenNumber(num, ticks)
	}
	let syms = ['', 'k', 'm', 't']
	return num.toFixed(0) + syms[ticks]
}

export function capitalizeWords(str: string) {
	return str.toLowerCase().split(' ').map(word => word[0].toUpperCase() + word.substr(1)).join(' ')
}

export function parseFloat(s: string) {
	if (!_.isString(s)) return s;
	return Number.parseFloat(s.replace(/[^0-9\.]/g, ''))
}

export function parseInt(s: string) {
	if (!_.isString(s)) return s;
	return Number.parseInt(s.replace(/[^0-9\.]/g, ''))
}

// export function randomBytes() {
// 	return Math.random().toString(36).replace(/[^a-z]+/g, '')
// }

export function randomBytes(len = 32) {
	let btyes = ''
	while (btyes.length < len && len > 0) {
		let rand = Math.random()
		btyes += (rand < 0.1 ? Math.floor(rand * 100) : String.fromCharCode(Math.floor(rand * 26) + (rand > 0.5 ? 97 : 65)))
	}
	return btyes
}

export function parseToId(id: string) {
	return id.toLowerCase().replace(/\@W+/g, '').trim()
}

export function string_clean(str: string) {
	return str.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s\s+/g, ' ')
}

export function cleanSearch(s: string) {
	if (!s) return s;
	return s.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').trim()
}

export function string_insertAt(a: string, b: string, position: number) {
	return a.substr(0, position) + b + a.substr(position)
}

export function retryPromise(time = 3000) {
	return new Promise<any>(function(resolve) {
		setTimeout(resolve, time)
	})
}

export function calcPercentChange(end: number, start: number) {
	if (!Number.isFinite(end) || !Number.isFinite(start)) return 0;
	if (start == 0) return 0;
	let percent = ((end - start) / start) * 100
	if (!Number.isFinite(percent)) percent = 0;
	return percent
}

export function humanPlusMinus(n: number, precision = 2, dollars = false, compact = true): string {
	if (!Number.isFinite(n)) n = 0; // return 'NaN';
	let ns = formatNumber(n, precision)
	if (compact && Math.abs(n) >= 1000) ns = compactInteger(n, precision - 1);
	ns = ns.replace('-', '')
	let dollar = dollars ? '$' : ''
	if (n == 0) ns = dollar + ns;
	if (n > 0) ns = '+' + dollar + ns;
	if (n < 0) ns = '–' + dollar + ns;
	return ns
}

export function formatNumber(n: number, precision?: number, compact = Infinity): string {
	if (!Number.isFinite(n)) return n as any;
	// if (n == 0) return '0';
	let abs = Math.abs(n)
	if (!Number.isFinite(precision)) {
		precision = 2
		if (abs < 3) precision = 3;
		if (abs < 0.1) precision = 4;
		if (abs < 0.01) precision = 5;
		if (abs < 0.001) precision = 6;
		if (abs >= 1000) precision = 1;
		if (abs >= 10000) precision = 0;
		if (abs == 0) precision = 2;
	}
	let value = humanize.formatNumber(n, precision)
	if (abs >= compact) {
		if (abs >= 1000) precision = 2;
		if (abs >= 10000) precision = 1;
		value = humanize.compactInteger(n, precision)
	}
	return value
}
export function formatPrice(price: number, precision?: number) {
	if (!Number.isFinite(precision)) precision = 2;
	return formatNumber(price, precision)
	// let formatted = formatNumber(price, precision)
	// if (Math.abs(price) < 1 && formatted.slice(-1) == '0') formatted = formatted.substring(0, formatted.length - 1);
}
export function compactInteger(n: number, precision = 1) {
	if (!Number.isFinite(n)) return 'NaN';
	return humanize.compactInteger(n, precision)
}

export function toFixed(n: number, p = 2) {
	if (!Number.isFinite(n)) return n;
	return Number.parseFloat(n.toFixed(p))
}

export function math_clamp(n: number, a: number, b: number) {
	return Math.min(Math.max(n, a), b)
}

// export function math_round(n: number, precision = 2) {
// 	return +(Math.round(n + 'e+' + precision as any) + 'e-' + precision)
// }

export function array_remove<T>(items: Array<T>, fn: (value: T, index?: number) => boolean) {
	let i: number, len: number = items.length
	for (i = len; i--;) {
		if (fn(items[i], i)) {
			items.splice(i, 1)
		}
	}
}

export function clone<T = any>(item: T): T {
	return JSON.parse(JSON.stringify(item))
}

export function math_randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function parseBool(bool: any): boolean {
	if (typeof bool == 'undefined') return false;
	let num: number = +bool
	return !isNaN(num) ? !!num : !!String(bool).toLowerCase().replace(<any>!!0, '')
}

export function sortAlphabetically(a: string, b: string) {
	let an = a.toLowerCase().trim().substring(0, 1)
	let bn = b.toLowerCase().trim().substring(0, 1)
	if (an < bn) return -1
	if (an > bn) return 1
	return 0
}

export function sortByStamp(a: any, b: any) {
	let adate = new Date(a).valueOf()
	let bdate = new Date(b).valueOf()
	return adate - bdate
}

// export function getMinMax(data: Array<number>, favor = 'min' as 'min' | 'max'): number {
// 	let fixed = data.filter(v => Number.isFinite(v))
// 	return Math[favor](...data)
// }

export function array_closest(items: Array<number>, find: number, favor = 'min' as 'min' | 'max') {
	let index = items.mapFast(k => Math.abs(k - find))
	let near = Math[favor].apply(Math, index)
	return index.indexOf(near)
	// return items[index.indexOf(min)]
}

export function array_move<T>(items: Array<T>, from: number, to: number) {
	if (to === from) return items;
	let target = items[from]
	let increment = to < from ? -1 : 1
	for (let k = from; k != to; k += increment) {
		items[k] = items[k + increment]
	}
	items[to] = target
}

export function prettyDate(date: any) {
	if (typeof date != 'string' && typeof date != 'number') {
		console.error('utils.prettyDate > !string && !number')
		return ''
	}
	return shared.moment(date).format('dddd, MMMM Do YYYY, h:mm:ss a')
}

export function hash(s = '') {
	s = s.toString()
	let hash = 0, i, chr
	if (s.length === 0) return hash.toString();
	for (i = 0; i < s.length; i++) {
		chr = s.charCodeAt(i)
		hash = ((hash << 5) - hash) + chr
		hash |= 0
	}
	return Math.abs(hash).toString()
}

export function isValidDate(date: any) {
	return !isNaN(new Date(date).getTime())
}

export function parseDateTimePicked(date: string, time: string) {
	let fdate = shared.moment(date).format('MM/DD/YYYY')
	let parsed = shared.moment(new Date(fdate + ' ' + string_insertAt(time, ' ', time.length - 2)))
	// let formatted = parsed.format('dddd, MMMM Do YYYY, h:mm:ss a')
	// console.log('formatted', formatted)
	return parsed
}

// export function dayOfWeek(mom: moment.Moment) {
// 	let day = mom.format('dddd')
// 	console.log('day', day)

// }

export function from_now(stamp: number) {
	// return shared.moment(stamp).fromNow()
	return shared.moment(Math.min(stamp, shared.now())).fromNow()
}
export function format_stamp(stamp: number, fromnow = false, showtoday = false) {
	return charts.xlabel(stamp, fromnow, showtoday)
}

export function quote_type(type: string) {
	if (!type) return type;
	else if (type == 'etp') return 'ETF';
	else if (type == 'cef') return 'CEF';
	else if (type == 'mlp') return 'MLP';
	else if (type == 'adr') return 'ADR';
	return shared.capitalize(type)
}





/*===========================
=            VUE            =
===========================*/

export function company_name(name: string, len = 2) {
	if (!name) return name;
	name = string_clean(name)
	let split = name.split(' ')
	array_remove(split, v => ['of', 'and', '&'].indexOf(v.toLowerCase()) != -1)
	split.splice(len)
	return split.join(' ')
	// return _.truncate(split.join(' '), { length: 16, omission: '' })
}



declare global {
	type RxSubsDict = { [key: string]: rx.Subscription }
}

@Vts.Component(<VueComponent>{
	name: 'UtilsMixin',
} as any)
export class Mixin extends Vue {

	$rxSubs: RxSubsDict
	beforeCreate() {
		if (!this.$rxSubs) this.$rxSubs = {};
	}
	beforeDestroy() {
		// console.warn('RxSubs-Mixin', this.$options.name, 'this.$rxSubs', this.$rxSubs)
		if (!this.$rxSubs) return;
		Object.keys(this.$rxSubs).forEach((k: string) => {
			let v = this.$rxSubs[k]
			if (!v) return;
			v.unsubscribe()
			this.$rxSubs[k] = null
		})
		this.$rxSubs = null
	}

	// get symbol() { return this.$store.state.symbol }
	// get cname() { return this.$store.state.cname }

	calc_percent(end: number, start: number) {
		return calcPercentChange(end, start)
	}
	format_number(n: number, precision?: number, compact?: number) {
		return formatNumber(n, precision, compact)
	}
	compact_integer(n: number, precision?: number) {
		return compactInteger(n, precision)
	}
	format_price(price: number, precision?: number) {
		return formatPrice(price, precision)
	}
	format_volume(volume: number, precision?: number) {
		return compactInteger(volume, precision)
	}
	format_stamp(stamp: number, fromnow = false, showtoday = false) {
		return format_stamp(stamp, fromnow, showtoday)
	}
	format_date(stamp: number) {
		return shared.moment(stamp).format('dddd, MMMM Do YYYY')
	}
	format_time(stamp: number) {
		return shared.moment(stamp).format('h:mm:ss a')
	}
	from_now(stamp: number) {
		return from_now(stamp)
	}
	yes_no(b: boolean) {
		return b ? 'Yes' : 'No'
	}
	plus_minus(n: number, precision?: number, dollars?: boolean, compact?: boolean) {
		return humanPlusMinus(n, precision, dollars, compact)
	}
	starts_case(s: string) {
		return _.startCase(s)
	}
	capitalize(s: string) {
		return shared.capitalize(s)
	}
	capitalize_words(s: string) {
		return capitalizeWords(s)
	}
	quote_type(type: string) {
		return quote_type(type)
	}

	logo_url(symbol: string) {
		return process.$domain + '/api/logo/' + symbol
	}
	logo_url_error(evt: Event) {
		let el = evt.target as HTMLImageElement
		el.src = 'https://clearbit.com/assets/site/icons/logo.png'
	}

	to_symbol(symbol: string) {
		// return { name: 'symbol', params: { symbol }, query: { tab: 'live' } } as VueLocation
		return { name: 'symbol', params: { symbol } } as VueLocation
	}

	open_url(url: string) {
		window.open(url, '_blank')
	}

	v_status(cquote: CalcQuote) {
		// console.log('v_status', cquote.symbol, _.pick(cquote, ['wbstatus', 'wbstatus0', 'wbfastatus']))
		return shared.wbstatusdict[cquote.wbstatus]
	}

	v_good(value: any) { return shared.isGood(value) }
	v_bad(value: any) { return shared.isBad(value) }

	v_mousewheelx(evt: WheelEvent) {
		evt.preventDefault()
		let delta = evt.deltaY + evt.deltaX
		let path = (evt as any).path as Array<HTMLElement>
		let el = path.find(v => v.className.indexOf('scroll-x') != -1)
		el.scrollLeft = el.scrollLeft + delta
	}

	v_pm_color(a: number, b: number, dark = false) {
		let diff = _.subtract(a, b)
		if (diff == 0) return '';
		if (diff > 0) return dark ? 'success--text--dbg' : 'success--text';
		if (diff < 0) return dark ? 'error--text--dbg' : 'error--text';
	}

	v_round(v: number, precision?: number) {
		return _.round(v, precision)
	}
	v_slider(n: number, min: number, max: number) {
		return shared.calcSlider(n, min, max)
	}

}

export function visDestroyed(vue) {
	return !vue || vue._isDestroyed == true
}
export function vdestroyedSafety(vue) {
	if (visDestroyed(vue)) throw new Error('vdestroyedSafety this > destroyed');
}

export function set$rxSub($rxSubs: RxSubsDict, key: string, sub: rx.Subscription) {
	if ($rxSubs[key]) {
		console.warn('$rxSubs[key]', key, $rxSubs)
	}
	$rxSubs[key] = sub
}

export function buildBottomTabs(tabs: Array<BottomTabItem>) {
	let components = {} as any
	tabs.forEachFast(v => components[v.id] = v.component)
	return components
}

// Vue.directive('lod', {
// 	inserted: function(el) {
// 		console.warn('el')
// 	}
// })



export class rxBuffer<T = any> extends rx.Subject<T> {

	private rxBuffer = new rx.Subject<void>()
	private rxThrottle = _.throttle(() => this.rxBuffer.next(), this.time, { leading: false, trailing: true })

	next(value: T) {
		super.next(value)
		this.rxThrottle()
	}

	constructor(
		private findkey: string,
		private time: number,
		private fn: (items: Array<T>) => void,
	) {
		super()
		this.map((item: any) => {
			if (!Number.isFinite(item.stamp)) item.stamp = Date.now();
			return item
		}).buffer(this.rxBuffer).filter(items => {
			return items.length > 0
		}).map(items => {
			return shared.rxMergeBuffer(items, 'stamp', this.findkey)
		}).subscribe(this.fn)
	}
}



@Vts.Component(<VueComponent>{
	name: 'VueChartist',
	template: '<div></div>',
} as any)
export class VueChartist extends Vue {



}





/*==============================
=            COLORS            =
==============================*/

export const THEME = {
	primary: '#21CE99',
	secondary: '#424242',
	accent: '#303030',
	info: '#42A5F5',
	warning: '#FFA000',
	error: '#F1563A',
	success: '#21CE99',
}

export const COLORS_500 = {
	red: '#F44336',
	pink: '#E91E63',
	purple: '#9C27B0',
	deeppurple: '#673AB7',
	indigo: '#3F51B5',
	blue: '#2196F3',
	lightblue: '#03A9F4',
	cyan: '#00BCD4',
	teal: '#009688',
	green: '#4CAF50',
	lightgreen: '#8BC34A',
	lime: '#CDDC39',
	yellow: '#FFD600',
	amber: '#FFC107',
	orange: '#FF9800',
	deeporange: '#FF5722',
	bluegrey: '#607D8B',
	brown: '#795548',
}

export const COLORS_700 = {
	red: '#D32F2F',
	pink: '#C2185B',
	purple: '#7B1FA2',
	deeppurple: '#512DA8',
	indigo: '#303F9F',
	blue: '#1976D2',
	lightblue: '#0288D1',
	cyan: '#0097A7',
	teal: '#00796B',
	green: '#388E3C',
	lightgreen: '#689F38',
	lime: '#AFB42B',
	yellow: '#FBC02D',
	amber: '#FFA000',
	orange: '#F57C00',
	deeporange: '#E64A19',
	bluegrey: '#455A64',
	brown: '#5D4037',
}

export const COLORS_900 = {
	red: '#B71C1C',
	pink: '#880E4F',
	purple: '#4A148C',
	deeppurple: '#311B92',
	indigo: '#1A237E',
	blue: '#0D47A1',
	lightblue: '#01579B',
	cyan: '#006064',
	teal: '#004D40',
	green: '#1B5E20',
	lightgreen: '#33691E',
	lime: '#827717',
	yellow: '#F57F17',
	amber: '#FF6F00',
	orange: '#E65100',
	deeporange: '#BF360C',
	bluegrey: '#212121',
	brown: '#3E2723',
}

export const COLORS_A100 = {
	red: '#FF8A80',
	pink: '#FF80AB',
	purple: '#EA80FC',
	deeppurple: '#B388FF',
	indigo: '#8C9EFF',
	blue: '#82B1FF',
	lightblue: '#80D8FF',
	cyan: '#84FFFF',
	teal: '#A7FFEB',
	green: '#B9F6CA',
	lightgreen: '#CCFF90',
	lime: '#F4FF81',
	yellow: '#FFFF8D',
	amber: '#FFE57F',
	orange: '#FFD180',
	deeporange: '#FF9E80',
	bluegrey: '#CFD8DC',
}

export const COLORS_A200 = {
	red: '#FF5252',
	pink: '#FF4081',
	purple: '#E040FB',
	deeppurple: '#7C4DFF',
	indigo: '#536DFE',
	blue: '#448AFF',
	lightblue: '#40C4FF',
	cyan: '#18FFFF',
	teal: '#64FFDA',
	green: '#69F0AE',
	lightgreen: '#B2FF59',
	lime: '#EEFF41',
	yellow: '#FFFF00',
	amber: '#FFD740',
	orange: '#FFAB40',
	deeporange: '#FF6E40',
	bluegrey: '#90A4AE',
}

export const COLORS_A700 = {
	red: '#D50000',
	pink: '#C51162',
	purple: '#AA00FF',
	deeppurple: '#6200EA',
	indigo: '#304FFE',
	blue: '#2962FF',
	lightblue: '#0091EA',
	cyan: '#00B8D4',
	teal: '#00BFA5',
	green: '#00C853',
	lightgreen: '#64DD17',
	lime: '#AEEA00',
	yellow: '#FFD600',
	amber: '#FFAB00',
	orange: '#FF6D00',
	deeporange: '#DD2C00',
}

export function randomColor(colors = COLORS_500 as any, ibadhexes = [] as Array<string>): string {
	let dbadhexes = [] as Array<string>
	let badcolors = ['bluegrey', 'yellow'] // ['red', 'green', 'bluegrey']
	badcolors.forEach(v => dbadhexes.push(colors[v]))
	let badhexes = dbadhexes.concat(ibadhexes)
	if ((badhexes.length + 1) >= Object.keys(colors).length) badhexes.splice(3);
	let keys = Object.keys(colors)
	let key = keys[math_randomInt(0, keys.length - 1)]
	let color = colors[key]
	if (badhexes.indexOf(color) != -1) return randomColor(colors, ibadhexes);
	return color
}





/*==================================
=            DECORATORS            =
==================================*/

// export function vxRegisterModule<S>(vxStore: Vuex.Store<S>, vxModule: { name: string }) {
// 	vxStore.registerModule(vxModule.name, vxModule)
// }

// Vue.use(function(vue) {
// 	// vue.prototype.$rxSubs = {}
// 	vue.mixin(<Vue.ComponentOptions<Vue>>{
// 		beforeCreate() {
// 			this.$rxSubs = {}
// 			// this.$rxSubs2 = []
// 		},
// 		// beforeDestroy() {
// 		// 	// console.log('this.$options.name', this.$options.name)
// 		// 	destroySubs(this.$rxSubs)
// 		// },
// 	})
// })

// export function destroy$rxSubs($rxSubs: RxSubsDict) {
// 	Object.keys($rxSubs).forEach((k: string) => {
// 		let v = $rxSubs[k]
// 		if (!v) return;
// 		v.unsubscribe()
// 		$rxSubs[k] = null
// 	})
// 	$rxSubs = null
// }

// export const NoCache = Vts.createDecorator(function(options, key) {
// 	// component options should be passed to the callback
// 	// and update for the options object affect the component
// 	// options.computed[key].cache = false
// })

// export const NonReactive = Vcc.createDecorator(function(options, key) {
// 	options[key] = 'boobies'
// })








// const SUB_KEY = '$$Sub'
// export function Sub<T>(subs: RxSubsDict, subject: Rx.BehaviorSubject<T>) {
// 	// console.log('subs', subs)
// 	return function(target: Vue, key: string) {
// 		let subjects = target[SUB_KEY] = target[SUB_KEY] || {}
// 		subjects[key] = subject
// 	}
// }
// Avts.Component.register(<any>SUB_KEY, function(proto, instance, options) {
// 	let subjects = instance[SUB_KEY] as RxSubjectsDict<any>
// 	for (let key in subjects) {
// 		// instance.$data[key] = subjects[key].value
// 		instance.$rxSubs[key] = subjects[key].subscribe(v => {
// 			// console.log('this', this)
// 			// console.warn('key', key)
// 			// console.log('v', v)
// 			// console.log('instance', instance)
// 			instance[key] = v
// 		})
// 	}
// })



// const STATIC_KEY = '$$Static'
// export function Static(target: Vue, key: string) {
// 	target[STATIC_KEY] = key
// }
// Avts.Component.register(<any>STATIC_KEY, function(proto, instance, options) {
// 	let key = proto[STATIC_KEY]
// 	options[key] = instance[key]
// })





// const EXPORT_KEY = '$$Export'
// export function Export(target: Vue, key: string) {
// 	console.log('this', this)
// 	console.log('target', target)
// 	console.log('key', key)
// 	target[EXPORT_KEY] = { key, that: this, }
// }
// Avts.Component.register(<any>EXPORT_KEY, (proto, instance, options) => {
// 	options.WTF = true
// 	console.warn('Avts.Component.register')
// 	console.log('proto', proto)
// 	console.log('instance', instance)
// 	console.log('options', options)
// 	let map = proto[EXPORT_KEY]
// 	console.log('map', map)
// 	let key = map.key
// 	console.log('key', key)
// 	let value = instance[key]
// 	console.log('value', value)
// 	// options[key] = value
// })




























const benches: any = {}
const mute: boolean = false
const filters: Array<string> = []
export function benchStart(id: string) {
	if (process.DEVELOPMENT && !mute && filters.indexOf(id) == -1) {
		let now = new Date().valueOf()
		benches[id] = {
			start: now,
			t: now,
		}
		console.log('bench > start', id)
	}
}
export function benchPing(id: string, name: string = '') {
	if (process.DEVELOPMENT && !mute && filters.indexOf(id) == -1 && benches[id]) {
		let bench = benches[id]
		let now = new Date().valueOf()
		let time = now - bench.t
		console.log('bench > ping', id, name, time)
		benches[id].t = now
	}
}
export function benchEnd(id: string) {
	if (process.DEVELOPMENT && !mute && filters.indexOf(id) == -1 && benches[id]) {
		let bench = benches[id]
		let now = new Date().valueOf()
		let time = now - bench.start
		console.log('bench > end', id, 'total', time)
		benches[id] = undefined
	}
}



export function keys(desc: string, obj: any) {
	console.debug('' + ('▼ ▼ ▼ ▼  ' + (desc) + '  ▼ ▼ ▼ ▼') + ' ')
	if (_.isUndefined(obj)) {
		console.log('\n' + ('IS UNDEFINED'))
	} else if (_.isNull(obj)) {
		console.log('\n' + ('IS NULL'))
	} else {
		let sendi: string = ''
		let fns: Array<string> = _.functionsIn(obj)
		let _fns: Array<string> = []
		let keys: Array<string> = _.difference(_.keysIn(obj), fns)
		let _keys: Array<string> = []

		{
			let i: number, len: number = keys.length
			for (i = 0; i < len; i++) {
				if (keys[i].charAt(0) == '_') {
					_keys.push(keys[i])
				}
			}
		}
		keys = _.difference(keys, _keys)

		{
			let i: number, len: number = keys.length
			if (len > 0) {
				sendi = sendi + '\n' + ('▼ KEYS') + '\n'
			}
			for (i = 0; i < len; i++) {
				sendi = sendi + keys[i] + '\n'
			}
		}

		{
			let i: number, len: number = _keys.length
			if (len > 0) {
				sendi = sendi + '\n' + ('▼ _PRIVATE KEYS') + '\n'
			}
			for (i = 0; i < len; i++) {
				sendi = sendi + _keys[i] + '\n'
			}
		}

		{
			let i: number, len: number = fns.length
			for (i = 0; i < len; i++) {
				if (fns[i].charAt(0) == '_') {
					_fns.push(fns[i])
				}
			}
		}
		fns = _.difference(fns, _fns)

		{
			let i: number, len: number = fns.length
			if (len > 0) {
				sendi = sendi + '\n' + ('▼ FUNCTIONS') + '\n'
			}
			for (i = 0; i < len; i++) {
				sendi = sendi + fns[i] + '()\n'
			}
		}

		{
			let i: number, len: number = _fns.length
			if (len > 0) {
				sendi = sendi + '\n' + ('▼ _PRIVATE FUNCTIONS') + '\n'
			}
			for (i = 0; i < len; i++) {
				sendi = sendi + _fns[i] + '()\n'
			}
		}

		console.log(sendi + '\n')
	}
	console.debug('' + ('▲ ▲ ▲ ▲  ' + (desc) + '  ▲ ▲ ▲ ▲') + '\n')
}

