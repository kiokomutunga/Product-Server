const Order = require("../models/Order");
const User = require("../models/User");
const { sendEmail } = require("../utils/mailer");

exports.placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress } = req.body;
    const order = await Order.create({
      user: req.user.id,
      items,
      totalAmount,
      shippingAddress
    });
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: "New Order Placed",
      html: `<p>A new order has been placed by ${req.user.id}</p>`
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to place order" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate("items.product");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user items.product");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all orders" });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: "Confirmed" }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to confirm order" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: "Cancelled" }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
};
