const axios = require('axios');
const moment = require('moment');

class MPesaService {
  constructor() {
    this.consumerKey = (process.env.MPESA_CONSUMER_KEY || '').trim();
    this.consumerSecret = (process.env.MPESA_CONSUMER_SECRET || '').trim();
    this.shortcode = (process.env.MPESA_SHORTCODE || '').trim();
    this.passkey = (process.env.MPESA_PASSKEY || '').trim();
    this.callbackUrl = (process.env.MPESA_CALLBACK_URL || '').trim();

    // Sandbox URLs
    this.authUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    this.stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    this.queryUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    // Production URLs (switch when going live)
    // this.authUrl = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    // this.stkUrl = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    // this.queryUrl = 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    this.accessToken = null;
    this.tokenExpiryTime = null;
  }

  validateConfig() {
    const missing = [];
    if (!this.consumerKey) missing.push('MPESA_CONSUMER_KEY');
    if (!this.consumerSecret) missing.push('MPESA_CONSUMER_SECRET');
    if (!this.shortcode) missing.push('MPESA_SHORTCODE');
    if (!this.passkey) missing.push('MPESA_PASSKEY');
    if (!this.callbackUrl) missing.push('MPESA_CALLBACK_URL');

    if (missing.length > 0) {
      throw new Error(`❌ Missing M-Pesa config: ${missing.join(', ')}. Check your .env file.`);
    }

    if (!/^\d{5,6}$/.test(this.shortcode)) {
      throw new Error(`❌ Invalid shortcode format: "${this.shortcode}". Use numeric shortcode like 174379 for sandbox.`);
    }

    if (!/^https?:\/\//i.test(this.callbackUrl)) {
      throw new Error(`❌ Invalid callback URL: "${this.callbackUrl}". Must start with http:// or https://`);
    }

    console.log('✓ M-Pesa configuration validated successfully');
    console.log(`  - Shortcode: ${this.shortcode}`);
    console.log(`  - Callback URL: ${this.callbackUrl}`);
  }

  async getAccessToken() {
    try {
      this.validateConfig();

      if (this.accessToken && this.tokenExpiryTime && moment().isBefore(this.tokenExpiryTime)) {
        console.log('✓ Using cached token (expires at', this.tokenExpiryTime.format('HH:mm:ss'), ')');
        return this.accessToken;
      }

      console.log('🔑 Requesting new M-Pesa access token...');
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

      const response = await axios.get(this.authUrl, {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 10000
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiryTime = moment().add(3599, 'seconds');

      console.log('✓ Token obtained successfully (expires at', this.tokenExpiryTime.format('HH:mm:ss'), ')');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to generate M-Pesa access token. Check credentials and environment.');
    }
  }

  async initiateSTKPush(phoneNumber, amount, orderId, orderNumber) {
    try {
      this.validateConfig();
      const token = await this.getAccessToken();

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const timestamp = moment().format('YYYYMMDDHHmmss');
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: orderNumber,
        TransactionDesc: `Payment for order ${orderNumber}`
      };

      console.log('🔍 STK Push Payload:', payload);

      const response = await axios.post(this.stkUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ STK Push Response:', response.data);

      // M-Pesa ResponseCode: 0 = Success (STK will be pushed), Others = Failure
      const responseCode = String(response.data.ResponseCode || '').trim();
      const isSuccessful = responseCode === '0';

      if (!isSuccessful) {
        console.error('❌ STK Push failed with ResponseCode:', responseCode, 'Description:', response.data.ResponseDescription);
        return {
          success: false,
          error: response.data.ResponseDescription || `STK push failed (Code: ${responseCode})`,
          responseCode: response.data.ResponseCode,
          responseDescription: response.data.ResponseDescription,
          customerMessage: response.data.CustomerMessage
        };
      }

      return {
        success: true,
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage
      };
    } catch (error) {
      console.error('❌ STK Push Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message,
        errorCode: error.response?.data?.errorCode || null,
        requestId: error.response?.data?.requestId || null
      };
    }
  }

  async querySTKPushStatus(checkoutRequestId) {
    try {
      this.validateConfig();
      const token = await this.getAccessToken();
      const timestamp = moment().format('YYYYMMDDHHmmss');
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(this.queryUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // M-Pesa ResponseCode: 0 = Query succeeded, can proceed to check ResultCode
      const responseCode = String(response.data.ResponseCode || '').trim();
      
      const queryResult = {
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        resultCode: response.data.ResultCode,
        resultDescription: response.data.ResultDescription
      };

      if (responseCode !== '0') {
        console.warn('⚠️ STK Query returned ResponseCode:', responseCode, 'Description:', response.data.ResponseDescription);
        return {
          success: false,
          ...queryResult,
          error: response.data.ResponseDescription || `Query failed (Code: ${responseCode})`
        };
      }

      return {
        success: true,
        ...queryResult
      };
    } catch (error) {
      console.error('❌ STK Query Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message,
        errorCode: error.response?.data?.errorCode || null,
        requestId: error.response?.data?.requestId || null
      };
    }
  }

  formatPhoneNumber(phone) {
    let formatted = phone.toString().trim();
    if (formatted.startsWith('+')) formatted = formatted.substring(1);
    if (formatted.startsWith('0')) formatted = '254' + formatted.substring(1);
    if (!formatted.startsWith('254')) formatted = '254' + formatted;
    return formatted;
  }

  validateCallback(data) {
    try {
      const result = {
        success: data.Body.stkCallback.ResultCode === 0,
        resultCode: data.Body.stkCallback.ResultCode,
        resultDescription: data.Body.stkCallback.ResultDesc,
        merchantRequestId: data.Body.stkCallback.MerchantRequestID,
        checkoutRequestId: data.Body.stkCallback.CheckoutRequestID,
        amount: null,
        mpesaReference: null,
        phoneNumber: null,
        transactionDate: null
      };

      if (result.success && data.Body.stkCallback.CallbackMetadata) {
        for (const item of data.Body.stkCallback.CallbackMetadata.Item) {
          if (item.Name === 'Amount') result.amount = item.Value;
          if (item.Name === 'MpesaReceiptNumber') result.mpesaReference = item.Value;
          if (item.Name === 'PhoneNumber') result.phoneNumber = item.Value;
          if (item.Name === 'TransactionDate') result.transactionDate = item.Value;
        }
      }
      return result;
    } catch (error) {
      console.error('❌ Callback validation error:', error);
      return { success: false, error: 'Invalid callback format' };
    }
  }
}

module.exports = new MPesaService();
