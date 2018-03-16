// 

public interface UserApiInterface {
	@C2971o(a = "api/user/settings")
	b < Void > addOrUpdateSettings(@C2957a ab abVar);

	@C2971o(a = "api/wallet/user/drawCash")
	b < C2776a < String >> drawCash(@C2957a q qVar);

	@C2962f(a = "api/user/messages/v2/pageList")
	b < ArrayList < C2778c >> getMessagesByTypeV2(@C2977u Map < String, String > map);

	@C2962f(a = "api/wallet/user/detail")
	b < C2776a < C2785b < C2784a >>> getMyWalletHistory(@C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/wallet/user/summary")
	b < C2776a < C2786c >> getMyWalletSummary();

	@C2962f(a = "api/user/messages/userMessageStatistic")
	b < C2782g > getUserMessageStatistic();

	@C2962f(a = "api/user/settings")
	b < C2783a > querySettings();
}

public interface PassportApiInterface {
	@C2972p(a = "api/passport/login/resetPwd")
	b < String > changePassword(@C2957a ab abVar);

	@C2962f(a = "api/passport/verificationCode/checkCode")
	b < C2766d > checkVerificationCode(@C2977u Map < String, String > map);

	@C2962f(a = "sns/oauth2/access_token")
	b < C2768f > getWeChatAccessTokenAndOpenId(@C2977u Map < String, String > map);

	@C2971o(a = "api/passport/login/third/v2/google/stock_android")
	b < C2769g > googleLogin(@C2957a ab abVar);

	@C2971o(a = "api/passport/login/account")
	b < C2769g > login(@C2957a ab abVar);

	@C2971o(a = "api/passport/refreshToken")
	b < C2770h > reFreshToken(@C2977u Map < String, String > map);

	@C2971o(a = "api/passport/register/account")
	b < C2769g > register(@C2957a ab abVar);

	@C2962f(a = "api/passport/verificationCode/sendCode")
	b < String > sendVerificationCode(@C2977u Map < String, String > map);

	@C2971o(a = "api/passport/login/third")
	b < C2769g > thirdLogin(@C2957a ab abVar);
}

public interface QuoteApiInterface {
	@C2962f(a = "api/quote/tickerRealTimes/{tickerId}")
	b < C2868b > getRealTimeTicker(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/quote/tickerRealTimes")
	b < List < C2761d >> getRealTimeTickers(@C2977u Map < String, String > map);
}

public interface UserApiInterface {
	@C2971o(a = "api/user/settings")
	b < Void > addOrUpdateSettings(@C2957a ab abVar);

	@C2971o(a = "api/user/warning/stock/tickers")
	b < Void > addStockTickerWarning(@C2957a ab abVar);

	@C2972p(a = "api/user/bindEmailPhone")
	b < C2767e > bindEmailPhone(@C2957a ab abVar);

	@C2971o(a = "api/user/bindThirdParty")
	b < C2765c > bindThirdAccount(@C2957a ab abVar);

	@C2962f(a = "api/user/messages/markNotificationAsRead")
	b < a > closeOperationMessage(@C2977u Map < String, String > map);

	@C2958b(a = "api/user/favorites/{ids}")
	b < Void > deleteFavorites(@C2975s(a = "ids") String str);

	@C2958b(a = "api/user/memos/{ids}")
	b < Void > deleteMemos(@C2975s(a = "ids") String str);

	@C2971o(a = "api/user/warning/stock/tickers/v2/delItems")
	b < Void > deleteStockTickerWarningItem(@C2957a ab abVar);

	@C2958b(a = "api/user/warning/stock/tickers")
	b < Void > deleteStockTickerWarningMapping(@C2977u Map < String, String > map);

	@C2962f(a = "api/user/warning/stock/tickers")
	b < List < C2762e >> getAllStockTickerWarnings();

	@C2962f(a = "api/user/warning/stock/tickers/v2/pullWarnInfo")
	b < C2760c > getAllStockTickerWarningsV2(@C2976t(a = "version") long j);

	@C2962f(a = "api/user/locale")
	b < Object > getLocalTimeZone(@C2977u Map < String, String > map);

	@C2962f(a = "api/user/warning/stock/tickers/{tickerId}")
	b < C2762e > getStockTickerSingleWarning(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/user/bindEmailPhone")
	b < ad > getTestApiResponse();

	@C2962f(a = "api/user")
	b < C2686d > getUserInfo();

	@C2962f(a = "api/user/messages/userMessageStatCommon")
	b < C2780e > getUserMessageStatCommon();

	@C2962f(a = "api/user/favorites/isFavorite")
	b < Long > isFavorite(@C2977u Map < String, String > map);

	@C2962f(a = "api/passport/login/logout")
	b < String > logout(@C2977u Map < String, String > map);

	@C2962f(a = "api/user/messages/markAsRead")
	b < C2776a > markAsRead(@C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/user/messages/queryLatestNotification")
	b < a > pullOperationMessage(@C2977u Map < String, String > map);

	@C2971o(a = "api/user/messages/messageAckBatch")
	b < Void > reportAlertMessageAck(@C2957a ab abVar);

	@C2971o(a = "api/user/reportThirdAccountInfo")
	b < Void > reportThirdAccountInfo(@C2957a ab abVar);

	@C2971o(a = "api/user/warning/stock/tickers/v2/SaveOrUpdateWarningItems")
	b < Void > saveOrUpdateTickerWarningItems(@C2957a ab abVar);

	@C2972p(a = "api/user/unbindEmailPhone")
	b < C2767e > unbindEmailPhone(@C2957a ab abVar);

	@C2958b(a = "api/user/unbindThirdParty")
	b < C2773k > unbindThirdAccount(@C2977u Map < String, String > map);

	@C2962f(a = "api/user/messages/updateMsgClientToken")
	b < String > updateMsgClientToken(@C2977u Map < String, String > map);

	@C2972p(a = "api/user/updatePwd")
	b < Object > updatePassword(@C2977u Map < String, String > map);

	@C2972p(a = "api/user/warning/stock/tickers/{tickerId}")
	b < Void > updateStockTickerWarning(@C2975s(a = "tickerId") String str, @C2957a ab abVar);

	@C2971o(a = "api/user")
	@C2968l
	b < C2686d > updateUserBaseInfo(@C2977u Map < String, String > map, @C2973q w$b d_w_b, @C2973q(a = "description") ab abVar);

	@C2971o(a = "api/user/uploadAvatar")
	@C2968l
	b < String > uploadAvatar(@C2973q(a = "description") ab abVar, @C2973q w$b d_w_b);
}

public interface SecuritiesApiInterface {
	@C2962f(a = "api/securities/market/tabs/exchanges")
	b < ArrayList < a >> getAllExchangeCode();

	@C2962f(a = "api/securities/regions/supportedMarketRegions")
	b < ArrayList < d >> getAllSupportedCountries();

	@C2962f(a = "api/securities/regions/registrableRegions")
	b < ArrayList < c >> getRegistrableRegions();

	@C2962f(a = "api/securities/regions/getRegionId")
	b < Integer > getUserRegionId(@C2977u Map < String, String > map);
}

public interface DnsApiInterface {
	@C2971o(a = "api/domain/route/v2")
	b < d > getDns(@C2957a ab abVar);
}

public interface GoogleApiInterface {
	@C2971o(a = "default/portfolios?positions=true&client=android-finance-app")
	b < String > insertPortfolio(@C2957a ab abVar, @C2965i(a = "Authorization") String str);

	@C2962f(a = "default/portfolios?positions=true&returns=true&client=android-finance-app")
	b < String > pullPortfolios(@C2965i(a = "Authorization") String str);
}

public interface PortfolioApiInterface {
	@C2958b(a = "api/portfolios/{portfolioId}")
	b < Void > deletePortfolio(@C2975s(a = "portfolioId") String str);

	@C2962f(a = "api/portfolios/getTickerInfo")
	b < List < z >> getAllTickerInfo(@C2977u Map < String, String > map);

	@C2971o(a = "api/portfolios")
	b < Void > insertPortfolio(@C2957a ab abVar);

	@C2972p(a = "api/portfolios/{portfolioId}/tickers/{tickerId}/tradings/{tradingId}")
	b < Void > updateTickerTrading(@C2975s(a = "portfolioId") String str, @C2975s(a = "tickerId") String str2, @C2975s(a = "tradingId") String str3, @C2957a ab abVar);
}

public interface SecuritiesApiInterface {
	@C2962f(a = "api/stocks/ticker/googleFinancialMapping")
	b < String > getGoogleExchangeMap(@C2977u Map < String, String > map);

	@C2962f(a = "api/stocks/ticker/googleFinancial/tickerIdMapping")
	b < ArrayList < t >> getTickerIdMapping(@C2977u Map < String, String > map);
}

public interface StocksApiInterface {
	@C2962f(a = "api/fmstock/stockscheck2")
	b < C2894l > checkPortfoliosV2(@C2977u Map < String, String > map);

	@C2971o(a = "api/fmstock/deleteStocksPortfolio")
	b < Void > deletePortfolio(@C2957a ab abVar);

	@C2971o(a = "api/fmstock/deleteStocksTicker")
	b < Void > deleteTicker(@C2957a ab abVar);

	@C2971o(a = "api/fmstock/deletetickertradings")
	b < Void > deleteTickerTrading(@C2957a ab abVar);

	@C2971o(a = "api/fmstock/currency/value")
	b < com.webull.datamodule.sync.api.a.b > getCurrencyByStock(@C2957a ab abVar);

	@C2971o(a = "api/fmstock/batch/tickers/tradings")
	b < v > getTradingsWithTicker(@C2957a ab abVar);

	@C2971o(a = "api/fmstock/saveOrUpdatePortfolio")
	b < Void > insertOrUpdatePortfolio(@C2957a ab abVar);

	@C2971o(a = "api/fmstock/{portfolioId}/tickers/{tickerId}/saveOrUpdateTicker")
	b < Void > insertOrUpdateTicker(@C2975s(a = "portfolioId") String str, @C2975s(a = "tickerId") long j, @C2957a ab abVar);

	@C2971o(a = "api/fmstock/{portfolioId}/tickers/{tickerId}/addTradings")
	b < Void > insertTickerTrading(@C2975s(a = "portfolioId") String str, @C2975s(a = "tickerId") long j, @C2957a ab abVar);
}

public interface UserApiInterface {
	@C2971o(a = "api/user/memos")
	b < Object > addOrUpdateMemos(@C2957a ab abVar);

	@C2958b(a = "api/user/memos/{ids}")
	b < Void > deleteMemos(@C2975s(a = "ids") String str);

	@C2962f(a = "api/user/warning/stock/tickers/v2/pullWarnInfo")
	b < Object > getAllStockTickerWarningsV2(@C2976t(a = "version") long j);

	@C2962f(a = "api/user/memos/all")
	b < List < Object >> getMemos(@C2977u Map < String, String > map);

	@C2971o(a = "api/user/warning/stock/tickers/v2/SaveOrUpdateWarningItems")
	b < Void > saveOrUpdateTickerWarningItems(@C2957a ab abVar);
}

public interface ActivityApiInterface {
	@C2971o(a = "api/adsense/queryAdsense")
	b < k < ArrayList < be >>> queryAdSense(@C2957a ab abVar);
}

public interface PassportApiInterface {
	@C2962f(a = "api/passport/verificationCode/checkCode")
	b < o > checkVerificationCode(@C2977u Map < String, String > map);

	@C2971o(a = "api/passport/login/account")
	b < Object > login(@C2957a ab abVar);

	@C2962f(a = "api/passport/login/logout")
	b < String > logout(@C2977u Map < String, String > map);

	@C2962f(a = "api/passport/verificationCode/sendCode")
	b < String > sendVerificationCode(@C2977u Map < String, String > map);
}

public interface QuoteApiInterface {
	@C2962f(a = "api/quote/tickerRealTimes/{tickerId}")
	b < ba > getRealTimeTicker(@C2975s(a = "tickerId") String str);
}

public interface SecuritiesApiInterface {
	@C2962f(a = "api/securities/base/currencies/all")
	b < ArrayList < z >> getAllCurrencies();

	@C2962f(a = "api/securities/market/tabs/exchanges")
	b < ArrayList < g >> getAllExchangeCode();

	@C2962f(a = "api/securities/regions/supportedMarketRegions")
	b < ArrayList < Object >> getAllSupportedCountries();

	@C2962f(a = "api/securities/market/tabs/all/foreignExchangesRates")
	b < C2152l > getAllSupportedForeignExchangesRates();

	@C2962f(a = "api/securities/regions/registrableRegions")
	b < ArrayList < am >> getRegistrableRegions();

	@C2962f(a = "api/securities/ticker/{tickerId}")
	b < ax > getTickerPageInfo(@C2975s(a = "tickerId") String str);
}

public interface TradeApiInterface {
	@C2971o(a = "api/trade/commission/{secAccountId}/calculateStockOrderCommission")
	b < k > calculateStockOrderCommission(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2971o(a = "api/trade/order/{secAccountId}/cancelStockCfdOrder/{orderId}/{serialId}")
	b < k > cancelStockCfdOrder(@C2975s(a = "secAccountId") long j, @C2975s(a = "orderId") long j2, @C2975s(a = "serialId") String str);

	@C2971o(a = "api/trade/order/{secAccountId}/cancelStockOrder/{orderId}/{serialId}")
	b < k > cancelStockOrder(@C2975s(a = "secAccountId") long j, @C2975s(a = "orderId") long j2, @C2975s(a = "serialId") String str);

	@C2971o(a = "api/trade/pwd/check")
	b < k > check(@C2957a ab abVar);

	@C2971o(a = "api/trade/pwd/reset/ckCode")
	b < k > checkCode(@C2957a ab abVar);

	@C2971o(a = "api/trade/order/{secAccountId}/checkPlaceStockOrder")
	b < k > checkPlaceStockOrder(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2962f(a = "api/trade/asset/{secAccountId}/depositInfo")
	b < k > depositInfo(@C2975s(a = "secAccountId") long j);

	@C2962f(a = "api/trade/position/{secAccountId}/positions/v2")
	b < k > getAccountPositionsList(@C2975s(a = "secAccountId") long j);

	@C2962f(a = "api/trade/permission/broker")
	b < k > getAllBrokerTradePermission();

	@C2962f(a = "api/trade/order/{secAccountId}/filledOrderList")
	b < k > getFilledOrderList(@C2975s(a = "secAccountId") long j, @C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/trade/pwd/fingerprintPwdCode")
	b < k > getFingerPrintPwdCode();

	@C2962f(a = "api/trade/order/{secAccountId}/fxOrderRecords")
	b < k > getFxOrderRecordList(@C2975s(a = "secAccountId") long j, @C2977u HashMap < String, String > hashMap);

	@C2971o(a = "api/trade/remind/detail")
	b < k > getGoldInGuideData(@C2957a ab abVar);

	@C2962f(a = "api/trade/asset/{secAccountId}/cashRecords")
	b < k > getGoldInOutRecordList(@C2975s(a = "secAccountId") long j, @C2977u HashMap < String, String > hashMap);

	@C2971o(a = "api/trade/saxo/authentication/SAMLRequest")
	b < k > getLoginSAXOAccountCallBackCode(@C2957a ab abVar);

	@C2962f(a = "api/trade/account/getOpenAccountNum")
	b < k > getOpenAccountNum();

	@C2962f(a = "api/trade/order/{secAccountId}/{orderId}/detail")
	b < k > getOrderDetail(@C2975s(a = "secAccountId") long j, @C2975s(a = "orderId") int i);

	@C2962f(a = "api/trade/order/{secAccountId}/orderList")
	b < k > getOrderList(@C2975s(a = "secAccountId") long j, @C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/trade/order/{secAccountId}/{tickerId}/tradingRecords")
	b < k > getOrderListByTickerId(@C2975s(a = "secAccountId") long j, @C2975s(a = "tickerId") int i);

	@C2962f(a = "api/trade/order/{secAccountId}/orderDetail/{orderId}")
	b < k > getOrderRecordDetails(@C2975s(a = "secAccountId") long j, @C2975s(a = "orderId") long j2, @C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/trade/account/{secAccountId}/configInfo")
	b < k > getSaxoConfigInfo(@C2975s(a = "secAccountId") long j);

	@C2962f(a = "api/trade/{secAccountId}/tradeReport")
	b < k > getSaxoOrderList(@C2975s(a = "secAccountId") long j, @C2977u HashMap < String, String > hashMap);

	@C2971o(a = "api/trade/ticker/search")
	b < k > getSearchResult(@C2957a ab abVar);

	@C2962f(a = "api/trade/account/{secAccountId}/getSecAccountCapitalSummary")
	b < k > getSecAccountCapitalSummary(@C2975s(a = "secAccountId") long j);

	@C2962f(a = "api/trade/order/{secAccountId}/getSecAccountDetail")
	b < k > getSecAccountDetail(@C2975s(a = "secAccountId") long j);

	@C2962f(a = "api/trade/account/getSecAccountList/v2")
	b < k > getSecAccountList();

	@C2962f(a = "api/trade/base/data/ib/supportedCurrencies")
	b < k > getSupportedCurrencyList();

	@C2962f(a = "api/trade/base/data/thirdApiKeys")
	b < k > getThirdApiKeys();

	@C2962f(a = "api/trade/ticker/broker/permission")
	b < k > getTickerBrokerTradeEnableList(@C2977u HashMap < String, String > hashMap);

	@C2971o(a = "api/trade/position/{secAccountId}/getTickerHisUnrealizedGain")
	b < k > getTickerHisUnrealizedGain(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2962f(a = "api/trade/position/{secAccountId}/{tickerId}/position")
	b < k > getTickerPositionInfo(@C2975s(a = "secAccountId") long j, @C2975s(a = "tickerId") int i, @C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/trade/position/{secAccountId}/{tickerId}/positions")
	b < k > getTickerPositionInfos(@C2975s(a = "secAccountId") long j, @C2975s(a = "tickerId") int i);

	@C2962f(a = "api/trade/base/data/{sourceCurrency}/tradableCurrencies")
	b < k > getTradableCurrencyList(@C2975s(a = "sourceCurrency") String str);

	@C2962f(a = "api/trade/message/{secAccountId}/{msgId}/detail")
	b < k > getTradeMessageDetail(@C2975s(a = "secAccountId") long j, @C2975s(a = "msgId") long j2);

	@C2962f(a = "api/trade/message/{secAccountId}")
	b < k > getTradeMessageList(@C2975s(a = "secAccountId") long j, @C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/trade/tradeTab/display")
	b < k > getTradeTabDisplay(@C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/trade/order/{secAccountId}/unFilledOrders")
	b < k > getUnFilledOrderList(@C2975s(a = "secAccountId") long j, @C2977u HashMap < String, String > hashMap);

	@C2962f(a = "api/trade/account/getUserAccountCapitalSummary")
	b < k > getUserAccountCapitalSummary();

	@C2962f(a = "api/trade/permission/account/{accountId}")
	b < k > getUserTradePermission(@C2975s(a = "accountId") int i);

	@C2971o(a = "api/trade/login")
	b < k > login(@C2957a ab abVar);

	@C2972p(a = "api/trade/order//{secAccountId}/modifyStockCfdOrder/{orderId}")
	b < k > modifyCfdOrder(@C2975s(a = "secAccountId") long j, @C2975s(a = "orderId") long j2, @C2957a ab abVar);

	@C2972p(a = "api/trade/order//{secAccountId}/modifyStockOrder/{orderId}")
	b < k > modifyStockOrder(@C2975s(a = "secAccountId") long j, @C2975s(a = "orderId") long j2, @C2957a ab abVar);

	@C2962f(a = "api/trade/asset/{secAccountId}/multiCurrency")
	b < k > multiCurrencyList(@C2975s(a = "secAccountId") long j);

	@C2971o(a = "api/trade/permission/open")
	b < k > openPermission(@C2957a ab abVar);

	@C2971o(a = "api/trade/order/{secAccountId}/placeStockCfdOrder")
	b < k > placeCfdOrder(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2971o(a = "api/trade/order/{secAccountId}/placeFxOrder")
	b < k > placeFxOrder(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2971o(a = "api/trade/order/{secAccountId}/placeStockOrder")
	b < k > placeStockOrder(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2971o(a = "api/trade/account/register/{secAccountId}/reOpen")
	b < k > reOpenSecAccount(@C2975s(a = "secAccountId") long j);

	@C2972p(a = "api/trade/message/{secAccountId}/readMessages")
	b < k > readMessages(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2971o(a = "api/trade/pwd/reset/pwd")
	b < k > resetPwd(@C2957a ab abVar);

	@C2962f(a = "api/trade/account/{secAccountId}/secAccountDetail")
	b < k > secAccountDetail(@C2975s(a = "secAccountId") long j);

	@C2971o(a = "api/trade/pwd/reset/sendCode")
	b < k > sendCode(@C2957a ab abVar);

	@C2971o(a = "api/trade/account/{secAccountId}/asDefault")
	b < k > setDefaultAccount(@C2975s(a = "secAccountId") long j);

	@C2971o(a = "api/trade/pwd/setFingerprintPwd")
	b < k > setFingerPrintPwdCode(@C2957a ab abVar);

	@C2962f(a = "api/trade/saxo/authentication/heartbeat")
	b < k > startSaxoHeartbeat(@C2977u HashMap < String, String > hashMap);

	@C2971o(a = "api/trade/asset/{secAccountId}/deposit")
	b < k > submitGoldInNotify(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2971o(a = "api/trade/asset/{secAccountId}/withdraw")
	b < k > submitGoldOutNotify(@C2975s(a = "secAccountId") long j, @C2957a ab abVar);

	@C2971o(a = "api/trade/pwd/update")
	b < k > update(@C2957a ab abVar);
}

public interface UserApiInterface {
	@C2972p(a = "api/user/bindEmailPhoneNoPwd")
	b < q > bindEmailPhone(@C2957a ab abVar);

	@C2962f(a = "api/user")
	b < bk > getUserInfo();
}

public interface QuoteApiInterface {
	@C2962f(a = "api/quote/v2/tickerMinutes/{tickerId}")
	b < com.webull.financechats.requests.b.b > getTickerMinuteList(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);
}

public interface SecuritiesApiInterface {
	@C2962f(a = "api/securities/calendar/v2/{regionsId}/financialReport")
	b < List < com.webull.marketmodule.network.a.b >> getFinancialReportList(@C2975s(a = "regionsId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/market/tabs/{tabId}/funds")
	b < List < a >> getFundsByTab(@C2975s(a = "tabId") String str);

	@C2962f(a = "api/securities/market/tabs/v2/globalIndices/{regionId}")
	b < List < d >> getGlobalIndicesList(@C2975s(a = "regionId") String str);

	@C2962f(a = "api/securities/market/tabs/v2/indexFuture/{regionId}")
	b < List < e >> getIndexFuture(@C2975s(a = "regionId") String str);

	@C2962f(a = "api/securities/market/tabs/v2/{tabId}/foreignExchanges/{regionId}")
	b < List < C2869c >> getMarketForeignExchangeTabData(@C2975s(a = "tabId") String str, @C2975s(a = "regionId") String str2, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/market/tabs/v2/{tabId}/futureGroups")
	b < List < e >> getMarketFutureGroupList(@C2975s(a = "tabId") String str);

	@C2962f(a = "api/securities/market/tabs/v2/1/hotcategories/{regionIds}")
	b < List < C2910c >> getMarketStockHotcategories(@C2975s(a = "regionIds") String str);

	@C2962f(a = "api/securities/market/tabs/v2/cards/region/indices/{regionId}")
	b < List < C2869c >> getMarketStockIndicesForSingleRegion(@C2975s(a = "regionId") String str);

	@C2962f(a = "api/securities/market/tabs/v2/{tabId}/othercategories/{regionIds}")
	b < List < C2910c >> getOtherCategories(@C2975s(a = "tabId") String str, @C2975s(a = "regionIds") String str2);

	@C2962f(a = "api/securities/market/tabs/{tabId}/region/{regionId}")
	b < f > getRegionList(@C2975s(a = "tabId") String str, @C2975s(a = "regionId") String str2, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/market/tabs/v2/{regionId}/cards/{cardId}")
	b < List < C2869c >> getTickersWithPage(@C2975s(a = "regionId") String str, @C2975s(a = "cardId") String str2, @C2977u Map < String, String > map);
}

public interface SearchApiInterface {
	@C2962f(a = "api/search/tickers2")
	b < a > getSearchResult(@C2977u Map < String, String > map);
}

public interface ActivityApiInterface {
	@C2972p(a = "/api/adsense/queryAdsense")
	b < Object > getExploreBannerList(@C2957a ab abVar);
}

public interface ExploreApiInterface {
	@C2971o(a = "api/wlas/strategy/rank/guruspicks")
	b < List < Object >> getGurusPicks(@C2977u Map < String, String > map);
}

public interface SchoolApiInterface {
	@C2962f(a = "api/bms/stockschool/list")
	b < n > getSchoolList();
}

public interface SecuritiesApiInterface {
	@C2962f(a = "api/securities/calendar/overall")
	b < ArrayList < a >> getCalendarList(@C2977u Map < String, String > map);

	@C2962f(a = "/api/adsense/queryAdsense")
	b < ArrayList < com.webull.newsmodule.ui.b.a >> getExploreBannerList(@C2977u Map < String, String > map);

	@C2962f(a = "api/information/news/frontPage")
	b < m > getFrontPage();

	@C2962f(a = "api/information/news/topNews")
	b < m > getTopNews(@C2976t(a = "currentNewsId") String str, @C2976t(a = "pageSize") int i);
}

public interface UserApiInterface {
	@C2971o(a = "/api/purchase/template/inmark")
	b < Object > getExplorePurchaseInfo(@C2977u Map < String, String > map);
}

public interface WlasApiInterface {
	@C2962f(a = "api/wlas/strategy/rank/bullvsbear")
	b < ArrayList < d >> getRegionBullvsbearList(@C2977u Map < String, String > map);
}

public interface PortfolioApiInterface {
	@C2962f(a = "api/portfolios/totalGain")
	b < a > getAllPortfolioGain();

	@C2962f(a = "api/portfolios/{portfolioId}/totalGain")
	b < d > getPortfolioGain(@C2975s(a = "portfolioId") String str);

	@C2962f(a = "api/portfolios/{portfolioId}/historyGain/{scope}")
	b < List < com.webull.portfoliosmodule.network.a.a >> getPortfolioHistoryGain(@C2975s(a = "portfolioId") String str, @C2975s(a = "scope") String str2);

	@C2972p(a = "api/portfolios/updateCurrency/{portfolioCurrencyId}")
	b < Void > updatePortfolioCurrency(@C2975s(a = "portfolioCurrencyId") String str);
}

public interface QuoteApiInterface {
	@C2962f(a = "api/quote/tickerRealTimes/{tickerId}")
	b < C2868b > getRealTimeTicker(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/quote/tickerRealTimes")
	b < List < com.webull.portfoliosmodule.network.a.b >> getRealTimeTickers(@C2977u Map < String, String > map);
}

public interface SecuritiesApiInterface {
	@C2962f(a = "api/securities/market/tabs/all/foreignExchangesRates")
	b < String > getAllSupportedForeignExchangesRates();

	@C2962f(a = "api/stocks/ticker/googleFinancialMapping")
	b < String > getGoogleExchangeMap(@C2977u Map < String, String > map);

	@C2962f(a = "api/stocks/ticker/googleFinancial/tickerIdMapping")
	b < ArrayList < a >> getTickerIdMapping(@C2977u Map < String, String > map);
}

public interface PurchaseApiInterface {
	@C2971o(a = "api/purchase/order/check")
	b < a < h >> checkOrder(@C2957a ab abVar);

	@C2971o(a = "api/purchase/order/create")
	b < a < g >> createOrder(@C2957a ab abVar);

	@C2962f(a = "api/user/locale")
	b < a < f >> getLocalTimeZone(@C2977u Map < String, String > map);

	@C2971o(a = "api/purchase/template/inmark")
	b < a < com.webull.subscription.network.a.b >> getPurchaseDataInmark();

	@C2971o(a = "api/purchase/template/inmark")
	b < a < com.webull.subscription.network.a.b >> getPurchaseDataInmark(@C2957a ab abVar);

	@C2971o(a = "api/purchase/order/own?filterType=all")
	b < a < j >> getPurchaseOwn(@C2977u Map < String, Integer > map);
}

public interface QuoteApiInterface {
	@C2962f(a = "/api/quote/v3/tickerMinutes/{tickerID}/{af}")
	b < com.webull.financechats.requests.b.b > getAfterMinutes(@C2975s(a = "tickerID") String str, @C2975s(a = "af") String str2, @C2976t(a = "minuteType") String str3);

	@C2962f(a = "/api/securities/ticker/{tickerId}")
	b < com.webull.ticker.network.a.b > getFundDetail(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/quote/tickerRealTimes/{tickerId}")
	b < n > getRealTimeTicker(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/quote/v2/tickerKDatas/{tickerId}")
	b < l > getTickerCandleList(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/quote/tickerDeals/{tickerId}")
	b < ArrayList < j >> getTickerDeals(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/quote/v2/tickerMinutes/{tickerId}")
	b < com.webull.financechats.requests.b.b > getTickerMinuteList(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/quote/v2/tickerTrends/{tickerId}")
	b < h > getTickerTrends(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);
}

public interface SecuritiesApiInterface {
	@C2971o(a = "api/user/memos")
	b < C2923a > addOrUpdateMemos(@C2957a ab abVar);

	@C2958b(a = "api/user/memos/{ids}")
	b < Void > deleteMemos(@C2975s(a = "ids") String str);

	@C2962f(a = "api/securities/stock/v2/{tickerId}/extension")
	b < a > getDistributionAndShares(@C2975s(a = "tickerId") String str, @C2976t(a = "days") int i);

	@C2962f(a = "api/securities/stock/v2/{tickerId}/extension")
	b < k > getExtensionInfo(@C2975s(a = "tickerId") String str, @C2976t(a = "days") int i);

	@C2962f(a = "api/securities/stock/{tickerId}/incomeAnalysis/crucial")
	b < com.webull.ticker.detail.tab.stock.financeanalysis.b.a > getFinanceAnalysisKeyIndex(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/fund/{tickerId}/briefv2")
	b < com.webull.ticker.detail.tab.fund.brief.b.b > getFundBrief(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/fund/{tickerId}/assetsMore")
	b < c > getFundBriefAssetsMore(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/fund/{tickerId}/bonus")
	b < ArrayList < d >> getFundBriefBonus(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/fund/{tickerId}/history")
	b < ArrayList < e >> getFundBriefHistory(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/fund/{tickerId}/briefMore")
	b < f > getFundBriefMore(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/fund/{tickerId}/position")
	b < com.webull.ticker.detail.tab.fund.a.b.a > getFundBulletin(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/fund/{tickerId}/queryManager")
	b < ArrayList < com.webull.ticker.detail.tab.fund.manager.b.a >> getFundManager(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/fund/manager/{managerId}/detail")
	b < com.webull.ticker.detail.tab.fund.manager.activity.a > getFundManagerDetail(@C2975s(a = "managerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/fund/{tickerId}/perform3")
	b < com.webull.ticker.detail.tab.fund.b.b.a > getFundPerform2(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/fund/{tickerId}/ratings")
	b < ArrayList < com.webull.ticker.detail.tab.fund.c.b.a >> getFundRanking(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/market/tabs/{tabId}/funds")
	b < List < Object >> getFundsByTab(@C2975s(a = "tabId") String str);

	@C2962f(a = "api/securities/market/tabs/v2/futures/{tickerId}/related")
	b < ArrayList < C2869c >> getFuturesRelatedList(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/index/v2/{tickerId}/component")
	b < ArrayList < C2869c >> getIndexComponent(@C2975s(a = "tickerId") String str, @C2976t(a = "type") int i, @C2976t(a = "direction") int i2, @C2976t(a = "pageIndex") int i3, @C2976t(a = "pageSize") int i4);

	@C2962f(a = "api/securities/ticker/v2/{tickerId}/indexFutureRelated")
	b < ArrayList < com.webull.ticker.detail.tab.c.b.a >> getIndexFutureRelated(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/user/memos/all")
	b < List < C2923a >> getMemos(@C2977u Map < String, String > map);

	@C2962f(a = "api/securities/stock/{tickerId}/statementsV2Detail")
	b < ArrayList < com.webull.ticker.detail.tab.stock.financereport.activity.a.d >> getStatementsV2Detail(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/ticker/{tickerId}/bulletins")
	b < ArrayList < com.webull.ticker.network.a.e >> getStockBulletin(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/stock/{tickerId}/compBrief")
	b < ArrayList < com.webull.ticker.detail.tab.stock.summary.b.e >> getStockCompleteBrief(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/stock/{tickerId}/statementsv2")
	b < g > getStockFinance(@C2975s(a = "tickerId") String str, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/stock/{tickerId}/incomeAnalysis/diagram")
	b < com.webull.ticker.detail.tab.stock.financeanalysis.b.b > getStockFinanceAnalysisDiagram(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/stock/{tickerId}/incomeAnalysis/crucialDetail")
	b < ArrayList < com.webull.ticker.detail.tab.stock.financeanalysis.b.c >> getStockFinanceAnalysisKeyIndexDetail(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/stock/{tickerId}/incomeAnalysis/mainOperIncome")
	b < ArrayList < com.webull.ticker.detail.tab.stock.financeanalysis.b.d >> getStockFinanceAnalysisMainIncome(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/stock/{tickerId}/recommendation")
	b < com.webull.ticker.detail.tab.b.b.a > getStockRecommendation(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/market/tabs/v2/selectors/{regionId}/{sectorId}")
	b < com.webull.ticker.detail.tab.stock.summary.b.b > getStockRelatedSectorDetail(@C2975s(a = "regionId") int i, @C2975s(a = "sectorId") int i2, @C2977u Map < String, String > map);

	@C2962f(a = "api/securities/stock/{tickerId}/relatedSector")
	b < i > getStockRelatedSectors(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/stock/{tickerId}/executives")
	b < ArrayList < com.webull.ticker.detail.tab.stock.summary.b.a >> getStockSummaryExecutives(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/ticker/v2/{tickerId}/commodityIndex")
	b < o > getTickerIndexFuturesRelatedIndex(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/securities/ticker/v2/{tickerId}")
	b < m > getTickerInfo(@C2975s(a = "tickerId") String str);

	@C2962f(a = "api/information/news/ticker/{tickerId}")
	b < com.webull.ticker.detail.tab.news.c.b > getTickerNews(@C2975s(a = "tickerId") String str, @C2976t(a = "currentNewsId") String str2, @C2976t(a = "pageSize") String str3);

	@C2962f(a = "api/securities/market/tabs/v2/{regionId}/cards/{cardId}")
	b < List < C2869c >> getTickersWithPage(@C2975s(a = "regionId") String str, @C2975s(a = "cardId") String str2, @C2977u Map < String, String > map);
}

public interface UserApiInterface {
	@C2962f(a = "/api/purchase/exchange/datalevel")
	b < a > getDataLevel(@C2976t(a = "exchangeCode") String str);
}

public interface WlasApiInterface {
	@C2962f(a = "api/wlas/capitalflow/ticker")
	b < a > getCapitalFlow(@C2977u Map < String, String > map);
}

