//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')
import logger = require('../adapters/logger')

import cron = require('cron')
import moment = require('moment')
import ss = require('simple-statistics')
import redis = require('../adapters/redis')
import socket = require('../adapters/socket')
import robinhood = require('../adapters/robinhood')
import storage = require('../adapters/storage')



export const sewmas = {} as { [symbol: string]: SymbolEWMAs }

export function initSymbols(symbols: Array<string>): Promise<void> {
	symbols.forEachFast(v => sewmas[v] = new SymbolEWMAs(v))
	return SymbolEWMAs.init()
}





class SymbolEWMAs {

	static init(): Promise<void> {
		return SymbolEWMAs.load().then(function() {
			return SymbolEWMAs.save(null, true)
		}).then(function() {
			// process.ee3_private.addListener(shared.RKEY.SYS.TICK_10, SymbolEWMAs.assign)
			process.ee3_private.addListener(shared.RKEY.SYS.TICK_5, SymbolEWMAs.save)
			return Promise.resolve()
		})
	}

	// static assign(i: number) {
	// 	if (shared.marketState() == 'CLOSED' && process.PRODUCTION) return;
	// 	let symbols = utils.equalChunks(Object.keys(sewmas), 6)[i % 6]
	// 	let ccoms = symbols.mapFast(function(symbol) {
	// 		let sewma = sewmas[symbol]
	// 		let cquote = { symbol } as CalcQuote
	// 		sewma.assign(cquote)
	// 		let crkey = shared.RKEY.CALCS + ':' + symbol
	// 		return ['hmset', crkey, utils.tohset(cquote)]
	// 	})
	// 	redis.calcs.pipelinecoms(ccoms).then(function(resolved) {
	// 		utils.pipelineErrors(resolved)
	// 		return Promise.resolve()
	// 	})
	// }

	static load(): Promise<void> {
		return Promise.resolve().then(function() {
			let coms = [] as RedisComs
			Object.keys(sewmas).forEachFast(function(symbol) {
				let sewma = sewmas[symbol]
				sewma.cewmas.forEachFast(function(cewma) {
					coms.push(['hgetall', shared.RKEY.EWMAS + ':' + symbol + ':' + cewma.name])
				})
			})
			return redis.main.pipelinecoms(coms)

		}).then(function(resolved) {
			utils.fixPipelineFast(resolved)
			let iii = 0
			Object.keys(sewmas).forEachFast(function(symbol) {
				sewmas[symbol].cewmas.forEachFast(function(cewma) {
					let data = utils.fromhget(resolved[iii])

					if (Array.isArray(data.ewmas)) {
						data.ewmas = (data.ewmas as Array<any>).mapFast(v => shared.explode(shared.EWMAS.RMAPS.EWMA, v))
					}
					if (Array.isArray(data.others)) {
						data.others = shared.explode(shared.EWMAS.RMAPS.OTHERS, data.others)
					}

					cewma.ewmas = shared.EWMAS.PERIODS.mapFast(function(period, i) {
						let dataewmas = data.ewmas as Array<any>
						if (!Array.isArray(dataewmas) || _.isEmpty(dataewmas[i])) {
							return new utils.EWMA(period)
						}
						return new utils.EWMA(period, dataewmas[i].sum, dataewmas[i].avg)
					})

					cewma.smas = shared.EWMAS.SMAS.mapFast(function(period, i) {
						let datasmas = data.smas as Array<number>
						if (!Array.isArray(datasmas)) {
							return new utils.SMA(period)
						}
						return new utils.SMA(period, datasmas[i])
					})

					cewma.slps = shared.EWMAS.SLPS.mapFast(function(period, i) {
						let dataslps = data.slps as Array<number>
						if (!Array.isArray(dataslps)) {
							return new utils.Slope(period)
						}
						return new utils.Slope(period, dataslps[i])
					})

					if (!_.isEmpty(data.others)) {
						Object.keys(shared.EWMAS.OTHERS).forEachFast(function(key) {
							if (Number.isFinite(data.others[key])) cewma.others[key] = data.others[key];
						})
					}

					if (Array.isArray(data.values)) cewma.values = data.values;

					iii++
				})
			})
			return Promise.resolve()
		})
	}

	static save(i: number, force = false): Promise<void> {
		if (force == false && shared.marketState() == 'CLOSED' && process.PRODUCTION) return Promise.resolve();

		return Promise.resolve().then(function() {
			let symbols = Object.keys(sewmas)
			if (force == false) symbols = utils.equalChunks(symbols, 3)[i % 3];

			let coms = [] as RedisComs
			symbols.forEachFast(function(symbol) {
				let sewma = sewmas[symbol]
				sewma.cewmas.forEachFast(function(cewma) {
					let rkey = shared.RKEY.EWMAS + ':' + symbol + ':' + cewma.name

					let data = cewma.data()
					data.ewmas = data.ewmas.mapFast(v => shared.implodeFast(shared.EWMAS.RMAPS.EWMA, v)) as any
					data.others = shared.implodeFast(shared.EWMAS.RMAPS.OTHERS, data.others) as any
					// data.smas = data.smas.mapFast(function(v) {
					// 	return Number.isFinite(v) ? _.round(v, 8) : v
					// })
					data.smas = data.smas.mapFast(v => _.round(v, 8))
					data.slps = data.slps.mapFast(v => _.round(v, 8))
					data.values = data.values.mapFast(v => _.round(v, 8))

					coms.push(['hmset', rkey, utils.tohset(data)])
				})
			})
			if (process.DEVELOPMENT) {
				// console.info('save > coms.splice')
				coms.splice(0)
			}
			return redis.main.pipelinecoms(coms).then(function(resolved) {
				utils.pipelineErrors(resolved)
				return Promise.resolve()
			})

		})
	}

	private cewmas = ewmacalcs.mapFast((v, i) => {
		let cewma = new v(this.symbol)
		if (cewma.name != shared.EWMAS.NAMES[i]) console.error('cewma.name != shared.EWMAS.NAMES[i]', cewma.name, shared.EWMAS.NAMES[i]);
		return cewma
	}) as Array<CalcEWMA>

	constructor(public symbol: string) { }

	flush() {
		this.cewmas.forEachFast(v => v.flush())
	}

	compute(cquote: CalcQuote, lquote: LiveQuote) {
		if (shared.marketState() == 'CLOSED' && process.PRODUCTION) return;
		this.cewmas.forEachFast(v => v.compute(cquote, lquote))
		this.assign(cquote)
	}

	assign(cquote: CalcQuote) {
		this.cewmas.forEachFast(cewma => shared.merge(cquote, cewma.quote()))
	}

}





class CalcEWMA {

	name: string
	compute?(cquote: CalcQuote, lquote: LiveQuote): void

	ewmas = [] as Array<utils.EWMA>
	smas = [] as Array<utils.SMA>
	slps = [] as Array<utils.Slope>
	values = [] as Array<number>
	others = Object.assign({}, shared.EWMAS.OTHERS)
	reset = false

	constructor(public symbol: string) {

	}

	data() {
		return {
			ewmas: this.ewmas.mapFast(v => v.data()),
			smas: this.smas.mapFast(v => v.data()),
			slps: this.slps.mapFast(v => v.data()),
			others: this.others,
			values: this.values,
		}
	}

	flush() {
		this.ewmas.forEachFast(v => v.flush())
		this.others.total = 0
		if (this.reset) {
			this.smas.forEachFast(v => v.flush())
			this.slps.forEachFast(v => v.flush())
			Object.assign(this.others, shared.EWMAS.OTHERS)
			this.values = []
		}
	}

	quote() {
		let quote = {} as any
		this.ewmas.forEachFast(ewma => {
			quote[this.name + '_ewma_' + ewma.period] = ewma.rate()
		})
		this.smas.forEachFast(sma => {
			quote[this.name + '_sma_' + sma.period] = sma.mean
		})
		this.slps.forEachFast(slp => {
			quote[this.name + '_slp_' + slp.period] = slp.slope
		})
		Object.keys(this.others).forEachFast(key => {
			quote[this.name + '_other_' + key] = this.others[key]
		})
		return quote
	}

	update(value: number) {
		if (shared.marketState() == 'CLOSED' && process.PRODUCTION) return;
		if (!Number.isFinite(value)) return;

		let previous = this.others.value
		this.others.value = value
		this.others.total += value

		this.ewmas.forEachFast(function(v) {
			v.update(value)
			v.tick()
		})
		this.smas.forEachFast(function(v) {
			v.update(value)
		})

		this.values.push(value)
		this.values.splice(0, _.max([this.values.length - shared.backRange, 0]))

		if (this.values.length > 2) {
			let std = shared.standardize(this.values)
			// if (std.length > 2) this.others.skewness = ss.sampleSkewness(std);
			let stddata = std.mapFast((v, i) => [i, v])
			this.slps.forEachFast(function(v) {
				v.update(stddata)
			})
		}

	}

}





const ewmacalcs = [

	class Price extends CalcEWMA {
		name = 'price'
		compute(cquote: CalcQuote, lquote: LiveQuote) {
			let change = shared.calcPercentChange(cquote.lastPrice, lquote.lastPrice, cquote.symbol)
			this.update(change)
		}
	},

	class Size extends CalcEWMA {
		name = 'size'
		compute(cquote: CalcQuote, lquote: LiveQuote) {
			let avgsize = cquote.volume / cquote.count
			let size = shared.calcOscRatio(cquote.size, avgsize, 2)
			this.update(size)
		}
	},

	class TradeSize extends CalcEWMA {
		name = 'tradesize'
		compute(cquote: CalcQuote, lquote: LiveQuote) {
			this.update(cquote.tradeFlowSize)
		}
	},

	class TradeVolume extends CalcEWMA {
		name = 'tradevolume'
		reset = true
		compute(cquote: CalcQuote, lquote: LiveQuote) {
			this.update(cquote.tradeFlowVolume)
		}
	},

	class Velocity extends CalcEWMA {
		name = 'velocity'
		compute(cquote: CalcQuote, lquote: LiveQuote) {
			let change = shared.calcPercentChange(cquote.lastPrice, lquote.lastPrice, cquote.symbol)
			let avgsize = cquote.volume / cquote.count
			let size = shared.calcOscRatio(cquote.size, avgsize, 2)
			this.update(change * size)
		}
	},

]







new cron.CronJob({
	/*----------  3:52:30 AM Weekdays  ----------*/
	cronTime: utils.cronTime('30 52 03 * * 1-5'),
	start: process.PRODUCTION,
	onTick: function() {
		if (utils.isMaster()) return;
		Object.keys(sewmas).forEachFast(v => sewmas[v].flush())
		SymbolEWMAs.save(null, true)
	},
	timeZone: 'America/New_York',
	// runOnInit: process.DEVELOPMENT,
})

// new cron.CronJob({
// 	/*----------  3:52 AM Weekdays  ----------*/
// 	cronTime: utils.cronTime('52 03 * * 1-5'),
// 	start: process.PRODUCTION,
// 	onTick: function() {
// 		// redis.main.rkeyflush(shared.RKEY.EWMAS)
// 		if (utils.isMaster()) return;
// 		let coms = [] as RedisComs
// 		Object.keys(sewmas).forEachFast(function(symbol) {
// 			shared.EWMAS.NAMES.forEachFast(function(name) {
// 				coms.push(['hdel', shared.RKEY.EWMAS + ':' + symbol + ':' + name, 'ewmas', 'others'])
// 			})
// 		})
// 		redis.main.pipelinecoms(coms).then(utils.pipelineErrors)
// 	},
// 	timeZone: 'America/New_York',
// 	// runOnInit: process.DEVELOPMENT,
// })




















