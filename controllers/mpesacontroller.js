const axios = require("axios");
const moment = require("moment");

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
  MPESA_ENV
} = process.env;

const BASE_URL = MPESA_ENV === "live"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

// 🔹 Generate OAuth Token
async function getToken() {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
  const url = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

  const { data } = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return data.access_token;
}

// 🔹 Initiate STK Push
exports.stkPush = async (req, res) => {
  try {
    const { phone, amount, accountReference, transactionDesc } = req.body;

    const token = await getToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

    const { data } = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: accountReference || "LIMPOPO",
        TransactionDesc: transactionDesc || "Limpopo Furniture Purchase",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.status(200).json(data);
  } catch (err) {
    console.error("STK Push Error:", err.response?.data || err.message);
    res.status(500).json({ error: "STK Push failed" });
  }
};

// 🔹 Handle Callback
exports.mpesaCallback = async (req, res) => {
  const result = req.body.Body?.stkCallback;
  
  if (result?.ResultCode === 0) {
    const metadata = result.CallbackMetadata.Item;
    const receipt = metadata.find(i => i.Name === "MpesaReceiptNumber")?.Value;
    const amount = metadata.find(i => i.Name === "Amount")?.Value;
    const phone = metadata.find(i => i.Name === "PhoneNumber")?.Value;

    console.log("✅ Payment Success:", { receipt, amount, phone });

    // TODO: Mark order as paid in DB using your Order model
  } else {
    console.log("❌ Payment Failed:", result?.ResultDesc);
  }

  res.status(200).json({ message: "Callback received" });
};
