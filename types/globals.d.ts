// 

export { }



declare global {

	interface FullSymbol {
		symbol: string
		tickerid: number
	}

	interface TinyQuote {
		symbol: string
		lastPrice: number
		size: number
		lastStamp: number
		askSpread: number
		bidSpread: number
		tradeSize: number
		tradeBuySize: number
		tradeSellSize: number
	}

	interface BaseQuote {
		symbol: string
		stamp: number
	}

	interface SmallQuote extends BaseQuote {
		lastPrice: number
		size: number
		lastStamp: number
		action: string
		prevAction: string
		liveTrading: boolean,
		position: number
		avgCost: number
		unrealizedPNL: number
		realizedPNL: number
		positionStamp: number
	}

	interface HistQuote extends BaseQuote {
		lastPrice: number
		open: number
		high: number
		low: number
		close: number
		size: number
		volume: number
		lastStamp: number
	}

	interface MarketCalcQuote extends BaseQuote {
		tickerId: number
		name: string
		wbstatus: string
		wbstatus0: string
		lastPrice: number
		volume: number
		lastStamp: number
		change: number
		changePercent: number
		askPrice: number
		askSize: number
		bidPrice: number
		bidSize: number
		openPrice: number
		closePrice: number
		prevClose: number
		yearHigh: number
		yearLow: number
		dayHigh: number
		dayLow: number
		turnoverRate: number
		vibrateRatio: number
	}

	interface LiveQuote extends BaseQuote {
		count: number
		bidPrice: number
		askPrice: number
		bidSize: number
		askSize: number
		bidVolume: number
		askVolume: number
		bidSizeAccum: number
		askSizeAccum: number
		bidSpread: number
		askSpread: number
		lastPrice: number
		high: number
		low: number
		open: number
		close: number
		size: number
		volume: number
		lastStamp: number
		tradeCount: number
		tradeSize: number
		tradeVolume: number
		tradeBuySize: number
		tradeSellSize: number
		tradeBuyVolume: number
		tradeSellVolume: number
		dealCount: number
		wbstatus: string
		wbstatus0: string
		wbfastatus: string
		wbstatusStamp: number
		dayHigh: number
		dayLow: number
		turnoverRate: number
		vibrateRatio: number
		yield: number
		rootMeanSquare: number
		sampleSkewness: number
		linearSlope: number
		linearIntercept: number
		linearCorrelation: number
		linearCovariance: number
		quadraticIntercept: number
		quadratic1stRoot: number
		quadratic2ndRoot: number
		quadraticCorrelation: number
		quadraticCovariance: number
		interquartileRange: number
		action: string
		prevAction: string
		liveTrading: boolean
		position: number
		avgCost: number
		unrealizedPNL: number
		realizedPNL: number
		priceChange: number
		bidAskSpread: number
		bidAskFlowSizeAccum: number
		bidAskFlowVolume: number
		tradeFlowSize: number
		tradeFlowVolume: number
		volumeOsc: number
		volumeProgressOsc: number
	}

	interface CalcQuote extends LiveQuote {
		iscalc?: boolean
		nano?: number
		name: string
		junk: boolean
		type: RobinhoodTypes
		mic: string
		exchange: string
		acronym: string
		eodPrice: number
		openPrice: number
		closePrice: number
		prevClose: number
		marketCap: number
		sharesOutstanding: number
		sharesFloat: number
		listDate: number
		avgVolume: number
		avgVolume10Day: number
		avgVolume3Month: number
		newsStamp: number
		messageBoardId: string
		tickerId: number
		avgTickChange: number
		yearHigh: number
		yearLow: number
		lastSize: number
		lastVolume: number
		industry: string
		sector: string
		rhid: string
		lastTradeSize: number
		lastTradeVolume: number
		country: string
		realParameter: Array<number>
		positionStamp: number
		// avgSizePerSecond: number
		// reason: string
		// systemEvent: string
		// halted: boolean
		// haltedStamp: number
		// ssr: boolean
		// ssrStamp: number
		// ssrDetail: string
		// securityEvent: string
	}

	// interface FullQuote extends CalcQuote {
	// 	bidAskSpread: number
	// 	bidAskFlowSizeAccum: number
	// 	bidAskFlowVolume: number
	// 	priceChange: number
	// 	tradeFlowSize: number
	// 	tradeFlowVolume: number
	// }

	type FullQuote = Partial<CalcQuote>
	// interface FullQuote extends CalcQuote, MinuteQuote { }

	interface EodQuote extends BaseQuote {
		squote: StreamQuote
		cquote: CalcQuote
		/*=====  YAHOO  ======*/
		yhPreMarketPrice: number
		yhPreMarketChange: number
		yhPreMarketChangePercent: number
		yhPostMarketPrice: number
		yhPostMarketChange: number
		yhPostMarketChangePercent: number
		yhRegularMarketPrice: number
		yhRegularMarketChange: number
		yhRegularMarketChangePercent: number

		yhRegularMarketOpen: number
		yhRegularMarketDayHigh: number
		yhRegularMarketDayLow: number
		yhRegularMarketPreviousClose: number
		yhRegularMarketVolume: number

		yhAverageDailyVolume3Month: number
		yhAverageDailyVolume10Day: number
		yhSharesOutstanding: number
		yhMarketCap: number

		yhFiftyTwoWeekLowChange: number
		yhFiftyTwoWeekLowChangePercent: number
		yhFiftyTwoWeekHighChange: number
		yhFiftyTwoWeekHighChangePercent: number
		yhFiftyTwoWeekLow: number
		yhFiftyTwoWeekHigh: number

		yhFiftyDayAverage: number
		yhFiftyDayAverageChange: number
		yhFiftyDayAverageChangePercent: number
		yhTwoHundredDayAverage: number
		yhTwoHundredDayAverageChange: number
		yhTwoHundredDayAverageChangePercent: number
		yhTrailingThreeMonthReturns: number
		yhTrailingThreeMonthNavReturns: number

		yhEarningsTimestamp: number
		yhEarningsTimestampStart: number
		yhEarningsTimestampEnd: number

		yhEpsTrailingTwelveMonths: number
		yhEpsForward: number
		yhPriceHint: number
		yhTrailingPE: number
		yhForwardPE: number
		yhPriceToBook: number
		yhBookValue: number

		/*=====  PREV EOD PRICE  ======*/
		prevEodLastPrice: number
		eodLastPrice: number
		eodLastPriceChange: number
		eodLastPriceChangePercent: number

		/*=====  DAY  ======*/
		rhDayPreviousClose: number
		rhDayOpenPrice: number
		rhDayHighPrice: number
		rhDayLowPrice: number
		rhDayClosePrice: number
		rhDayChange: number
		rhDayChangePercent: number
		rhDayAvgSize: number
		rhDayVolume: number
		rhDayAbsPriceMovement: number
		rhDayAbsPriceMovementPercent: number
		rhDayPriceMovementWeighted: number

		/*=====  WEEK  ======*/
		rhWeekOpenPrice: number
		rhWeekHighPrice: number
		rhWeekLowPrice: number
		rhWeekClosePrice: number
		rhWeekChange: number
		rhWeekChangePercent: number
		rhWeekAvgSize: number
		rhWeekVolume: number
		rhWeekAbsPriceMovement: number
		rhWeekAbsPriceMovementPercent: number
		rhWeekPriceMovementWeighted: number

		/*=====  MONTH  ======*/
		rhMonthOpenPrice: number
		rhMonthHighPrice: number
		rhMonthLowPrice: number
		rhMonthClosePrice: number
		rhMonthChange: number
		rhMonthChangePercent: number
		rhMonthAvgSize: number
		rhMonthVolume: number
		rhMonthAbsPriceMovement: number
		rhMonthAbsPriceMovementPercent: number
		rhMonthPriceMovementWeighted: number

		/*=====  YEAR  ======*/
		rhYearOpenPrice: number
		rhYearHighPrice: number
		rhYearLowPrice: number
		rhYearClosePrice: number
		rhYearChange: number
		rhYearChangePercent: number
		rhYearAvgSize: number
		rhYearVolume: number
		rhYearAbsPriceMovement: number
		rhYearAbsPriceMovementPercent: number
		rhYearPriceMovementWeighted: number

		/*=====  VOLUMES  ======*/
		avgSize5min1day: number
		avgSize5min1week: number
		avgSize1day1week: number
		avgSize1day1month: number



		// dayChange: number
		// dayChangePercent: number
		// previousClose: number
		// dayVolume: number
		// tenDayPrice: number
		// dayPrice: number
		// weekPrice: number
		// oneMonthPrice: number
		// threeMonthPrice: number
		// avg5minVolume1day: number
		// avg5minVolume1week: number
		// avg1dayVolume1week: number
		// avg1dayVolume10day: number
		// avg1dayVolume1month: number
		// avg1dayVolume3month: number
		// ____: number
		// ____: number
		// ____: number
		// ____: number
		// ____: number
	}

	interface EodVolumeQuote extends BaseQuote {
		time: string
		daySize: number
		dayVolume: number
		weekSize: number
		weekVolume: number
	}
	type EodVolumesMap = { [time: string]: EodVolumeQuote }

	interface CalcVolumes {
		deltaVolumePercent: number
		fromVolumePercent: number
		toVolumePercent: number
	}

	interface TopQuote extends BaseQuote {
		name: string
		score: number
		type: string
		lastPrice: number
		dayPriceChangePercent: number
		volume: number
		weekPriceChangePercent: number
		avg1dayVolume1week: number
		monthPriceChangePercent: number
		avg1dayVolume1month: number
		// ____: number
	}

	interface TopNewsQuote extends BaseQuote {
		score: number
		pricePercent: number
		deltaVolumePercent: number
		toVolumePercent: number
	}

	type TimeSeriesQuote = Array<number>
	type TimeSeriesData = Array<TimeSeriesQuote>



	interface EwmaData {
		key: string
		period: number
		interval: number
		tkey?: string
		rate: number
		sum: number
		avg: number
	}
	interface EwmaOpts {
		cquotekey: string
		key: string
		period: number
		interval: number
	}

	/*==============================
	=            ERRORS            =
	==============================*/

	interface LogItem {
		message: string
		messages: string
		instance: number
		rkey: string
		stack: string
		stamp: number
	}
	interface LogItemExt extends LogItem {
		id: string
		type: string
		moment: string
	}

	/*===========================
	=            IEX            =
	===========================*/

	interface IexBatchResponse {
		[symbol: string]: {
			company: IexCompany
			earnings: IexEarningsResponse
			'effective-spread': Array<IexEffectiveSpread>
			financials: IexFinancialsResponse
			'open-close': IexOpenClose
			peers: Array<string>
			news: Array<IexNews>
			quote: IexQuote
			splits: Array<IexSplit>
			stats: IexStats
			'system-event': IexEventMessageData
			'trading-status': IexEventMessageData
			'op-halt-status': IexEventMessageData
			'ssr-status': IexEventMessageData
			'security-event': IexEventMessageData
		}
	}

	interface IexCompany {
		CEO: string
		companyName: string
		description: string
		exchange: string
		industry: string
		issueType: string
		sector: string
		symbol: string
		website: string
	}

	interface IexEarnings {
		EPSReportDate: string
		EPSSurpriseDollar: number
		actualEPS: number
		announceTime: string
		consensusEPS: number
		estimatedEPS: number
		fiscalEndDate: string
		fiscalPeriod: string
		numberOfEstimates: number
	}
	interface IexEarningsResponse {
		symbol: string
		earnings: Array<IexEarnings>
	}

	interface IexEffectiveSpread {
		effectiveQuoted: number
		effectiveSpread: number
		priceImprovement: number
		venue: string
		venueName: string
		volume: number
	}
	interface IexEffectiveSpreadItem {
		symbol: string
		spreads: Array<IexEffectiveSpread>
	}

	interface IexFinancials {
		cashChange: number
		cashFlow: number
		costOfRevenue: number
		currentAssets: number
		currentCash: number
		currentDebt: number
		grossProfit: number
		netIncome: number
		operatingExpense: number
		operatingGainsLosses: number
		operatingIncome: number
		operatingRevenue: number
		reportDate: string
		researchAndDevelopment: number
		shareholderEquity: number
		totalAssets: number
		totalCash: number
		totalDebt: number
		totalLiabilities: number
		totalRevenue: number
	}
	interface IexFinancialsResponse {
		symbol: string
		financials: Array<IexFinancials>
	}

	interface IexOpenClose {
		open: IexOpenCloseItem
		close: IexOpenCloseItem
	}
	interface IexOpenCloseItem {
		price: number
		time: number
	}

	interface IexQuote {
		avgTotalVolume: number
		calculationPrice: string
		change: number
		changePercent: number
		close: number
		closeTime: number
		companyName: string
		delayedPrice: number
		delayedPriceTime: number
		iexMarketPercent: number
		latestPrice: number
		latestSource: string
		latestTime: string
		latestUpdate: number
		latestVolume: number
		marketCap: number
		open: number
		openTime: number
		peRatio: number
		previousClose: number
		primaryExchange: string
		sector: string
		symbol: string
		week52High: number
		week52Low: number
		ytdChange: number
	}

	interface IexSplit {
		exDate: string
		declaredDate: string
		recordDate: string
		paymentDate: string
		ratio: number
		toFactor: number
		forFactor: number
	}

	interface IexStats {
		EBITDA: number
		EPSSurpriseDollar: number
		EPSSurprisePercent: number
		beta: number
		cash: number
		companyName: string
		consensusEPS: number
		day200MovingAvg: number
		day50MovingAvg: number
		day5ChangePercent: number
		debt: number
		dividendRate: number
		dividendYield: number
		exDividendDate: number
		float: number
		grossProfit: number
		insiderPercent: number
		institutionPercent: number
		latestEPS: number
		latestEPSDate: string
		marketcap: number
		month1ChangePercent: number
		month3ChangePercent: number
		month6ChangePercent: number
		numberOfEstimates: number
		peRatioHigh: number
		peRatioLow: number
		priceToBook: number
		priceToSales: number
		profitMargin: number
		returnOnAssets: number
		returnOnCapital: number
		returnOnEquity: number
		revenue: number
		revenuePerEmployee: number
		revenuePerShare: number
		sharesOutstanding: number
		shortDate: string
		shortInterest: number
		shortRatio: number
		symbol: string
		ttmEPS: number
		week52change: number
		week52high: number
		week52low: number
		year1ChangePercent: number
		year2ChangePercent: number
		year5ChangePercent: number
		ytdChangePercent: number
	}

	interface IexItem extends IexCompany, IexQuote, IexStats {
		peers: Array<string>
		stamp: number
	}

	interface IexTopsMessage {
		symbol: string
		marketPercent: number
		bidSize: number
		bidPrice: number
		askSize: number
		askPrice: number
		volume: number
		lastSalePrice: number
		lastSaleSize: number
		lastSaleTime: number
		lastUpdated: number
	}

	interface IexEventMessage {
		symbol: string
		messageType: string
		data: IexEventMessageData
	}
	interface IexEventMessageData {
		systemEvent: string
		status: string
		reason: string
		isHalted: boolean
		isSSR: boolean
		detail: string
		securityEvent: string
		timestamp: number
	}

	/*==============================
	=            ROUTES            =
	==============================*/

	interface RangesBody {
		symbols: Array<string>
		start?: number
		end?: number
		count?: number
	}

	interface GetSystemBody {
		init?: boolean
		sync?: boolean
		other?: boolean
		processes?: boolean
		services?: Array<string>
	}

	// type MarketsResponse = Array<{
	// 	mkquote: MarketCalcQuote
	// 	mklives: Array<MarketLiveQuote>
	// }>

	interface NewsResponse {
		commues: Array<YahooCommunityItem>
		news: Array<NewsItem>
	}

	interface ScreenerBody {
		sortBy: string
		descending: boolean
		count?: number
	}

	interface SymbolSbarItem {
		symbol: string
		name: string
		last_trade_price: number
		updated_at: string
		score: number
	}
	interface PostSearchSymbolRequest {
		query: string
	}
	interface PostSearchSymbolResponse {
		query: string
		results: Array<SymbolSbarItem>
	}

	interface GetNewsBody {
		symbol: string
	}
	interface GetNewsResponse {
		nitems: Array<NewsItem>
		diags: Array<TopNewsQuote>
	}

	interface PostSymbolsLogosRequest {
		symbols: Array<string>
	}
	interface PostSymbolsLogosItem {
		logo: string
		website: string
	}
	type PostSymbolsLogosResponse = Array<PostSymbolsLogosItem>

	interface GetHistoricalsBody {
		symbol: string
		tframe: string
	}
	type GetHistoricalsResponse = Array<HistQuote>

	interface GetRkeyBody {
		rkey: string
		symbols?: Array<string>
	}
	type GetRkeyResponse = Array<any>

	// interface PostIbSubmitOrderBody {
	// 	action: string
	// 	quantity: number
	// 	symbol: string
	// 	type: string
	// 	limit: number
	// 	stop: number
	// 	tif: string
	// 	rth: boolean
	// }
	// type PostIbSubmitOrderResponse = number

	interface GetLivesBody {
		symbol: string
	}
	type GetLivesResponse = Array<LiveQuote>

	interface GetSymbolRequest {
		symbol: string
	}
	interface GetSymbolResponse {
		symbol: string
		instrument: RobinhoodInstrument
		fundamentals: RobinhoodFundamentals
		quote: RobinhoodQuote
		lquote: LiveQuote
	}

	interface GetRedisResponse {
		info: any
		latdoctor: string
		memdoctor: string
		latency: Array<Array<any>>
		slowlog: Array<Array<any>>
	}

	interface GetMovementsBody {
		symbols?: Array<string>
		sortkey?: string
		bulls?: boolean
	}
	type GetMovementsResponse = Array<MovementItem>

	interface GetLquotesRequest {
		symbols: Array<string>
	}
	type GetLquotesResponse = Array<Array<LiveQuote>>

	interface GetLivesRangeBody {
		symbol: string
		start: number
		end: number
		minutes: boolean
	}
	type GetLivesRangeResponse = Array<LiveQuote>

	interface GetMinutesRangeBody {
		symbol: string
		start: number
		end: number
	}
	type GetMinutesRangeResponse = Array<LiveQuote>

	interface PostBacktestRangeRequest {
		symbol: string
		fromlow: number
		tohigh: number
		pastticks: number
	}
	interface PostBacktestRangeResponse {
		lquotes: Array<LiveQuote>
		cquote: CalcQuote
		eodquote: EodQuote
		eod5quotes: Array<EodVolumeQuote>
		emvquotes: EodVolumesMap
	}

	interface GetDiagsResponse {
		[rkey: string]: Array<string>
	}

	interface GetLogsBody {
		rkeys?: Array<string>
	}
	type GetLogsResponse = Array<Array<LogItem>>

	interface GetMetricsBody {
		rkeys?: Array<string>
	}
	interface GetMetricsResponse {
		gblocked?: boolean
		items: Array<MetricItem>
	}

	/*=============================
	=            YAHOO            =
	=============================*/

	interface YahooTimeFrames {
		[tframe: string]: Array<string>
	}

	interface StreamQuote {
		nano?: number
		symbol: string
		stamp: number
		ask: number
		asksize: number
		bid: number
		bidsize: number
		pricerealtime: number
		pricerealtimeafterhours: number
		change: number
		changerealtime: number
		changerealtimeafterhours: number
		disputedchangerealtimeafterhours: number
		percentchange: number
		percentchangerealtime: number
		percentchangerealtimeafterhours: number
		daylow: number
		dayhigh: number
		volume: number
		marketcap: number
		lastsaleprice: number
		lastsaletime: number
		disputedtimestampforstocks: number
		disputedtimestampforcommodities: number
	}

	interface YahooQuoteResponse {
		quoteResponse: {
			result: Array<YahooQuote>
			error: YahooError
		}
	}

	type YahooTypes = 'EQUITY' | 'ETF' | 'WARRANT' | 'INDEX'
	type YahooStates = 'PRE' | 'PREPRE' | 'REGULAR' | 'POSTPOST' | 'POST' | 'CLOSED'
	interface YahooQuote {
		stamp: number
		trailingAnnualDividendYield: number
		dividendDate: number
		trailingAnnualDividendRate: number
		trailingPE: number
		forwardPE: number
		priceToBook: number
		sharesOutstanding: number
		bookValue: number
		marketCap: number
		financialCurrency: string
		earningsTimestamp: number
		earningsTimestampStart: number
		earningsTimestampEnd: number
		epsTrailingTwelveMonths: number
		epsForward: number
		language: string
		quoteType: YahooTypes
		quoteSourceName: string
		currency: string
		market: string
		fiftyDayAverage: number
		fiftyDayAverageChange: number
		fiftyDayAverageChangePercent: number
		twoHundredDayAverage: number
		twoHundredDayAverageChange: number
		twoHundredDayAverageChangePercent: number
		sourceInterval: number
		exchangeTimezoneName: string
		exchangeTimezoneShortName: string
		gmtOffSetMilliseconds: number
		longName: string
		marketState: YahooStates
		regularMarketPrice: number
		regularMarketTime: number
		regularMarketChange: number
		/** ▶ price at 9:30am */
		regularMarketOpen: number
		regularMarketDayHigh: number
		regularMarketDayLow: number
		regularMarketVolume: number
		exchange: string
		priceHint: number
		regularMarketChangePercent: number
		regularMarketPreviousClose: number
		bid: number
		ask: number
		bidSize: number
		askSize: number
		openInterest: number
		messageBoardId: string
		fullExchangeName: string
		averageDailyVolume3Month: number
		averageDailyVolume10Day: number
		fiftyTwoWeekLowChange: number
		fiftyTwoWeekLowChangePercent: number
		fiftyTwoWeekHighChange: number
		fiftyTwoWeekHighChangePercent: number
		fiftyTwoWeekLow: number
		fiftyTwoWeekHigh: number
		trailingThreeMonthReturns: number
		trailingThreeMonthNavReturns: number
		shortName: string
		symbol: string
		tradeable: boolean
		postMarketChangePercent: number
		postMarketTime: number
		postMarketPrice: number
		postMarketChange: number
		preMarketChange: number
		preMarketChangePercent: number
		preMarketTime: number
		preMarketPrice: number
		exchangeDataDelayedBy: number
	}

	interface YahooSparksResponse {
		spark: {
			result: Array<YahooSparkResult>
			error: YahooError
		}
	}
	interface YahooSparkResult {
		symbol: string
		response: Array<YahooChartResult>
	}

	interface YahooChartResponse {
		chart: {
			result: Array<YahooChartResult>
			error: YahooError
		}
	}
	interface YahooChartResult {
		meta: {
			currency: string
			symbol: string
			exchangeName: string
			instrumentType: string
			firstTradeDate: number
			gmtoffset: number
			timezone: string
			previousClose: number
			scale: number
			currentTradingPeriod: {
				pre: YahooTradingPeriod
				regular: YahooTradingPeriod
				post: YahooTradingPeriod
			}
			tradingPeriods: Array<YahooTradingPeriod>
			dataGranularity: string
			validRanges: Array<string>
		}
		timestamp: Array<number>
		indicators: {
			quote: Array<YahooChartResultQuote>
		}
	}
	interface YahooTradingPeriod {
		timezone: string
		end: number
		start: number
		gmtoffset: number
	}
	interface YahooChartResultQuote {
		open: Array<number>
		close: Array<number>
		high: Array<number>
		low: Array<number>
		volume: Array<number>
	}

	interface YahooError {
		code: string
		description: string
	}

	interface YahooSummaryResponse {
		quoteSummary: {
			result: Array<YahooSummaryResult>
			error: YahooError
		}
	}

	interface YahooSummaryResult {
		symbol: string
		stamp: number
		assetProfile: YahooAssetProfile
		recommendationTrend: YahooRecommendationTrend
		cashflowStatementHistory: YahooCashflowStatementHistory
		indexTrend: YahooIndexTrend
		defaultKeyStatistics: YahooDefaultKeyStatistics
		industryTrend: YahooIndustryTrend
		incomeStatementHistory: YahooIncomeStatementHistory
		fundOwnership: YahooFundOwnership
		summaryDetail: YahooSummaryDetail
		insiderHolders: YahooInsiderHolders
		calendarEvents: YahooCalendarEvents
		upgradeDowngradeHistory: YahooUpgradeDowngradeHistory
		price: YahooPrice
		balanceSheetHistory: YahooBalanceSheetHistory
		earningsTrend: YahooEarningsTrend
		secFilings: YahooSecFilings
		institutionOwnership: YahooInstitutionOwnership
		majorHoldersBreakdown: YahooMajorHoldersBreakdown
		balanceSheetHistoryQuarterly: YahooBalanceSheetHistoryQuarterly
		earningsHistory: YahooEarningsHistory
		majorDirectHolders: YahooMajorDirectHolders
		summaryProfile: YahooSummaryProfile
		netSharePurchaseActivity: YahooNetSharePurchaseActivity
		insiderTransactions: YahooInsiderTransactions
		sectorTrend: YahooSectorTrend
		incomeStatementHistoryQuarterly: YahooIncomeStatementHistoryQuarterly
		cashflowStatementHistoryQuarterly: YahooCashflowStatementHistoryQuarterly
		earnings: YahooEarnings
		financialData: YahooFinancialData
	}

	interface YahooAssetProfile {
		website: string
	}

	interface YahooRecommendationTrend {

	}

	interface YahooCashflowStatementHistory {

	}

	interface YahooIndexTrend {

	}

	interface YahooDefaultKeyStatistics {

	}

	interface YahooIndustryTrend {

	}

	interface YahooIncomeStatementHistory {

	}

	interface YahooFundOwnership {

	}

	interface YahooSummaryDetail {

	}

	interface YahooInsiderHolders {

	}

	interface YahooCalendarEvents {

	}

	interface YahooUpgradeDowngradeHistory {

	}

	interface YahooPrice {
		symbol: string
	}

	interface YahooBalanceSheetHistory {

	}

	interface YahooEarningsTrend {

	}

	interface YahooSecFilings {

	}

	interface YahooInstitutionOwnership {

	}

	interface YahooMajorHoldersBreakdown {

	}

	interface YahooBalanceSheetHistoryQuarterly {

	}

	interface YahooEarningsHistory {

	}

	interface YahooMajorDirectHolders {

	}

	interface YahooSummaryProfile {
		website: string
	}

	interface YahooNetSharePurchaseActivity {

	}

	interface YahooInsiderTransactions {

	}

	interface YahooSectorTrend {

	}

	interface YahooIncomeStatementHistoryQuarterly {

	}

	interface YahooCashflowStatementHistoryQuarterly {

	}

	interface YahooEarnings {

	}

	interface YahooFinancialData {

	}

	/*============================
	=            NEWS            =
	============================*/

	interface NewsMoveItem {
		symbol: string
		rate: number
		live: boolean
	}

	interface NewsItem {
		id: string
		min: string
		symbol: string
		api: string
		title: string
		summary: string
		url: string
		source: string
		published: number
		tags: Array<string>
		stamp: number
	}

	interface IexNews {
		datetime: string
		headline: string
		source: string
		url: string
		summary: string
		related: string
	}

	interface TiingoNewsItem {
		source: string
		url: string
		tags: Array<string>
		title: string
		tickers: Array<string>
		id: number
		crawlDate: string
		description: string
		publishedDate: string
	}

	interface GoogleNewsResponse {
		clusters: Array<GoogleNewsCluster>
	}
	interface GoogleNewsCluster {
		nrel: number
		idx: number
		id: string
		lead_story_url: string
		a: Array<GoogleNewsItem>
		lead_story_doc_id: string
	}
	interface GoogleNewsItem {
		t: string
		u: string
		s: string
		sp: string
		d: string
		tt: string
		usg: string
		sru: string
	}

	interface YahooNewsResponse {
		feed: {
			entries: Array<YahooNewsItem>
		}
	}
	interface YahooNewsItem {
		symbol: string
		title: string
		link: string
		pubDate: string
		content: string
		contentSnippet: string
		guid: string
		isoDate: string
		stamp: number
	}

	interface StockrowNewsItem {
		id: string
		title: string
		source: string
		url: string
		published_at: string
		company_id: string
	}
	type StockrowNewsResponse = Array<{
		[date: string]: Array<StockrowNewsItem>
	}>

	interface YahooCommunityResponse {
		total: {
			count: number
		}
		canvassMessages: Array<YahooCanvasMessage>
	}
	interface YahooCanvasMessage {
		messageId: string
		contextId: string
		replyId: string
		index: string
		namespace: string
		tags: Array<string>
		details: {
			userText: string
			linkMessageDetails: Array<{
				url: string
				title: string
				description: string
				coverImages: Array<{
					url: string
					height: number
					width: number
				}>,
				attribution: {
					name: string
					source: string
				}
			}>
		}
		lastActivity: {
			activityAt: number
			activityAuthor: {
				guid: string
				image: {
					height: number
					url: string
					width: number
				}
				nickname: string
				userCategory: string
				userType: string
			}
		}
		meta: {
			author: {
				guid: string
				image: {
					height: number
					url: string
					width: number
				}
				nickname: string
				userCategory: string
				userType: string
			}
			contextInfo: {
				displayText: string
				url: string
			}
			createdAt: number
			locale: {
				lang: string
				region: string
			}
			sentimentLabel: string
			type: string
			updatedAt: number
			visibility: string
			mentions: Array<any>
		}
		reactionStats: {
			abuseVoteCount: number
			downVoteCount: number
			replyCount: number
			upVoteCount: number
		}
	}

	interface YahooCommunityItem {
		symbol: string
		stamp: number
		id: string
		boardId: string
		type: string
		created: number
		authorId: string
		authorName: string
		authorImage: string
		sentiment: string
		text: string
		linkUrl: string
		linkTitle: string
		linkDesc: string
		linkImage: string
		linkName: string
		tags: Array<string>
		upVote: number
		downVote: number
		replyId: string
		replies: Array<YahooCommunityItem>
		calcTags: Array<string>
		calcUps: number
		calcDowns: number
		calcReplies: number
	}



	/*============================
	=            CALC            =
	============================*/

	// interface CalcItem {
	// 	symbol: string
	// 	pc1d: number
	// 	pc1w: number
	// 	pc1m: number
	// 	pc3m: number
	// 	pc6m: number
	// 	pc1y: number
	// 	pc5y: number
	// 	avgSize: number
	// 	avgVolume: number
	// 	stamp: number
	// }

	/*=============================
	=            OTHER            =
	=============================*/

	interface SocketMessage {
		action?: string
		event?: string
		data?: any
	}

	interface Array<T> {
		forEachFast(fn: (value: T, index: number, array: Array<T>) => void, thisArg?: any): void
		mapFast<U>(fn: (value: T, index: number, array: Array<T>) => U, thisArg?: any): Array<U>
		filterFast(fn: (value: T, index: number, array: Array<T>) => boolean, thisArg?: any): Array<T>
		findFast(fn: (value: T, index: number, array: Array<T>) => boolean, thisArg?: any): T
		removeFast(fn: (value: T, index: number, array: Array<T>) => boolean, thisArg?: any): void
		// filterFast<S extends T>(fn: (value: T, index: number, array: Array<T>) => value is S, thisArg?: any): Array<S>
		// findFast<S extends T>(predicate: (this: void, value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined
		// findFast(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): T | undefined
	}

	// interface ObjectConstructor {
	// 	clean<T>(object: T): void
	// }

	interface ProfilingItem {
		id: string
		file: string
		name: string
		line: number
		count: number
		calls: number
	}

	interface ForecastOpts {
		nfutures?: number
		smooth?: number
		degree?: number
	}
	interface ForecastResults {
		pasts: Array<Array<number>>
		futures: Array<Array<number>>
	}

	interface LogoItem {
		symbol: string
		logo: string
		website: string
	}

	type MarketState = 'PREPRE' | 'PRE' | 'REGULAR' | 'POST' | 'POSTPOST' | 'CLOSED'
	interface MarketStamps {
		is_open: boolean
		date: string
		am4: number
		extopens: number
		opens: number
		closes: number
		extcloses: number
		pm8: number
	}

	interface CTBounds {
		fromlow: number
		tohigh: number
	}
	interface TBounds extends CTBounds { }

	interface DataPoint {
		value?: Array<number>
		itemStyle?: any
		lineStyle?: any
		areaStyle?: any
	}

	interface BacktestQuote {
		lastStamp: number
		bkindex: number
		action: string
		prevAction: string
		notes?: { [key: string]: number }
	}

	/*==================================
	=            STOCKTWITS            =
	==================================*/

	interface StockTwitsQuote {
		type: string
		timestamp: number
		server: string
		volume: number
		outcome: string
		last: number
		extendedhoursprice: number
		extendedhourstype: 'PreMarket' | 'PostMarket'
		symbol: string
		previousclose: number
		datetime: string
		high: number
		utcoffset: number
		extendedhourschange: number
		low: number
		percentchange: number
		extendedhourspercentchange: number
		extendedhoursdatetime: string
		identifier: string
		open: number
		change: number
		message: string
		easternextendedhoursdatetime: string
		easterndatetime: string
	}

	/*==========================
	=            IB            =
	==========================*/

	// interface OrderItem {
	// 	orderId: number
	// 	pubId: number
	// 	action: 'buy' | 'sell'
	// 	symbol: string
	// 	quantity: number
	// 	type: 'limit' | 'stop' | 'stopLimit' | 'market'
	// 	limit: number
	// 	stop: number
	// 	tif: string // 'goodUntilCancelled' | 'day' | 'open'
	// 	rth: boolean
	// }

	// interface CancelOrderItem {
	// 	orderId: number
	// 	pubId: number
	// }

	/*==============================
	=            WEBULL            =
	==============================*/

	interface WebullBase {
		nano?: number
		stamp: number
		symbol: string
		tickerId: number
	}

	interface WebullFastQuote extends WebullBase {
		change: number
		changeRatio: number
		close: number
		faStatus: string
		faTradeTime: string
		mktradeTime: string
		mkTradeTime: string
		pChRatio: number
		pChange: number
		pPrice: number
		price: number
		regionAlias: string
		regionId: number
		status: string
		tradeTime: string
		turnoverRate: number
	}

	interface WebullQuote extends WebullFastQuote {
		askList: Array<{ price: number, volume: number }>
		bidList: Array<{ price: number, volume: number }>
		ask: number
		askSize: number
		avg: number
		avgVol10D: number
		avgVol3M: number
		avgVolume: number
		baNum: number
		beta: number
		bid: number
		bidSize: number
		countryISOCode: string
		currency: string
		dataStatus: number
		dealNum: number
		dealAmount: number
		dividend: number
		eps: number
		exchangeId: number
		fiftyTwoWkHigh: number
		fiftyTwoWkHighCalc: number
		fiftyTwoWkLow: number
		fiftyTwoWkLowCalc: number
		high: number
		lfHigh: number
		lfLow: number
		limitDown: number
		limitUp: number
		lotSize: number
		low: number
		open: number
		pe: number
		preChange: number
		preChangeRatio: number
		preClose: number
		timeZone: string
		utcOffset: string
		vibrateRatio: number
		volume: number
		yield: number
		yrHigh: number
		yrLow: number
		forwardPe: number
		marketValue: number
		negMarketValue: number
		nextEarningDay: string
		outstandingShares: number
		projDps: number
		projEps: number
		projLtGrowthRate: number
		projPe: number
		projProfit: number
		projSales: number
		status0: string
		listStatus: number
		targetPrice: number
		totalShares: number
	}

	interface WebullTrade extends WebullBase {
		deal: number
		tradeBsFlag: string
		tradeTime: string
		volume: number
	}

	interface WebullStatus extends WebullBase {
		status: string
	}

	interface WebullTrends {
		hasMoreData: boolean
		regionId: number
		tickerId: number
		tickerKDatas: Array<WebullTrendsData>
		tickerType: number
		timeZone: string
		version: number
		zzz: string
	}
	interface WebullTrendsData {
		forwardKData: {
			close: number
			high: number
			low: number
			open: number
			preClose: number
		}
		noneKData: {
			close: number
			high: number
			low: number
			open: number
			preClose: number
		}
		tickerId: number
		tradeTime: string
	}

	interface WebullMqttMessage<T = any> {
		data: Array<T>
		type: string
	}
	interface WebullMqttTopic {
		tid: number
		type: string
	}

	interface WebullSearchResult {
		currencyId: number
		disExchangeCode: string
		disSymbol: string
		exchangeCode: string
		exchangeId: number
		exchangeName: string
		listStatus: number
		regionAlias: string
		regionAreaCode: number
		regionId: number
		regionName: string
		showCode: string
		tickerId: number
		tickerName: string
		tinyName: string
		tickerStatus: string
		tickerSymbol: string
		tickerType: number
		match: number
	}

	interface WebullCapitalFlowResponse {
		currencyId: number
		latest: {
			date: string
			item: WebullCapitalFlowItem
		}
	}

	interface WebullCapitalFlowItem {
		symbol: string
		stamp: number
		tickerId: number
		date: string
		largeInflow: number
		largeNetFlow: number
		largeOutflow: number
		majorInflow: number
		majorInflowRatio: number
		majorNetFlow: number
		majorOutflow: number
		majorOutflowRatio: number
		mediumInflow: number
		mediumInflowRatio: number
		mediumNetFlow: number
		mediumOutflow: number
		mediumOutflowRatio: number
		newLargeInflow: number
		newLargeInflowRatio: number
		newLargeNetFlow: number
		newLargeOutflow: number
		newLargeOutflowRatio: number
		retailInflow: number
		retailInflowRatio: number
		retailOutflow: number
		retailOutflowRatio: number
		smallInflow: number
		smallInflowRatio: number
		smallNetFlow: number
		smallOutflow: number
		smallOutflowRatio: number
		superLargeInflow: number
		superLargeNetFlow: number
		superLargeOutflow: number
	}

	interface WebullTickerMinutesChart {
		cleanDuration: number
		cleanTime: number
		code: number
		data: Array<{
			dates: Array<{
				avgShow: boolean
				end: string
				start: string
				type: string
			}>
			tickerMinutes: Array<string>
		}>
		preClose: number
		regionId: number
		status: string
		tickerType: number
		timeZone: string
		zzz: string
	}

	interface WebullNewsResponse {
		code: string
		news: Array<WebullNewsItem>
	}
	interface WebullNewsItem {
		id: number
		title: string
		sourceName: string
		newsTime: string
		summary: string
		newsUrl: string
		siteType: number
	}





	interface SystemInformationFn {
		fn: keyof SystemInformationData
		init: boolean
		sync: boolean
		other: boolean
		processes: boolean
		bad: boolean
	}

	interface SystemInformationProcess {
		command: string
		mem_rss: number
		mem_vsz: number
		name: string
		nice: number
		pcpu: number
		pcpus: number
		pcpuu: number
		pid: number
		pmem: number
		priority: number
		started: string
		state: string
		tty: string
		user: string
		stamp: number
	}

	interface SystemInformationData {
		baseboard: {
			assetTag: string
			manufacturer: string
			model: string
			serial: string
			version: string
		}
		battery: {
			currentcapacity: number
			cyclecount: number
			hasbattery: boolean
			ischarging: boolean
			maxcapacity: number
			percent: number
		}
		bios: {
			releaseDate: string
			revision: string
			vendor: string
			version: string
		}
		blockDevices: Array<{
			fstype: string
			identifier: string
			label: string
			model: string
			mount: string
			name: string
			physical: string
			protocol: string
			removable: boolean
			serial: string
			size: number
			type: string
			uuid: string
		}>
		cpu: {
			brand: string
			cache: {
				l1d: number
				l1i: number
				l2: number
				l3: number
			}
			cores: number
			family: number
			manufacturer: string
			model: number
			revision: string
			speed: number
			speedmax: number
			speedmin: number
			stepping: number
			vendor: string
		}
		cpuCache: {
			l1d: number
			l1i: number
			l2: number
			l3: number
		}
		cpuCurrentspeed: {
			avg: number
			max: number
			min: number
		}
		cpuFlags: string
		cpuTemperature: {
			cores: any[]
			main: number
			max: number
		}
		currentLoad: {
			avgload: number
			cpus: Array<{
				load: number
				load_idle: number
				load_irq: number
				load_nice: number
				load_system: number
				load_user: number
				raw_load: number
				raw_load_idle: number
				raw_load_irq: number
				raw_load_nice: number
				raw_load_system: number
				raw_load_user: number
			}>
			currentload: number
			currentload_idle: number
			currentload_irq: number
			currentload_nice: number
			currentload_system: number
			currentload_user: number
			raw_currentload: number
			raw_currentload_idle: number
			raw_currentload_irq: number
			raw_currentload_nice: number
			raw_currentload_system: number
			raw_currentload_user: number
		}
		diskLayout: Array<{
			bytesPerSector: number
			firmwareRevision: string
			interfaceType: string
			name: string
			sectorsPerTrack: number
			serialNum: string
			size: number
			totalCylinders: number
			totalHeads: number
			totalSectors: number
			totalTracks: number
			tracksPerCylinder: number
			type: string
			vendor: string
		}>
		disksIO: {
			ms: number
			rIO: number
			rIO_sec: number
			tIO: number
			tIO_sec: number
			wIO: number
			wIO_sec: number
		}
		fsSize: Array<{
			fs: string
			mount: string
			size: number
			type: string
			use: number
			used: number
		}>
		fsStats: {
			ms: number
			rx: number
			rx_sec: number
			tx: number
			tx_sec: number
			wx: number
			wx_sec: number
		}
		fullLoad: number
		graphics: {
			controllers: Array<{
				bus: string
				model: string
				vendor: string
				vram: number
				vramDynamic: boolean
			}>
			displays: Array<{
				builtin: boolean
				connection: string
				main: boolean
				model: string
				pixeldepth: number
				resolutionx: number
				resolutiony: number
				sizex: number
				sizey: number
			}>
		}
		inetChecksite: {
			ms: number
			ok: boolean
			status: number
			url: any
		}
		inetLatency: number
		mem: {
			active: number
			available: number
			buffcache: number
			free: number
			swapfree: number
			swaptotal: number
			swapused: number
			total: number
			used: number
		}
		memLayout: Array<{
			bank: string
			clockSpeed: number
			formFactor: string
			manufacturer: string
			partNum: string
			serialNum: string
			size: number
			type: string
			voltageConfigured: number
			voltageMax: number
			voltageMin: number
		}>
		networkConnections: Array<{
			localaddress: string
			localport: string
			peeraddress: string
			peerport: string
			protocol: string
			state: string
		}>
		networkInterfaceDefault: string
		networkInterfaces: Array<{
			iface: string
			internal: boolean
			ip4: string
			ip6: string
			mac: string
		}>
		networkStats: {
			iface: string
			ms: number
			operstate: string
			rx: number
			rx_sec: number
			tx: number
			tx_sec: number
		}
		osInfo: {
			arch: string
			codename: string
			distro: string
			hostname: string
			kernel: string
			logofile: string
			platform: string
			release: string
		}
		processes: {
			all: number
			blocked: number
			list: Array<SystemInformationProcess>
			running: number
			sleeping: number
			unknown: number
		}
		processLoad: {
			cpu: number
			mem: number
			pid: number
			proc: any
		}
		services: Array<{
			name: string
			pcpu: number
			pmem: number
			running: boolean
		}>
		shell: string
		system: {
			manufacturer: string
			model: string
			serial: string
			sku: string
			uuid: string
			version: string
		}
		time: {
			current: number
			timezone: string
			timezoneName: string
			uptime: number
		}
		users: Array<{
			command: string
			date: string
			ip: string
			time: string
			tty: string
			user: string
		}>
		version: string
		versions: {
			git: string
			grunt: string
			gulp: string
			kernel: string
			node: string
			npm: string
			openssl: string
			pm2: string
			tsc: string
			v8: string
			yarn: string
		}
	}



}



declare module 'node-forge' {
	var md: any
	var hmac: any
	var random: any
	var prime: any
	namespace pki {
		function privateKeyFromPem(pem: PEM): Key
	}
}







