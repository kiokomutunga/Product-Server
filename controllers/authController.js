const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendEmail } = require("../utils/mailer");

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashedPassword });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, code: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 });
    await sendEmail({
      to: email,
      subject: "Verify Your Email",
      html: `<p>Your OTP is <b>${otpCode}</b></p>`
    });

    res.status(201).json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    const otp = await Otp.findOne({ email, code });

    if (!otp || otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await User.findOneAndUpdate({ email }, { isVerified: true });
    await Otp.deleteOne({ _id: otp._id });
    res.json({ message: "Email verified" });
  } catch (err) {
    res.status(500).json({ error: "OTP verification failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};
