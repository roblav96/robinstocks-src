//

import * as Template from './ib.account.html?style=./ib.account.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import moment from 'moment'
import lockr from 'lockr'
import humanize from 'humanize-plus'
import rx from 'rxjs/Rx'
import nib from 'ib'
import Ib from './ib'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'



@Template
@Vts.Component(<VueComponent>{
	name: 'IbAccount',
} as any)
export default class IbAccount extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	get parent() { return this.$parent as Ib }

	created() {

	}

	mounted() {

	}

	beforeDestroy() {
		this.syncStamps.cancel()
	}

	syncStamps = _.debounce(this.$forceUpdate, 1000, { leading: false, trailing: true })



	search = ''
	get account() { return this.$store.state.ib.account }
	get v_account() {
		this.syncStamps()
		let account = {} as nib.Account
		let search = utils.cleanSearch(this.search)
		Object.keys(this.account).sort(utils.sortAlphabetically).forEachFast(key => {
			let value = this.account[key]
			let desc = this.v_desc(key).join(' ')
			let cleaned = utils.cleanSearch([key, value, desc].join(' '))
			if (!search || cleaned.indexOf(search) >= 0) account[key] = value;
		})
		return account
	}

	parse_key(key: string) {
		return _.startCase(key)
	}
	parse_value(value: any, key: string) {
		key = key.toLowerCase().trim()
		if (['lookaheadnextchange', 'lastupdate', 'stamp'].indexOf(key) >= 0) {
			if (key == 'lookaheadnextchange') value = value * 1000;
			return utils.from_now(value)
		}
		if (key.indexOf('daytrades') >= 0 && value == -1) return Infinity;
		if (Number.isFinite(value)) return utils.formatNumber(value, 2);
		return value
	}
	v_desc(key: string) {
		let descs = []
		if (IB_ACCOUNT_DESC_1[key]) descs.push(IB_ACCOUNT_DESC_1[key]);
		if (IB_ACCOUNT_DESC_2[key]) descs.push(IB_ACCOUNT_DESC_2[key]);
		return descs
	}



}

































const IB_ACCOUNT_DESC_1 = {
	'AccountType': `Identifies the IB account structure`,
	'NetLiquidation': `The basis for determining the price of the assets in your account. Total cash value + stock value + options value + bond value`,
	'TotalCashValue': `Total cash balance recognized at the time of trade + futures PNL`,
	'SettledCash': `Cash recognized at the time of settlement - purchases at the time of trade - commissions - taxes - fees`,
	'AccruedCash': `Total accrued cash value of stock, commodities and securities`,
	'BuyingPower': `Buying power serves as a measurement of the dollar value of securities that one may purchase in a securities account without depositing additional funds`,
	'EquityWithLoanValue': `Forms the basis for determining whether a client has the necessary assets to either initiate or maintain security positions. Cash + stocks + bonds + mutual funds`,
	'PreviousEquityWithLoanValue': `Marginable Equity with Loan value as of 16:00 ET the previous day`,
	'GrossPositionValue': `The sum of the absolute value of all stock and equity option positions`,
	'RegTEquity': `Regulation T equity for universal account`,
	'RegTMargin': `Regulation T margin for universal account`,
	'SMA': `Special Memorandum Account: Line of credit created when the market value of securities in a Regulation T account increase in value`,
	'InitMarginReq': `Initial Margin requirement of whole portfolio`,
	'MaintMarginReq': `Maintenance Margin requirement of whole portfolio`,
	'AvailableFunds': `This value tells what you have available for trading`,
	'ExcessLiquidity': `This value shows your margin cushion, before liquidation`,
	'Cushion': `Excess liquidity as a percentage of net liquidation value`,
	'FullInitMarginReq': `Initial Margin of whole portfolio with no discounts or intraday credits`,
	'FullMaintMarginReq': `Maintenance Margin of whole portfolio with no discounts or intraday credits`,
	'FullAvailableFunds': `Available funds of whole portfolio with no discounts or intraday credits`,
	'FullExcessLiquidity': `Excess liquidity of whole portfolio with no discounts or intraday credits`,
	'LookAheadNextChange': `Time when look-ahead values take effect`,
	'LookAheadInitMarginReq': `Initial Margin requirement of whole portfolio as of next period's margin change`,
	'LookAheadMaintMarginReq': `Maintenance Margin requirement of whole portfolio as of next period's margin change`,
	'LookAheadAvailableFunds': `This value reflects your available funds at the next margin change`,
	'LookAheadExcessLiquidity': `This value reflects your excess liquidity at the next margin change`,
	'HighestSeverity': `A measure of how close the account is to liquidation`,
	'DayTradesRemaining': `The Number of Open/Close trades a user could put on before Pattern Day Trading is detected. A value of "-1" means that the user can put on unlimited day trades.`,
	'Leverage': `GrossPositionValue / NetLiquidation`,
}

const IB_ACCOUNT_DESC_2 = {
	'AccountCode': `The account ID number`,
	'AccountOrGroup': `"All" to return account summary data for all accounts, or set to a specific Advisor Account Group name that has already been created in TWS Global Configuration`,
	'AccountReady': `For internal use only`,
	'AccountType': `Identifies the IB account structure`,
	'AccruedCash': `Total accrued cash value of stock, commodities and securities`,
	'AccruedCash-C': `Reflects the current's month accrued debit and credit interest to date, updated daily in commodity segment`,
	'AccruedCash-S': `Reflects the current's month accrued debit and credit interest to date, updated daily in security segment`,
	'AccruedDividend': `Total portfolio value of dividends accrued`,
	'AccruedDividend-C': `Dividends accrued but not paid in commodity segment`,
	'AccruedDividend-S': `Dividends accrued but not paid in security segment`,
	'AvailableFunds': `This value tells what you have available for trading`,
	'AvailableFunds-C': `Net Liquidation Value - Initial Margin`,
	'AvailableFunds-S': `Equity with Loan Value - Initial Margin`,
	'Billable': `Total portfolio value of treasury bills`,
	'Billable-C': `Value of treasury bills in commodity segment`,
	'Billable-S': `Value of treasury bills in security segment`,
	'BuyingPower': `Cash Account: Minimum (Equity with Loan Value, Previous Day Equity with Loan Value)-Initial Margin, Standard Margin Account: Minimum (Equity with Loan Value, Previous Day Equity with Loan Value) - Initial Margin *4`,
	'CashBalance': `Cash recognized at the time of trade + futures PNL`,
	'CorporateBondValue': `Value of non-Government bonds such as corporate bonds and municipal bonds`,
	'Currency': `Open positions are grouped by currency`,
	'Cushion': `Excess liquidity as a percentage of net liquidation value`,
	'DayTradesRemaining': `Number of Open/Close trades one could do before Pattern Day Trading is detected`,
	'DayTradesRemainingT+1': `Number of Open/Close trades one could do tomorrow before Pattern Day Trading is detected`,
	'DayTradesRemainingT+2': `Number of Open/Close trades one could do two days from today before Pattern Day Trading is detected`,
	'DayTradesRemainingT+3': `Number of Open/Close trades one could do three days from today before Pattern Day Trading is detected`,
	'DayTradesRemainingT+4': `Number of Open/Close trades one could do four days from today before Pattern Day Trading is detected`,
	'EquityWithLoanValue': `Forms the basis for determining whether a client has the necessary assets to either initiate or maintain security positions`,
	'EquityWithLoanValue-C': `Cash account: Total cash value + commodities option value - futures maintenance margin requirement + minimum (0, futures PNL) Margin account: Total cash value + commodities option value - futures maintenance margin requirement`,
	'EquityWithLoanValue-S': `Cash account: Settled Cash Margin Account: Total cash value + stock value + bond value + (non-U.S. & Canada securities options value)`,
	'ExcessLiquidity': `This value shows your margin cushion, before liquidation`,
	'ExcessLiquidity-C': `Equity with Loan Value - Maintenance Margin`,
	'ExcessLiquidity-S': `Net Liquidation Value - Maintenance Margin`,
	'ExchangeRate': `The exchange rate of the currency to your base currency`,
	'FullAvailableFunds': `Available funds of whole portfolio with no discounts or intraday credits`,
	'FullAvailableFunds-C': `Net Liquidation Value - Full Initial Margin`,
	'FullAvailableFunds-S': `Equity with Loan Value - Full Initial Margin`,
	'FullExcessLiquidity': `Excess liquidity of whole portfolio with no discounts or intraday credits`,
	'FullExcessLiquidity-C': `Net Liquidation Value - Full Maintenance Margin`,
	'FullExcessLiquidity-S': `Equity with Loan Value - Full Maintenance Margin`,
	'FullInitMarginReq': `Initial Margin of whole portfolio with no discounts or intraday credits`,
	'FullInitMarginReq-C': `Initial Margin of commodity segment's portfolio with no discounts or intraday credits`,
	'FullInitMarginReq-S': `Initial Margin of security segment's portfolio with no discounts or intraday credits`,
	'FullMaintMarginReq': `Maintenance Margin of whole portfolio with no discounts or intraday credits`,
	'FullMaintMarginReq-C': `Maintenance Margin of commodity segment's portfolio with no discounts or intraday credits`,
	'FullMaintMarginReq-S': `Maintenance Margin of security segment's portfolio with no discounts or intraday credits`,
	'FundValue': `Value of funds value (money market funds + mutual funds)`,
	'FutureOptionValue': `Real-time market-to-market value of futures options`,
	'FuturesPNL': `Real-time changes in futures value since last settlement`,
	'FxCashBalance': `Cash balance in related IB-UKL account`,
	'GrossPositionValue': `Gross Position Value in securities segment`,
	'GrossPositionValue-S': `Long Stock Value + Short Stock Value + Long Option Value + Short Option Value`,
	'IndianStockHaircut': `Margin rule for IB-IN accounts`,
	'InitMarginReq': `Initial Margin requirement of whole portfolio`,
	'InitMarginReq-C': `Initial Margin of the commodity segment in base currency`,
	'InitMarginReq-S': `Initial Margin of the security segment in base currency`,
	'IssuerOptionValue': `Real-time mark-to-market value of Issued Option`,
	'Leverage-S': `GrossPositionValue / NetLiquidation in security segment`,
	'LookAheadNextChange': `Time when look-ahead values take effect`,
	'LookAheadAvailableFunds': `This value reflects your available funds at the next margin change`,
	'LookAheadAvailableFunds-C': `Net Liquidation Value - look ahead Initial Margin`,
	'LookAheadAvailableFunds-S': `Equity with Loan Value - look ahead Initial Margin`,
	'LookAheadExcessLiquidity': `This value reflects your excess liquidity at the next margin change`,
	'LookAheadExcessLiquidity-C': `Net Liquidation Value - look ahead Maintenance Margin`,
	'LookAheadExcessLiquidity-S': `Equity with Loan Value - look ahead Maintenance Margin`,
	'LookAheadInitMarginReq': `Initial margin requirement of whole portfolio as of next period's margin change`,
	'LookAheadInitMarginReq-C': `Initial margin requirement as of next period's margin change in the base currency of the account`,
	'LookAheadInitMarginReq-S': `Initial margin requirement as of next period's margin change in the base currency of the account`,
	'LookAheadMaintMarginReq': `Maintenance margin requirement of whole portfolio as of next period's margin change`,
	'LookAheadMaintMarginReq-C': `Maintenance margin requirement as of next period's margin change in the base currency of the account`,
	'LookAheadMaintMarginReq-S': `Maintenance margin requirement as of next period's margin change in the base currency of the account`,
	'MaintMarginReq': `Maintenance Margin requirement of whole portfolio`,
	'MaintMarginReq-C': `Maintenance Margin for the commodity segment`,
	'MaintMarginReq-S': `Maintenance Margin for the security segment`,
	'MoneyMarketFundValue': `Market value of money market funds excluding mutual funds`,
	'MutualFundValue': `Market value of mutual funds excluding money market funds`,
	'NetDividend': `The sum of the Dividend Payable/Receivable Values for the securities and commodities segments of the account`,
	'NetLiquidation': `The basis for determining the price of the assets in your account`,
	'NetLiquidation-C': `Total cash value + futures PNL + commodities options value`,
	'NetLiquidation-S': `Total cash value + stock value + securities options value + bond value`,
	'NetLiquidationByCurrency': `Net liquidation for individual currencies`,
	'OptionMarketValue': `Real-time mark-to-market value of options`,
	'PASharesValue': `Personal Account shares value of whole portfolio`,
	'PASharesValue-C': `Personal Account shares value in commodity segment`,
	'PASharesValue-S': `Personal Account shares value in security segment`,
	'PostExpirationExcess': `Total projected "at expiration" excess liquidity`,
	'PostExpirationExcess-C': `Provides a projected "at expiration" excess liquidity based on the soon-to expire contracts in your portfolio in commodity segment`,
	'PostExpirationExcess-S': `Provides a projected "at expiration" excess liquidity based on the soon-to expire contracts in your portfolio in security segment`,
	'PostExpirationMargin': `Total projected "at expiration" margin`,
	'PostExpirationMargin-C': `Provides a projected "at expiration" margin value based on the soon-to expire contracts in your portfolio in commodity segment`,
	'PostExpirationMargin-S': `Provides a projected "at expiration" margin value based on the soon-to expire contracts in your portfolio in security segment`,
	'PreviousDayEquityWithLoanValue': `Marginable Equity with Loan value as of 16:00 ET the previous day in securities segment`,
	'PreviousDayEquityWithLoanValue-S': `IMarginable Equity with Loan value as of 16:00 ET the previous day`,
	'RealCurrency': `Open positions are grouped by currency`,
	'RealizedPnL': `Shows your profit on closed positions, which is the difference between your entry execution cost and exit execution costs, or (execution price + commissions to open the positions) - (execution price + commissions to close the position)`,
	'RegTEquity': `Regulation T equity for universal account`,
	'RegTEquity-S': `Regulation T equity for security segment`,
	'RegTMargin': `Regulation T margin for universal account`,
	'RegTMargin-S': `Regulation T margin for security segment`,
	'SMA': `Line of credit created when the market value of securities in a Regulation T account increase in value`,
	'SMA-S': `Regulation T Special Memorandum Account balance for security segment`,
	'SegmentTitle': `Account segment name`,
	'StockMarketValue': `Real-time mark-to-market value of stock`,
	'TBondValue': `Value of treasury bonds`,
	'TBillValue': `Value of treasury bills`,
	'TotalCashBalance': `Total Cash Balance including Future PNL`,
	'TotalCashValue': `Total cash value of stock, commodities and securities`,
	'TotalCashValue-C': `CashBalance in commodity segment`,
	'TotalCashValue-S': `CashBalance in security segment`,
	'TradingType-S': `Account Type`,
	'UnrealizedPnL': `The difference between the current market value of your open positions and the average cost, or Value - Average Cost`,
	'WarrantValue': `Value of warrants`,
	'WhatIfPMEnabled': `To check projected margin requirements under Portfolio Margin model`,
}
Object.keys(IB_ACCOUNT_DESC_2).forEachFast(function(k) {
	if (IB_ACCOUNT_DESC_1[k] && IB_ACCOUNT_DESC_2[k]) {
		let a = (IB_ACCOUNT_DESC_1[k] as string).toLowerCase()
		let b = (IB_ACCOUNT_DESC_2[k] as string).toLowerCase()
		if (a == b) delete IB_ACCOUNT_DESC_2[k];
		if (a.indexOf(b) >= 0) delete IB_ACCOUNT_DESC_2[k];
		// if (b.indexOf(a) >= 0) delete IB_ACCOUNT_DESC_2[k];
	}
})

// const IB_ACCOUNT_DESC = IB_ACCOUNT_DESC_1 as any
// // Object.assign(IB_ACCOUNT_DESC, IB_ACCOUNT_DESC_1)
// Object.keys(IB_ACCOUNT_DESC_2).forEachFast(function(k) {
// 	if (IB_ACCOUNT_DESC[k] == IB_ACCOUNT_DESC_2[k]) return;
// 	if (IB_ACCOUNT_DESC[k]) return IB_ACCOUNT_DESC[k] = IB_ACCOUNT_DESC[k] + ' /*=====AND/OR======*/ ' + IB_ACCOUNT_DESC_2[k];
// 	IB_ACCOUNT_DESC[k] = IB_ACCOUNT_DESC_2[k]
// })

