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
import rx = require('rxjs/Rx')
import pdelay = require('delay')
import pevent = require('p-event')
import pforever = require('p-forever')
import pqueue = require('p-queue')
import pall = require('p-all')
import url = require('url')
import fuzzy = require('fuzzy')
import rss = require('rss-parser')
import jsonic = require('jsonic')
import ti = require('technicalindicators')
import ss = require('simple-statistics')
import redis = require('../adapters/redis')
import r = require('../adapters/rethinkdb')
import socket = require('../adapters/socket')
import metrics = require('../adapters/metrics')
import http = require('../adapters/http')
import robinhood = require('../adapters/robinhood')
import storage = require('../adapters/storage')



function onReady() {
	if (utils.isMaster()) return;
	// if (process.PRODUCTION) return;
	if (process.DEVELOPMENT) return;
	// if (process.DEVELOPMENT && !utils.isPrimary()) return;

	NewsBuilder.ready = true

}
rx.Observable.fromEvent(process.ee3_private, process.PRODUCTION ? shared.RKEY.SYS.TICK_3 : shared.RKEY.SYS.TICK_1).filter(function() {
	return !!process.$marketStamps && !!utils.readyInstruments && !!utils.readyCalcs && !!utils.readyLives
}).take(1).subscribe(onReady)



const devfilter = [
	// 'robinhood',
	// 'yahoo',
	// 'iex',
	// 'tiingo',
	// 'stockrow',
	// 'webull',
	// 'community',
]

const builders = [] as Array<NewsBuilder>

export function forceSyncSymbols(symbols: Array<string>) {
	builders.forEachFast(v => v.forceSyncSymbols(symbols))
}





const sysrkeys = [] as Array<string>
const sysnums = Object.keys(shared.RKEY.SYS).filter(k => k.toLowerCase().indexOf('tick_') == 0).mapFast(function(key) {
	let rkey = shared.RKEY.SYS[key]
	sysrkeys.push(rkey)
	let tick = shared.parseInt(key)
	if (key == 'TICK_01') tick = 0.1;
	if (key == 'TICK_025') tick = 0.25;
	if (key == 'TICK_05') tick = 0.5;
	return tick * 1000
})



class NewsBuilder {

	static ready = false

	private queue = new pqueue({ concurrency: 1 }) as PQueue
	private throttle = { period: 15, value: 100 }
	private bads = [] as Array<string>

	constructor(
		public api: string,
		public fn: (this: NewsBuilder, symbols: Array<string>) => Promise<Array<NewsItem>>,
		private delay = shared.RKEY.SYS.TICK_3,
		private limit = 32,
		private batch = false,
	) {
		redis.main.smembers(shared.RKEY.NEWS.BADS + ':' + this.api).then(bads => this.bads = _.uniq(_.compact(bads)))
		if (utils.isMaster()) return;
		if (process.DEVELOPMENT && devfilter.indexOf(this.api) == -1) return;
		pforever(() => this.refillQueue())
	}



	forceSyncSymbols(symbols: Array<string>) {
		let now = shared.now()
		if (this.batch == true) {
			this.queue.add(() => this.fnWrapper(symbols, true), { priority: now })
		} else {
			symbols.forEachFast((v, i) => this.queue.add(() => this.fnWrapper([v], true), { priority: now + i }))
		}
	}



	private refillQueue() {
		if (!NewsBuilder.ready) return pevent(process.ee3_private, shared.RKEY.SYS.TICK_10);

		return Promise.resolve().then(() => {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1) // incase of infinite error loop

		}).then(() => {
			return this.getSymbols()

		}).then(symbols => {
			symbols = symbols.filter(v => this.bads.indexOf(v) == -1)

			if (this.batch == true) {
				this.queue.add(() => this.fnWrapper(symbols))
			} else {
				symbols.forEachFast(v => this.queue.add(() => this.fnWrapper([v])))
			}
			return this.queue.onIdle()

		}).catch(error => {
			logger.error('refillQueue > error', utils.peRender(error))
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_1)
		})
	}



	private getSymbols(): Promise<Array<string>> {
		return Promise.resolve().then(() => {
			let allsymbols = _.shuffle(Object.keys(storage.newssymbols))

			if (process.PRODUCTION && shared.marketState() == 'CLOSED') {
				return Promise.resolve(allsymbols.splice(0, this.limit))
			}

			let nsymbols = Object.keys(storage.newssymbols).filter(symbol => {
				return storage.newssymbols[symbol] > 0
			})
			nsymbols = nsymbols.concat(allsymbols.splice(0, _.max([this.limit - nsymbols.length, 0])))

			if (process.DEVELOPMENT) nsymbols = utils.devFsymbols().mapFast(v => v.symbol);

			let sortkey = 'velocity_ewma_5'
			let quotes = nsymbols.mapFast(v => ({
				symbol: v,
				sortkey: storage.calcquotes[v][sortkey],
			}))
			quotes = _.orderBy(quotes, ['sortkey'], ['desc'])

			let qrt = _.round(this.limit / 4)
			let highs = quotes.splice(0, qrt * 3)
			let lows = quotes.splice(quotes.length - qrt, qrt)

			return Promise.resolve(highs.concat(lows).mapFast(v => v.symbol))

		})
	}



	private fnWrapper(symbols: Array<string>, immediate = false) {
		return Promise.resolve().then(() => {
			if (immediate == true) return Promise.resolve();

			let index = utils.array_closest(sysnums, this.throttle.value)
			return pevent(process.ee3_private, this.delay).then(() => pevent(process.ee3_private, sysrkeys[index]))

		}).then(() => {
			let tstart = Date.now()

			return this.fn(symbols).then(nitems => {
				let duration = shared.math_clamp(Date.now() - tstart, 100, 10000)
				this.throttle.value = ss.addToMean(this.throttle.value, this.throttle.period, duration)

				return this.saveNewsItems(nitems)

			}).catch(error => {
				// if (error) {
				// 	if (utils.isTimeoutError(error)) logger.warn('fnWrapper > error', utils.peRender(error));
				// 	else logger.error('fnWrapper > error', utils.peRender(error));
				// }

				let status = _.get(error, 'response.status') as number
				if (status == 400 || status == 404) {
					this.bads.push(symbols[0])
					return redis.main.sadd(shared.RKEY.NEWS.BADS + ':' + this.api, symbols[0])
				}

				if (error && !utils.isTimeoutError(error) && [502, 503, 504].indexOf(status) == -1) {
					logger.error('fnWrapper > error', utils.peRender(error))
				}

				if (immediate == true) return Promise.resolve();
				// return pevent(process.ee3_private, shared.RKEY.SYS.TICK_15)
				return pdelay(30000)

			})
		})
	}



	private saveNewsItems(nitems: Array<NewsItem>): Promise<any> {
		if (!Array.isArray(nitems) || nitems.length == 0) return Promise.resolve();

		let symbols = _.uniq(nitems.mapFast(v => v.symbol))

		return Promise.resolve().then(() => {
			return redis.main.hmget(...[shared.RKEY.NEWS.IDS].concat(nitems.mapFast(v => v.id)))

		}).then((exists: Array<string>) => {
			let proms = [] as Array<any>
			let ccoms = [] as RedisComs

			symbols.forEachFast(function(symbol, i) {
				let nstamp = shared.now()
				if (Number.isFinite(storage.calcsymbols[symbol])) {
					let cquote = storage.calcquotes[symbol]
					cquote.newsStamp = nstamp
					storage.calcsymbols[symbol]++
					ccoms.push(['hset', shared.RKEY.CALCS + ':' + symbol, 'newsStamp', JSON.stringify(nstamp)])
				} else {
					let cquote = { symbol, newsStamp: nstamp } as CalcQuote
					proms.push(storage.remoteCalcUpdate(cquote))
				}

			})

			nitems = nitems.filter((v, i) => !exists[i])

			if (nitems.length > 0) {
				nitems.forEachFast(function(nitem) {
					let nrkey = shared.RKEY.NEWSES + ':' + nitem.symbol
					if (socket.hasSubscriber(nrkey)) socket.emit(nrkey, shared.implodeFast(shared.RMAP.NEWSES, nitem));
				})

				let com = _.flatten(nitems.mapFast(v => [v.id, '1']))
				proms.push(redis.main.hmset(...[shared.RKEY.NEWS.IDS].concat(com)))

				proms.push(r.table('news').insert(nitems, { conflict: 'update' }).run())
			}

			if (ccoms.length > 0) {
				proms.push(redis.calcs.pipelinecoms(ccoms))
			}

			return Promise.all(proms)

		})
	}



}







/*█████████████████████████████████
█            ROBINHOOD            █
█████████████████████████████████*/

builders.push(new NewsBuilder('robinhood', function(symbols) {
	let symbol = symbols[0]

	let url = 'https://api.robinhood.com/midlands/news/' + symbol + '/'
	return http.get(url, null, { silent: true }).then((response: RobinhoodPaginatedResponse<RobinhoodNewsItem>) => {
		let results = _.get(response, 'results')
		if (!results) return Promise.resolve([]);

		return Promise.resolve(results.mapFast(v => ({
			symbol,
			stamp: shared.now(),
			id: symbol + ':' + utils.buildId(v.title),
			min: utils.string_minify(v.title),
			api: this.api,
			source: v.api_source,
			title: v.title,
			summary: v.summary || v.title,
			url: v.url,
			published: shared.moment(v.published_at).valueOf(),
			tags: utils.buildTags(v.title),
		} as NewsItem)))

	})
}))





/*█████████████████████████████
█            YAHOO            █
█████████████████████████████*/

builders.push(new NewsBuilder('yahoo', function(symbols) {
	let symbol = symbols[0]

	return http.get('http://feeds.finance.yahoo.com/rss/2.0/headline', {
		s: symbol,
		lang: 'en-US',
		region: 'US',
	}, { silent: true }).then(response => {
		return new Promise(function(resolve, reject) {
			rss.parseString(response, function(error, results) {
				if (error) return reject(error);
				resolve(results)
			})
		})

	}).then((response: YahooNewsResponse) => {
		let results = _.get(response, 'feed.entries') as YahooNewsItem
		if (!Array.isArray(results)) return Promise.resolve([]);

		return Promise.resolve(results.filter(v => !!v).mapFast(v => {
			return {
				symbol,
				stamp: shared.now(),
				id: symbol + ':' + utils.buildId(v.title),
				min: utils.string_minify(v.title),
				api: this.api,
				source: 'yahoo.com',
				title: v.title,
				summary: v.content,
				url: v.link,
				published: shared.moment(v.isoDate).subtract(5, 'hours').valueOf(),
				tags: utils.buildTags(v.title),
			} as NewsItem
		}))

	})
}, shared.RKEY.SYS.TICK_10))





/*███████████████████████████
█            IEX            █
███████████████████████████*/

builders.push(new NewsBuilder('iex', function(symbols) {

	return http.get('https://api.iextrading.com/1.0/stock/market/batch', {
		symbols: symbols.join(','),
		types: 'news',
	}, { silent: true }).then((response: IexBatchResponse) => {
		if (_.isEmpty(response)) return Promise.resolve([]);

		let nitems = [] as Array<NewsItem>
		Object.keys(response).forEachFast(symbol => {
			let iexnews = response[symbol].news
			iexnews.filter(v => !!v).forEachFast(v => {
				nitems.push({
					symbol,
					stamp: shared.now(),
					id: symbol + ':' + utils.buildId(v.headline),
					min: utils.string_minify(v.headline),
					api: this.api,
					source: v.source,
					title: v.headline,
					summary: (v.summary || v.headline).trim(),
					url: v.url,
					published: shared.moment(v.datetime).valueOf(),
					tags: utils.buildTags(v.headline),
				})
			})
		})
		return Promise.resolve(nitems)

	})
}, shared.RKEY.SYS.TICK_15, 64, true))





/*██████████████████████████████
█            TIINGO            █
██████████████████████████████*/

builders.push(new NewsBuilder('tiingo', function(symbols) {

	return http.get('https://api.tiingo.com/tiingo/news',
		{ tickers: symbols.join(',') },
		{
			headers: { 'Authorization': 'Token 5470666255c64f22462cfde623ab76b5b9a9fcc2' },
			silent: true,
		}
	).then((response: Array<TiingoNewsItem>) => {
		response.forEachFast(v => v.tickers = v.tickers.mapFast(v => v.toUpperCase()))

		let nitems = [] as Array<NewsItem>
		symbols.forEachFast(symbol => {
			let items = response.filter(v => v.tickers.indexOf(symbol) != -1)
			if (items.length == 0) return;
			nitems = nitems.concat(items.mapFast(v => {
				return {
					symbol,
					stamp: shared.now(),
					id: symbol + ':' + utils.buildId(v.title),
					min: utils.string_minify(v.title),
					api: this.api,
					source: v.source,
					title: v.title,
					summary: v.description,
					url: v.url,
					published: shared.moment(v.publishedDate).valueOf(),
					tags: utils.buildTags(v.title, v.tags),
				} as NewsItem
			}))
		})
		return Promise.resolve(nitems)

	})
}, shared.RKEY.SYS.TICK_15, 64, true))





/*████████████████████████████████
█            STOCKROW            █
████████████████████████████████*/

builders.push(new NewsBuilder('stockrow', function(symbols) {
	let symbol = symbols[0]

	return http.get('https://stockrow.com/api/companies/' + symbol + '/company_news.json', {
		limit: 10,
	}, { silent: true }).then((response: StockrowNewsResponse) => {
		if (!Array.isArray(response)) return Promise.resolve([]);

		let nitems = [] as Array<NewsItem>
		response.filter(v => !!v).forEachFast(dates => {
			Object.keys(dates).forEachFast(date => {
				dates[date].forEachFast(v => {
					if (!v) return;
					nitems.push({
						symbol,
						stamp: shared.now(),
						id: symbol + ':' + utils.buildId(v.title),
						min: utils.string_minify(v.title),
						api: this.api,
						source: url.parse(v.url).host,
						title: v.title,
						summary: v.title,
						url: v.url,
						published: shared.moment(v.published_at).valueOf(),
						tags: utils.buildTags(v.title),
					})
				})
			})
		})
		return Promise.resolve(nitems)

	})
}, shared.RKEY.SYS.TICK_10))





/*██████████████████████████████
█            WEBULL            █
██████████████████████████████*/

builders.push(new NewsBuilder('webull', function(symbols) {
	let symbol = symbols[0]

	return redis.calcs.hget(shared.RKEY.CALCS + ':' + symbol, 'tickerId').then(function(tickerid: number) {
		return http.get('https://securitiesapi.stocks666.com/api/information/news/ticker/' + shared.safeParse(tickerid), {
			currentNewsId: 0,
			pageSize: 20,
		}, { silent: true })
	}).then((response: WebullNewsResponse) => {
		if (_.isEmpty(_.get(response, 'news'))) return Promise.resolve([]);

		return Promise.resolve(response.news.filter(v => !!v).mapFast(v => {
			return {
				symbol,
				stamp: shared.now(),
				id: symbol + ':' + utils.buildId(v.title),
				min: utils.string_minify(v.title),
				api: this.api,
				source: v.sourceName,
				title: v.title,
				summary: v.summary || v.title,
				url: v.newsUrl,
				published: shared.moment(v.newsTime).valueOf(),
				tags: utils.buildTags(v.title),
			} as NewsItem
		}))

	})
}, shared.RKEY.SYS.TICK_15))





/*███████████████████████████████████████
█            YAHOO COMMUNITY            █
███████████████████████████████████████*/

builders.push(new NewsBuilder('community', function(symbols) {
	let symbol = symbols[0]

	return redis.calcs.hget(shared.RKEY.CALCS + ':' + symbol, 'messageBoardId').then((messageBoardId: string) => {
		messageBoardId = shared.safeParse(messageBoardId)

		let query = 'namespace = "yahoo_finance" and (contextId="' + messageBoardId + '" or tag="' + symbol + '")'
		let url = 'https://finance.yahoo.com/_finance_doubledown/api/resource/canvass.getMessageList;oauthConsumerKey=finance.oauth.client.canvass.prod.consumerKey;oauthConsumerSecret=finance.oauth.client.canvass.prod.consumerSecret;lang=en-US;region=US;userActivity=true;query=' + query + ';sortBy=createdAt;count=20'
		return http.get(url, null, { silent: true })

	}).then((response: YahooCommunityResponse) => {
		if (_.isEmpty(response) || _.isEmpty(response.canvassMessages) || response.total.count == 0) return Promise.resolve([]);

		let nitems = [] as Array<NewsItem>
		response.canvassMessages.forEachFast(ycmessage => {
			if (_.isEmpty(ycmessage) || _.isEmpty(ycmessage.details.linkMessageDetails)) return;
			let link = ycmessage.details.linkMessageDetails[0]
			if (_.isEmpty(link.title)) return;
			nitems.push({
				symbol,
				stamp: shared.now(),
				id: symbol + ':' + utils.buildId(link.title),
				min: utils.string_minify(link.title),
				api: this.api,
				source: url.parse(link.url).host,
				title: link.title,
				summary: link.description || ycmessage.details.userText,
				url: link.url,
				published: ycmessage.meta.createdAt * 1000,
				tags: utils.buildTags(link.title),
			})
		})

		return Promise.resolve(nitems)

	})
}, shared.RKEY.SYS.TICK_15))




















