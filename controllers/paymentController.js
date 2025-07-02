const Payment = require("../models/Payment");
const Order = require("../models/Order");
const { stkPush } = require("../utils/mpesa");
const { sendEmail } = require("../utils/mailer");

exports.initiateSTKPush = async (req, res) => {
  const { phone, amount, orderId } = req.body;
  try {
    const response = await stkPush(phone, amount, orderId);
    await Payment.create({
      user: req.user.id,
      order: orderId,
      amount,
      phone,
      status: "Pending"
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "STK push failed" });
  }
};

exports.mpesaCallback = async (req, res) => {
  const body = req.body.Body.stkCallback;
  const resultCode = body.ResultCode;
  const metadata = body.CallbackMetadata?.Item || [];
  const phone = metadata.find(i => i.Name === "PhoneNumber")?.Value;
  const amount = metadata.find(i => i.Name === "Amount")?.Value;
  const receipt = metadata.find(i => i.Name === "MpesaReceiptNumber")?.Value;

  const payment = await Payment.findOneAndUpdate(
    { phone, amount },
    { resultCode, transactionId: receipt, status: resultCode === 0 ? "Success" : "Failed" },
    { new: true }
  );

  if (payment && resultCode === 0) {
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: "Paid", mpesaTransactionId: receipt });
    const order = await Order.findById(payment.order).populate("user");
    await sendEmail({
      to: order.user.email,
      subject: "Payment Successful",
      html: `<p>Your payment of KES ${amount} was received. Receipt: ${receipt}</p>`
    });
  }

  res.status(200).json({ message: "Callback processed" });
};
