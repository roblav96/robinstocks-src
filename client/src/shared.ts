// 

import * as eyes from 'eyes'
import * as _ from 'lodash'
import * as mmoment from 'moment'
import * as ss from 'simple-statistics'
import * as axios from 'axios'
import * as nib from 'ib'
import * as pqueue from 'p-queue'
import * as ts from 'timeseries-analysis'
import * as ecstat from 'echarts-stat/dist/ecStat'



declare global {
	namespace NodeJS {
		interface Process {
			dtsgen: (name: string, value: any) => void
			$env: 'DEVELOPMENT' | 'PRODUCTION'
			DEVELOPMENT: boolean
			PRODUCTION: boolean
			$platform: 'client' | 'server'
			CLIENT: boolean
			SERVER: boolean
			$marketStamps: MarketStamps
			$prevMarketStamps: MarketStamps
			$nextMarketStamps: MarketStamps
		}
	}
	interface HttpRequestConfig extends axios.AxiosRequestConfig {
		silent?: boolean
		rhtoken?: string
		rhqsdata?: boolean
		wbtoken?: boolean
		production?: boolean
	}
	interface GetIbBody {
		account?: boolean
		positions?: boolean
		orders?: boolean
		executions?: boolean
		tradings?: boolean
		symbol?: string
		start?: number
		end?: number
	}
	interface GetIbResponse {
		account: nib.Account
		positions: Array<nib.Position>
		orders: Array<nib.Order>
		executions: Array<nib.Execution>
		tradings: Array<string>
	}
	interface IbMinute extends GetIbResponse {
		stamp: number
	}
	interface IbDay {
		account: nib.Account
		date: string
		stamp: number
	}
	interface TradingItem extends SmallQuote {
		orders: number
		commissions: number
	}
	interface PositionItem extends SmallQuote {
		equity: number
		unrealizedPNLpercent: number
	}
	interface IbPortfolio {

	}
	interface PQueue extends pqueue {
		onIdle(): Promise<void>
		addAll<T>(proms: Array<Promise<T>>): Promise<void>
	}
}



/*=============================
=            RKEYS            =
=============================*/

export const RKEY = {

	MOVES: 'moves',
	EWMAS: 'ewmas',
	EODS: 'eods',
	STDEVS: 'stdevs',
	NEWSES: 'newses',

	CALCS: 'calcs',
	CALCS_SMALLS: 'calcs:smalls',
	CALCS_REMOTE: 'calcs:remote',
	CALCS_TRADING: 'calcs:trading',

	// CALCS_ZMAP_LIVES: 'calcs:zmap:lives',
	// CALCS_ZMAP_MINUTES: 'calcs:zmap:minutes',
	// CALCS_ZMAP_5MINUTES: 'calcs:zmap:5minutes',

	LIVES: 'lives',
	LIVES_TINYS: 'lives:tinys',
	LIVES_TINYS_5M: 'lives:tinys5m',
	LIVES_MINUTES: 'lives:minutes',
	LIVES_RMAP: 'lives:rmap',

	// LIVES_ZMAP: 'lives:zmap:lives',
	// LIVES_ZMAP_TINYS: 'lives:zmap:tinys',
	// LIVES_ZMAP_TINYS_5M: 'lives:zmap:tinys5m',
	// LIVES_ZMAP_MINUTES: 'lives:zmap:minutes',

	RH: {
		SYMBOLS: 'rh:symbols',
		SYMBOLS_LENGTH: 'rh:symbols:length',
		SYMBOLS_FULL: 'rh:symbols:full',
		// SYMBOLS_SORTED: 'rh:symbols:sorted',
		INSTRUMENTS: 'rh:instruments',
		FUNDAMENTALS: 'rh:fundamentals',
		QUOTES: 'rh:quotes',
		PRICES: 'rh:prices',
		HOURS: 'rh:hours',
		PREV_HOURS: 'rh:hours:prev',
		NEXT_HOURS: 'rh:hours:next',
		HISTORICALS: 'rh:historicals',
		EARNINGS: 'rh:earnings',
		EARNINGS_DATE: 'rh:earnings:date',
	},

	WB: {
		QUOTES: 'wb:quotes',
		TRADE: 'wb:trade',
		BIDASK: 'wb:bidask',
	},

	YH: {
		QUOTES: 'yh:quotes',
		SUMMARIES: 'yh:summaries',
		CHARTS: 'yh:charts',
	},

	IEX: {
		ITEMS: 'iex:items',
		QUOTES: 'iex:quotes',
	},

	MARKET: {
		CALCS: 'market:calcs',
	},

	NEWS: {
		IDS: 'news:ids',
		BADS: 'news:bads',
	},

	SYS: {
		READY: 'sys:ready',
		RESTART: 'sys:restart',
		TICK_01: 'sys:tick:01',
		TICK_025: 'sys:tick:025',
		TICK_05: 'sys:tick:05',
		TICK_1: 'sys:tick:1',
		TICK_2: 'sys:tick:2',
		TICK_3: 'sys:tick:3',
		TICK_5: 'sys:tick:5',
		TICK_10: 'sys:tick:10',
		TICK_15: 'sys:tick:15',
		TICK_30: 'sys:tick:30',
		TICK_60: 'sys:tick:60',
		SECURITY: 'sys:security',
	},

	DIAG: {
		GOOGLE_BLOCKED: 'diag:google:blocked',
		NEWS_TOPS: 'diag:news:tops',
	},

	LOGS: {
		LOGS: 'logs:logs',
		INFOS: 'logs:infos',
		WARNS: 'logs:warns',
		ERRORS: 'logs:errors',
		PRIMARIES: 'logs:primaries',
		MASTERS: 'logs:masters',
	},

	IB: {
		ACCOUNT: 'ib:account',
		POSITIONS: 'ib:positions',
		ORDERS: 'ib:orders',
		EXECUTIONS: 'ib:executions',
		ACTIVES: 'ib:actives',
		ZMAP: 'ib:zmap',
		DEV_TRADE: 'ib:devtrade',
	},

	// SORTED: 'sorted',
	BROADCAST: 'broadcast',
	LOGOS: 'logos',
	PROFILING: 'metrics:profiling',

}



export const livesTick = 10
export const backRange = _.round(mmoment.duration(1, 'hour').asSeconds() / livesTick)



export const EWMAS = {
	NAMES: ['price', 'size', 'tradesize', 'tradevolume', 'velocity'],
	PERIODS: [1, 5, 10, 15, 30],
	SMAS: [0.5, 1, 2, 5, 10, 15, 30], // minutes
	SLPS: [0.5, 1, 2, 5, 10, 15, 30], // minutes
	OTHERS: {
		value: 0,
		total: 0,
	},
	RMAP: [] as Array<string>,
	RMAPS: {
		EWMA: ['rate', 'sum', 'avg'],
		OTHERS: [] as Array<string>,
	},
}
EWMAS.RMAPS.OTHERS = Object.keys(EWMAS.OTHERS)
EWMAS.SMAS = EWMAS.SMAS.mapFast(v => _.round(mmoment.duration(v, 'minutes').asSeconds() / livesTick))
EWMAS.SLPS = EWMAS.SLPS.mapFast(v => _.round(mmoment.duration(v, 'minutes').asSeconds() / livesTick))
EWMAS.NAMES.forEachFast(function(name) {
	EWMAS.PERIODS.forEachFast(v => EWMAS.RMAP.push(name + '_ewma_' + v))
	EWMAS.SMAS.forEachFast(v => EWMAS.RMAP.push(name + '_sma_' + v))
	EWMAS.SLPS.forEachFast(v => EWMAS.RMAP.push(name + '_slp_' + v))
	Object.keys(EWMAS.OTHERS).forEachFast(v => EWMAS.RMAP.push(name + '_other_' + v))
})

// console.log('EWMAS >')
// eyes.inspect(EWMAS)





/*=============================
=            RMAPS            =
=============================*/

let LOGS: LogItem = {
	message: null,
	messages: null,
	instance: null,
	rkey: null,
	stack: null,
	stamp: null,
}

let HISTS: HistQuote = {
	symbol: null,
	stamp: null,
	lastPrice: null,
	open: null,
	high: null,
	low: null,
	close: null,
	size: null,
	volume: null,
	lastStamp: null,
}

let TINYS: TinyQuote = {
	symbol: null,
	lastPrice: null,
	size: null,
	lastStamp: null,
	askSpread: null,
	bidSpread: null,
	tradeSize: null,
	tradeBuySize: null,
	tradeSellSize: null,
}

let SMALLS: SmallQuote = {
	symbol: null,
	stamp: null,
	lastPrice: null,
	size: null,
	lastStamp: null,
	action: null,
	prevAction: null,
	liveTrading: null,
	position: null,
	avgCost: null,
	unrealizedPNL: null,
	realizedPNL: null,
	positionStamp: null,
}

let LIVES: LiveQuote = {
	symbol: null,
	stamp: null,
	count: null,
	bidPrice: null,
	askPrice: null,
	bidSize: null,
	askSize: null,
	bidVolume: null,
	askVolume: null,
	bidSizeAccum: null,
	askSizeAccum: null,
	bidSpread: null,
	askSpread: null,
	lastPrice: null,
	high: null,
	low: null,
	open: null,
	close: null,
	size: null,
	volume: null,
	lastStamp: null,
	tradeCount: null,
	tradeSize: null,
	tradeVolume: null,
	tradeBuySize: null,
	tradeSellSize: null,
	tradeBuyVolume: null,
	tradeSellVolume: null,
	dealCount: null,
	wbstatus: null,
	wbstatus0: null,
	wbfastatus: null,
	wbstatusStamp: null,
	dayHigh: null,
	dayLow: null,
	turnoverRate: null,
	vibrateRatio: null,
	yield: null,
	rootMeanSquare: null,
	sampleSkewness: null,
	linearSlope: null,
	linearIntercept: null,
	linearCorrelation: null,
	linearCovariance: null,
	quadraticIntercept: null,
	quadratic1stRoot: null,
	quadratic2ndRoot: null,
	quadraticCorrelation: null,
	quadraticCovariance: null,
	interquartileRange: null,
	action: null,
	prevAction: null,
	liveTrading: null,
	position: null,
	avgCost: null,
	unrealizedPNL: null,
	realizedPNL: null,
	priceChange: null,
	bidAskSpread: null,
	bidAskFlowSizeAccum: null,
	bidAskFlowVolume: null,
	tradeFlowSize: null,
	tradeFlowVolume: null,
	volumeOsc: null,
	volumeProgressOsc: null,
}

EWMAS.RMAP.forEachFast(v => LIVES[v] = null)

let CALCS = Object.assign({} as any, LIVES, {
	name: null,
	junk: null,
	type: null,
	mic: null,
	exchange: null,
	acronym: null,
	eodPrice: null,
	openPrice: null,
	closePrice: null,
	prevClose: null,
	marketCap: null,
	sharesOutstanding: null,
	sharesFloat: null,
	listDate: null,
	avgVolume: null,
	avgVolume10Day: null,
	avgVolume3Month: null,
	newsStamp: null,
	messageBoardId: null,
	tickerId: null,
	avgTickChange: null,
	yearHigh: null,
	yearLow: null,
	lastSize: null,
	lastVolume: null,
	industry: null,
	sector: null,
	rhid: null,
	lastTradeSize: null,
	lastTradeVolume: null,
	country: null,
	realParameter: null,
	positionStamp: null,
} as CalcQuote)

let NEWSES: NewsItem = {
	id: null,
	min: null,
	symbol: null,
	api: null,
	title: null,
	summary: null,
	url: null,
	source: null,
	published: null,
	tags: null,
	stamp: null,
}

let MARKET_CALCS: MarketCalcQuote = {
	symbol: null,
	tickerId: null,
	stamp: null,
	name: null,
	wbstatus: null,
	wbstatus0: null,
	lastPrice: null,
	volume: null,
	lastStamp: null,
	change: null,
	changePercent: null,
	askPrice: null,
	askSize: null,
	bidPrice: null,
	bidSize: null,
	openPrice: null,
	closePrice: null,
	prevClose: null,
	yearHigh: null,
	yearLow: null,
	dayHigh: null,
	dayLow: null,
	turnoverRate: null,
	vibrateRatio: null,
}

export const SKIP_KEYS = ['symbol', 'circuitBreaker', 'strat', 'orderIds', 'execIds', 'action', 'prevAction', 'liveTrading', 'junk', 'name', 'type', 'rhid', 'industry', 'sector', 'wbstatus', 'wbstatus0', 'wbfastatus', 'status', 'reason', 'statusStamp', 'systemEvent', 'halted', 'haltedStamp', 'ssr', 'ssrDetail', 'ssrStamp', 'securityEvent', 'mic', 'acronym', 'exchange', 'country', 'yhtype', 'newsStamp', 'messageBoardId', 'tickerId', 'eodVolume', 'listDate']

export const RMAP = {
	LOGS: Object.keys(LOGS),
	HISTS: Object.keys(HISTS),
	TINYS: Object.keys(TINYS),
	SMALLS: Object.keys(SMALLS),
	LIVES: Object.keys(LIVES),
	CALCS: Object.keys(CALCS),
	NEWSES: Object.keys(NEWSES),
	MARKET_CALCS: Object.keys(MARKET_CALCS),
	SORTED: Object.keys(CALCS).filter(function(key) {
		if (SKIP_KEYS.indexOf(key) >= 0) return false;
		return true
	}),
	STDEVS: Object.keys(CALCS).filter(function(key) {
		if (SKIP_KEYS.concat(['listDate']).indexOf(key) >= 0) return false;
		if (key.toLowerCase().indexOf('stamp') >= 0) return false;
		return true
	}),
}





export const MARKETS = [
	{ name: 'S&P 500', symbol: 'INX', tickerId: 913354362 },
	{ name: 'Dow Jones Industrial', symbol: 'DJI', tickerId: 913353822 },
	{ name: 'NASDAQ Composite', symbol: 'IXIC', tickerId: 913354090 },

	{ name: 'S&P 500 Futures', symbol: 'ESc1', tickerId: 925117631 },
	{ name: 'Dow Jones Futures', symbol: '1YMc1', tickerId: 925147804 },
	{ name: 'NASDAQ Futures', symbol: 'NQc1', tickerId: 925117622 },

	{ name: 'Market Volatility', symbol: 'VIX', tickerId: 925323875 },
	{ name: 'VIX Inverse Short Term', symbol: 'XIV', tickerId: 913246081 },
	{ name: 'VIX Short Term', symbol: 'VXX', tickerId: 913247456 },

	{ name: 'BitCoin USD', symbol: 'BTCUSD', tickerId: 913420438 },
	{ name: 'Gold USD', symbol: 'XAUUSD', tickerId: 913420437 },
	{ name: 'Silver USD', symbol: 'XAGUSD', tickerId: 925281086 },

	{ name: 'Crude Oil Continuation', symbol: 'CLc1', tickerId: 913401180 },
	{ name: 'Gold Continuation', symbol: 'GCc2', tickerId: 913400665 },
	{ name: 'Silver Continuation', symbol: 'SIc2', tickerId: 913400801 },

	{ name: '10yr Bond Interest Rate', symbol: 'TNX', tickerId: 925353445 },
	{ name: '30yr Bond Interest Rate', symbol: 'TYX', tickerId: 925377763 },
	{ name: 'Interest Rate Volatility', symbol: 'SRVIX', tickerId: 925377851 },

	// { name: 'Copper Continuation 2', symbol: 'HGc2', tickerId: 913400716 },
	// { name: 'Russell 2000', symbol: 'RUT', tickerId: 925343903 },
] as Array<MarketCalcQuote>
export const MARKETS_SYMBOLS = MARKETS.mapFast(v => v.symbol)
export const MARKETS_FSYMBOLS = MARKETS.mapFast(v => { return { symbol: v.symbol, tickerid: v.tickerId } as FullSymbol })





/*===============================
=            METRICS            =
===============================*/

declare global {

	interface MetricOpts {
		index: number
		key: string
		rkey: string
		lrkey1s: string
		lrkey1m: string
		lrkey1h: string
		name: string
		type: string
		category: string
		desc: string
		sums: MetricData
		avgs: MetricData
	}

	interface MetricData {
		[key: string]: number
	}
	interface MetricIdatas {
		[instance: string]: MetricData
	}
	interface MetricItem extends MetricOpts {
		idatas: MetricIdatas
	}

}

export const METRICS = {

	/*=====  STORAGE  ======*/
	storage_calcs: {
		category: 'watchers',
		name: 'Storage',
		desc: 'Calcs Meter',
	} as MetricOpts,
	storage_lives: {
		category: 'watchers',
		name: 'Storage',
		desc: 'Lives Meter',
	} as MetricOpts,

	/*=====  NEWS  ======*/
	// news_anomaly: {
	// 	category: 'watchers',
	// 	name: 'News',
	// 	desc: 'Anomaly',
	// } as MetricOpts,
	// news_totals: {
	// 	category: 'watchers',
	// 	name: 'News',
	// 	desc: 'Totals',
	// } as MetricOpts,
	// ms_stdevs_histogram: {
	// 	category: 'watchers',
	// 	name: 'Stdevs',
	// 	desc: 'syncStdevs() Duration',
	// } as MetricOpts,

	/*=====  REDIS  ======*/
	redis_pipeline_meter: {
		category: 'adapters',
		name: 'Redis',
		desc: 'Pipeline Meter',
	} as MetricOpts,
	redis_pipeline_histogram: {
		category: 'adapters',
		name: 'Redis',
		desc: 'Pipeline Duration',
	} as MetricOpts,

	// /*=====  METRICS  ======*/
	// metrics_meter: {
	// 	category: 'system',
	// 	name: 'Metrics',
	// 	desc: 'Meter',
	// } as MetricOpts,

	/*=====  PROFILING  ======*/
	// profiling_meter: {
	// 	category: 'system',
	// 	name: 'Profiling',
	// 	desc: 'Functions Executed',
	// } as MetricOpts,

	/*=====  MEMORY  ======*/
	memory: {
		category: 'system',
		name: 'Memory',
	} as MetricOpts,

	/*=====  CPU  ======*/
	cpu: {
		category: 'system',
		name: 'CPU',
	} as MetricOpts,

	/*=====  GC  ======*/
	gc: {
		category: 'system',
		name: 'Garbage Collection',
	} as MetricOpts,
	gc_meter: {
		category: 'system',
		name: 'Garbage Collection',
		desc: 'Times Collected',
	} as MetricOpts,
	gc_histogram: {
		category: 'system',
		name: 'Garbage Collection',
		desc: 'Duration',
	} as MetricOpts,

	/*=====  AXIOS  ======*/
	axios_meter: {
		category: 'network',
		name: 'Axios',
		desc: 'Requests',
	} as MetricOpts,
	axios_errors_meter: {
		category: 'network',
		name: 'Axios',
		desc: 'Errors',
	} as MetricOpts,

	/*=====  HTTP  ======*/
	// http_inbound_meter: {
	// 	category: 'network',
	// 	name: 'Inbound HTTP',
	// 	desc: 'Rate',
	// } as MetricOpts,
	// http_inbound_latency: {
	// 	category: 'network',
	// 	name: 'Inbound HTTP',
	// 	desc: 'Latency',
	// } as MetricOpts,
	// http_inbound_errors: {
	// 	category: 'network',
	// 	name: 'Inbound HTTP',
	// 	desc: 'Errors',
	// } as MetricOpts,

	// http_outbound_meter: {
	// 	category: 'network',
	// 	name: 'Outbound HTTP',
	// 	desc: 'Rate',
	// } as MetricOpts,
	// http_outbound_latency: {
	// 	category: 'network',
	// 	name: 'Outbound HTTP',
	// 	desc: 'Latency',
	// } as MetricOpts,
	// http_outbound_errors: {
	// 	category: 'network',
	// 	name: 'Outbound HTTP',
	// 	desc: 'Errors',
	// } as MetricOpts,

	/*=====  EVENT LOOP  ======*/
	eventloop: {
		category: 'system',
		name: 'Event Loop',
		desc: 'Five Second Latency',
	} as MetricOpts,
	loop: {
		category: 'system',
		name: 'Event Loop',
		desc: 'One Minute Timing',
	} as MetricOpts,

}
// export const METRICS_ITEMS = Object.keys(METRICS).mapFast(function(key, i) {
Object.keys(METRICS).forEachFast(function(key, i) {
	let item = METRICS[key] as MetricItem
	item.index = i
	item.key = key
	item.rkey = 'metrics:' + key
	item.lrkey1s = item.rkey + ':lives1s'
	item.lrkey1m = item.rkey + ':lives1m'
	item.lrkey1h = item.rkey + ':lives1h'
	// return item as MetricItem
})

export function calcMetricData(item: MetricItem) {
	// METRICS[item.key].type = item.type
	if (!item.sums) item.sums = {};
	if (!item.avgs) item.avgs = {};
	let alls = {} as { [key: string]: Array<number> }
	Object.keys(item.idatas).forEachFast(function(instance, i) {
		let idata = item.idatas[instance]
		if (typeof idata == 'string') {
			idata = JSON.parse(idata)
			item.idatas[instance] = idata
		}
		Object.keys(idata).forEachFast(function(key) {
			if (!alls[key]) alls[key] = [];
			alls[key].push(idata[key])
		})
	})
	Object.keys(alls).forEachFast(function(key) {
		item.sums[key] = _.sum(alls[key])
		item.avgs[key] = _.mean(alls[key])
		if (key == 'time') item.sums[key] = item.avgs[key];
		if (key == 'stamp') item.sums[key] = item.avgs[key];
	})
}

export function allMetricValues(idatas: MetricIdatas, key: string) {
	return Object.keys(idatas).mapFast(function(instance, i) {
		let idata = idatas[instance]
		return idata[key]
	})
}





/*==============================
=            QUOTES            =
==============================*/

export function calcSlopes(key: keyof TinyQuote, periods: Array<number>, tquotes: Array<TinyQuote>): Array<number> {
	if (tquotes.length < 2) return periods.mapFast(v => null);
	let stddata = standardize(tquotes.mapFast(v => v[key] as number)).mapFast((v, i) => [i, v])
	return periods.mapFast(function(period) {
		let slice = stddata.slice(stddata.length - period, stddata.length)
		if (slice.length == 0) return null;
		let linear = ecstat.regression('linear', stddata) as EChartsStat.RegressionResult<EChartsStat.LinearRegressionResult>
		return linear.parameter.gradient
	})
}

export function isJunkQuote(lastPrice: number, volumeOsc: number, marketCap: number, listDate: number, avgVolume: number, sharesOutstanding: number, sharesFloat: number) {
	if (!Number.isFinite(lastPrice) || lastPrice < 0.50) return true;
	// if (Number.isFinite(volumeOsc) && volumeOsc > 0) return false;
	// if (!!sharesOutstanding == false && !!sharesFloat == false) return false; // is an IPO
	let ago = moment().subtract(7, 'days').valueOf()
	if (Number.isFinite(listDate) && listDate > ago) return false; // could be an IPO
	if (Number.isFinite(marketCap) && marketCap < 5000000) return true;
	if (Number.isFinite(avgVolume) && avgVolume < 10000) return true;
	return false
}

export function fixSymbol(symbol: string) {
	if (!symbol) return symbol;
	return symbol.replace(/\W+/g, '').trim().toUpperCase()
}

// const FIXING_JSON = '||||'
export function fix(response: { [key: string]: any }) {
	if (!response) return;
	if (typeof response != 'object') return;
	Object.keys(response).forEachFast(function(key) {
		let v = response[key] as string
		if (typeof v == 'string' && !isNaN(<any>v) && v.match(/[^0-9.-]/) == null) {
			response[key] = Number.parseFloat(v)
		} else if (v && typeof v == 'object') {
			fix(v)
		} else if (v && typeof v == 'string' && v == 'true') {
			response[key] = true
		} else if (v && typeof v == 'string' && v == 'false') {
			response[key] = false
			// } else if (v && typeof v == 'string') {
			// 	let split = v.split(FIXING_JSON)
			// 	console.log('split', split)
			// 	if (split.pop() == FIXING_JSON) {
			// 		response[key] = JSON.parse(split.join(FIXING_JSON))
			// 	}
		}
	})
}

export function fixResponse(response: any): void {
	if (isBad(response)) return;
	Object.keys(response).forEachFast(function(k) {
		let v = response[k] as string
		if (typeof v != 'string' || v === '') return;
		if (!isNaN(v as any) && v.match(/[^0-9.-]/) == null) {
			response[k] = Number.parseFloat(v)
		} else if (['true', 'false'].indexOf(v) == 0) {
			response[k] = JSON.parse(v)
		}
	})
}



export function parseRedisInfo(info: any): any {
	let lines = info.split('\r\n')
	let results = {}
	for (let i = 0, l = info.length; i < l; i++) {
		let line = lines[i]
		if (line && line.split) {
			line = line.split(':')
			if (line.length > 1) {
				let key = line.shift()
				results[key] = line.join(':')
			}
		}
	}
	fixResponse(results)
	return results
}

// export function round(value: number, precision = 3) {
// 	if (!Number.isFinite(value)) return value;
// 	return math_round(value, precision)
// }



// export function unfix(item: { [key: string]: any }) {
// 	if (!item) return;
// 	if (typeof item != 'object') return;
// 	Object.keys(item).forEachFast(function(key) {
// 		let v = item[key]
// 		if (Array.isArray(v)) {
// 			item[key] = JSON.stringify(v) + FIXING_JSON
// 		}
// 	})
// }

export function extractInstrumentId(url: string) {
	return _.compact(url.split('/')).pop()
}

// export function isPrePost() {
// 	let day = moment().day()
// 	let hour = moment().hour()
// 	let minute = moment().minute()
// 	let isWeekend = day == 0 || day == 6
// 	return {
// 		isPre: hour >= 4 && (hour < 9 || (hour == 9 && minute < 30)) && !isWeekend,
// 		isPost: hour >= 16 && hour < 20 && !isWeekend,
// 	}
// }





export function buildMarketStamps(hours: RobinhoodMarketHours): MarketStamps {
	let stamps = { is_open: hours.is_open, date: hours.date } as MarketStamps
	if (stamps.is_open == false) {
		let start = moment().startOf('day').valueOf()
		stamps.am4 = moment(start).add(4, 'hours').valueOf()
		stamps.extopens = moment(start).add(9, 'hours').valueOf()
		stamps.opens = moment(start).add(9.5, 'hours').valueOf()
		stamps.closes = moment(start).add(16, 'hours').valueOf()
		stamps.extcloses = moment(start).add(18, 'hours').valueOf()
		stamps.pm8 = moment(start).add(20, 'hours').valueOf()
		return stamps
	}
	stamps.am4 = moment(hours.opens_at).subtract(5, 'hours').subtract(30, 'minutes').valueOf()
	stamps.extopens = moment(hours.extended_opens_at).valueOf()
	stamps.opens = moment(hours.opens_at).valueOf()
	stamps.closes = moment(hours.closes_at).valueOf()
	stamps.extcloses = moment(hours.extended_closes_at).valueOf()
	stamps.pm8 = moment(hours.closes_at).add(4, 'hours').valueOf()
	return stamps
}

export function marketState(stamp?: number): MarketState {
	if (!Number.isFinite(stamp)) stamp = now();
	let stamps = process.$marketStamps
	if (_.isEmpty(stamps)) return null;
	if (stamps.is_open == false) return 'CLOSED';
	if (stamp >= stamps.am4 && stamp < stamps.extopens) return 'PREPRE';
	if (stamp >= stamps.extopens && stamp < stamps.opens) return 'PRE';
	if (stamp >= stamps.opens && stamp < stamps.closes) return 'REGULAR';
	if (stamp >= stamps.closes && stamp < stamps.extcloses) return 'POST';
	if (stamp >= stamps.extcloses && stamp < stamps.pm8) return 'POSTPOST';
	return 'CLOSED'
}

export function isWeekend(): boolean {
	let stamps = process.$marketStamps
	if (_.isEmpty(stamps)) return null;
	return stamps.is_open == false
}

// export function dummyMarketStamps() {
// 	if (process.$marketStamps.is_open) return process.$marketStamps;
// 	let dstart = moment().startOf('day').valueOf()
// 	return {
// 		is_open: true,
// 		date: moment().format('YYYY-MM-DD'),
// 		am4: moment(dstart).add(4, 'hours').valueOf(),
// 		am415: moment(dstart).add(4, 'hours').add(15, 'minutes').valueOf(),
// 		extopens: moment(dstart).add(9, 'hours').valueOf(),
// 		opens: moment(dstart).add(9, 'hours').add(30, 'minutes').valueOf(),
// 		closes: moment(dstart).add(16, 'hours').valueOf(),
// 		extcloses: moment(dstart).add(18, 'hours').valueOf(),
// 		pm8: moment(dstart).add(20, 'hours').valueOf(),
// 	}
// }



// export function stquoteToLiveQuote(stquote: StockTwitsQuote): LiveQuote {
// 	if (!stquote || Object.keys(stquote).length == 0) return stquote as any;
// 	let lquote = {} as LiveQuote
// 	if (stquote.message || stquote.type == 'error' || !stquote.datetime) return lquote;

// 	if (stquote.symbol) lquote.symbol = stquote.symbol;
// 	if (Number.isFinite(stquote.volume)) lquote.volume = stquote.volume;
// 	// if (Number.isFinite(stquote.high)) lquote.highPrice = stquote.high;
// 	// if (Number.isFinite(stquote.low)) lquote.lowPrice = stquote.low;
// 	// if (Number.isFinite(stquote.open)) lquote.openPrice = stquote.open;
// 	// if (Number.isFinite(stquote.previousclose)) lquote.previousClose = stquote.previousclose;

// 	let stdatetime = new Date(stquote.datetime)
// 	let stextdatetime = new Date(stquote.datetime)
// 	if (stquote.easterndatetime) {
// 		stdatetime = new Date(stquote.easterndatetime)
// 	}
// 	if (stquote.easternextendedhoursdatetime) {
// 		stextdatetime = new Date(stquote.easternextendedhoursdatetime)
// 	}
// 	lquote.lastStamp = stdatetime.valueOf()

// 	if (Number.isFinite(stquote.last)) lquote.lastPrice = stquote.last;
// 	if (stquote.extendedhourstype) {
// 		let today = moment().toISOString().split('T')[0]
// 		let datetime = moment(stdatetime).toISOString().split('T')[0]
// 		let isPre = stquote.extendedhourstype == 'PreMarket' && today != datetime
// 		let hour = moment().hour()
// 		let minute = moment().minute()
// 		let isPost = hour >= 16 && hour < 20
// 		if (isPre || isPost) {
// 			lquote.lastPrice = stquote.extendedhoursprice
// 			lquote.lastStamp = moment(stquote.extendedhoursdatetime).valueOf()
// 		} else if ((hour >= 20) || (hour <= 9 && minute < 30)) {
// 			lquote.lastStamp = Date.now()
// 		}
// 	}
// 	return lquote
// }

// export function fixStquote(stquote: StockTwitsQuote) {
// 	Object.keys(stquote).forEachFast(function(key) {
// 		let v = stquote[key]
// 		delete stquote[key]
// 		stquote[key.toLowerCase()] = v
// 	})
// }



export function wbParseChartResponse(chart: WebullTickerMinutesChart): Array<TinyQuote> {
	if (_.isEmpty(chart.data)) return [];
	let tquotes = [] as Array<TinyQuote>
	chart.data.forEachFast(function(data) {
		tquotes = tquotes.concat(data.tickerMinutes.mapFast(function(minute) {
			let msplit = minute.split(',').mapFast(v => Number.parseFloat(v))
			return { lastStamp: msplit[0] * 1000, lastPrice: msplit[1], size: msplit[2] } as TinyQuote
		}))
	})
	return tquotes
}

export const wbstatusdict = {
	A: 'After-Hours',
	B: 'Closed',
	C: 'Pre-Opening',
	D: 'Closed',
	E: 'Closed',
	F: 'Pre-Market',
	H: 'Closed',
	M: 'Closed',
	P: 'SUSPENSION',
	S: 'Closed',
	T: 'Trading',
	W: 'Closed',
}

// export const wbfastatusdict = {
// 	A: 'After Hours',
// 	F: 'Pre Market',
// }









/*=============================
=            UTILS            =
=============================*/

export function supports(data: ts.Data, grid = 10, threshold = Math.round(data.length * 0.2)) {
	let t = new ts.main(data)
	return t.supports({ grid, threshold }).mapFast(v => Number.parseFloat(v))
}

export function smoother(data: ts.Data, period = 4) {
	let t = new ts.main(data)
	t.smoother({ period })
	return t.output()
	// let output = t.output()
	// console.log('output', output)
	// output.forEachFast((v, i) => output[i][0] = data[i][0])
	// return output
}

export function forecast(data: ts.Data, opts = {} as ForecastOpts): ForecastResults {
	opts = Object.assign({ nfutures: 10, smooth: 4, degree: 15 } as ForecastOpts, opts)
	let t = new ts.main(data.slice(0))
	t.smoother({ period: opts.smooth })
	if (!t.data || !t.data[1] || !t.data[1][1]) return null;
	t.data[0][1] = t.data[1][1]

	// let analysis = t.regression_analysis({ threshold: 2 })
	// console.log('analysis', analysis)

	// let mses = t.regression_forecast_mse({
	// 	data: clone(data),
	// 	// method: 'ARMaxEntropy',
	// 	// sample: opts.degree * 2,
	// 	// degree: opts.degree,
	// 	// period: opts.period,
	// })
	// console.log('mses', mses)

	let coeffs = t.ARMaxEntropy({ degree: opts.degree })
	let pasts = t.output().slice(0)
	let fstamps = [] as Array<number>
	let futures = [] as ts.Data
	{
		let stamps = t.output().map((v, i) => v[0])
		let tdiff = _.mean(_.compact(stamps.map((v, i) => stamps[i] - stamps[i - 1])))
		let end = stamps[stamps.length - 1]
		let i: number, len = opts.nfutures
		for (i = 0; i < len; i++) {
			fstamps.push(Math.round(end + tdiff + (tdiff * i)))
		}
	}
	{
		let i: number, len = opts.nfutures
		for (i = 0; i < len; i++) {
			let fc = 0
			let ii, lenn = coeffs.length
			for (ii = 0; ii < lenn; ii++) {
				fc -= pasts[(pasts.length - 1) - ii][1] * coeffs[ii]
			}
			let insert = [fstamps[i], fc]
			pasts.push(insert)
			futures.push(insert)
		}
	}
	pasts.splice(pasts.length - opts.nfutures)
	// futures.unshift(pasts[pasts.length - 1])
	return { pasts, futures }
}

export function getStackTrace() {
	let stack = new Error('shared.getStackTrace').stack.toString()
	return stack
}

export function getDuration(tstart: number) {
	return mmoment.duration(_.round(Date.now() - tstart), 'milliseconds') + 'ms'
}

export function isBad<T>(value: T): boolean {
	return value == null || (typeof value == 'number' && !Number.isFinite(value as any))
}
if (process.CLIENT) (global as any).isBad = isBad;

export function isGood<T>(value: T): boolean {
	return !isBad(value)
}
if (process.CLIENT) (global as any).isGood = isGood;

export function repair<T>(target: T, source: T): void {
	if (_.isEmpty(source)) return;
	Object.keys(source).forEachFast(function(key) {
		let tvalue = target[key]
		let svalue = source[key]
		if (isBad(tvalue) && isGood(svalue)) target[key] = svalue;
	})
}

export function merge<T>(target: T, source: T): void {
	if (_.isEmpty(source)) return;
	Object.keys(source).forEachFast(function(key) {
		let svalue = source[key]
		if (isGood(svalue)) target[key] = svalue;
	})
}

export function difference<T>(target: T, source: T): T {
	let diff = {} as T
	if (_.isEmpty(target)) return diff;
	Object.keys(target).forEachFast(function(key) {
		let tvalue = target[key]
		let svalue = source[key]
		if (tvalue != svalue) diff[key] = tvalue;
	})
	return diff
}

export function object_compact<T>(target: T): void {
	Object.keys(target).forEachFast(function(k, i) {
		if (isBad(target[k])) _.unset(target, k);
	})
}

export function calcSlider(n: number, min: number, max: number) {
	return ((n - min) / (max - min)) * 100
}
if (process.CLIENT) (global as any).calcSlider = calcSlider;





export function calcPercentChange(end: number, start: number, symbol?: string) {
	if (!Number.isFinite(end) || !Number.isFinite(start)) {
		if (process.PRODUCTION) console.warn('calcPercentChange >' + (symbol ? ' ' + symbol + ' >' : '') + ' !end || !start', end, start, '\n', getStackTrace());
		return 0
	}
	if (start == 0) return 0;
	let percent = ((end - start) / start) * 100
	if (!Number.isFinite(percent)) return 0;
	return percent
}
if (process.CLIENT) (global as any).calcPercentChange = calcPercentChange;

export function calcRatio(end: number, start: number) {
	if (!Number.isFinite(end) || !Number.isFinite(start)) {
		if (process.PRODUCTION) console.warn('calcRatio > !end || !start', end, start, '\n', getStackTrace());
		return 1
	}
	if (start == 0) return 1;
	let ratio = end / start
	if (!Number.isFinite(ratio)) return 1;
	return ratio + 1
}
if (process.CLIENT) (global as any).calcRatio = calcRatio;

export function calcOscChange(end: number, start: number, osc = 100, symbol?: string) {
	if (!Number.isFinite(end) || !Number.isFinite(start)) {
		if (process.PRODUCTION) console.warn('calcOscChange >' + (symbol ? ' ' + symbol + ' >' : '') + ' !end || !start', end, start, '\n', getStackTrace());
		return 0
	}
	if (start == 0) return 0;
	let ratio = end / start
	if (!Number.isFinite(ratio)) return 0;
	let rs = osc - (osc / (1 + ratio))
	return (rs - (osc / 2)) * 2
}
if (process.CLIENT) (global as any).calcOscChange = calcOscChange;

export function calcOscRatio(end: number, start: number, osc = 100) {
	if (!Number.isFinite(end) || !Number.isFinite(start)) {
		if (process.PRODUCTION) console.warn('calcOscRatio > !end || !start', end, start, '\n', getStackTrace());
		return 0
	}
	if (start == 0) return 0;
	let ratio = end / start
	if (!Number.isFinite(ratio)) return 0;
	return osc - (osc / (1 + ratio))
}
if (process.CLIENT) (global as any).calcOscRatio = calcOscRatio;



// PRE
// [0,0.0001],
// [55,0.2],
// [66,1],
// y = 0e^(0.15x)
// { coefficient: 0.00006457634610641419, index: 0.14617338958440998 }
// { x: 0 - 66, y: 0 - 1 }

// POST
// [0,0.0001],
// [40,0.2],
// [48,1],
// y = 0e^(0.2x)
// { coefficient: 0.00006457634610640214, index: 0.20098841067856762 }
// { x: 0 - 48, y: 0 - 1 }

export function calcRealisticStampRange(stamp: number, parameter: Array<number>) {
	if (_.isEmpty(parameter) || _.isEmpty(_.compact(parameter))) return calcLinearStampProgress(stamp);

	let stamps = process.$marketStamps
	let sstart = moment(stamp).startOf('day').valueOf()
	let mstart = moment(stamps.date).startOf('day').valueOf()
	stamp = math_clamp(mstart + (stamp % sstart), stamps.am4, stamps.pm8)

	let y = 0 // (stamp - stamps.am4) / (stamps.pm8 - stamps.am4)
	if (stamp >= stamps.am4 && stamp < stamps.opens) {
		let x = mmoment.duration(stamp - stamps.am4, 'milliseconds').asMinutes() / 5
		y = 0.00006457634610641419 * Math.pow(Math.E, 0.14617338958440998 * x)
		y = (math_clamp(y, 0, 1) * 0.025) + 0

	} else if (stamp >= stamps.opens && stamp < stamps.closes) {
		let x = mmoment.duration(stamp - stamps.opens, 'milliseconds').asMinutes() / 5
		y = _.sum(parameter.mapFast(function(v, i) {
			if (i == 0) return v;
			if (i == 1) return v * x;
			return v * Math.pow(x, i)
		}))
		y = (math_clamp(y, 0, 1) * 0.95) + 0.025

	} else if (stamp >= stamps.closes && stamp <= stamps.pm8) {
		let x = 48 - (mmoment.duration(stamp - stamps.closes, 'milliseconds').asMinutes() / 5)
		y = 1 - (0.00006457634610640214 * Math.pow(Math.E, 0.20098841067856762 * x))
		y = (math_clamp(y, 0, 1) * 0.025) + 0.975

	}
	return math_clamp(y, 0, 1)
}
if (process.CLIENT) (global as any).calcRealisticStampRange = calcRealisticStampRange;

export function calcLinearStampProgress(stamp = now()) {
	let stamps = process.$marketStamps
	let sstart = moment(stamp).startOf('day').valueOf()
	let mstart = moment(stamps.date).startOf('day').valueOf()
	stamp = math_clamp(mstart + (stamp % sstart), stamps.am4, stamps.pm8)
	return math_clamp((stamp - stamps.am4) / (stamps.pm8 - stamps.am4), 0, 1)
}
if (process.CLIENT) (global as any).calcLinearStampProgress = calcLinearStampProgress;

export function nowMaxLives(livesInterval: number, stamp = now()) {
	let stamps = process.$marketStamps
	let opens = stamps.opens
	let closes = stamps.closes
	let intms = mmoment.duration(livesInterval, 'seconds').asMilliseconds()
	return _.round((calcLinearStampProgress(stamp) * (closes - opens)) / intms)
}
if (process.CLIENT) (global as any).nowMaxLives = nowMaxLives;

export function calcShouldBe(value: number, stamp = now()) {
	if (!Number.isFinite(value)) return value;
	return calcLinearStampProgress(stamp) * value
	// let progress = calcLinearStampProgress(stamp)
	// let shouldbe = progress * value
	// return {
	// 	value,
	// 	shouldbe,
	// 	ratio: calcRatio(value, shouldbe),
	// 	oscratio: calcOscRatio(value, shouldbe),
	// 	oscchange: calcOscChange(value, shouldbe),
	// }
}
if (process.CLIENT) (global as any).calcShouldBe = calcShouldBe;



// export function nowMaxLivesBak(livesInterval: number, stamp = now()) {
// 	let opensecs = mmoment.duration(16 - 9.5, 'hours').asSeconds() / livesInterval
// 	let allsecs = mmoment.duration(20 - 4, 'hours').asSeconds() / livesInterval
// 	let am4 = moment(stamp).startOf('day').add(4, 'hours').valueOf()
// 	let current = mmoment.duration(stamp - am4, 'milliseconds').asSeconds() / livesInterval
// 	return _.round((current / allsecs) * opensecs)
// }
// if (process.CLIENT) (global as any).nowMaxLivesBak = nowMaxLivesBak;

// export function nowMaxLives2(stamp = now()) {
// 	let am4 = process.$marketStamps.am4
// 	if (!Number.isFinite(am4)) am4 = moment(stamp).startOf('day').add(4, 'hours').valueOf();
// 	let opens = process.$marketStamps.opens
// 	if (!Number.isFinite(opens)) opens = moment(stamp).startOf('day').add(9.5, 'hours').valueOf();
// 	let closes = process.$marketStamps.closes
// 	if (!Number.isFinite(closes)) closes = moment(stamp).startOf('day').add(16, 'hours').valueOf();
// 	let pm8 = process.$marketStamps.pm8
// 	if (!Number.isFinite(pm8)) pm8 = moment(stamp).startOf('day').add(20, 'hours').valueOf();
// 	stamp = math_clamp(stamp, am4, pm8)
// 	return {
// 		closeopen: _.round(((stamp - am4) / (pm8 - am4)) * (closes - opens)) / 10000,
// 		pm8am4: _.round(((stamp - am4) / (pm8 - am4)) * (pm8 - am4)) / 10000,
// 	}
// }
// if (process.CLIENT) (global as any).nowMaxLives2 = nowMaxLives2;

// if (process.CLIENT) (global as any).calcProportion = calcProportion;





export function standardize(items: Array<number>, meanfn = 'mean', stdevfn = 'standardDeviation') {
	let mean = ss[meanfn](items)
	let stdev = ss[stdevfn](items)
	if (mean == 0 || stdev == 0) return items.mapFast(v => 0);
	return items.mapFast(v => (v - mean) / stdev)
}
if (process.CLIENT) (global as any).standardize = standardize;

export function standardizeByKey<T>(items: Array<T>, key: string, meanfn = 'mean', stdevfn = 'standardDeviation') {
	let vs = standardize(items.mapFast(v => v[key]), meanfn, stdevfn)
	items.forEachFast((v, i) => v[key] = vs[i])
	// let vs = items.mapFast(v => v[key]).filter(v => Number.isFinite(v)) as Array<number>
	// let stdevs = standardize(vs, meanfn, stdevfn)
	// let ii = 0
	// items.forEachFast(function(item) {
	// 	let value = item[key]
	// 	if (!Number.isFinite(value)) return;
	// 	item[key] = stdevs[ii]
	// 	ii++
	// })
}





declare global {
	interface AnomalyData {
		mean: number
		trend: number
		stdev: number
		anomaly: number
	}
}

export class Anomaly {

	data = { mean: 0, trend: 0, stdev: 0, anomaly: 0 } as AnomalyData

	constructor(
		private cinterval = 3,
		private tfactor = 0.1,
		private maxsize = 100,
		private m_n = 0,
		private m_oldM = 0,
		private m_newM = 0,
		private m_oldS = 0,
		private m_newS = 0,
		private t_old = null,
	) {

	}

	// debug() {
	// 	if (process.PRODUCTION) return;
	// 	if (isPrimary()) console.log('anomaly >', clc.bold(math_round(this.data.stdev * 2) + 'ms'), '>', JSON.stringify({ stdev: math_round(this.data.stdev), mean: math_round(this.data.mean), trend: math_round(this.data.trend) } as AnomalyData));
	// }

	flush() {
		this.m_n = 0
	}

	update(value: number): AnomalyData {
		this.m_n = Math.min(this.m_n + 1, this.maxsize)

		let mean = this.mean()
		let stdev = this.stdev()

		if (this.m_n === 1) {
			this.m_oldM = value
			this.m_newM = value
			this.m_oldS = 0
		} else {
			this.m_newM = this.m_oldM + (value - this.m_oldM) / this.m_n
			this.m_newS = this.m_oldS + (value - this.m_oldM) * (value - this.m_newM)
			this.m_oldM = this.m_newM
			this.m_oldS = this.m_newS
		}

		this.trend(value)

		let cistdev = this.cinterval * stdev
		let preamble = Math.abs(value - mean)
		let anomaly = preamble / cistdev

		mean = this.mean()
		stdev = this.stdev()
		let trend = this.t_old

		Object.assign(this.data, { anomaly, mean, stdev, trend })
		return this.data
	}

	private mean() {
		if (this.m_n > 0) return this.m_newM;
		return 0
	}

	private variance() {
		if (this.m_n > 1) return this.m_newS / (this.m_n - 1);
		return 0
	}

	private stdev() {
		return Math.sqrt(this.variance())
	}

	private trend(value: number) {
		if (this.t_old === null) this.t_old = value;
		let prev = this.t_old
		let tfactor = this.tfactor
		this.t_old = prev * (1 - tfactor) + tfactor * value
		return this.t_old
	}

}














export function prettyStamp(stamp: number, format = 'ddd, MMM Do YYYY, h:mm:ss a'): string {
	if (!Number.isFinite(stamp)) return stamp as any;
	return moment(stamp).format(format)
}

export function isNodejs() {
	return !!(typeof process != 'undefined' && (process as any).release && (process as any).release.name == 'node')
}

export function capitalize(s: string) {
	if (!s || !_.isString(s)) return s;
	s = s.toLowerCase()
	return [s].mapFast(ss => ss[0].toUpperCase() + ss.substr(1))[0]
}

export function math_clamp(n: number, a: number, b: number) {
	return Math.min(Math.max(n, a), b)
}

export function math_round(n: number, precision = 0) {
	if (!Number.isFinite(n)) return n;
	n = +(Math.round(n + 'e+' + precision as any) + 'e-' + precision)
	return Number.isFinite(n) ? n : 0
}
if (process.CLIENT) (global as any).math_round = math_round;



// export function parseToXid(id: string) {
// 	if (!id) return id;
// 	return id.replace(/[^a-zA-Z0-9@. ]/g, '').trim()
// }

export function decodeString(s: string) {
	// let map = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': "'" }
	// return s.replace(/&([^;]+);/g, (m, c) => map[c])
	let map = { amp: '&', lt: '<', le: '≤', gt: '>', ge: '≥', quot: '"', '#039': "'" }
	return s.replace(/&([^;]+);/g, (m, c) => map[c] || '')
}

export function parseToId(id: string, lower = false) {
	if (!_.isString(id)) return id;
	let s = id.replace(/\W+/g, '').trim()
	return lower ? s.toLowerCase() : s
}
if (process.CLIENT) (global as any).parseToId = parseToId;

export function string_clean(s: string) {
	if (isBad(s)) return s;
	return s.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s\s+/g, ' ')
}

export function string_insertAt(a: string, b: string, position: number) {
	return a.substr(0, position) + b + a.substr(position)
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

export function randomBytes(len = 8) {
	let btyes = ''
	while (btyes.length < len && len > 0) {
		let rand = Math.random()
		btyes += (rand < 0.1 ? Math.floor(rand * 100) : String.fromCharCode(Math.floor(rand * 26) + (rand > 0.5 ? 97 : 65)))
	}
	return btyes
}

export function hash(input: any): string {
	if (isBad(input)) return input;
	input = input.toString()
	let hash = 0, i, chr
	if (input.length === 0) return hash.toString();
	for (i = 0; i < input.length; i++) {
		chr = input.charCodeAt(i)
		hash = ((hash << 5) - hash) + chr
		hash |= 0
	}
	return Math.abs(hash).toString()
}

export function safeParse<T>(doc: T): T {
	if (doc == null || !_.isString(doc)) return doc;
	return JSON.parse(doc)
}

export function clone<T = any>(item: T): T {
	if (isBad(item)) return item;
	return JSON.parse(JSON.stringify(item))
}

export function moment(date = Date.now() as mmoment.MomentInput, parser?: string) {
	let mom = parser ? mmoment(date, parser) : mmoment(date)
	let offset = mom.isDST() ? -4 : -5
	return mom.utcOffset(offset, true)
}
export function now() {
	return moment(Date.now()).valueOf()
}

export function prefilledArray<T = any>(length: number, item?: T) {
	return Array.from(Array(length), (v, i) => item === undefined ? i : clone(item)) as Array<T>
}

export function getType(value: any) {
	let type = typeof value
	if (type === 'object') {
		type = value ? Object.prototype.toString.call(value).slice(8, -1) : 'null'
	}
	return type.toLowerCase()
}

export function array2object<T>(items: Array<T>, key: string) {
	return items.reduce(function(prev, curr, i) {
		prev[curr[key]] = curr
		return prev
	}, {}) as { [key: string]: T }
}





export function implodeFast(rmap: Array<string>, exploded: any): Array<any> {
	if (!exploded) return exploded;
	return rmap.mapFast(function(key) {
		let value = exploded[key]
		return Number.isFinite(value) ? _.round(value, 8) : value;
	})
}

export function implode(rmap: Array<string>, exploded: any): string {
	if (!exploded) return exploded;
	return JSON.stringify(implodeFast(rmap, exploded))
}

export function explode<T>(rmap: Array<string>, imploded: any) {
	if (!imploded) return {};
	if (_.isString(imploded)) imploded = safeParse(imploded);
	if (!Array.isArray(imploded)) return {};
	let exploded = {} as any
	imploded.forEachFast(function(v, i) {
		if (v != null && rmap[i]) exploded[rmap[i]] = v;
	})
	return exploded
}

export function implodeArraysFast(array: Array<any>) {
	if (!Array.isArray(array) || array.length == 0) return;
	let rmap = Object.keys(array[0])
	array.forEachFast(function(v, i) {
		array[i] = implode(rmap, v)
	})
	array.unshift(rmap)
}

export function explodeArraysFast(array: Array<any>) {
	if (!Array.isArray(array) || array.length == 0) return;
	let rmap = array.shift()
	array.forEachFast(function(v, i) {
		array[i] = explode(rmap, v)
	})
}

export function implodeWithArrays(item: any, keys: Array<string>) {
	if (!item) return item;
	keys.forEachFast(function(key, i) {
		let v = item[key]
		if (Array.isArray(v) && v.length > 0) {
			let rmap = Object.keys(v[0])
			item[key] = v.mapFast(vv => implode(rmap, vv))
			item[key].unshift(rmap)
		}
	})
	return item // JSON.stringify(item)
}

export function explodeWithArrays(item: any, keys: Array<string>) {
	if (!item) return item;
	keys.forEachFast(function(key, i) {
		let v = item[key]
		if (Array.isArray(v) && v.length > 0) {
			let rmap = v.shift()
			v = v.mapFast(vv => explode(rmap, vv))
			item[key] = v
		}
	})
	return item
}





export function rxMergeBuffer<T = any>(items: Array<T>, sortkey: string, findkey: string, rm = false): Array<T> {
	if (items.length == 0) return items;
	items.sort((a, b) => a[sortkey] - b[sortkey])
	items.forEachFast(function(item, i) {
		if (rm) _.unset(item, sortkey);
		let iii = items.findIndex((vv, ii) => ii < i && vv && vv[findkey] == item[findkey])
		if (iii == -1) return;
		Object.assign(items[iii], item)
		items[i] = null
	})
	items.removeFast(v => v == null)
	return items
}



export function compareSkip(from: any, to: any, filterkeys = [] as Array<string>, debug = '') {
	if (!from || Object.keys(from).length == 0) return false;
	let skip = true
	Object.keys(to).forEachFast(function(key) {
		if (skip == false) return;
		if (filterkeys.indexOf(key) >= 0) return;
		skip = from[key] == to[key]
		if (skip == false && debug && process.DEVELOPMENT) {
			console.info('compareSkip ' + debug + ' >', 'from[' + key + ']', from[key], '!=', 'to[' + key + ']', to[key])
		}
	})
	// if (skip == true) { return console.warn('skip == true') } else { console.info('skip == false') };
	return skip
}











/*==============================
=            CHARTS            =
==============================*/

// export function getYahooChart(symbol: string): Promise<Array<HistQuote>> {
// 	return axios.default.get('https://query' + _.random(1, 2) + '.finance.yahoo.com/v8/finance/chart/' + symbol, {
// 		params: {
// 			range: '1d',
// 			interval: '1m',
// 			includePrePost: true,
// 			indicators: 'quote',
// 			includeTimestamps: 'true',
// 			corsDomain: 'finance.yahoo.com',
// 		},
// 	}).then(function({ data }: { data: YahooChartResponse }) {
// 		if (!(data && data.chart && Array.isArray(data.chart.result))) {
// 			return Promise.reject('!Array.isArray(data.chart.result)');
// 		}
// 		let results = [] as Array<HistQuote>
// 		let result = data.chart.result[0]
// 		let stamps = result.timestamp
// 		if (!stamps) return Promise.reject('!stamps');
// 		let quotes = result.indicators.quote[0]
// 		stamps.forEachFast(function(stamp, i) {
// 			if (!Number.isFinite(quotes.close[i])) return;
// 			results.push({
// 				open: quotes.open[i],
// 				close: quotes.close[i],
// 				high: quotes.high[i],
// 				low: quotes.low[i],
// 				size: quotes.volume[i],
// 				stamp: stamp * 1000,
// 			})
// 		})
// 		results.sort((a, b) => a.stamp - b.stamp)
// 		return Promise.resolve(results)

// 	})
// }



export function parseGoogleChartCSV(response: string): Array<HistQuote> {
	if (!response) return [];
	let rows = response.split('\n')
	if (rows[rows.length - 1] == '') rows.pop();
	if (rows.length <= 6) return [];

	let delta = Number.parseInt(rows.find(v => v.indexOf('INTERVAL') == 0).split('=').pop()) * 1000
	let cols = rows.find(v => v.indexOf('COLUMNS') == 0).split('=').pop().split(',')
	cols.forEachFast(function(v, i) {
		if (v == 'DATE') return cols[i] = 'stamp';
		cols[i] = v.toLowerCase()
	})
	rows.splice(0, rows.findIndex(v => v.indexOf('a1') == 0))

	let results = [] as Array<HistQuote>
	let tbase: number
	rows.forEachFast(function(row) {
		let srow = row.split(',')
		let row0 = srow[0]
		if (row0.indexOf('a1') == 0) {
			tbase = Number.parseInt(row0.substring(1)) * 1000
			srow[0] = '0'
		}
		let insert = {} as HistQuote
		srow.forEachFast(function(v, i) {
			let n = Number.parseFloat(v)
			let col = cols[i]
			if (col == 'stamp') {
				n = tbase + (delta * n)
			}
			insert[col] = n
		})
		if (!Number.isFinite(insert.stamp)) return;
		results.push(insert)
	})
	results.sort((a, b) => a.stamp - b.stamp)
	return results
}



/*=============================
=            ENUMS            =
=============================*/

export const IB_ACTIONS = {
	buy: 'BUY',
	sell: 'SELL',
	short: 'SSHORT',
}

export const IB_ORDER_TYPES = {
	market: 'MKT',
	marketProtect: 'MKT PRT',
	marketToLimit: 'MTL',
	// marketIfTouched: 'MIT',
	// marketOnClose: 'MOC',
	limit: 'LMT',
	// limitIfTouched: 'LIT',
	// limitOnClose: 'LOC',
	stop: 'STP',
	stopProtect: 'STP PRT',
	stopLimit: 'STP LMT',
	// trailingStop: 'TRAIL',
	// trailingStopLimit: 'TRAIL LIMIT',
	// trailingLimitIfTouched: 'TRAIL LIT',
	// trailingMarketIfTouched: 'TRAIL MIT',
}

export const IB_TIME_IN_FORCES = {
	day: 'DAY',
	goodUntilCancelled: 'GTC',
	// goodTilCancelled: 'GTC',
	immediateOrCancel: 'IOC',
	fillOrKill: 'FOK',
	goodUntil: 'GTD',
	auction: 'AUC',
	open: 'OPG',
}



export const FUNDS = [
	{ symbol: 'RIDEX' },
	{ symbol: 'DEMSX' },
	{ symbol: 'DFEMX' },
	{ symbol: 'DFEVX' },
	{ symbol: 'ODMAX' },
	{ symbol: 'REREX' },
	{ symbol: 'DFISX' },
	{ symbol: 'DFIVX' },
	{ symbol: 'DODFX' },
	{ symbol: 'TEFRX' },
	{ symbol: 'RITEX' },
	{ symbol: 'BHYIX' },
	{ symbol: 'MWTIX' },
	{ symbol: 'RGVEX' },
	{ symbol: 'DFFGX' },
	{ symbol: 'VFIJX' },
	{ symbol: 'VAIPX' },
	{ symbol: 'VFIUX' },
	{ symbol: 'NYVTX' },
	{ symbol: 'FAIRX' },
	{ symbol: 'VFIAX' },
	{ symbol: 'YACKX' },
	{ symbol: 'RGAEX' },
	{ symbol: 'POSKX' },
	{ symbol: 'RWMEX' },
	{ symbol: 'DFLVX' },
	{ symbol: 'NEFZX' },
	{ symbol: 'BMCAX' },
	{ symbol: 'ACRNX' },
	{ symbol: 'ACINX' },
	{ symbol: 'UMMGX' },
	{ symbol: 'GSFTX' },
	{ symbol: 'UMEMX' },
	{ symbol: 'CIOZX' },
	{ symbol: 'CREEX' },
	{ symbol: 'UMLGX' },
	{ symbol: 'CMSCX' },
	{ symbol: 'CSCZX' },
	{ symbol: 'VOE' },
	{ symbol: 'VIMSX' },
	{ symbol: 'VEA' },
	{ symbol: 'DFREX' },
	{ symbol: 'VFSUX' },
	{ symbol: 'FUSRX' },
	{ symbol: 'DFSCX' },
	{ symbol: 'GTCSX' },
	{ symbol: 'VSMAX' },
	{ symbol: 'FLPSX' },
	{ symbol: 'DISVX' },
	{ symbol: 'DFSVX' },
	{ symbol: 'KDSAX' },
	{ symbol: 'DFIHX' },
	{ symbol: 'RWIEX' },
	{ symbol: 'DFGBX' },
	{ symbol: 'DFGFX' },
	{ symbol: 'HABDX' },
	{ symbol: 'MPGFX' },
	{ symbol: 'DFUSX' },
	{ symbol: 'VPMAX' },
	{ symbol: 'ROFIX' },
]

// symbols = shared.FUNDS.mapFast(v => v.symbol)
// let chunks = utils.equalChunks(symbols, process.$instances)
// symbols = chunks[process.$instance]
// console.log('symbols >')
// eyes.inspect(symbols)





// export function calcVolumePercents(from: LiveQuote, to: LiveQuote, emvmap: EodVolumesMap, fromtime?: string, totime?: string): CalcVolumes {
// 	if (!to || !from) return { deltaVolumePercent: 0, fromVolumePercent: 0, toVolumePercent: 0 };
// 	// console.info('from >')
// 	// eyes.inspect(from)
// 	// console.info('to >')
// 	// eyes.inspect(to)

// 	// console.log('from.stamp', from.stamp)
// 	// console.log('emvQuoteTime(from.stamp)', emvQuoteTime(from.stamp))
// 	// console.log('to.stamp', to.stamp)
// 	// console.log('emvQuoteTime(to.stamp)', emvQuoteTime(to.stamp))

// 	// console.log('fromtime', fromtime)
// 	// console.log('totime', totime)

// 	// console.info('emvmap >')
// 	// eyes.inspect(emvmap)

// 	let fromemvQuote = emvmap[fromtime || emvQuoteTime(from.stamp)]
// 	// console.log('fromemvQuote', fromemvQuote)
// 	let toemvQuote = emvmap[totime || emvQuoteTime(to.stamp)]
// 	// console.log('toemvQuote', toemvQuote)
// 	// console.info('fromemvQuote >')
// 	// eyes.inspect(fromemvQuote)
// 	// console.info('toemvQuote >')
// 	// eyes.inspect(toemvQuote)

// 	let fromAvgVolume = fromemvQuote.weekVolume
// 	let toAvgVolume = toemvQuote.weekVolume
// 	let avgVolumeDelta = toAvgVolume - fromAvgVolume
// 	// console.log('avgVolumeDelta', avgVolumeDelta)

// 	let fromvolume = from.volume
// 	if (fromvolume >= to.volume) fromvolume = fromemvQuote.weekVolume;
// 	let volumeDelta = to.volume - fromvolume
// 	// console.log('volumeDelta', volumeDelta)

// 	// console.warn('calcDeltaVolumePercent')
// 	// let daystart = moment(to.stamp).startOf('day').add(6, 'hours').valueOf()
// 	// let dayend = moment(to.stamp).startOf('day').add(20, 'hours').valueOf()

// 	// let fromtime = moment(math_clamp(from.stamp, daystart, dayend)).format('HH:mm')
// 	// let fromemvQuote = emvmap[fromtime]
// 	// console.log('fromemvQuote > ' + fromtime, JSON.stringify(fromemvQuote))

// 	// let totime = moment(math_clamp(to.stamp, daystart, dayend)).format('HH:mm')
// 	// let toemvQuote = emvmap[totime]
// 	// console.log('toemvQuote > ' + totime, JSON.stringify(toemvQuote))

// 	// let fromAvgVolume = fromemvQuote.weekVolume
// 	// // console.log('fromAvgVolume', fromAvgVolume)
// 	// let toAvgVolume = toemvQuote.weekVolume
// 	// // console.log('toAvgVolume', toAvgVolume)
// 	// let avgVolumeDelta = toAvgVolume - fromAvgVolume
// 	// // console.log('avgVolumeDelta', avgVolumeDelta)

// 	// let fromvolume = from.volume
// 	// if (fromvolume >= to.volume) fromvolume = fromemvQuote.weekVolume;
// 	// let volumeDelta = to.volume - fromvolume
// 	// // console.log('volumeDelta', volumeDelta)

// 	let deltaVolumePercent = calcPercentChange(volumeDelta, avgVolumeDelta)
// 	if (!Number.isFinite(deltaVolumePercent)) deltaVolumePercent = 0;
// 	// console.log('deltaVolumePercent', deltaVolumePercent)
// 	let fromVolumePercent = calcPercentChange(from.volume, fromAvgVolume)
// 	if (!Number.isFinite(fromVolumePercent)) fromVolumePercent = 0;
// 	// console.log('fromVolumePercent', fromVolumePercent)
// 	let toVolumePercent = calcPercentChange(to.volume, toAvgVolume)
// 	if (!Number.isFinite(toVolumePercent)) toVolumePercent = 0;
// 	// console.log('toVolumePercent', toVolumePercent)
// 	return { deltaVolumePercent, fromVolumePercent, toVolumePercent }
// }

// export function avgVolumesPerFiveMinutesInOneWeek(historicals: Array<RobinhoodHistorical>) {
// 	let times = {} as { [time: string]: Array<RobinhoodHistorical> }
// 	historicals.forEachFast(function(v) {
// 		let time = v.begins_at.split('T').pop()
// 		if (Array.isArray(times[time]) == false) times[time] = [];
// 		times[time].push(v)
// 	})
// 	return Object.keys(times).mapFast(function(time) {
// 		let hist = times[time]
// 		let allv = hist.mapFast(v => v.volume)
// 		return _.mean(allv)
// 	})
// }

// export function emvQuoteTime(stamp: number) {
// 	let daystart = moment(stamp).startOf('day').add(6, 'hours').valueOf()
// 	let dayend = moment(stamp).startOf('day').add(20, 'hours').valueOf()
// 	return moment(math_clamp(stamp, daystart, dayend)).format('HH:mm')
// }






// export const MARKETS = [
// 	{ name: 'S&P 500', symbol: '^GSPC' },
// 	{ name: 'Dow Jones Industrial', symbol: '^DJI' },
// 	{ name: 'NASDAQ Composite', symbol: '^IXIC' },
// 	{ name: 'Russell 2000', symbol: '^RUT' },

// 	{ name: '[Futures] S&P 500', symbol: 'ESZ17.CME' },
// 	{ name: '[Futures] Dow Jones Industrial', symbol: 'YMZ17.CBT' },
// 	{ name: '[Futures] NASDAQ Composite', symbol: 'NQZ17.CME' },
// 	{ name: '[Futures] Russell 2000', symbol: 'TFZ17.NYB' },

// 	{ name: 'Volatility S&P 500', symbol: '^VIX' },
// 	{ name: '[XIV] Reverse VIX Short Term ETF', symbol: 'XIV' },
// 	{ name: '[VXX] VIX Short Term ETF', symbol: 'VXX' },
// 	{ name: '[UVXY] 2x VIX Short Term ETF', symbol: 'UVXY' },

// 	{ name: 'Gold', symbol: 'GCZ17.CMX' },
// 	{ name: 'Silver', symbol: 'SIZ17.CMX' },
// 	{ name: 'Crude Oil', symbol: 'CLZ17.NYM' },
// 	{ name: '10 Year Bond Interest Rate', symbol: '^TNX' },

// 	{ name: 'BitCoin', symbol: 'BTCUSD=X' },
// 	{ name: 'Ethereum', symbol: 'ETHUSD=X' },
// ] as Array<MarketCalcQuote>







export function shouldTrading(cquote: CalcQuote, tquotes: Array<TinyQuote>) {
	let vprog = calcLinearStampProgress()
}



export function stratForecast(quotes: Array<FullQuote>, opts: StratForecastOpts) {
	let data = prefilledArray(6, [] as Array<DataPoint>)

	if (!opts.bkindex) opts.bkindex = quotes.length - 1;
	let fdata = quotes.slice(opts.bkindex - opts.pastticks, opts.bkindex + 1).mapFast(v => [v.lastStamp, v.lastPrice])
	let fcdata = forecast(fdata, { nfutures: opts.nfutures, degree: opts.degree, smooth: opts.smooth })
	if (!fcdata) return null;
	let offset = opts.bkindex - opts.pastticks

	fcdata.pasts.forEachFast((v, i) => data[0].push({ value: [quotes[i + offset].lastStamp, v[1]] }))
	fcdata.futures.forEachFast((v, i) => data[1].push({ value: v }))
	data[1].unshift(_.last(data[0]))

	let alls = fcdata.pasts.splice(fcdata.pasts.length - opts.nfutures, opts.nfutures).concat(fcdata.futures)
	if (alls.length <= 2) return null;
	let stddata = standardize(alls.mapFast(v => v[1])).mapFast((v, i) => [i, v])

	let findex = stddata.length - opts.nfutures
	stddata.forEachFast(function(v, i) {
		if (i < findex) data[2].push({ value: [alls[i][0], v[1]] });
		else data[3].push({ value: [alls[i][0], v[1]] });
	})
	data[3].unshift(_.last(data[2]))

	let linear = ecstat.regression('linear', stddata) as EChartsStat.RegressionResult<EChartsStat.LinearRegressionResult>
	linear.points.forEachFast((v, i) => data[4].push({ value: [alls[i][0], v[1]] }))

	let quadratic = ecstat.regression('polynomial', stddata, 2) as EChartsStat.RegressionResult
	quadratic.points.forEachFast((v, i) => data[5].push({ value: [alls[i][0], v[1]] }))

	let linearExp = linear.expression
	let linearSlope = linear.parameter.gradient
	let linearIntercept = linear.parameter.intercept
	let linearChange = calcPercentChange(alls[alls.length - 1][1], alls[0][1])
	let quadraticExp = quadratic.expression
	let quadraticFirstRoot = quadratic.parameter[2]
	let quadraticSecondRoot = quadratic.parameter[1]
	let quadraticIntercept = quadratic.parameter[0]
	let stdprices = stddata.mapFast(v => v[1])
	let sampleSkewness = ss.sampleSkewness(stdprices)
	let interquartileRange = ss.interquartileRange(stdprices)
	let rootMeanSquare = ss.rootMeanSquare(stdprices)

	let lprices = linear.points.mapFast(v => v[1])
	let linearCorrelation = stdprices.length == lprices.length ? ss.sampleCorrelation(stdprices, lprices) : null
	let linearCovariance = stdprices.length == lprices.length ? ss.sampleCovariance(stdprices, lprices) : null

	let qprices = quadratic.points.mapFast(v => v[1])
	let quadraticCorrelation = stdprices.length == qprices.length ? ss.sampleCorrelation(stdprices, qprices) : null
	let quadraticCovariance = stdprices.length == qprices.length ? ss.sampleCovariance(stdprices, qprices) : null



	let action = ''
	if (linearSlope < 0 && quadraticFirstRoot > 0) {
		action = 'sell'
	} else if (linearSlope > 0 && quadraticFirstRoot < 0) {
		action = 'buy'
	}



	return {
		action,
		data: process.PRODUCTION ? [] : data,
		linearExp,
		linearSlope,
		linearIntercept,
		linearChange,
		quadraticExp,
		quadraticFirstRoot,
		quadraticSecondRoot,
		quadraticIntercept,
		sampleSkewness,
		interquartileRange,
		rootMeanSquare,
		linearCorrelation,
		linearCovariance,
		quadraticCorrelation,
		quadraticCovariance,
	}

}





/*██████████████████████████████████
█            STRATEGIES            █
██████████████████████████████████*/



export const STRAT_WATCHERS = {



	forecast: function(results: any) {
		let action = ''
		if (results.linearSlope < 0 && results.quadraticFirstRoot > 0) {
			action = 'sell'
		} else if (results.linearSlope > 0 && results.quadraticFirstRoot < 0) {
			action = 'buy'
		}

		return { action }
	},



}



export const STRAT_RESULTS = {



	forecast: function(quotes: Array<FullQuote>, opts: StratForecastOpts) {
		let data = prefilledArray(6, [] as Array<DataPoint>)

		if (!opts.bkindex) opts.bkindex = quotes.length - 1;
		let fdata = quotes.slice(opts.bkindex - opts.pastticks, opts.bkindex + 1).mapFast(v => [v.lastStamp, v.lastPrice])
		let fcdata = forecast(fdata, { nfutures: opts.nfutures, degree: opts.degree, smooth: opts.smooth })
		if (!fcdata) return null;
		let offset = opts.bkindex - opts.pastticks

		fcdata.pasts.forEachFast((v, i) => data[0].push({ value: [quotes[i + offset].lastStamp, v[1]] }))
		fcdata.futures.forEachFast((v, i) => data[1].push({ value: v }))
		data[1].unshift(_.last(data[0]))

		let alls = fcdata.pasts.splice(fcdata.pasts.length - opts.nfutures, opts.nfutures).concat(fcdata.futures)
		if (alls.length <= 2) return null;
		let stddata = standardize(alls.mapFast(v => v[1])).mapFast((v, i) => [i, v])

		let findex = stddata.length - opts.nfutures
		stddata.forEachFast(function(v, i) {
			if (i < findex) data[2].push({ value: [alls[i][0], v[1]] });
			else data[3].push({ value: [alls[i][0], v[1]] });
		})
		data[3].unshift(_.last(data[2]))

		let linear = ecstat.regression('linear', stddata) as EChartsStat.RegressionResult<EChartsStat.LinearRegressionResult>
		linear.points.forEachFast((v, i) => data[4].push({ value: [alls[i][0], v[1]] }))

		let quadratic = ecstat.regression('polynomial', stddata, 2) as EChartsStat.RegressionResult
		quadratic.points.forEachFast((v, i) => data[5].push({ value: [alls[i][0], v[1]] }))

		let linearExp = linear.expression
		let linearSlope = linear.parameter.gradient
		let linearIntercept = linear.parameter.intercept
		let linearChange = calcPercentChange(alls[alls.length - 1][1], alls[0][1])
		let quadraticExp = quadratic.expression
		let quadraticFirstRoot = quadratic.parameter[2]
		let quadraticSecondRoot = quadratic.parameter[1]
		let quadraticIntercept = quadratic.parameter[0]
		let stdprices = stddata.mapFast(v => v[1])
		let sampleSkewness = ss.sampleSkewness(stdprices)
		let interquartileRange = ss.interquartileRange(stdprices)
		let rootMeanSquare = ss.rootMeanSquare(stdprices)

		let lprices = linear.points.mapFast(v => v[1])
		let linearCorrelation = stdprices.length == lprices.length ? ss.sampleCorrelation(stdprices, lprices) : null
		let linearCovariance = stdprices.length == lprices.length ? ss.sampleCovariance(stdprices, lprices) : null

		let qprices = quadratic.points.mapFast(v => v[1])
		let quadraticCorrelation = stdprices.length == qprices.length ? ss.sampleCorrelation(stdprices, qprices) : null
		let quadraticCovariance = stdprices.length == qprices.length ? ss.sampleCovariance(stdprices, qprices) : null

		return {
			data: process.PRODUCTION ? [] : data,
			linearExp,
			linearSlope,
			linearIntercept,
			linearChange,
			quadraticExp,
			quadraticFirstRoot,
			quadraticSecondRoot,
			quadraticIntercept,
			sampleSkewness,
			interquartileRange,
			rootMeanSquare,
			linearCorrelation,
			linearCovariance,
			quadraticCorrelation,
			quadraticCovariance,
		}

	},



}



export const STRAT_ACTIONS = {



	forecast: function(results: any) {
		let action = ''
		if (results.linearSlope < 0 && results.quadraticFirstRoot > 0) {
			action = 'sell'
		} else if (results.linearSlope > 0 && results.quadraticFirstRoot < 0) {
			action = 'buy'
		}

		return { action }
	},



}



export const STRAT_EXECUTORS = {
	last_price: { buy: 'lastPrice', sell: 'lastPrice' },
	bid_ask_price: { buy: 'bidPrice', sell: 'askPrice' },
	bid_ask_spread: { buy: 'bidSpread', sell: 'askSpread' },
} as { [executor: string]: { buy: keyof CalcQuote, sell: keyof CalcQuote } }









export class StrategyBase<O = any, R = any> {

	constructor(
		public id: string,
		public opts: O,
	) {

	}

	buildResults?(quotes: Array<CalcQuote>, bkindex?: number): R

	calcAction?(quotes: Array<CalcQuote>, results: R): R

}



declare global {
	interface StratResults {
		action?: string
		data: Array<Array<DataPoint>>
	}
	interface StratForecastOpts {
		bkindex?: number
		pastticks: number
		nfutures: number
		degree: number
		smooth: number
	}
	interface StratForecastResults extends StratResults {
		linearExp: string
		linearSlope: number
		linearIntercept: number
		linearChange: number
		quadraticExp: string
		quadraticFirstRoot: number
		quadraticSecondRoot: number
		quadraticIntercept: number
		sampleSkewness: number
		interquartileRange: number
	}
}

export class ForecastStrategy extends StrategyBase<StratForecastOpts, StratForecastResults> {

	buildResults(quotes: Array<CalcQuote>, index?: number) {
		let data = prefilledArray(6, [] as Array<DataPoint>)

		if (!Number.isFinite(index)) index = quotes.length - 1;
		let fdata = quotes.slice(index - this.opts.pastticks, index + 1).mapFast(v => [v.lastStamp, v.lastPrice])
		let fcdata = forecast(fdata, { nfutures: this.opts.nfutures, degree: this.opts.degree, smooth: this.opts.smooth })
		if (!fcdata) return null;
		let offset = index - this.opts.pastticks

		fcdata.pasts.forEachFast((v, i) => data[0].push({ value: [quotes[i + offset].lastStamp, v[1]] }))
		fcdata.futures.forEachFast((v, i) => data[1].push({ value: v }))
		data[1].unshift(_.last(data[0]))

		let alls = fcdata.pasts.splice(fcdata.pasts.length - this.opts.nfutures, this.opts.nfutures).concat(fcdata.futures)
		if (alls.length <= 2) return null;
		let stddata = standardize(alls.mapFast(v => v[1])).mapFast((v, i) => [i, v])

		let findex = stddata.length - this.opts.nfutures
		stddata.forEachFast(function(v, i) {
			if (i < findex) data[2].push({ value: [alls[i][0], v[1]] });
			else data[3].push({ value: [alls[i][0], v[1]] });
		})
		data[3].unshift(_.last(data[2]))

		let linear = ecstat.regression('linear', stddata) as EChartsStat.RegressionResult<EChartsStat.LinearRegressionResult>
		linear.points.forEachFast((v, i) => data[4].push({ value: [alls[i][0], v[1]] }))

		let quadratic = ecstat.regression('polynomial', stddata, 2) as EChartsStat.RegressionResult
		quadratic.points.forEachFast((v, i) => data[5].push({ value: [alls[i][0], v[1]] }))

		let linearExp = linear.expression
		let linearSlope = linear.parameter.gradient
		let linearIntercept = linear.parameter.intercept
		let linearChange = calcPercentChange(alls[alls.length - 1][1], alls[0][1])
		let quadraticExp = quadratic.expression
		let quadraticFirstRoot = quadratic.parameter[2]
		let quadraticSecondRoot = quadratic.parameter[1]
		let quadraticIntercept = quadratic.parameter[0]
		let stdprices = stddata.mapFast(v => v[1])
		let sampleSkewness = ss.sampleSkewness(stdprices)
		let interquartileRange = ss.interquartileRange(stdprices)

		return {
			data,
			linearExp,
			linearSlope,
			linearIntercept,
			linearChange,
			quadraticExp,
			quadraticFirstRoot,
			quadraticSecondRoot,
			quadraticIntercept,
			sampleSkewness,
			interquartileRange,
		}
	}

	calcAction(quotes: Array<CalcQuote>, results: StratForecastResults) {
		if (results.linearSlope < 0 && results.quadraticFirstRoot > 0) {
			results.action = 'buy'
		} else if (results.linearSlope > 0 && results.quadraticFirstRoot < 0) {
			results.action = 'sell'
		}
		results.data = process.PRODUCTION ? [] : results.data
		return results
	}

}














