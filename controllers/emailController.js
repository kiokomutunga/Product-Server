const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Change if using Outlook/Yahoo/etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Email server error:", error);
  } else {
    console.log("✅ Email server ready");
  }
});

// 📩 Send Contact Form Email
const sendContactEmail = async (req, res) => {
  const { name, email, phone, subject, inquiryType, message } = req.body;

  try {
    await transporter.sendMail({
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact: ${subject || "No Subject"}`,
      html: `
        <h2>New Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Inquiry Type:</strong> ${inquiryType}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Email sending failed" });
  }
};

// 📰 Send Newsletter Subscription Email
const sendSubscriptionEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Notify admin
    await transporter.sendMail({
      from: `"Newsletter" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New Newsletter Subscriber",
      text: `A new user subscribed: ${email}`,
    });

    // Send welcome email to subscriber
    await transporter.sendMail({
      from: `"Your Website" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Our Newsletter!",
      html: `
        <h2>Thank you for subscribing!</h2>
        <p>You'll now get updates on our latest arrivals, offers, and discounts.</p>
      `,
    });

    res.status(200).json({ success: true, message: "Subscription successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Subscription email failed" });
  }
};

module.exports = { sendContactEmail, sendSubscriptionEmail };
