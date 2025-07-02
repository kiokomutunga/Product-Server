const axios = require("axios");
const moment = require("moment");
const base64 = require("base-64");

const getToken = async () => {
  const { data } = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    auth: { username: process.env.MPESA_CONSUMER_KEY, password: process.env.MPESA_CONSUMER_SECRET }
  });
  return data.access_token;
};

exports.stkPush = async (phone, amount, accountRef) => {
  const token = await getToken();
  const timestamp = moment().format("YYYYMMDDHHmmss");
  const password = base64.encode(process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp);

  const { data } = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: "Furniture Purchase"
  }, { headers: { Authorization: `Bearer ${token}` } });

  return data;
};
