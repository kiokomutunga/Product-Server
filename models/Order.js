const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
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
    phone: { type: String, required: false },
    email: { type: String },
  },
  shippingAddress: {
    address: { type: String, required: false },
    city: { type: String, required: false },
    county: { type: String, required: false},
    postalCode: { type: String }, // optional
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Order", orderSchema);
