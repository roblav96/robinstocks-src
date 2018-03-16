//





interface YahooFundSummary {
	assetProfile: {
		address1: string
		companyOfficers: any[]
		longBusinessSummary: string
		maxAge: number
		phone: string
	}
	defaultKeyStatistics: {
		'52WeekChange': YahooFormattedValue
		SandP52WeekChange: YahooFormattedValue
		annualHoldingsTurnover: YahooFormattedValue
		annualReportExpenseRatio: YahooFormattedValue
		beta3Year: YahooFormattedValue
		bookValue: YahooFormattedValue
		category: any
		earningsQuarterlyGrowth: YahooFormattedValue
		enterpriseToEbitda: YahooFormattedValue
		enterpriseToRevenue: YahooFormattedValue
		enterpriseValue: YahooFormattedValue
		fiveYearAverageReturn: YahooFormattedValue
		forwardEps: YahooFormattedValue
		forwardPE: YahooFormattedValue
		fundFamily: any
		fundInceptionDate: YahooFormattedValue
		lastCapGain: YahooFormattedValue
		lastDividendValue: YahooFormattedValue
		lastFiscalYearEnd: YahooFormattedValue
		lastSplitDate: YahooFormattedValue
		lastSplitFactor: any
		legalType: any
		maxAge: number
		morningStarOverallRating: YahooFormattedValue
		morningStarRiskRating: YahooFormattedValue
		mostRecentQuarter: YahooFormattedValue
		netIncomeToCommon: YahooFormattedValue
		nextFiscalYearEnd: YahooFormattedValue
		pegRatio: YahooFormattedValue
		priceToBook: YahooFormattedValue
		priceToSalesTrailing12Months: YahooFormattedValue
		profitMargins: YahooFormattedValue
		revenueQuarterlyGrowth: YahooFormattedValue
		threeYearAverageReturn: YahooFormattedValue
		totalAssets: YahooFormattedValue
		trailingEps: YahooFormattedValue
		yield: YahooFormattedValue
		ytdReturn: YahooFormattedValue
	}
	fundPerformance: {
		annualTotalReturns: {
			returns: {
				annualValue: YahooFormattedValue
				year: string
			}[]
			returnsCat: {
				annualValue: YahooFormattedValue
				year: string
			}[]
		}
		loadAdjustedReturns: {
			fiveYear: YahooFormattedValue
			oneYear: YahooFormattedValue
			tenYear: YahooFormattedValue
			threeYear: YahooFormattedValue
		}
		maxAge: number
		pastQuarterlyReturns: {
			returns: {
				q1: YahooFormattedValue
				q2: YahooFormattedValue
				q3: YahooFormattedValue
				q4: YahooFormattedValue
				year: string
			}[]
		}
		performanceOverview: {
			asOfDate: YahooFormattedValue
			bestOneYrTotalReturn: YahooFormattedValue
			bestThreeYrTotalReturn: YahooFormattedValue
			fiveYrAvgReturnPct: YahooFormattedValue
			morningStarReturnRating: YahooFormattedValue
			numYearsDown: YahooFormattedValue
			numYearsUp: YahooFormattedValue
			oneYearTotalReturn: YahooFormattedValue
			threeYearTotalReturn: YahooFormattedValue
			worstOneYrTotalReturn: YahooFormattedValue
			worstThreeYrTotalReturn: YahooFormattedValue
			ytdReturnPct: YahooFormattedValue
		}
		performanceOverviewCat: {
			asOfDate: YahooFormattedValue
			bestOneYrTotalReturn: YahooFormattedValue
			bestThreeYrTotalReturn: YahooFormattedValue
			fiveYrAvgReturnPct: YahooFormattedValue
			morningStarReturnRating: YahooFormattedValue
			numYearsDown: YahooFormattedValue
			numYearsUp: YahooFormattedValue
			worstOneYrTotalReturn: YahooFormattedValue
			worstThreeYrTotalReturn: YahooFormattedValue
			ytdReturnPct: YahooFormattedValue
		}
		rankInCategory: {
			fiveYear: YahooFormattedValue
			oneMonth: YahooFormattedValue
			oneYear: YahooFormattedValue
			threeMonth: YahooFormattedValue
			threeYear: YahooFormattedValue
			ytd: YahooFormattedValue
		}
		riskOverviewStatistics: {
			riskRating: YahooFormattedValue
			riskStatistics: {
				alpha: YahooFormattedValue
				beta: YahooFormattedValue
				meanAnnualReturn: YahooFormattedValue
				rSquared: YahooFormattedValue
				sharpeRatio: YahooFormattedValue
				stdDev: YahooFormattedValue
				treynorRatio: YahooFormattedValue
				year: string
			}[]
		}
		riskOverviewStatisticsCat: {
			riskStatisticsCat: {
				alpha: YahooFormattedValue
				beta: YahooFormattedValue
				meanAnnualReturn: YahooFormattedValue
				rSquared: YahooFormattedValue
				sharpeRatio: YahooFormattedValue
				stdDev: YahooFormattedValue
				treynorRatio: YahooFormattedValue
				year: string
			}[]
		}
		trailingReturns: {
			fiveYear: YahooFormattedValue
			lastBearMkt: YahooFormattedValue
			lastBullMkt: YahooFormattedValue
			oneMonth: YahooFormattedValue
			oneYear: YahooFormattedValue
			tenYear: YahooFormattedValue
			threeMonth: YahooFormattedValue
			threeYear: YahooFormattedValue
			ytd: YahooFormattedValue
		}
		trailingReturnsCat: {
			fiveYear: YahooFormattedValue
			lastBearMkt: YahooFormattedValue
			lastBullMkt: YahooFormattedValue
			oneMonth: YahooFormattedValue
			oneYear: YahooFormattedValue
			tenYear: YahooFormattedValue
			threeMonth: YahooFormattedValue
			threeYear: YahooFormattedValue
			ytd: YahooFormattedValue
		}
		trailingReturnsNav: {
			fiveYear: YahooFormattedValue
			oneMonth: YahooFormattedValue
			oneYear: YahooFormattedValue
			tenYear: YahooFormattedValue
			threeMonth: YahooFormattedValue
			threeYear: YahooFormattedValue
			ytd: YahooFormattedValue
		}
	}
	fundProfile: {
		brokerages: string[]
		categoryName: string
		family: string
		feesExpensesInvestment: {
			annualHoldingsTurnover: YahooFormattedValue
			annualReportExpenseRatio: YahooFormattedValue
			deferredSalesLoad: YahooFormattedValue
			frontEndSalesLoad: YahooFormattedValue
			grossExpRatio: YahooFormattedValue
			netExpRatio: YahooFormattedValue
			projectionValues: {
				'10y': YahooFormattedValue
				'3y': YahooFormattedValue
				'5y': YahooFormattedValue
			}
			totalNetAssets: YahooFormattedValue
			twelveBOne: YahooFormattedValue
		}
		feesExpensesInvestmentCat: {
			annualHoldingsTurnover: YahooFormattedValue
			annualReportExpenseRatio: YahooFormattedValue
			deferredSalesLoad: YahooFormattedValue
			frontEndSalesLoad: YahooFormattedValue
			projectionValuesCat: {
				'10y': YahooFormattedValue
				'3y': YahooFormattedValue
				'5y': YahooFormattedValue
			}
			totalNetAssets: YahooFormattedValue
			twelveBOne: YahooFormattedValue
		}
		initAipInvestment: YahooFormattedValue
		initInvestment: YahooFormattedValue
		initIraInvestment: YahooFormattedValue
		legalType: any
		managementInfo: {
			managerBio: string
			managerName: string
			startdate: YahooFormattedValue
		}
		maxAge: number
		styleBoxUrl: string
		subseqAipInvestment: YahooFormattedValue
		subseqInvestment: YahooFormattedValue
		subseqIraInvestment: YahooFormattedValue
	}
	price: {
		averageDailyVolume10Day: YahooFormattedValue
		averageDailyVolume3Month: YahooFormattedValue
		circulatingSupply: YahooFormattedValue
		currency: string
		currencySymbol: string
		exchange: string
		exchangeName: string
		fromCurrency: any
		lastMarket: any
		longName: string
		marketCap: YahooFormattedValue
		marketState: string
		maxAge: number
		openInterest: YahooFormattedValue
		postMarketChange: YahooFormattedValue
		postMarketChangePercent: YahooFormattedValue
		postMarketPrice: YahooFormattedValue
		postMarketSource: string
		postMarketTime: number
		preMarketChange: YahooFormattedValue
		preMarketChangePercent: YahooFormattedValue
		preMarketPrice: YahooFormattedValue
		preMarketSource: string
		preMarketTime: number
		priceHint: YahooFormattedValue
		quoteSourceName: string
		quoteType: string
		regularMarketChange: YahooFormattedValue
		regularMarketChangePercent: YahooFormattedValue
		regularMarketDayHigh: YahooFormattedValue
		regularMarketDayLow: YahooFormattedValue
		regularMarketOpen: YahooFormattedValue
		regularMarketPreviousClose: YahooFormattedValue
		regularMarketPrice: YahooFormattedValue
		regularMarketSource: string
		regularMarketTime: number
		regularMarketVolume: YahooFormattedValue
		shortName: string
		strikePrice: YahooFormattedValue
		symbol: string
		underlyingSymbol: any
		volume24Hr: YahooFormattedValue
		volumeAllCurrencies: YahooFormattedValue
	}
	quoteType: {
		exchange: string
		firstTradeDateEpochUtc: number
		gmtOffSetMilliseconds: number
		longName: string
		maxAge: number
		quoteType: string
		shortName: string
		symbol: string
		timeZoneFullName: string
		timeZoneShortName: string
		underlyingSymbol: string
		uuid: string
	}
	stamp: number
	summaryDetail: {
		ask: YahooFormattedValue
		askSize: YahooFormattedValue
		averageDailyVolume10Day: YahooFormattedValue
		averageVolume: YahooFormattedValue
		averageVolume10days: YahooFormattedValue
		beta: YahooFormattedValue
		bid: YahooFormattedValue
		bidSize: YahooFormattedValue
		circulatingSupply: YahooFormattedValue
		dayHigh: YahooFormattedValue
		dayLow: YahooFormattedValue
		dividendRate: YahooFormattedValue
		dividendYield: YahooFormattedValue
		exDividendDate: YahooFormattedValue
		expireDate: YahooFormattedValue
		fiftyDayAverage: YahooFormattedValue
		fiftyTwoWeekHigh: YahooFormattedValue
		fiftyTwoWeekLow: YahooFormattedValue
		fiveYearAvgDividendYield: YahooFormattedValue
		forwardPE: YahooFormattedValue
		fromCurrency: any
		lastMarket: any
		marketCap: YahooFormattedValue
		maxAge: number
		navPrice: YahooFormattedValue
		open: YahooFormattedValue
		openInterest: YahooFormattedValue
		payoutRatio: YahooFormattedValue
		previousClose: YahooFormattedValue
		priceHint: YahooFormattedValue
		priceToSalesTrailing12Months: YahooFormattedValue
		regularMarketDayHigh: YahooFormattedValue
		regularMarketDayLow: YahooFormattedValue
		regularMarketOpen: YahooFormattedValue
		regularMarketPreviousClose: YahooFormattedValue
		regularMarketVolume: YahooFormattedValue
		strikePrice: YahooFormattedValue
		totalAssets: YahooFormattedValue
		trailingAnnualDividendRate: YahooFormattedValue
		trailingAnnualDividendYield: YahooFormattedValue
		trailingPE: YahooFormattedValue
		twoHundredDayAverage: YahooFormattedValue
		volume: YahooFormattedValue
		volume24Hr: YahooFormattedValue
		volumeAllCurrencies: YahooFormattedValue
		yield: YahooFormattedValue
		ytdReturn: YahooFormattedValue
	}
	summaryProfile: {
		address1: string
		companyOfficers: any[]
		longBusinessSummary: string
		maxAge: number
		phone: string
	}
	symbol: string
	topHoldings: {
		bondHoldings: {
			creditQuality: YahooFormattedValue
			creditQualityCat: YahooFormattedValue
			duration: YahooFormattedValue
			durationCat: YahooFormattedValue
			maturity: YahooFormattedValue
			maturityCat: YahooFormattedValue
		}
		bondPosition: YahooFormattedValue
		bondRatings: {
			bb: YahooFormattedValue
		}[]
		cashPosition: YahooFormattedValue
		convertiblePosition: YahooFormattedValue
		equityHoldings: {
			medianMarketCap: YahooFormattedValue
			medianMarketCapCat: YahooFormattedValue
			priceToBook: YahooFormattedValue
			priceToBookCat: YahooFormattedValue
			priceToCashflow: YahooFormattedValue
			priceToCashflowCat: YahooFormattedValue
			priceToEarnings: YahooFormattedValue
			priceToEarningsCat: YahooFormattedValue
			priceToSales: YahooFormattedValue
			priceToSalesCat: YahooFormattedValue
			threeYearEarningsGrowth: YahooFormattedValue
			threeYearEarningsGrowthCat: YahooFormattedValue
		}
		holdings: {
			holdingName: string
			holdingPercent: YahooFormattedValue
			symbol: string
		}[]
		maxAge: number
		otherPosition: YahooFormattedValue
		preferredPosition: YahooFormattedValue
		sectorWeightings: {
			realestate: YahooFormattedValue
		}[]
		stockPosition: YahooFormattedValue
	}
}



interface YahooFormattedValue {
	fmt: string
	longFmt: string
	raw: number
}








