
declare module 'ib' {

	/*=====================================================================================
	=            Time format must be 'yyyymmdd-hh:mm:ss' E.g. '20030702-14:55'            =
	=====================================================================================*/

	export = nib

	declare namespace nib {

		namespace contract {
			function cfd(symbol: string, exchange: string, currency: string): nib.Contract
			function combo(symbol: string, currency: string, exchange: string): nib.Contract
			function fop(symbol: string, expiry: any, strike: any, right: any, multiplier: any, exchange: string, currency: string): nib.Contract
			function forex(symbol: string, currency: string): nib.Contract
			function future(symbol: string, expiry: any, currency: string, exchange: string, multiplier: any): nib.Contract
			function index(symbol: string, expiry: any, currency: string, exchange: string): nib.Contract
			function option(symbol: string, expiry: any, strike: any, right: any, exchange: string, currency: string): nib.Contract
			function stock(symbol: string, exchange?: string, currency?: string): nib.Contract
		}

		namespace order {
			function limit(action: string, quantity: number, price: number, transmitOrder: boolean): nib.Order
			function market(action: string, quantity: number, transmitOrder: boolean, goodAfterTime: string, goodTillDate: string): nib.Order
			function marketClose(action: string, quantity: number, transmitOrder: boolean): nib.Order
			function stop(action: string, quantity: number, price: number, transmitOrder: boolean, parentId: number, tif: string): nib.Order
			function stopLimit(action: string, quantity: number, limitPrice: any, stopPrice: any, transmitOrder: boolean, parentId: number, tif: string): nib.Order
			function trailingStop(action: string, quantity: number, auxPrice: any, tif: string, transmitOrder: boolean, parentId: number): nib.Order
		}

		namespace util {
			function incomingToString(incoming: any): any
			function numberToString(number: any): any
			function outgoingToString(outgoing: any): any
			function tickTypeToString(tickType: any): any
		}

		interface Account {
			EodNetLiquidation: number
			AccountCode: string
			AccountOrGroup: string
			AccountReady: boolean
			AccountType: string
			AccruedCash: number
			AccruedDividend: number
			AvailableFunds: number
			Billable: number
			BuyingPower: number
			CashBalance: number
			CorporateBondValue: number
			Currency: string
			Cushion: number
			DayTradesRemaining: number
			EquityWithLoanValue: number
			ExcessLiquidity: number
			ExchangeRate: number
			FullAvailableFunds: number
			FullExcessLiquidity: number
			FullInitMarginReq: number
			FullMaintMarginReq: number
			FundValue: number
			FutureOptionValue: number
			FuturesPNL: number
			FxCashBalance: number
			GrossPositionValue: number
			Guarantee: number
			IndianStockHaircut: number
			InitMarginReq: number
			IssuerOptionValue: number
			LookAheadAvailableFunds: number
			LookAheadExcessLiquidity: number
			LookAheadInitMarginReq: number
			LookAheadMaintMarginReq: number
			LookAheadNextChange: number
			MaintMarginReq: number
			MoneyMarketFundValue: number
			MutualFundValue: number
			NetDividend: number
			NetLiquidation: number
			NetLiquidationByCurrency: number
			NetLiquidationUncertainty: number
			OptionMarketValue: number
			PASharesValue: number
			PostExpirationExcess: number
			PostExpirationMargin: number
			PreviousDayEquityWithLoanValue: number
			RealCurrency: string
			RealizedPnL: number
			RegTEquity: number
			RegTMargin: number
			SMA: number
			StockMarketValue: number
			TBillValue: number
			TBondValue: number
			TotalCashBalance: number
			TotalCashValue: number
			UnrealizedPnL: number
			WarrantValue: number
			WhatIfPMEnabled: boolean
			lastUpdate: number
			stamp: number
		}

		interface Contract {
			conId: number
			currency: string
			expiry: string
			localSymbol: string
			multiplier: string
			primaryExch: string
			right: string
			secType: string
			strike: number
			symbol: string
			tradingClass: string
		}

		interface Position {
			symbol: string
			position: number
			marketPrice: number
			marketValue: number
			avgCost: number
			unrealizedPNL: number
			realizedPNL: number
			stamp: number
		}
		type HashedPositions = { [symbol: string]: Position }

		type IbStatuses = 'ApiPending' | 'ApiCancelled' | 'PreSubmitted' | 'PendingCancel' | 'Cancelled' | 'Submitted' | 'Filled' | 'Inactive' | 'PendingSubmit' | 'Unknown'
		interface Status {
			active: boolean
			avgFillPrice: number
			clientId: number
			filled: number
			orderId: number
			lastFillPrice: number
			parentId: number
			permId: number
			remaining: number
			status: IbStatuses
			whyHeld: string
			stamp: number
		}
		interface State extends Status {
			commission: number
			commissionCurrency: string
			equityWithLoan: number
			initMargin: number
			maintMargin: number
			maxCommission: number
			minCommission: number
			warningText: string
		}
		interface Order extends State {
			pubId: number
			symbol: string
			stamp: number
			message: string
			createdAt: number
			filledAt: number
			cancelledAt: number
			account: string
			action: 'BUY' | 'SELL'
			algoStrategy: string
			allOrNone: boolean
			auctionStrategy: number
			auxPrice: number
			basisPoints: number
			basisPointsType: number
			blockOrder: boolean
			clearingAccount: string
			clearingIntent: string
			clientId: number
			continuousUpdate: number
			delta: number
			deltaNeutralAuxPrice: number
			deltaNeutralClearingAccount: string
			deltaNeutralClearingIntent: string
			deltaNeutralConId: number
			deltaNeutralDesignatedLocation: string
			deltaNeutralOpenClose: string
			deltaNeutralOrderType: string
			deltaNeutralSettlingFirm: string
			deltaNeutralShortSale: boolean
			deltaNeutralShortSaleSlot: number
			designatedLocation: string
			discretionaryAmt: number
			displaySize: number
			eTradeOnly: boolean
			exemptCode: number
			faGroup: string
			faMethod: string
			faPercentage: string
			faProfile: string
			firmQuoteOnly: boolean
			goodAfterTime: string
			goodTillDate: string
			hedgeType: string
			hidden: boolean
			lmtPrice: number
			minQty: number
			nbboPriceCap: number
			notHeld: boolean
			ocaGroup: string
			ocaType: number
			openClose: string
			optOutSmartRouting: boolean
			orderId: number
			orderRef: string
			orderType: string
			origin: number
			overridePercentageConstraints: boolean
			outsideRth: boolean
			parentId: number
			percentOffset: number
			permId: number
			referencePriceType: number
			rule80A: number
			scaleInitLevelSize: number
			scalePriceIncrement: number
			scaleSubsLevelSize: number
			settlingFirm: string
			shortSaleSlot: number
			startingPrice: number
			stockRangeLower: number
			stockRangeUpper: number
			stockRefPrice: number
			sweepToFill: boolean
			tif: string
			totalQuantity: number
			trailStopPrice: number
			trailingPercent: number
			transmit: boolean
			triggerMethod: number
			volatility: number
			volatilityType: number
			whatIf: boolean
		}

		interface Commission {
			commission: number
			currency: string
			execId: string
			realizedPNL: number
			yield: number
			yieldRedemptionDate: number
			stamp: number
		}
		interface Execution extends Commission {
			symbol: string
			createdAt: number
			acctNumber: string
			avgPrice: number
			clientId: number
			cumQty: number
			evMultiplier: number
			evRule: string
			exchange: string
			execId: string
			liquidation: number
			orderId: number
			orderRef: string
			permId: number
			price: number
			shares: number
			side: 'BOT' | 'SLD'
			time: string
			lastUpdate: number
			stamp: number
			position: nib.Position
		}

	}



	declare class nib extends NodeJS.EventEmitter {

		contract = nib.contract
		order = nib.order
		util = nib.util
		domain: any

		constructor(opts: {
			clientId?: number
			host?: string
			port?: number
		})

		calculateImpliedVolatility(reqId: number, contract: nib.Contract, optionPrice: number, underPrice: number): this
		calculateOptionPrice(reqId: number, contract: nib.Contract, volatility: number, underPrice: number): this
		cancelAccountSummary(reqId: number): this
		cancelCalculateImpliedVolatility(reqId: number): this
		cancelCalculateOptionPrice(reqId: number): this
		cancelFundamentalData(reqId: number): this
		cancelHistoricalData(tickerId: number): this
		cancelMktData(tickerId: number): this
		cancelMktDepth(tickerId: number): this
		cancelNewsBulletins(): this
		cancelOrder(id: number): this
		cancelPositions(): this
		cancelRealTimeBars(tickerId: number): this
		cancelScannerSubscription(tickerId: number): this
		connect(): this
		disconnect(): this
		exerciseOptions(tickerId: number, contract: nib.Contract, exerciseAction: any, exerciseQuantity: any, account: string, override: any): this
		placeOrder(id: number, contract: nib.Contract, order: nib.Order): this
		queryDisplayGroups(reqId: number): this
		replaceFA(faDataType: any, xml: any): this
		reqAccountSummary(reqId: number, group: string, tags: string | Array<string>): this
		reqAccountUpdates(subscribe: boolean, account: string): this
		reqAllOpenOrders(): this
		reqAutoOpenOrders(bAutoBind: boolean): this
		reqContractDetails(reqId: number, contract: nib.Contract): this
		reqCurrentTime(): this
		reqExecutions(reqId: number, filter: Object): this
		reqFundamentalData(reqId: number, contract: nib.Contract, reportType: any): this
		reqGlobalCancel(): this
		reqHeadTimestamp(reqId: number, contract: nib.Contract, whatToShow: any, useRTH: any, formatDate: any): void
		reqHistoricalData(tickerId: number, contract: nib.Contract, endDateTime: any, durationStr: any, barSizeSetting: any, whatToShow: any, useRTH: any, formatDate: any, keepUpToDate: any): this
		reqIds(numIds: number): this
		reqManagedAccts(): this
		reqMarketDataType(marketDataType: any): this
		reqMktData(tickerId: number, contract: nib.Contract, genericTickList: any, snapshot: any, regulatorySnapshot: any): this
		reqMktDepth(tickerId: number, contract: nib.Contract, numRows: any): this
		reqNewsBulletins(allMsgs: any): this
		reqOpenOrders(): this
		reqPositions(): this
		reqRealTimeBars(tickerId: number, contract: nib.Contract, barSize: any, whatToShow: any, useRTH: any): this
		reqScannerParameters(): this
		reqScannerSubscription(tickerId: number, subscription: any): this
		reqSecDefOptParams(reqId: number, underlyingSymbol: any, futFopExchange: any, underlyingSecType: any, underlyingConId: any): this
		requestFA(faDataType: any): this
		setServerLogLevel(logLevel: any): this
		subscribeToGroupEvents(reqId: number, groupId: any): this
		unsubscribeToGroupEvents(reqId: number): this
		updateDisplayGroup(reqId: number, contractInfo: any): this

		on(event: 'error', fn: (error: Error, data: { id: number, code: number }) => void): this
		on(event: 'result', fn: (event: string, args: Array<any>) => void): this
		on(event: 'all', fn: (event: string, args: Array<any>) => void): this

		on(event: 'connected', fn: () => void): this
		on(event: 'disconnected', fn: () => void): this
		on(event: 'received', fn: (tokens: any, data: any) => void): this
		on(event: 'sent', fn: (tokens: any, data: any) => void): this
		on(event: 'server', fn: (version: number, connectionTime: string) => void): this

		on(event: 'accountDownloadEnd', fn: (account: string) => void): this
		on(event: 'accountSummary', fn: (reqId: number, account: string, tag: string, value: string, currency: string) => void): this
		on(event: 'accountSummaryEnd', fn: (reqId: number) => void): this
		on(event: 'bondContractDetails', fn: (reqId: number, contract: nib.Contract) => void): this
		on(event: 'commissionReport', fn: (report: nib.Commission) => void): this
		on(event: 'contractDetails', fn: (reqId: number, contract: nib.Contract) => void): this
		on(event: 'contractDetailsEnd', fn: (reqId: number) => void): this
		on(event: 'currentTime', fn: (time) => void): this
		on(event: 'deltaNeutralValidation', fn: (reqId: number, underComp) => void): this
		on(event: 'execDetails', fn: (reqId: number, contract: nib.Contract, exec: nib.Execution) => void): this
		on(event: 'execDetailsEnd', fn: (reqId: number) => void): this
		on(event: 'fundamentalData', fn: (reqId: number, data) => void): this
		on(event: 'historicalData', fn: (reqId: number, date, open, high, low, close, volume, count, WAP, hasGaps) => void): this
		on(event: 'managedAccounts', fn: (account: string) => void): this
		on(event: 'marketDataType', fn: (reqId: number, marketDataType) => void): this
		on(event: 'nextValidId', fn: (orderId: number) => void): this
		on(event: 'openOrder', fn: (orderId: number, contract: nib.Contract, order: nib.Order, orderState: nib.State) => void): this
		on(event: 'openOrderEnd', fn: () => void): this
		on(event: 'orderStatus', fn: (orderId: number, status: nib.IbStatuses, filled: number, remaining: number, avgFillPrice: number, permId: number, parentId: number, lastFillPrice: number, clientId: number, whyHeld: string) => void): this
		on(event: 'position', fn: (account: string, contract: nib.Contract, pos: number, avgCost: number) => void): this
		on(event: 'positionEnd', fn: () => void): this
		on(event: 'realtimeBar', fn: (reqId: number, time, open, high, low, close, volume, wap, count) => void): this
		on(event: 'receiveFA', fn: (faDataType, xml) => void): this
		on(event: 'scannerData', fn: (tickerId, rank, contract: nib.Contract, distance, benchmark, projection, legsStr) => void): this
		on(event: 'scannerDataEnd', fn: (tickerId) => void): this
		on(event: 'scannerParameters', fn: (xml) => void): this
		on(event: 'tickEFP', fn: (tickerId, tickType, basisPoints, formattedBasisPoints, impliedFuturesPrice, holdDays, futureExpiry, dividendImpact, dividendsToExpiry) => void): this
		on(event: 'tickGeneric', fn: (tickerId, tickType, value) => void): this
		on(event: 'tickOptionComputation', fn: (tickerId, tickType, impliedVol, delta, optPrice, pvDividend, gamma, vega, theta, undPrice) => void): this
		on(event: 'tickPrice', fn: (tickerId, tickType, price, canAutoExecute) => void): this
		on(event: 'tickSize', fn: (tickerId, sizeTickType, size) => void): this
		on(event: 'tickSnapshotEnd', fn: (reqId: number) => void): this
		on(event: 'tickString', fn: (tickerId, tickType, value) => void): this
		on(event: 'updateAccountTime', fn: (timeStamp: string) => void): this
		on(event: 'updateAccountValue', fn: (key: string, value: string, currency: string, account: string) => void): this
		on(event: 'updateMktDepth', fn: (id, position, operation, side, price, size) => void): this
		on(event: 'updateMktDepthL2', fn: (id, position, marketMaker, operation, side, price, size) => void): this
		on(event: 'updateNewsBulletin', fn: (newsMsgId, newsMsgType, newsMessage, originatingExch) => void): this
		on(event: 'updatePortfolio', fn: (contract: nib.Contract, position: number, marketPrice: number, marketValue: number, averageCost: number, unrealizedPNL: number, realizedPNL: number, accountName: string) => void): this
		on(event: 'displayGroupList', fn: (id, list) => void): this
		on(event: 'displayGroupUpdated', fn: (id, contract: nib.Contract) => void): this

	}

}

