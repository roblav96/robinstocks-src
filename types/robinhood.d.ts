// 

export { }



declare global {

	interface RhdbTable<T> {
		k: string
		v: T
	}

	type RobinhoodLogoMap = { [symbol: string]: string }

	/*===============================
	=            ACCOUNT            =
	===============================*/

	// interface RobinhoodAccountItem {
	// 	account: RobinhoodAccount
	// 	portfolio: RobinhoodAccount
	// 	positions: Array<RobinhoodAccount>
	// }

	type RobinhoodAccountResponse = RobinhoodPaginatedResponse<RobinhoodAccount>
	interface RobinhoodAccount {
		deactivated: boolean
		updated_at: string
		margin_balances: {
			day_trade_buying_power: number
			start_of_day_overnight_buying_power: number
			overnight_buying_power_held_for_orders: number
			cash_held_for_orders: number
			created_at: string
			start_of_day_dtbp: number
			day_trade_buying_power_held_for_orders: number
			overnight_buying_power: number
			marked_pattern_day_trader_date: string
			cash: number
			unallocated_margin_cash: number
			updated_at: string
			cash_available_for_withdrawal: number
			margin_limit: number
			outstanding_interest: number
			uncleared_deposits: number
			unsettled_funds: number
			day_trade_ratio: number
			overnight_ratio: number
		}
		portfolio: string
		cash_balances: string
		withdrawal_halted: boolean
		cash_available_for_withdrawal: number
		type: string
		sma: number
		sweep_enabled: boolean
		deposit_halted: boolean
		buying_power: number
		user: string
		max_ach_early_access_amount: number
		instant_eligibility: {
			updated_at: string
			reason: string
			reinstatement_date: string
			reversal: string
			state: string
		}
		cash_held_for_orders: number
		only_position_closing_trades: boolean
		url: string
		positions: string
		created_at: string
		cash: number
		sma_held_for_orders: number
		account_number: string
		uncleared_deposits: number
		unsettled_funds: number
	}

	interface RobinhoodPortfolio {
		unwithdrawable_grants: number
		account: string
		excess_maintenance_with_uncleared_deposits: number
		url: string
		excess_maintenance: number
		market_value: number
		withdrawable_amount: number
		last_core_market_value: number
		unwithdrawable_deposits: number
		extended_hours_equity: number
		excess_margin: number
		excess_margin_with_uncleared_deposits: number
		equity: number
		last_core_equity: number
		adjusted_equity_previous_close: number
		equity_previous_close: number
		start_date: number
		extended_hours_market_value: number
	}

	type RobinhoodPositionResponse = RobinhoodPaginatedResponse<RobinhoodPosition>
	interface RobinhoodPosition {
		account: string
		intraday_quantity: number
		intraday_average_buy_price: number
		url: string
		created_at: string
		updated_at: string
		shares_held_for_buys: number
		average_buy_price: number
		symbol: string
		instrument: string
		shares_held_for_sells: number
		quantity: number
	}

	interface RobinhoodPortfolioHistoricalStats {
		total_return: number
		span: string
		open_time: string
		interval: string
		bounds: string
		adjusted_open_equity: number
		adjusted_previous_close_equity: number
		previous_close_equity: number
		open_equity: number
	}

	interface RobinhoodPortfolioHistorical {
		adjusted_close_equity: number
		begins_at: string
		open_market_value: number
		session: string
		adjusted_open_equity: number
		close_market_value: number
		net_return: number
		open_equity: number
		close_equity: number
	}

	interface RobinhoodPortfolioHistoricals extends RobinhoodPortfolioHistoricalStats {
		historicals: Array<RobinhoodPortfolioHistorical>
	}

	/*================================
	=            EARNINGS            =
	================================*/

	interface RobinhoodEarningsRequest {
		symbols: Array<string>
		date: string
	}
	type RobinhoodEarningsResponse = Array<RobinhoodEarningItem>
	// interface RobinhoodEarningExtras {
	// 	symbol: string
	// 	name: string
	// 	fundamentals: RobinhoodFundamentals
	// 	lquote: LiveQuote
	// }
	interface RobinhoodEarningItem extends RobinhoodEarning {
		name: string
		logo: string
		fundamentals: RobinhoodFundamentals
		lquote: LiveQuote
	}

	/*============================
	=            NEWS            =
	============================*/

	interface RobinhoodNewsItem {
		url: string
		title: string
		source: string
		published_at: string
		author: string
		summary: string
		api_source: string
		updated_at: string
		instrument: string
	}

	/*=================================
	=            WATCHLIST            =
	=================================*/

	interface RobinhoodWatchlistItem {
		symbol: string
		created_at: string
		logo: string
		instrument: RobinhoodInstrument
		rhquote: RobinhoodQuote
		historicals: RobinhoodHistoricals
		position: RobinhoodPosition
	}
	interface RobinhoodWatchlist {
		url: string
		user: string
		name: string
	}
	interface RobinhoodWatchlistMeta {
		watchlist: string
		instrument: string
		created_at: string
		url: string
	}

	/*===============================
	=            CONVERT            =
	===============================*/

	interface RhConvertSymbolsBody {
		instruments: Array<string>
	}
	type RhConvertSymbolsResponse = Array<string>

	/*===============================
	=            RHLOGOS            =
	===============================*/

	type RhLogosResponse = RobinhoodLogoMap

	/*=============================
	=            LOGIN            =
	=============================*/

	interface RhLoginBody {
		uname: string
		pass: string
		mfa: string
	}
	interface RhLoginResponse {
		mfa?: boolean
		xid: string
		bytes: string
		token: string
		rhtoken: string
		tstamp: number
	}

	/*============================
	=            MISC            =
	============================*/

	interface RobinhoodErrorResponse {
		non_field_errors: Array<string>
	}

	interface RobinhoodProxyRequest {
		params?: any
		proxy: {
			url: string
			method: string
			rhtoken: boolean
			silent: boolean
		}
	}

	/*============================
	=            USER            =
	============================*/

	interface RobinhoodProfileAccount {
		user: RobinhoodUser
		basic: RobinhoodUserBasic
		investment: RobinhoodUserInvestment
		employment: RobinhoodUserEmployment
		additional: RobinhoodUserAdditional
		// applications: Array<RobinhoodApplication>
	}

	interface RobinhoodUser {
		username: string
		first_name: string
		last_name: string
		id_info: string
		url: string
		email_verified: boolean
		created_at: string
		basic_info: string
		email: string
		investment_profile: string
		id: string
		international_info: string
		employment: string
		additional_info: string
	}

	interface RobinhoodUserBasic {
		phone_number: string
		city: string
		number_dependents: number
		citizenship: string
		updated_at: string
		marital_status: string
		zipcode: string
		country_of_residence: string
		state: string
		date_of_birth: string
		user: string
		address: string
		tax_id_ssn: string
	}

	interface RobinhoodUserInvestment {
		annual_income: string
		investment_experience: string
		updated_at: string
		risk_tolerance: string
		total_net_worth: string
		liquidity_needs: string
		investment_objective: string
		source_of_funds: string
		user: string
		suitability_verified: boolean
		tax_bracket: string
		time_horizon: string
		liquid_net_worth: string
		investment_experience_collected: boolean
	}

	interface RobinhoodUserEmployment {
		employer_zipcode: number
		employment_status: string
		employer_address: string
		updated_at: string
		employer_name: string
		user: string
		years_employed: number
		employer_state: string
		employer_city: string
		occupation: string
	}

	interface RobinhoodUserAdditional {
		security_affiliated_firm_relationship: string
		security_affiliated_employee: boolean
		security_affiliated_address: string
		object_to_disclosure: boolean
		updated_at: string
		control_person: boolean
		stock_loan_consent_status: string
		sweep_consent: boolean
		user: string
		control_person_security_symbol: string
		security_affiliated_firm_name: string
		security_affiliated_person_name: string
	}

	type RobinhoodApplicationsResponse = RobinhoodPaginatedResponse<RobinhoodApplication>
	interface RobinhoodApplication {
		account_type: string
		url: string
		last_error: string
		state: string
		customer_type: string
		cip_questions: any
		user: string
		ready: boolean
	}

	/*================================
	=            EARNINGS            =
	================================*/

	interface RobinhoodEarning {
		symbol: string // Ticker symbol of the security
		instrument: string // Link back to this security's instrument data
		year: number // Year this earning was announced
		quarter: number // Quarter this earning was announced
		eps: { // Earnings per share announcement
			estimate: number // General guesstimate before announcement
			actual: number // Actual EPS released
		}
		report: { // Report meta data
			date: string // ISO 8601 formatted date, 'YYYY-MM-DD'
			timing: string // 'am' or 'pm'
			verified: boolean // Is it legit?
		}
		call: { // Original call conference meta data
			datetime: string // ISO 8601 formatted date, 'YYYY-MM-DDTHH:mm:ss.sssZ'
			broadcast_url: string // Web url to the broadcast
			replay_url: string // Web url to the reply
		}
	}

	interface RobinhoodMarket {
		website: string
		city: string
		name: string
		url: string
		country: string
		todays_hours: string
		operating_mic: string
		timezone: string
		acronym: string
		mic: string
	}

	interface RobinhoodMarketHours {
		closes_at: string
		extended_opens_at: string
		next_open_hours: string
		previous_open_hours: string
		is_open: boolean
		extended_closes_at: string
		date: string
		opens_at: string
	}

	interface RobinhoodPrice {
		symbol?: string
		price: number
		size: number
		instrument_id: string
		updated_at: string
		stamp?: number
	}

	interface RobinhoodQuote {
		has_traded: boolean
		ask_price: number
		ask_size: number
		bid_price: number
		bid_size: number
		last_trade_price: number
		last_extended_hours_trade_price: number
		previous_close: number
		adjusted_previous_close: number
		previous_close_date: string
		symbol: string
		trading_halted: boolean
		last_trade_price_source: string
		updated_at: string
		instrument: string
		stamp: number
	}

	type RobinhoodHistoricalSpans = 'day' | 'week' | 'month' | 'year'
	interface RobinhoodHistoricalStats {
		quote: string
		symbol: string
		interval: string
		span: RobinhoodHistoricalSpans
		bounds: string
		previous_close_price: number
		open_price: number
		open_time: string
		instrument: string
		stamp: number
	}
	interface RobinhoodHistoricals extends RobinhoodHistoricalStats {
		historicals: Array<RobinhoodHistorical>
	}
	interface RobinhoodHistorical {
		begins_at: string
		open_price: number
		close_price: number
		high_price: number
		low_price: number
		volume: number
		session: string
		interpolated: boolean
	}

	interface RobinhoodPaginatedResponse<T = any> {
		previous: string
		results: Array<T>
		next: string
	}

	type RobinhoodTypes = 'wrt' | 'pfd' | 'stock' | 'etp' | 'unit' | 'adr' | 'nyrs' | 'right' | 'cef' | 'reit' | 'mlp' | 'tracking' | 'lp' | 'rlt'

	interface RobinhoodInstrument {
		min_tick_size: number
		type: RobinhoodTypes
		splits: string
		margin_initial_ratio: number
		simple_name: string
		url: string
		quote: string
		symbol: string
		bloomberg_unique: string
		list_date: string
		fundamentals: string
		state: 'unlisted' | 'active' | 'inactive'
		country: string
		day_trade_ratio: number
		tradeable: boolean
		tradability: 'untradable' | 'tradable' | 'position_closing_only'
		maintenance_ratio: number
		id: string
		market: string
		name: string
		stamp: number
		tickerid: number
		mic: string
		acronym: string
		ticker_name: string
		tiny_name: string
	}

	interface RobinhoodFundamentals {
		open: number
		high: number
		low: number
		volume: number
		average_volume: number
		high_52_weeks: number
		dividend_yield: number
		low_52_weeks: number
		market_cap: number
		pe_ratio: number
		description: string
		instrument: string
		ceo: string
		headquarters_city: string
		headquarters_state: string
		num_employees: number
		year_founded: number
		symbol: string
		stamp: number
	}

	interface RobinhoodMover {
		instrument_url: string
		symbol: string
		updated_at: string
		price_movement: {
			market_hours_last_movement_pct: number
			market_hours_last_price: number
		}
		description: string
	}
	type RobinhoodMoversResponse = RobinhoodPaginatedResponse<RobinhoodMover>

	interface RobinhoodLoginResponse {
		// token: string
		mfa_type: string
		mfa_required: boolean
		mfa_code: string
		backup_code: string
		access_token: string
		expires_in: number
		token_type: string
		scope: string
		refresh_token: string
	}

}




