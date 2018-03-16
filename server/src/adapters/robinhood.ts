//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')
import logger = require('./logger')

import pevent = require('p-event')
import pqueue = require('p-queue')
import pall = require('p-all')
import redis = require('./redis')
import http = require('./http')



export const marketacronyms = {
	'OTCM': 'OTCM',
	'XASE': 'AMEX',
	'ARCX': 'NYSE',
	'XNYS': 'NYSE',
	'XNAS': 'NASDAQ',
	'BATS': 'BATS',
} as { [mic: string]: string }

export const marketnames = {
	'OTCM': 'Otc Markets',
	'XASE': 'NYSE Market',
	'ARCX': 'NYSE Arca',
	'XNYS': 'New York Stock Exchange',
	'XNAS': 'NASDAQ',
	'BATS': 'BATS Exchange',
} as { [mic: string]: string }



export function getAllSymbols(): Promise<Array<string>> {
	return redis.main.get(shared.RKEY.RH.SYMBOLS).then(function(symbols: Array<string>) {
		symbols = shared.safeParse(symbols)
		return Promise.resolve(symbols)
	})
}

export function getAllFullSymbols(): Promise<Array<FullSymbol>> {
	return redis.main.get(shared.RKEY.RH.SYMBOLS_FULL).then(function(fsymbols: Array<any>) {
		fsymbols = shared.safeParse(fsymbols)
		return Promise.resolve(fsymbols.mapFast(v => { return { symbol: v[0], tickerid: v[1] } as FullSymbol }))
	})
}

export function getAllSymbolsLength(): Promise<number> {
	return redis.main.get(shared.RKEY.RH.SYMBOLS_LENGTH).then(function(length: number) {
		return Promise.resolve(shared.safeParse(length))
	})
}

export function getInstanceSymbols(): Promise<Array<string>> {
	if (utils.isMaster()) return Promise.resolve([]);
	let rkey = shared.RKEY.RH.SYMBOLS + ':' + process.$instances + ':' + process.$instance
	return redis.main.get(rkey).then(function(symbols: Array<string>) {
		symbols = shared.safeParse(symbols)
		return Promise.resolve(symbols)
	})
}

export function getInstanceFullSymbols(): Promise<Array<FullSymbol>> {
	if (utils.isMaster()) return Promise.resolve([]);
	let rkey = shared.RKEY.RH.SYMBOLS_FULL + ':' + process.$instances + ':' + process.$instance
	return redis.main.get(rkey).then(function(fsymbols: Array<any>) {
		fsymbols = shared.safeParse(fsymbols)
		return Promise.resolve(fsymbols.mapFast(v => { return { symbol: v[0], tickerid: v[1] } as FullSymbol }))
	})
}

export function getInstanceSymbolsLength(): Promise<number> {
	if (utils.isMaster()) return Promise.resolve(NaN);
	let rkey = shared.RKEY.RH.SYMBOLS_LENGTH + ':' + process.$instances + ':' + process.$instance
	return redis.main.get(rkey).then(function(length: number) {
		return Promise.resolve(shared.safeParse(length))
	})
}





export function getQuotes(symbols: Array<string>): Promise<Array<RobinhoodQuote>> {
	if (!Array.isArray(symbols) || symbols.length == 0) return Promise.resolve([]);

	return Promise.resolve().then(function() {
		return http.get('https://api.robinhood.com/marketdata/quotes/', {
			symbols: symbols.join(','),
		}, { silent: true })

	}).then(function(response: RobinhoodPaginatedResponse<RobinhoodQuote>) {
		if (!response || !Array.isArray(response.results)) return Promise.resolve([]);

		let now = shared.now()
		response.results.forEachFast(function(rquote, i) {
			if (!rquote) return;
			shared.fixResponse(rquote)
			rquote.symbol = symbols[i]
			rquote.stamp = now
		})
		return Promise.resolve(response.results.filter(v => !!v))

	}).catch(function(error) {
		logger.error('getQuotes > error', utils.peRender(error));
		if (utils.isTimeoutError(error)) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_3).then(() => getQuotes(symbols))
		}
		return Promise.resolve([])
	})
}



export function getFundamentals(symbols: Array<string>): Promise<Array<RobinhoodFundamentals>> {
	if (!Array.isArray(symbols) || symbols.length == 0) return Promise.resolve([]);

	return Promise.resolve().then(function() {
		return http.get('https://api.robinhood.com/marketdata/fundamentals/', {
			symbols: symbols.join(','),
		}, { silent: true })

	}).then(function(response: RobinhoodPaginatedResponse<RobinhoodFundamentals>) {
		if (!response || !Array.isArray(response.results)) return Promise.resolve([]);

		let now = shared.now()
		response.results.forEachFast(function(fundamental, i) {
			if (!fundamental) return;
			shared.fixResponse(fundamental)
			fundamental.symbol = symbols[i]
			if (Number.isFinite(fundamental.volume)) fundamental.volume = _.round(fundamental.volume);
			if (Number.isFinite(fundamental.average_volume)) fundamental.average_volume = _.round(fundamental.average_volume);
			if (Number.isFinite(fundamental.market_cap)) fundamental.market_cap = _.round(fundamental.market_cap);
			fundamental.stamp = now
		})
		return Promise.resolve(response.results)

	}).catch(function(error) {
		logger.error('getFundamentals > error', utils.peRender(error));
		if (utils.isTimeoutError(error)) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_3).then(() => getFundamentals(symbols))
		}
		return Promise.resolve([])
	})
}



export function getHistoricals(symbols: Array<string>, span: RobinhoodHistoricalSpans): Promise<Array<RobinhoodHistoricals>> {
	if (!Array.isArray(symbols) || symbols.length == 0) return Promise.resolve([]);

	return Promise.resolve().then(function() {
		let params = { span, symbols: symbols.join(','), interval: '5minute' } as any
		if (span == 'day') params.bounds = 'trading';
		if (span == 'year') params.interval = 'day';
		return http.get('https://api.robinhood.com/marketdata/historicals/', params, { silent: true })

	}).then(function(response: RobinhoodPaginatedResponse<RobinhoodHistoricals>) {
		if (!response || !Array.isArray(response.results)) return Promise.resolve([]);

		let now = shared.now()
		response.results.forEachFast(function(historical, i) {
			if (!historical) return;
			shared.fixResponse(historical)
			if (historical.symbol != symbols[i]) {
				logger.error('getHistoricals historical.symbol != symbols[i] >', historical.symbol, symbols[i])
				historical.symbol = symbols[i]
			}
			historical.historicals.forEachFast(v => shared.fixResponse(v))
			historical.historicals.sort((a, b) => new Date(a.begins_at).valueOf() - new Date(b.begins_at).valueOf())
			historical.stamp = now
		})
		return Promise.resolve(response.results)

	}).catch(function(error) {
		logger.error('getHistoricals > error', utils.peRender(error));
		if (utils.isTimeoutError(error)) {
			return pevent(process.ee3_private, shared.RKEY.SYS.TICK_3).then(() => getHistoricals(symbols, span))
		}
		return Promise.resolve([])
	})
}





export function login(uname: string, pass: string, mfa?: string): Promise<RobinhoodLoginResponse> {
	let url = 'https://api.robinhood.com/oauth2/token/'
	return http.post(url, {
		grant_type: 'password',
		username: uname,
		password: pass,
		mfa_code: mfa,
		client_id: 'c82SH0WZOsabOXGP2sxqcj34FxkvfnWRZBKlBjFS',
		scope: 'internal',
	}, { rhqsdata: true }).then(function(response) {
		shared.fixResponse(response)
		return Promise.resolve(response)
	})
}

export function refreshToken(reftoken: string): Promise<RobinhoodLoginResponse> {
	let url = 'https://api.robinhood.com/oauth2/token/'
	return http.post(url, {
		grant_type: 'refresh_token',
		refresh_token: reftoken,
		client_id: 'c82SH0WZOsabOXGP2sxqcj34FxkvfnWRZBKlBjFS',
		scope: 'internal',
	}, { rhqsdata: true }).then(function(response) {
		shared.fixResponse(response)
		return Promise.resolve(response)
	})
}

export function checkToken(username: string, rhtoken: string): Promise<boolean> {
	let url = 'https://api.robinhood.com/applications/'
	return http.get(url, null, { rhtoken }).then(function(response: RobinhoodApplicationsResponse) {
		shared.fixResponse(response)
		if (!Array.isArray(response.results) || response.results.length == 0) {
			throw new errors.NotFoundError('Application for account not found.')
		}
		let application = response.results[0]
		if (application.last_error || application.ready != true || application.state != 'approved') {
			throw new errors.ServiceUnavailableError(`Account not approved. "${application.last_error}"`)
		}
		return http.get<RobinhoodUser>(application.user, null, { rhtoken }).then(function(response) {
			shared.fixResponse(response)
			if (response.username != username) {
				throw new errors.InvalidCredentialsError('Provided username does not match username on file.')
			}
			return Promise.resolve(true)
		})
	})
}


















// /*████████████████████████████████████████
// █            REDIS MIGRATIONS            █
// ████████████████████████████████████████*/

// function migrate(): Promise<any> {
// 	let tstart = Date.now()
// 	console.log('migrate > start')
// 	return getInstanceSymbols().then(function(symbols) {
// 		let chunks = _.chunk(symbols, 16)

// 		// chunks.splice(1)

// 		return pall(chunks.mapFast(v => () => eachmigrate(v)), { concurrency: 1 })
// 	}).then(function() {
// 		console.log('migrate > done ' + shared.getDuration(tstart))
// 		return Promise.resolve()
// 	}).catch(function(error) {
// 		console.error('migrate > error', utils.peRender(error))
// 		return Promise.resolve()
// 	})
// }

// function eachmigrate(symbols: Array<string>): Promise<any> {

// 	// symbols.splice(3)

// 	console.log('eachmigrate', JSON.stringify(symbols));
// 	return Promise.resolve().then(function() {
// 		return pevent(process.ee3_private, shared.RKEY.SYS.TICK_025)
// 	}).then(function() {

// 		let coms = []
// 		symbols.forEachFast(function(symbol) {
// 			// coms.push(['zrange', shared.RKEY.TINYS_5M + ':' + symbol, 0, -1, 'WITHSCORES'])
// 			// coms.push(['hgetall', shared.RKEY.CALCS + ':' + symbol])
// 			// coms.push(['del', shared.RKEY.TINYS_5M + ':' + symbol])
// 		})

// 		if (process.DEVELOPMENT) coms.splice(0);

// 		return redis.main.pipelinecoms(coms)

// 		// }).then(function(resolveds: Array<string>) {
// 		// 	utils.fixPipelineFast(resolveds)

// 		// 	let coms = []
// 		// 	symbols.forEachFast(function(symbol, i) {
// 		// 		let resolved = resolveds[i]
// 		// 		let crkey = shared.RKEY.CALCS + ':' + symbol
// 		// 		coms.push(['hmset', crkey, resolved])
// 		// 		// resolved.splice(2)
// 		// 		// let ii: number, len = resolved.length / 2
// 		// 		// for (ii = 0; ii < len; ii++) {
// 		// 		// 	let stamp = resolved[(ii * 2) + 1]
// 		// 		// 	let live = resolved[(ii * 2) + 0]
// 		// 		// 	let lrkey = shared.RKEY.TINYS_5M + ':' + symbol
// 		// 		// 	coms.push(['zadd', lrkey, Number.parseInt(stamp), live])
// 		// 		// }
// 		// 	})

// 		// 	// coms.splice(12)
// 		// 	// console.log('coms >')
// 		// 	// eyes.inspect(coms)

// 		// 	// if (process.DEVELOPMENT) coms.splice(0);

// 		// 	return redis.calcs.pipelinecoms(coms)

// 	}).then(function(resolved) {
// 		utils.pipelineErrors(resolved)
// 		return Promise.resolve()
// 	})
// }

// // if (!utils.isMaster()) {
// // 	// if (utils.isPrimary()) {
// // 	migrate()
// // }


































