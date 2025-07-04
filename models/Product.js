const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  commission: Number,
  stock: Number,
  category: String,
  images: [String],
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
