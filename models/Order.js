const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: Number }],
  totalAmount: Number,
  status: { type: String, enum: ["Pending", "Confirmed", "Cancelled"], default: "Pending" },
  paymentStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
  mpesaTransactionId: String,
  shippingAddress: String
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);