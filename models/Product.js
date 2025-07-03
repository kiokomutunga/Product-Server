const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  commission: Number,
  Stocknumber :Number,
  Category:String,
  stock: Number,
  images: [String],
  category: String,
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);