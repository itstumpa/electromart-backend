// src/app/modules/payment/sslcommerz.service.ts
import axios from 'axios';
import crypto from 'crypto';

const SSLCOMMERZ_API =
  process.env.SSLCOMMERZ_IS_LIVE === 'true'
    ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

const VALIDATION_API =
  process.env.SSLCOMMERZ_IS_LIVE === 'true'
    ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
    : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

const REFUND_API =
  process.env.SSLCOMMERZ_IS_LIVE === 'true'
    ? 'https://securepay.sslcommerz.com/merchant/payment/refund.json'
    : 'https://sandbox.sslcommerz.com/merchant/payment/refund.json';

interface SSLCommerzPayload {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
}

export const initiateSSLCommerzPayment = async (
  payload: SSLCommerzPayload
): Promise<{ gatewayUrl: string; sessionKey: string }> => {
  const data = {
    store_id: process.env.SSLCOMMERZ_STORE_ID,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: payload.amount,
    currency: payload.currency,
    tran_id: payload.orderId,
    success_url: process.env.SSLCOMMERZ_SUCCESS_URL,
    fail_url: process.env.SSLCOMMERZ_FAIL_URL,
    cancel_url: process.env.SSLCOMMERZ_CANCEL_URL,
    ipn_url: process.env.SSLCOMMERZ_IPN_URL,
    cus_name: payload.customerName,
    cus_email: payload.customerEmail,
    cus_phone: payload.customerPhone,
    cus_add1: payload.customerAddress,
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    shipping_method: 'NO',
    product_name: 'Electromart Order',
    product_category: 'Electronics',
    product_profile: 'general',
  };

  const response = await axios.post(SSLCOMMERZ_API, data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (response.data.status !== 'SUCCESS') {
    throw new Error('SSLCommerz session initiation failed');
  }

  return {
    gatewayUrl: response.data.GatewayPageURL,
    sessionKey: response.data.sessionkey,
  };
};

// validate IPN hit from SSLCommerz
export const validateSSLCommerzPayment = async (valId: string): Promise<any> => {
  const response = await axios.get(VALIDATION_API, {
    params: {
      val_id: valId,
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      format: 'json',
    },
  });
  return response.data;
};

// refund via SSLCommerz
export const refundSSLCommerzPayment = async (bankTransactionId: string, amount: number, reason: string): Promise<any> => {
  const response = await axios.post(
    REFUND_API,
    {
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      bank_tran_id: bankTransactionId,
      refund_amount: amount,
      refund_remarks: reason,
    },
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data;
};

/**
 * Verifies the SSLCommerz IPN `verify_hash` signature.
 * SSLCommerz sends a `verify_key` (colon-separated field names) and
 * a `verify_hash` (MD5 or SHA-512 of concatenated field values + store password).
 * Returns true if the hash is valid, false otherwise.
 */
export const verifySSLCommerzIPNSignature = (body: Record<string, string>): boolean => {
  const { verify_key, verify_hash, verify_sign_algo } = body;

  if (!verify_key || !verify_hash) {
    return false;
  }

  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storePassword) {
    return false;
  }

  // Split verify_key into field names
  const keys = verify_key.split(':');

  // Get values in the order specified by verify_key
  const values = keys.map((key) => body[key] || '');

  // Concatenate values with the store password
  const concatString = values.join('') + storePassword;

  // Choose hash algorithm based on verify_sign_algo
  if (verify_sign_algo === 'sha512' || verify_sign_algo === 'SHA512') {
    const computedHash = crypto.createHash('sha512').update(concatString).digest('hex').toLowerCase();
    return computedHash === verify_hash.toLowerCase();
  }

  // Default: MD5
  const computedHash = crypto.createHash('md5').update(concatString).digest('hex').toLowerCase();
  return computedHash === verify_hash.toLowerCase();
};
