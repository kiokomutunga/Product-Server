const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.sendEmail = ({ to, subject, text, html }) =>
  transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text, html });