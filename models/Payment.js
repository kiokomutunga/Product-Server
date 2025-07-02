const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  amount: Number,
  phone: String,
  transactionId: String,
  resultCode: Number,
  status: { type: String, enum: ["Success", "Failed", "Pending"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);