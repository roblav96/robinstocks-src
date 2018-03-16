// 

import _ from 'lodash'
import lockr from 'lockr'
import pevent from 'p-event'
import pforever from 'p-forever'
import pqueue from 'p-queue'
import * as shared from '../shared'
import * as utils from './utils'
import * as http from './http'





export function getQuotes(symbols: Array<string>): Promise<Array<YahooQuote>> {
	if (!_.isArray(symbols) || symbols.length == 0) return Promise.resolve([]);

	return Promise.resolve().then(function() {
		return http.get('https://query1.finance.yahoo.com/v7/finance/quote', {
			symbols: symbols.join(','),
		}, { silent: true })

	}).then(function(response: YahooQuoteResponse) {
		if (_.get(response, 'quoteResponse.error')) return Promise.reject(JSON.stringify(response.quoteResponse.error));
		if (_.isEmpty(_.get(response, 'quoteResponse.result'))) return Promise.resolve([]);

		let yquotes = response.quoteResponse.result.filter(v => !!v)
		yquotes.forEachFast(function(yquote, i) {
			yquote.symbol = yquote.symbol.toUpperCase()
			yquote.stamp = shared.now()
		})
		return Promise.resolve(yquotes)

	}).catch(function(error) {
		console.error('getQuotes > error', error);
		return Promise.resolve([])
	})
}





export function getSummary(symbol: string): Promise<YahooSummaryResult> {
	return Promise.resolve().then(function() {

		let modules = [
			// stocks
			'assetProfile', 'balanceSheetHistory', 'balanceSheetHistoryQuarterly', 'calendarEvents',
			'cashflowStatementHistory', 'cashflowStatementHistoryQuarterly', 'defaultKeyStatistics', 'earnings',
			'earningsHistory', 'earningsTrend', 'financialData', 'fundOwnership', 'incomeStatementHistory',
			'incomeStatementHistoryQuarterly', 'indexTrend', 'industryTrend', 'insiderHolders', 'insiderTransactions',
			'institutionOwnership', 'majorDirectHolders', 'majorHoldersBreakdown', 'netSharePurchaseActivity', 'price', 'quoteType',
			'recommendationTrend', 'secFilings', 'sectorTrend', 'summaryDetail', 'summaryProfile', 'symbol', 'upgradeDowngradeHistory',
			// funds
			'fundProfile', 'topHoldings', 'fundPerformance',
		]

		return http.get('https://query1.finance.yahoo.com/v10/finance/quoteSummary/' + symbol, {
			modules: modules.join(','),
			formatted: false,
		}, { silent: true })

	}).then(function(response: YahooSummaryResponse) {
		if (_.get(response, 'quoteSummary.error')) return Promise.reject(JSON.stringify(response.quoteSummary.error));
		if (_.isEmpty(_.get(response, 'quoteSummary.result'))) return Promise.resolve(null);

		let summary = response.quoteSummary.result[0]
		summary.symbol = symbol
		summary.stamp = shared.now()
		return Promise.resolve(summary)

	}).catch(function(error) {
		console.error('getSummary ' + symbol + ' > error', error)
	})
}





export function getSparks(symbols: Array<string>): Promise<Array<Array<HistQuote>>> {
	if (!_.isArray(symbols) || symbols.length == 0) return Promise.resolve([]);

	return Promise.resolve().then(function() {
		return http.get('https://query1.finance.yahoo.com/v7/finance/spark', {
			symbols: symbols.join(','),
			range: '1d',
			interval: '5m',
			includePrePost: true,
		}, { silent: true })

	}).then(function(response: YahooSparksResponse) {
		if (_.get(response, 'spark.error')) return Promise.reject(JSON.stringify(response.spark.error));
		if (_.isEmpty(_.get(response, 'spark.result'))) return Promise.resolve([]);

		return Promise.resolve(_.flatten(response.spark.result.mapFast(function({ response }) {
			return response.mapFast(function(response) {
				let results = [] as Array<HistQuote>
				let stamps = response.timestamp
				if (!stamps) return results;
				let quotes = response.indicators.quote[0]
				stamps.forEachFast(function(stamp, i) {
					if (!_.isFinite(quotes.close[i])) return;
					results.push({
						close: quotes.close[i],
						stamp: stamp * 1000, // yahoo doesnt know seconds
					} as HistQuote)
				})
				return results
			})
		})))

	}).catch(function(error) {
		console.error('getSparks ' + JSON.stringify(symbols) + ' > error', error)
		return Promise.resolve([])
	})
}





export function ylQuoteFast(yquote: YahooQuote): LiveQuote {
	if (_.isEmpty(yquote)) return yquote as any;

	let ylquote = { symbol: yquote.symbol } as LiveQuote
	ylquote.lastStamp = _.max([yquote.postMarketTime, yquote.preMarketTime, yquote.regularMarketTime]) * 1000

	let state = shared.marketState(ylquote.lastStamp)
	if (state.indexOf('PRE') == 0 && _.isFinite(yquote.preMarketPrice)) {
		ylquote.lastPrice = yquote.preMarketPrice
	} else if (state == 'REGULAR' && _.isFinite(yquote.regularMarketPrice)) {
		ylquote.lastPrice = yquote.regularMarketPrice
	} else if (state.indexOf('POST') == 0 && _.isFinite(yquote.postMarketPrice)) {
		ylquote.lastPrice = yquote.postMarketPrice
	} else {
		let lastPrices = _.compact([yquote.postMarketPrice, yquote.regularMarketPrice, yquote.preMarketPrice])
		if (_.isFinite(lastPrices[0])) ylquote.lastPrice = lastPrices[0];
	}

	if (_.isFinite(yquote.regularMarketVolume)) ylquote.volume = yquote.regularMarketVolume;

	if (_.isFinite(yquote.askSize)) ylquote.askSize = yquote.askSize * 100;
	if (_.isFinite(yquote.ask)) {
		if (yquote.ask > 0) ylquote.askPrice = yquote.ask;
		else if (yquote.ask == 0 && _.isFinite(ylquote.lastPrice)) ylquote.askPrice = ylquote.lastPrice;
	}
	if (_.isFinite(yquote.bidSize)) ylquote.bidSize = yquote.bidSize * 100;
	if (_.isFinite(yquote.bid)) {
		if (yquote.bid > 0) ylquote.bidPrice = yquote.bid;
		else if (yquote.bid == 0 && _.isFinite(ylquote.lastPrice)) ylquote.bidPrice = ylquote.lastPrice;
	}

	return ylquote
}

export function ycQuoteFast(yquote: YahooQuote): CalcQuote {
	if (_.isEmpty(yquote)) return yquote as any;
	let ycquote = Object.assign({}, ylQuoteFast(yquote)) as CalcQuote
	if (_.isFinite(yquote.marketCap)) ycquote.marketCap = yquote.marketCap;
	if (_.isFinite(yquote.sharesOutstanding)) ycquote.sharesOutstanding = yquote.sharesOutstanding;
	if (_.isFinite(yquote.averageDailyVolume10Day)) ycquote.avgVolume10Day = yquote.averageDailyVolume10Day;
	if (_.isFinite(yquote.averageDailyVolume3Month)) ycquote.avgVolume3Month = yquote.averageDailyVolume3Month;
	if (_.isFinite(yquote.regularMarketOpen)) ycquote.openPrice = yquote.regularMarketOpen;
	if (_.isFinite(yquote.regularMarketPreviousClose)) ycquote.prevClose = yquote.regularMarketPreviousClose;
	// if (_.isString(yquote.quoteType)) ycquote.yhtype = yquote.quoteType;
	if (_.isString(yquote.messageBoardId)) ycquote.messageBoardId = yquote.messageBoardId;
	return ycquote
}





// Promise.resolve().then(function() {
// 	let queue = new pqueue({ concurrency: 1 })
// 	shared.FUNDS.mapFast(v => v.symbol).forEachFast(v => queue.add(() => getSummary(v)))
// 	return queue.onEmpty()
// }).then(function() {
// 	console.warn('DONE')
// 	process.dtsgen('summaryitem', summaryitem)
// })





