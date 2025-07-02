const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: String,
  code: String,
  expiresAt: Date
});

module.exports = mongoose.model("Otp", otpSchema);