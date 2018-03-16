package com.robinhood.api.retrofit;

import com.robinhood.models.PaginatedResult;
import com.robinhood.models.api.AcatsBrokerage;
import com.robinhood.models.api.AcatsRequest;
import com.robinhood.models.api.AchBank;
import com.robinhood.models.api.AchVerificationRequest;
import com.robinhood.models.api.ApiAcatsTransfer;
import com.robinhood.models.api.ApiAccount;
import com.robinhood.models.api.ApiAchRelationship;
import com.robinhood.models.api.ApiAchTransfer;
import com.robinhood.models.api.ApiApplication;
import com.robinhood.models.api.ApiAutomaticDeposit;
import com.robinhood.models.api.ApiAutomaticDeposit.Request;
import com.robinhood.models.api.ApiCard.Stack;
import com.robinhood.models.api.ApiDayTrade;
import com.robinhood.models.api.ApiDividend;
import com.robinhood.models.api.ApiDocument;
import com.robinhood.models.api.ApiDocument.DownloadResponse;
import com.robinhood.models.api.ApiEarnings;
import com.robinhood.models.api.ApiFundamental;
import com.robinhood.models.api.ApiInstrument;
import com.robinhood.models.api.ApiMarginInterestCharge;
import com.robinhood.models.api.ApiMarginSetting;
import com.robinhood.models.api.ApiMarginSetting.UpdateSettingRequest;
import com.robinhood.models.api.ApiMarginSubscription;
import com.robinhood.models.api.ApiMarginSubscriptionFee;
import com.robinhood.models.api.ApiMarketHours;
import com.robinhood.models.api.ApiOrder;
import com.robinhood.models.api.ApiPortfolio;
import com.robinhood.models.api.ApiPortfolioHistorical;
import com.robinhood.models.api.ApiPosition;
import com.robinhood.models.api.ApiQuote;
import com.robinhood.models.api.ApiQuoteHistorical;
import com.robinhood.models.api.ApiReferral;
import com.robinhood.models.api.ApiStockLoanPayment;
import com.robinhood.models.api.ApiUser;
import com.robinhood.models.api.ApiUser.CreateUserRequest;
import com.robinhood.models.api.ApiUser.UpdateRequest;
import com.robinhood.models.api.ApiUserInvestmentProfile;
import com.robinhood.models.api.ApiWatchlistInstrument;
import com.robinhood.models.api.CashDowngradeInfo;
import com.robinhood.models.api.CipAnswerRequest;
import com.robinhood.models.api.CipQuestion;
import com.robinhood.models.api.ConfigurationVitals;
import com.robinhood.models.api.ContactData;
import com.robinhood.models.api.ContactRecommendations;
import com.robinhood.models.api.DayTradeCheck;
import com.robinhood.models.api.Device;
import com.robinhood.models.api.DtbpCheck;
import com.robinhood.models.api.EstablishReferralRequest;
import com.robinhood.models.api.GenericResult;
import com.robinhood.models.api.IavBank;
import com.robinhood.models.api.IdDocument.OptionsRequest;
import com.robinhood.models.api.IdDocument.OptionsResponse;
import com.robinhood.models.api.IdentityMismatch;
import com.robinhood.models.api.InstrumentPrice;
import com.robinhood.models.api.IpoQuote;
import com.robinhood.models.api.LeverageSuitability;
import com.robinhood.models.api.MarginCall;
import com.robinhood.models.api.MarginUpgrade;
import com.robinhood.models.api.MarginUpgradePlans;
import com.robinhood.models.api.Mfa;
import com.robinhood.models.api.Mfa.BackupCode;
import com.robinhood.models.api.News;
import com.robinhood.models.api.NotificationSettings;
import com.robinhood.models.api.OAuthClientInfo;
import com.robinhood.models.api.OAuthRequest;
import com.robinhood.models.api.OAuthToken;
import com.robinhood.models.api.OrderRequest;
import com.robinhood.models.api.OrganicReward;
import com.robinhood.models.api.ReferralCode;
import com.robinhood.models.api.ReferrerCampaign;
import com.robinhood.models.api.ReferrerData;
import com.robinhood.models.api.RiskCheck;
import com.robinhood.models.api.StockReward;
import com.robinhood.models.api.StockRewardInventory;
import com.robinhood.models.api.TopMover;
import com.robinhood.models.api.UserAdditionalInfo;
import com.robinhood.models.api.UserAdditionalInfo.StockLoanEnrollmentRequest;
import com.robinhood.models.api.UserBasicInfo;
import com.robinhood.models.api.UserEmployment;
import com.robinhood.models.api.UserInternationalInfo;
import com.robinhood.models.api.Watchlist.ReorderQuery;
import java.util.List;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.GET;
import retrofit2.http.HTTP;
import retrofit2.http.Headers;
import retrofit2.http.Multipart;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Part;
import retrofit2.http.Path;
import retrofit2.http.Query;
import rx.Observable;

public interface Brokeback {
	@POST("/ach/deposit_schedules/")
	Observable<ApiAutomaticDeposit> addAutomaticDeposit(@Body Request request);

	@FormUrlEncoded
	@POST("/watchlists/{watchlistName}/")
	Observable<ApiWatchlistInstrument> addInstrument(@Path("watchlistName") String str, @Field("instrument") String str2);

	@PUT("/user/cip_questions/")
	Observable<Void> answerCipQuestions(@Body CipAnswerRequest cipAnswerRequest);

	@POST("/oauth2/authorize/")
	Observable<Void> authenticateWithOAuth2(@Body OAuthRequest oAuthRequest);

	@POST("/ach/transfers/{id}/cancel/")
	Observable<Void> cancelAchTransfer(@Path("id") String str);

	@POST("/orders/{orderId}/cancel/")
	Observable<Void> cancelOrder(@Path("orderId") String str);

	@FormUrlEncoded
	@POST("/password_change/")
	Observable<Void> changePassword(@Field("password") String str, @Field("old_password") String str2);

	@POST("/midlands/rewards/stock/{reward_id}/claim/")
	Observable<StockReward> claimStockReward(@Path("reward_id") String str);

	@POST("/acats/")
	Observable<Void> createAcatsTransfer(@Body AcatsRequest acatsRequest);

	@FormUrlEncoded
	@POST("/ach/relationships/")
	Observable<ApiAchRelationship> createAchRelationship(@Field("account") String str, @Field("bank_routing_number") String str2, @Field("bank_account_number") String str3, @Field("bank_account_type") String str4, @Field("bank_account_holder_name") String str5);

	@PUT("/applications/individual/")
	Observable<ApiApplication> createApplication(@Body ApiApplication.Request request);

	@POST("/queued_acats/")
	Observable<Void> createQueuedAcatsTransfer(@Body AcatsRequest acatsRequest);

	@PUT("/user/")
	Observable<ApiUser> createUser(@Body CreateUserRequest createUserRequest);

	@FormUrlEncoded
	@POST("/watchlists/")
	Observable<Void> createWatchlist(@Field("name") String str);

	@DELETE("/ach/deposit_schedules/{automaticDepositId}/")
	Observable<Void> deleteAutomaticDeposit(@Path("automaticDepositId") String str);

	@DELETE("/notifications/devices/{deviceId}/")
	Observable<Void> deleteDevice(@Path("deviceId") String str);

	@DELETE("/watchlists/{watchlistName}/{instrumentId}/")
	Observable<Void> deleteInstrument(@Path("watchlistName") String str, @Path("instrumentId") String str2);

	@DELETE("/mfa/")
	Observable<Void> deleteMfa();

	@POST("/midlands/notifications/stack/{cardId}/dismiss/")
	Observable<Void> dismissCard(@Path("cardId") String str);

	@PATCH("/user/additional_info/")
	Observable<Void> enrollInStockLoan(@Body StockLoanEnrollmentRequest stockLoanEnrollmentRequest);

	@FormUrlEncoded
	@POST("/midlands/referral/instant/")
	Observable<Void> establishInstantReferral(@Field("referral_code") String str);

	@POST("/midlands/referral/")
	Observable<Void> establishReferral(@Body EstablishReferralRequest establishReferralRequest);

	@PUT("/user/identity_mismatch/")
	Observable<PaginatedResult<IdentityMismatch>> generateMismatches();

	@GET("/midlands/acats/brokerages/default/")
	Observable<PaginatedResult<AcatsBrokerage>> getAcatsBrokeragesDefault();

	@GET("/acats/?direction=incoming")
	Observable<PaginatedResult<ApiAcatsTransfer>> getAcatsTransfers();

	@GET("/accounts/")
	Observable<PaginatedResult<ApiAccount>> getAccounts();

	@GET("/ach/relationships/")
	Observable<PaginatedResult<ApiAchRelationship>> getAchRelationships(@Query("cursor") String str);

	@GET("/ach/transfers/")
	Observable<PaginatedResult<ApiAchTransfer>> getAchTransfers(@Query("updated_at[gte]") String str, @Query("cursor") String str2);

	@GET("/applications/{type}/")
	Observable<ApiApplication> getApplicationByType(@Path("type") String str);

	@GET("/ach/deposit_schedules/")
	Observable<PaginatedResult<ApiAutomaticDeposit>> getAutomaticDeposits(@Query("cursor") String str);

	@GET("/midlands/ach/banks/{routingNumber}/")
	Observable<AchBank> getBankName(@Path("routingNumber") String str);

	@GET("/midlands/notifications/stack/")
	Observable<Stack> getCardStack();

	@GET("/midlands/accounts/cash_downgrade_info/")
	Observable<CashDowngradeInfo> getCashDowngradeInfo(@Query("account_number") String str);

	@GET("/user/cip_questions/")
	Observable<List<CipQuestion>> getCipQuestions();

	@GET("/midlands/configurations/vitals/android/")
	Observable<ConfigurationVitals> getConfigurationVitals();

	@GET("/midlands/contacts/recommendations/")
	Observable<ContactRecommendations> getContactRecommendations();

	@GET("/subscription/subscriptions/?active=true")
	Observable<PaginatedResult<ApiMarginSubscription>> getCurrentMarginPlan(@Query("cursor") String str);

	@GET("/accounts/{accountNumber}/day_trade_checks/")
	Observable<DayTradeCheck> getDayTradeCheck(@Path("accountNumber") String str, @Query("instrument") String str2);

	@GET("/notifications/devices/")
	Observable<PaginatedResult<Device>> getDevices();

	@GET("/dividends/")
	Observable<PaginatedResult<ApiDividend>> getDividends(@Query("cursor") String str);

	@GET("/documents/{id}/download/?redirect=False")
	Observable<DownloadResponse> getDocumentDownloadUrl(@Path("id") String str);

	@GET("/documents/")
	Observable<PaginatedResult<ApiDocument>> getDocuments(@Query("cursor") String str);

	@GET("/accounts/{id}/dtbp_checks/")
	Observable<DtbpCheck> getDtbpCheck(@Path("id") String str, @Query("instrument") String str2);

	@GET("/marketdata/earnings/")
	Observable<ApiEarnings> getEarnings(@Query("instrument") String str, @Query("range") String str2);

	@GET("/marketdata/fundamentals/{symbol}/")
	Observable<ApiFundamental> getFundamental(@Path("symbol") String str);

	@GET("/portfolios/historicals/{accountNumber}/")
	Observable<ApiPortfolioHistorical> getHistoricalPortfolios(@Path("accountNumber") String str, @Query("interval") String str2, @Query("span") String str3, @Query("bounds") String str4);

	@GET("/marketdata/historicals/{symbol}/")
	Observable<ApiQuoteHistorical> getHistoricalQuotes(@Path("symbol") String str, @Query("interval") String str2, @Query("span") String str3, @Query("bounds") String str4);

	@GET("/marketdata/historicals/")
	Observable<PaginatedResult<ApiQuoteHistorical>> getHistoricalQuotesMulti(@Query("symbols") String str, @Query("interval") String str2, @Query("span") String str3, @Query("bounds") String str4, @Query("cursor") String str5);

	@GET("/midlands/ach/iav_banks/default/")
	Observable<PaginatedResult<IavBank>> getIavBanksDefault();

	@GET("/instruments/{instrumentId}/")
	Observable<ApiInstrument> getInstrument(@Path("instrumentId") String str, @Query("nocache") String str2);

	@GET("/instruments/?active_instruments_only=true")
	Observable<PaginatedResult<ApiInstrument>> getInstrumentBySymbol(@Query("symbol") String str, @Query("nocache") String str2);

	@GET("/marketdata/prices/?delayed=true&source=consolidated")
	Observable<PaginatedResult<InstrumentPrice>> getInstrumentPrice(@Query("instruments") String str);

	@GET("/instruments/?active_instruments_only=false")
	Observable<PaginatedResult<ApiInstrument>> getInstruments(@Query("ids") String str);

	@GET("/marketdata/ipo/{instrumentId}/")
	Observable<IpoQuote> getIpoQuote(@Path("instrumentId") String str);

	@GET("accounts/{id}/leverage_suitability/")
	Observable<LeverageSuitability> getLeverageSuitability(@Path("id") String str);

	@GET("/margin/calls/")
	Observable<PaginatedResult<MarginCall>> getMarginCalls();

	@GET("/cash_journal/margin_interest_charges/")
	Observable<PaginatedResult<ApiMarginInterestCharge>> getMarginInterestCharges(@Query("cursor") String str);

	@GET("/settings/margin/{accountNumber}/")
	Observable<ApiMarginSetting> getMarginSettings(@Path("accountNumber") String str);

	@GET("/subscription/subscription_fees/")
	Observable<PaginatedResult<ApiMarginSubscriptionFee>> getMarginSubscriptionFees(@Query("cursor") String str);

	@GET("/subscription/plans/")
	Observable<MarginUpgradePlans> getMarginSubscriptionPlans();

	@GET("/margin/upgrades/")
	Observable<PaginatedResult<MarginUpgrade>> getMarginUpgrades();

	@GET("/markets/{mic}/hours/{date}/")
	Observable<ApiMarketHours> getMarketHours(@Path("mic") String str, @Path("date") String str2);

	@GET("/mfa/")
	Observable<Mfa> getMfa();

	@GET("/midlands/news/{instrumentSymbol}/")
	Observable<PaginatedResult<News>> getNews(@Path("instrumentSymbol") String str);

	@GET("/settings/notifications/")
	Observable<NotificationSettings> getNotificationSettings();

	@GET("/oauth2/applications/{clientId}/info/")
	Observable<OAuthClientInfo> getOAuth2ClientInfo(@Path("clientId") String str);

	@GET("/orders/{orderId}/")
	Observable<ApiOrder> getOrder(@Path("orderId") String str);

	@GET("/orders/")
	Observable<PaginatedResult<ApiOrder>> getOrders(@Query("updated_at[gte]") String str, @Query("cursor") String str2);

	@GET("/midlands/referral/promotion/")
	Observable<OrganicReward> getOrganicReward(@Query("device_id") String str);

	@GET("/portfolios/{accountNumber}/?bounds=trading")
	Observable<ApiPortfolio> getPortfolio(@Path("accountNumber") String str);

	@GET("/positions/?nonzero=true")
	Observable<PaginatedResult<ApiPosition>> getPositions(@Query("cursor") String str);

	@GET("/queued_acats/")
	Observable<Void> getQueuedAcatsTransfer();

	@GET("/ach/queued_deposit/")
	Observable<Void> getQueuedAchVerification();

	@GET("/marketdata/quotes/{symbolOrInstrumentId}/?bounds=trading")
	Observable<ApiQuote> getQuote(@Path("symbolOrInstrumentId") String str);

	@GET("/marketdata/quotes/?bounds=trading")
	Observable<PaginatedResult<ApiQuote>> getQuotesByInstrumentIds(@Query("instruments") String str, @Query("cursor") String str2);

	@GET("/marketdata/quotes/?bounds=trading")
	Observable<PaginatedResult<ApiQuote>> getQuotesBySymbols(@Query("symbols") String str, @Query("cursor") String str2);

	@GET("/accounts/{id}/recent_day_trades/")
	Observable<PaginatedResult<ApiDayTrade>> getRecentDayTrades(@Path("id") String str, @Query("cursor") String str2);

	@GET("/midlands/referral/code/")
	Observable<ReferralCode> getReferralCode();

	@GET("/midlands/referral/")
	Observable<PaginatedResult<ApiReferral>> getReferrals(@Query("cursor") String str);

	@GET("/midlands/referral/campaign/general/context/")
	Observable<ReferrerCampaign> getReferrerCampaign();

	@GET("/midlands/referral/campaign/general/")
	Observable<ReferrerData> getReferrerData();

	@GET("/ach/iav/risk/")
	Observable<RiskCheck> getRiskCheck();

	@GET("/stock_loan/payments/")
	Observable<PaginatedResult<ApiStockLoanPayment>> getStockLoanPayments(@Query("cursor") String str);

	@GET("/midlands/rewards/stock/inventory/")
	Observable<StockRewardInventory> getStockRewardInventory();

	@GET("/midlands/movers/sp500/")
	Observable<PaginatedResult<TopMover>> getTopMover(@Query("direction") String str);

	@GET("/user/")
	Observable<ApiUser> getUser();

	@GET("/user/additional_info/")
	Observable<UserAdditionalInfo> getUserAdditionalInfo();

	@GET("/user/basic_info/")
	Observable<UserBasicInfo> getUserBasicInfo();

	@GET("/user/employment/")
	Observable<UserEmployment> getUserEmployment();

	@GET("/user/investment_profile/")
	Observable<ApiUserInvestmentProfile> getUserInvestmentProfile();

	@GET("/watchlists/{watchlistName}/")
	Observable<PaginatedResult<ApiWatchlistInstrument>> getWatchlist(@Path("watchlistName") String str, @Query("cursor") String str2);

	@POST("/api-token-logout/")
	@Deprecated
	Observable<Void> logOut();

	@POST("/oauth2/migrate_token/")
	Observable<OAuthToken> migrateToOAuthToken();

	@FormUrlEncoded
	@POST("/oauth2/token/")
	@Headers({"X-Omit-Auth-Header: 1"})
	Observable<OAuthToken> oAuthLogin(@Field("username") String str, @Field("password") String str2, @Field("grant_type") String str3, @Field("scope") String str4, @Field("client_id") String str5, @Field("mfa_code") String str6, @Field("backup_code") String str7);

	@FormUrlEncoded
	@POST("/oauth2/token/")
	@Headers({"X-Dont-Intercept-For-OAuth: 1", "X-Omit-Auth-Header: 1"})
	Observable<OAuthToken> oAuthRefreshToken(@Field("refresh_token") String str, @Field("grant_type") String str2, @Field("scope") String str3, @Field("client_id") String str4);

	@FormUrlEncoded
	@POST("/oauth2/revoke_token/")
	Observable<Void> oAuthRevokeToken(@Field("token") String str, @Field("client_id") String str2);

	@HTTP(hasBody = true, method = "OPTIONS", path = "/upload/national_ids/")
	Observable<OptionsResponse> optionsUploadNationalId(@Body OptionsRequest optionsRequest);

	@HTTP(hasBody = true, method = "OPTIONS", path = "/upload/photo_ids/")
	Observable<OptionsResponse> optionsUploadPhotoId(@Body OptionsRequest optionsRequest);

	@FormUrlEncoded
	@POST("/watchlists/{watchlist}/bulk_add/")
	Observable<List<ApiWatchlistInstrument>> populateWatchlist(@Path("watchlist") String str, @Field("symbols") String str2);

	@POST("/ach/transfers/")
	Observable<ApiAchTransfer> postAchTransfer(@Body ApiAchTransfer.Request request);

	@POST("/notifications/devices/")
	Observable<Device> postDevice(@Body Device device);

	@POST("/orders/")
	Observable<ApiOrder> postOrder(@Body OrderRequest orderRequest);

	@PUT("/ach/queued_deposit/")
	Observable<Void> postQueuedAchVerification(@Body AchVerificationRequest achVerificationRequest);

	@PUT("/settings/notifications/")
	Observable<Void> putNotificationSettings(@Body NotificationSettings notificationSettings);

	@GET("/instruments/?active_instruments_only=true")
	Observable<PaginatedResult<ApiInstrument>> queryInstruments(@Query("query") String str);

	@POST("/midlands/referral/{referral_id}/remind/")
	Observable<Void> remindPendingReferral(@Path("referral_id") String str);

	@GET("/positions/?nonzero=true")
	Observable<Void> reorderPositions(@Query("ordering") String str);

	@POST("/watchlists/{watchlistName}/reorder/")
	Observable<Void> reorderWatchlist(@Path("watchlistName") String str, @Body ReorderQuery reorderQuery);

	@FormUrlEncoded
	@PUT("/mfa/sms/request/")
	Observable<Void> requestMfa(@Field("phone_number") String str);

	@FormUrlEncoded
	@POST("/password_reset/request/")
	Observable<GenericResult> requestPasswordResetEmail(@Field("email") String str);

	@GET("/midlands/acats/brokerages/")
	Observable<PaginatedResult<AcatsBrokerage>> searchAcatsBrokerages(@Query("query") String str);

	@GET("/midlands/ach/iav_banks/")
	Observable<PaginatedResult<IavBank>> searchIavBanks(@Query("query") String str);

	@FormUrlEncoded
	@POST("/ach/iav/captcha/")
	Observable<Void> submitCaptchaToken(@Field("captcha_token") String str);

	@PUT("/user/additional_info/")
	Observable<UserAdditionalInfo> submitUserAdditionalInfo(@Body UserAdditionalInfo userAdditionalInfo);

	@PUT("/user/basic_info/")
	Observable<UserBasicInfo> submitUserBasicInfo(@Body UserBasicInfo userBasicInfo);

	@PUT("/user/employment/")
	Observable<UserEmployment> submitUserEmployment(@Body UserEmployment userEmployment);

	@PUT("/user/international_info/")
	Observable<UserInternationalInfo> submitUserInternationalInfo(@Body UserInternationalInfo userInternationalInfo);

	@PUT("/user/investment_profile/")
	Observable<ApiUserInvestmentProfile> submitUserInvestmentProfile(@Body ApiUserInvestmentProfile.Request request);

	@POST("/ach/relationships/{id}/unlink/")
	Observable<Void> unlinkAchRelationship(@Path("id") String str);

	@POST("/subscription/subscriptions/{subscriptionId}/unsubscribe/")
	Observable<Void> unsubscribeFromMarginPlan(@Path("subscriptionId") String str);

	@PATCH("/settings/margin/{accountNumber}/")
	Observable<ApiMarginSetting> updateDayTradeSetting(@Path("accountNumber") String str, @Body UpdateSettingRequest updateSettingRequest);

	@PATCH("/user/")
	Observable<ApiUser> updateUser(@Body UpdateRequest updateRequest);

	@PATCH("/user/basic_info/")
	Observable<UserBasicInfo> updateUserBasicInfo(@Body UserBasicInfo userBasicInfo);

	@PATCH("/user/employment/")
	Observable<UserEmployment> updateUserEmployment(@Body UserEmployment userEmployment);

	@PATCH("/user/investment_profile/")
	Observable<ApiUserInvestmentProfile> updateUserInvestmentProfile(@Body ApiUserInvestmentProfile.Request request);

	@POST("/subscription/subscriptions/")
	Observable<MarginUpgradePlans> upgradeInstantToGold(@Body MarginUpgrade.Request request);

	@POST("/margin/upgrades/")
	Observable<MarginUpgrade> upgradeToMargin(@Body MarginUpgrade.Request request);

	@POST("/upload/compliance_documents/")
	@Multipart
	Observable<Void> uploadComplianceDocument(@Part("document_request") RequestBody requestBody, @Part("type") RequestBody requestBody2, @Part MultipartBody.Part part);

	@POST("/midlands/contacts/invites/")
	Observable<Void> uploadContactInvitesData(@Body ContactData.Request request);

	@POST("/midlands/contacts/")
	Observable<Void> uploadContactsData(@Body ContactData.Request request);

	@POST("/upload/national_ids/")
	@Multipart
	Observable<Void> uploadNationalId(@Part("document_request") RequestBody requestBody, @Part("country") RequestBody requestBody2, @Part MultipartBody.Part part, @Part MultipartBody.Part part2);

	@POST("/upload/photo_ids/")
	@Multipart
	Observable<Void> uploadPhotoId(@Part("document_request") RequestBody requestBody, @Part("country") RequestBody requestBody2, @Part("type") RequestBody requestBody3, @Part MultipartBody.Part part, @Part MultipartBody.Part part2);

	@FormUrlEncoded
	@PUT("/mfa/sms/verify/")
	Observable<Mfa> verifyMfa(@Field("mfa_code") String str);

	@FormUrlEncoded
	@POST("/ach/relationships/{id}/micro_deposits/verify/")
	Observable<Void> verifyMicrodeposits(@Path("id") String str, @Field("first_amount_cents") String str2, @Field("second_amount_cents") String str3);

	@GET("/mfa/recovery/")
	Observable<BackupCode> viewBackupCode();
}
