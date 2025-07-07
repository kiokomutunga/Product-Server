const Order = require("../models/Order");
const User = require("../models/User");
const { sendEmail } = require("../utils/mailer");

exports.placeOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      paymentMethod,
      mpesaTransactionId,
      shippingAddress,
      customerInfo,
    } = req.body;

    let paymentStatus = paymentMethod === "cod" ? "Unpaid" : "Paid";

    const order = await Order.create({
      user: req.user.id,
      items,
      totalAmount,
      paymentMethod,
      mpesaTransactionId,
      shippingAddress,
      customerInfo,
      paymentStatus,
    });

    await sendEmail({
      to: customerInfo.email,
      subject: "Order Placed Successfully",
      html: `<h2>Your order has been placed!</h2><p>Order ID: ${order._id}</p>`
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

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (status === "Delivered") {
      order.paymentStatus = order.paymentMethod === "cod" ? "Paid" : order.paymentStatus;
      await order.save();

      await sendEmail({
        to: order.customerInfo.email,
        subject: "Order Delivered",
        html: `<h2>Your order has been delivered!</h2><p>Order ID: ${order._id}</p>`
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
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
