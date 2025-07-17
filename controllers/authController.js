const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendEmail } = require("../utils/mailer");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
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
//register admin
// Admin Register (with secret key)
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, secretCode } = req.body;

    if (secretCode !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Invalid admin secret" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Admin with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin", // assign admin role
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, code: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 });

    await sendEmail({
      to: email,
      subject: "Verify Your Admin Email",
      html: `<p>Your OTP is <b>${otpCode}</b></p>`
    });

    res.status(201).json({ message: "Admin registered. OTP sent to email." });
  } catch (err) {
    res.status(500).json({ error: "Admin registration failed" });
  }
};

// Verify OTP
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

// Login
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

// Forgot Password (Send OTP)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 },
      { upsert: true }
    );

    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your password reset OTP is <b>${otpCode}</b></p>`
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send reset OTP" });
  }
};

// Reset Password (Using OTP)
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const otp = await Otp.findOne({ email, code });

    if (!otp || otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await Otp.deleteOne({ _id: otp._id });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: "Password reset failed" });
  }
};

// Change Password (Authenticated Users)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Password change failed" });
  }
};

// Google Sign-In
exports.googleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        isVerified: true,
        password: "",
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Google login failed" });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

