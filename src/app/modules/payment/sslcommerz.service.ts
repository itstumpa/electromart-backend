// src/app/modules/payment/sslcommerz.service.ts
import axios from "axios";

const SSLCOMMERZ_API = process.env.SSLCOMMERZ_IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
  : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

const VALIDATION_API = process.env.SSLCOMMERZ_IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
  : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

const REFUND_API = process.env.SSLCOMMERZ_IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com/merchant/payment/refund.json"
  : "https://sandbox.sslcommerz.com/merchant/payment/refund.json";

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
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: "ElectroMart Order",
    product_category: "Electronics",
    product_profile: "general",
  };

  const response = await axios.post(SSLCOMMERZ_API, data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (response.data.status !== "SUCCESS") {
    throw new Error("SSLCommerz session initiation failed");
  }

  return {
    gatewayUrl: response.data.GatewayPageURL,
    sessionKey: response.data.sessionkey,
  };
};

// validate IPN hit from SSLCommerz
export const validateSSLCommerzPayment = async (
  valId: string
): Promise<any> => {
  const response = await axios.get(VALIDATION_API, {
    params: {
      val_id: valId,
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      format: "json",
    },
  });
  return response.data;
};

// refund via SSLCommerz
export const refundSSLCommerzPayment = async (
  bankTransactionId: string,
  amount: number,
  reason: string
): Promise<any> => {
  const response = await axios.post(
    REFUND_API,
    {
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      bank_tran_id: bankTransactionId,
      refund_amount: amount,
      refund_remarks: reason,
    },
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data;
};