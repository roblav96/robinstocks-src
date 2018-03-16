//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')
import logger = require('./logger')

import os = require('os')
import axios from 'axios'
import cron = require('cron')
import imetrics = require('inspector-metrics')
import rx = require('rxjs/Rx')
import redis = require('./redis')
import socket = require('./socket')





class Metric {

	static registry = new imetrics.MetricRegistry()
	static datas = {} as { [key: string]: MetricData }
	static pinstance = process.$instance.toString()

	readonly mydata = {} as MetricData

	constructor(
		public opts: MetricOpts
	) {
		Metric.datas[this.opts.key] = {}
		if (!process.$dometrics) return;
		process.ee3_private.addListener(shared.RKEY.SYS.TICK_1, () => {
			_.delay(() => this.sync(), 50)
			saveMetrics()
		})
	}

	sync?(): void

	save() {
		this.mydata.stamp = shared.now()
		Object.assign(Metric.datas[this.opts.key], this.mydata)
	}

}

if (process.$dometrics) {
	let mcoms = Object.keys(shared.METRICS).mapFast(function(key) {
		let item = shared.METRICS[key] as MetricItem
		return ['hget', item.rkey, Metric.pinstance]
	})
	redis.metrics.pipelinecoms(mcoms).then(function(resolved) {
		utils.fixPipelineFast(resolved)
		Object.keys(shared.METRICS).forEachFast(function(key, i) {
			Metric.datas[key] = shared.safeParse(resolved[i]) || {}
			_.unset(Metric.datas[key], 'p98')
			_.unset(Metric.datas[key], 'p999')
		})
	})
}

// let mcoms = []
// Object.keys(shared.METRICS).forEachFast(function(key) {
// 	let item = shared.METRICS[key] as MetricItem
// 	Metric.datas[item.key] = {}
// 	if (utils.isMaster() && process.$dometrics) mcoms.push(['del', item.rkey]);
// })
// if (mcoms.length > 0) redis.metrics.pipelinecoms(mcoms);





const saveMetrics = _.debounce(function() {
	if (!process.$dometrics) return;

	Promise.resolve().then(function() {
		let mcoms = Object.keys(shared.METRICS).mapFast(function(key) {
			let item = shared.METRICS[key] as MetricItem
			let idata = Metric.datas[key]
			// socket.emit(item.rkey, { key, idatas: { [Metric.pinstance]: idata } } as MetricItem)
			return ['hset', item.rkey, Metric.pinstance, JSON.stringify(idata)]
		}) as RedisComs

		return redis.metrics.pipelinecoms(mcoms)

	}).then(function(resolved) {
		utils.pipelineErrors(resolved)
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('saveMetrics > error', utils.peRender(error));
		return Promise.resolve()
	})

}, 100, { leading: false, trailing: true })





function saveLiveMetrics() {
	if (!utils.isMaster() || !process.$dometrics) return;

	let mskeys = Object.keys(shared.METRICS)
	Promise.resolve().then(function() {
		let mcoms = mskeys.mapFast(function(key) {
			let item = shared.METRICS[key] as MetricItem
			return ['hgetall', item.rkey]
		}) as RedisComs
		return redis.metrics.pipelinecoms(mcoms)

	}).then(function(resolved: Array<MetricIdatas>) {
		utils.fixPipelineFast(resolved)

		let stamp = shared.now()
		let mcoms = [] as RedisComs
		mskeys.forEachFast(function(key, i) {
			let idatas = resolved[i]
			if (Object.keys(idatas).length <= process.$instances) return;

			Object.keys(idatas).forEachFast(function(instance) {
				idatas[instance] = shared.safeParse(idatas[instance])
			})

			let item = {} as MetricItem
			Object.assign(item, shared.METRICS[key])
			item.idatas = idatas
			shared.calcMetricData(item)
			item.avgs.stamp = stamp

			mcoms.push(['zremrangebyrank', item.lrkey1s, 0 as any, -360 as any])
			mcoms.push(['zadd', item.lrkey1s, item.avgs.stamp as any, JSON.stringify(item.avgs)])
			if (socket.hasSubscriber(item.lrkey1s)) socket.emit(item.lrkey1s, item.avgs);

			let second = shared.moment().second()
			if (second == 0) {
				mcoms.push(['zremrangebyrank', item.lrkey1m, 0 as any, -360 as any])
				mcoms.push(['zadd', item.lrkey1m, item.avgs.stamp as any, JSON.stringify(item.avgs)])
				if (socket.hasSubscriber(item.lrkey1m)) socket.emit(item.lrkey1m, item.avgs);
			}
			let minute = shared.moment().minute()
			if (second == 0 && minute == 0) {
				mcoms.push(['zremrangebyrank', item.lrkey1h, 0 as any, -360 as any])
				mcoms.push(['zadd', item.lrkey1h, item.avgs.stamp as any, JSON.stringify(item.avgs)])
				if (socket.hasSubscriber(item.lrkey1h)) socket.emit(item.lrkey1h, item.avgs);
			}
		})
		if (mcoms.length == 0) return Promise.resolve(null);

		return redis.metrics.pipelinecoms(mcoms)

	}).then(function(resolved) {
		utils.pipelineErrors(resolved)
		return Promise.resolve()
	}).catch(function(error) {
		logger.error('saveLiveMetrics > error', utils.peRender(error));
		return Promise.resolve()
	})

}

new cron.CronJob({
	cronTime: '* * * * * *',
	start: utils.isMaster() && process.$dometrics,
	onTick: saveLiveMetrics,
	timeZone: 'America/New_York',
})





// process.ee3_private.addListener(shared.RKEY.SYS.TICK_5, function() {
// 	if (process.DEVELOPMENT) return;
// 	let coms = Object.keys(Metric.datas).mapFast(function(rkey) {
// 		return ['hset', rkey, Metric.instance, JSON.stringify(Metric.datas[rkey])]
// 	}) as RedisComs
// 	let comslen = coms.length
// 	Metric.myrkeys.forEachFast(rkey => coms.push(['hgetall', rkey]))
// 	redis.metrics.pipelinecoms(coms).then(function(resolved: Array<any>) {
// 		utils.fixPipelineFast(resolved)
// 		resolved.splice(0, comslen)
// 		if (resolved.length == 0) return;

// 		resolved.forEachFast(function(idatas, i) {
// 			Object.keys(idatas).forEachFast(k => idatas[k] = JSON.parse(idatas[k]))
// 			let rkey = Metric.myrkeys[i]
// 			let item = {} as MetricItem
// 			Object.assign(item, shared.METRICS[rkey])
// 			item.idatas = idatas
// 			shared.calcMetricData(item)
// 			socket.emit(rkey, item)
// 		})

// 	}).catch(function(error) {
// 		logger.error('save > error', error)
// 	})
// })





export class Constant extends Metric {

	constructor(opts: MetricOpts, mydata = {} as MetricData) {
		super(opts)
		opts.type = 'constant'
		this.set(mydata)
		this.sync()
	}

	sync() {
		this.save()
	}

	set(mydata: MetricData) {
		Object.assign(this.mydata, mydata)
		// this.sync()
	}

}



export class Gauge extends Metric {

	constructor(opts: MetricOpts, private fn: () => MetricData) {
		super(opts)
		opts.type = 'gauge'
		this.update()
		this.sync()
	}

	sync() {
		this.save()
	}

	update() {
		Object.assign(this.mydata, this.fn())
		// this.sync()
	}

}



export class Counter extends Metric {

	private counter = Metric.registry.newCounter(this.opts.name)

	constructor(opts: MetricOpts) {
		super(opts)
		opts.type = 'counter'
		this.sync()
	}

	sync() {
		Object.assign(this.mydata, { count: this.counter.getCount() })
		this.save()
	}

	increment(n = 1) {
		this.counter.increment(n)
		// this.sync()
	}

	decrement(n = 1) {
		this.counter.decrement(n)
		// this.sync()
	}

	reset() {
		this.counter.reset()
		// this.sync()
	}

}



export class Meter extends Metric {

	private count = 0
	private ewmas = [] as Array<imetrics.ExponentiallyWeightedMovingAverage>

	constructor(
		opts: MetricOpts,
	) {
		super(opts)
		opts.type = 'meter'
		this.ewmas.push(new imetrics.ExponentiallyWeightedMovingAverage(utils.calcAlpha(1, 1), 1, imetrics.SECOND))
		this.ewmas.push(new imetrics.ExponentiallyWeightedMovingAverage(utils.calcAlpha(5, 1), 1, imetrics.SECOND))
		this.ewmas.push(new imetrics.ExponentiallyWeightedMovingAverage(utils.calcAlpha(15, 1), 1, imetrics.SECOND))
		this.ewmas.push(new imetrics.ExponentiallyWeightedMovingAverage(utils.calcAlpha(30, 1), 1, imetrics.SECOND))
		this.ewmas.push(new imetrics.ExponentiallyWeightedMovingAverage(utils.calcAlpha(60, 1), 1, imetrics.SECOND))
		this.ewmas.forEachFast(v => v.tick())
		process.ee3_private.addListener(shared.RKEY.SYS.TICK_1, () => this.ewmas.forEachFast(v => v.tick()))
		this.sync()
	}

	sync() {
		Object.assign(this.mydata, {
			count: this.count,
			m1: this.ewmas[0].getAverage(imetrics.SECOND) * 60 * 1,
			m5: this.ewmas[1].getAverage(imetrics.SECOND) * 60 * 5,
			m15: this.ewmas[2].getAverage(imetrics.SECOND) * 60 * 15,
			m30: this.ewmas[3].getAverage(imetrics.SECOND) * 60 * 30,
			m60: this.ewmas[4].getAverage(imetrics.SECOND) * 60 * 60,
		})
		this.save()
	}

	mark(n = 1) {
		if (!Number.isFinite(n)) return;
		this.count += n
		this.ewmas.forEachFast(v => v.update(n))
		// this.sync()
	}

}



export class Histogram extends Metric {

	private histogram = Metric.registry.newHistogram(this.opts.name)

	constructor(opts: MetricOpts) {
		super(opts)
		opts.type = 'histogram'
		this.sync()
	}

	sync() {
		let snapshot = this.histogram.getSnapshot()
		Object.assign(this.mydata, {
			count: this.histogram.getCount(),
			size: snapshot.size(),
			mean: snapshot.getMean(),
			median: snapshot.getMedian(),
			stdDev: snapshot.getStdDev(),
			min: snapshot.getMin(),
			max: snapshot.getMax(),
			p75: snapshot.get75thPercentile(),
			p95: snapshot.get95thPercentile(),
			// p98: snapshot.get98thPercentile(),
			p99: snapshot.get99thPercentile(),
			// p999: snapshot.get999thPercentile(),
		})
		this.save()
	}

	update(ms: number) {
		if (!Number.isFinite(ms)) return;
		this.histogram.update(ms)
		// this.sync()
	}

}



export class Timer extends Metric {

	static nano2sec(nano: number) {
		return imetrics.NANOSECOND.convertTo(nano, imetrics.SECOND)
	}

	private timer = Metric.registry.newTimer(this.opts.name)

	constructor(opts: MetricOpts) {
		super(opts)
		opts.type = 'timer'
		this.sync()
	}

	sync() {
		let snapshot = this.timer.getSnapshot()
		Object.assign(this.mydata, {
			count: this.timer.getCount(),
			m1: this.timer.get1MinuteRate(),
			m5: this.timer.get5MinuteRate(),
			m15: this.timer.get15MinuteRate(),
			m00: this.timer.getMeanRate(),
			size: snapshot.size(),
			mean: Timer.nano2sec(snapshot.getMean()),
			median: Timer.nano2sec(snapshot.getMedian()),
			stdDev: Timer.nano2sec(snapshot.getStdDev()),
			min: Timer.nano2sec(snapshot.getMin()),
			max: Timer.nano2sec(snapshot.getMax()),
			p75: Timer.nano2sec(snapshot.get75thPercentile()),
			p95: Timer.nano2sec(snapshot.get95thPercentile()),
			// p98: Timer.nano2sec(snapshot.get98thPercentile()),
			p99: Timer.nano2sec(snapshot.get99thPercentile()),
			// p999: Timer.nano2sec(snapshot.get999thPercentile()),
		})
		this.save()
	}

	addDuration(ms: number) {
		if (!Number.isFinite(ms)) return;
		this.timer.addDuration(ms, imetrics.MILLISECOND)
		// this.sync()
	}

	// stopwatch() {
	// 	let stopwatch = this.timer.newStopWatch()
	// 	stopwatch.start()
	// 	return stopwatch
	// }

	// time(fn: () => void) {
	// 	this.timer.time(fn)
	// }

}





export class EWMA {

	private _alpha: number
	protected _total = 0
	protected _count = 0
	protected _rate = 0

	get count() { return this._count }
	get total() { return this._total }
	get rate() { return (this._rate || 0) * 1000 }

	constructor(
		protected _timePeriod = 30,
		protected _tickInterval = 1,
	) {
		this._timePeriod = this._timePeriod * 1000
		this._tickInterval = this._tickInterval * 1000
		this._alpha = 1 - Math.exp(-this._tickInterval / this._timePeriod)
		process.ee3_private.addListener(shared.RKEY.SYS.TICK_1, () => this.tick())
	}

	private tick() {
		let instrate = this._count / this._tickInterval
		this._count = 0
		this._rate += ((instrate - this._rate) * this._alpha)
	}

	update(n = 1) {
		this._count += n
		this._total += n
	}

}

// let wtfmeter = new EWMA()
// if (utils.isPrimaryNode()) {
// 	ci.setCorrectingInterval(function() {
// 		wtfmeter.update()
// 	}, 1000)

// 	ci.setCorrectingInterval(function() {
// 		console.log('wtfmeter.rate', wtfmeter.rate)
// 	}, 1337)
// }



export class SharedEWMA extends EWMA {

	constructor(public topic: string, timePeriod = 30, tickInterval = 1) {
		super(timePeriod, tickInterval)
		process.ee3_public.addListener(this.topic, n => super.update(n))
	}

	update(n = 1) {
		process.ee3_public.emit(this.topic, n)
	}

	// private _constant: Constant
	// get metric() { return this._constant }

	// set(data = {}) {
	// 	this._constant.set(Object.assign({
	// 		count: this.count,
	// 		rate: this.rate,
	// 	}, data))
	// }

	// attach(metric: Constant) {
	// 	if (this._constant) return console.warn('metric already attached');
	// 	this._constant = metric
	// }

}

// if (utils.isPrimary()) {
// 	setTimeout(function() {
// 		timeoutmeter.update(123)
// 	}, 2000)
// }





// const ms_axios_timeout = new Constant(shared.MS.ms_axios_timeout, { total: 0, timeoutrate: 0, calcrate: 0, delay: 0 })
// const timeoutmeter = new SharedEWMA('timeout:error')

const ms_axios_meter = new Meter(shared.METRICS.axios_meter)
const ms_axios_errors_meter = new Meter(shared.METRICS.axios_errors_meter)

axios.interceptors.response.use(function(response) {
	ms_axios_meter.mark()
	return response
}, function(error) {
	if (!utils.isTimeoutError(error)) {
		ms_axios_errors_meter.mark()
	}
	return Promise.reject(error)
})

// export function getHttpDelay() {
// 	let total = timeoutmeter.total
// 	let timeoutrate = timeoutmeter.rate
// 	let exp = 5
// 	let by = 1000
// 	let calcrate = Math.pow(1 + timeoutrate, exp)
// 	let delay = _.round((calcrate * by) - by)
// 	// ms_axios_timeout.set({ total, timeoutrate, calcrate, delay })
// 	// console.log('{ total, timeoutrate, exp, by, calcrate, delay }', { total, timeoutrate, exp, by, calcrate, delay })
// 	return shared.math_clamp(delay, 0, 10000)
// }





// const ms_metrics_meter = new Meter(shared.METRICS.metrics_meter)
// process.ee3_private.addListener(shared.METRICS.metrics_meter.rkey, function(count: number) {
// 	ms_metrics_meter.mark(count)
// })

const ms_redis_pipeline_meter = new Meter(shared.METRICS.redis_pipeline_meter)
process.ee3_private.addListener(shared.METRICS.redis_pipeline_meter.rkey, function(count: number) {
	ms_redis_pipeline_meter.mark(count)
})
const ms_redis_pipeline_histogram = new Histogram(shared.METRICS.redis_pipeline_histogram)
process.ee3_private.addListener(shared.METRICS.redis_pipeline_histogram.rkey, function(ms: number) {
	ms_redis_pipeline_histogram.update(ms)
})





if (process.$dometrics) {

	let profilingdisabled = true
	const appmetrics = require('appmetrics')
	const monitor = appmetrics.monitor()
	// monitor.on('initialized', function() {
	// 	appmetrics.enable('trace')
	// 	monitor.on('trace', function(trace) {
	// 		console.info('trace >')
	// 		eyes.inspect(trace)
	// 	})
	// 	appmetrics.enable('requests')
	// 	monitor.on('requests', function(requests) {
	// 		console.info('requests >')
	// 		eyes.inspect(requests)
	// 	})
	// })

	// if (utils.isMaster()) redis.del(shared.RKEY.PROFILING + ':' + process.$env);
	// const ms_profiling_meter = new Meter(shared.MS.ms_profiling_meter)
	// appmetrics.enable('profiling')
	// profilingdisabled = false
	// monitor.on('profiling', function(profiling: AppmetricsProfiling) {
	// 	let ii = 0
	// 	let idict = {} as any
	// 	let rkey = shared.RKEY.PROFILING + ':' + process.$env
	// 	let coms = [] as RedisComs
	// 	profiling.functions.forEachFast(function(v) {
	// 		if (v.file.indexOf('server/dist') == -1) return;
	// 		v.file = v.file.split('server/dist').pop()
	// 		let id = utils.buildId(v.file + v.line + v.name)
	// 		if (_.gt(v.count, 0)) coms.push(['hincrby', rkey, id + ':count', v.count as any]);
	// 		coms.push(['hincrby', rkey, id + ':calls', 1 as any])
	// 		idict[id + ':item'] = { id, file: v.file, line: v.line, name: v.name } as ProfilingItem
	// 		ii++
	// 	})
	// 	if (ii > 0) ms_profiling_meter.mark(ii);
	// 	if (_.isEmpty(idict)) return;
	// 	coms.push(['hmset', rkey, utils.tohset(idict)])
	// 	redis.pipelinecoms(coms)
	// })
	// // process.ee3_private.addListener(shared.RKEY.SYS.TICK_5, function() { global.gc() }) // for the possible memory leak

	const ms_memory = new Constant(shared.METRICS.memory)
	appmetrics.enable('memory')
	monitor.on('memory', function(memory) {
		ms_memory.set(memory)
		// if (profilingdisabled == false && memory.physical > 536870912) { // 512 MB
		// 	appmetrics.disable('profiling')
		// 	profilingdisabled = true
		// }
	})

	const ms_cpu = new Constant(shared.METRICS.cpu)
	appmetrics.enable('cpu')
	monitor.on('cpu', function(cpu) {
		ms_cpu.set(cpu)
	})

	let ms_gc = new Constant(shared.METRICS.gc)
	let ms_gc_meter = new Meter(shared.METRICS.gc_meter)
	let ms_gc_histogram = new Histogram(shared.METRICS.gc_histogram)
	appmetrics.enable('gc')
	monitor.on('gc', function(gc) {
		_.unset(gc, 'type')
		ms_gc.set(gc)
		ms_gc_meter.mark()
		ms_gc_histogram.update(gc.duration)
	})

	// const ms_http_inbound_meter = new Meter(shared.METRICS.http_inbound_meter)
	// const ms_http_inbound_errors = new Meter(shared.METRICS.http_inbound_errors)
	// const ms_http_inbound_latency = new Histogram(shared.METRICS.http_inbound_latency)
	// appmetrics.enable('http')
	// monitor.on('http', function(inbound) {
	// 	if (inbound.url.indexOf(process.$host) >= 0) return;
	// 	// console.info('inbound >')
	// 	// eyes.inspect(inbound)
	// 	ms_http_inbound_meter.mark()
	// 	if (Number.isFinite(inbound.statusCode) && inbound.statusCode != 200) ms_http_inbound_errors.mark();
	// 	ms_http_inbound_latency.update(inbound.duration)
	// })

	// const ms_http_outbound_meter = new Meter(shared.METRICS.http_outbound_meter)
	// const ms_http_outbound_errors = new Meter(shared.METRICS.http_outbound_errors)
	// const ms_http_outbound_latency = new Histogram(shared.METRICS.http_outbound_latency)
	// appmetrics.enable('http-outbound')
	// monitor.on('http-outbound', function(outbound) {
	// 	if (outbound.url.indexOf(process.$host) >= 0) return;
	// 	// console.info('outbound >')
	// 	// eyes.inspect(outbound)
	// 	ms_http_outbound_meter.mark()
	// 	if (Number.isFinite(outbound.statusCode) && outbound.statusCode != 200) ms_http_outbound_errors.mark();
	// 	ms_http_outbound_latency.update(outbound.duration)
	// })

	const ms_loop = new Constant(shared.METRICS.loop)
	appmetrics.enable('loop')
	monitor.on('loop', function(loop) {
		ms_loop.set(loop)
	})

	const ms_eventloop = new Constant(shared.METRICS.eventloop)
	appmetrics.enable('eventloop')
	monitor.on('eventloop', function(eventloop) {
		Object.assign(eventloop, eventloop.latency)
		_.unset(eventloop, 'latency')
		ms_eventloop.set(eventloop)
	})

	// appmetrics.enable('redis')
	// monitor.on('redis', function(redis) {
	// 	console.info('redis >')
	// 	eyes.inspect(redis)
	// })

}



// const rxProfiling = new rx.Subject<ProfilingItem>()
// rxProfiling.buffer(rx.Observable.fromEvent(process.ee3_private, shared.RKEY.SYS.TICK_1)).map(function(items) {
// 	if (_.isEmpty(items)) return items;
// 	items.forEachFast(function(item, i) {
// 		let iii = items.findIndex((vv, ii) => ii < i && vv && vv.id == item.id)
// 		if (iii == -1) return;
// 		items[iii].count = _.sum([items[iii].count, item.count])
// 		items[iii].calls++
// 		items[i] = null
// 	})
// 	let i: number, len = items.length
// 	for (i = len; i--;) {
// 		if (!items[i]) items.splice(i, 1)
// 	}
// 	return items
// }).subscribe(function(items) {
// 	if (_.isEmpty(items)) return;

// 	let hash = {} as any
// 	// let rkey = process.PRODUCTION ? shared.RKEY.PROFILING : shared.RKEY.PROFILING + ':' + process.$env;
// 	let rkey = shared.RKEY.PROFILING + ':' + process.$env
// 	let coms = [] as RedisComs
// 	items.forEachFast(function(item) {
// 		let count = item.count
// 		_.unset(item, 'count')
// 		if (count > 0) coms.push(['hincrby', rkey, item.id + ':count', count as any]);
// 		let calls = item.calls
// 		_.unset(item, 'calls')
// 		if (calls > 0) coms.push(['hincrby', rkey, item.id + ':calls', calls as any])
// 		hash[item.id + ':item'] = item
// 	})
// 	coms.push(['hmset', rkey, utils.tohset(hash)])
// 	redis.pipelinecoms(coms)

// })
















































