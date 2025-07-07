const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["mpesa", "card", "cod"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Unpaid"],
    default: "Unpaid",
  },
  mpesaTransactionId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Order Placed", "Processing", "Shipped", "In Transit", "Delivered"],
    default: "Order Placed",
  },
  customerInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    county: { type: String, required: true },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Order", orderSchema);
