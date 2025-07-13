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

    // Basic validation (optional but useful)
    if (
      !items?.length ||
      !customerInfo?.firstName ||
      !customerInfo?.phone ||
      !shippingAddress?.address
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing order details. Please complete all required fields.",
      });
    }

    // Format items properly
    const formattedItems = items.map((item) => ({
      product: item.product, // match frontend's productId
      quantity: item.quantity,
    }));

    const paymentStatus = paymentMethod === "cod" ? "Unpaid" : "Paid";

    const order = await Order.create({
      items: formattedItems,
      totalAmount,
      paymentMethod,
      mpesaTransactionId,
      shippingAddress,
      customerInfo,
      paymentStatus,
    });

    // Send order confirmation email
    await sendEmail({
      to: customerInfo.email,
      subject: "Order Placed Successfully",
      html: `<h2>Your order has been placed!</h2><p>Order ID: ${order._id}</p>`,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("Order placement failed:", err);
    console.log("Order request body:", req.body);
    res.status(500).json({
      success: false,
      error: "Failed to place order",
      message: err.message,
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate("items.product");
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Fetching user orders failed:", err);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user items.product");
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Fetching all orders failed:", err);
    res.status(500).json({ success: false, error: "Failed to fetch all orders" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["Order Placed", "Processing", "Shipped", "In Transit", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.status = status;

    // If delivered and payment is COD, mark as paid
    if (status === "Delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "Paid";
    }

    await order.save();

    // Email on delivery
    if (status === "Delivered") {
      await sendEmail({
        to: order.customerInfo.email,
        subject: "Order Delivered",
        html: `<h2>Your order has been delivered!</h2><p>Order ID: ${order._id}</p>`,
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Failed to update order status:", err);
    res.status(500).json({ success: false, error: "Failed to update order status" });
  }
};


exports.markOrderDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.status = "Delivered";

    if (order.paymentMethod === "cod") {
      order.paymentStatus = "Paid";
    }

    await order.save();

    await sendEmail({
      to: order.customerInfo.email,
      subject: "Order Delivered",
      html: `<h2>Your order has been delivered!</h2><p>Order ID: ${order._id}</p>`,
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("Failed to mark as delivered:", err);
    res.status(500).json({ success: false, error: "Failed to mark as delivered" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "Cancelled" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Failed to cancel order:", err);
    res.status(500).json({ success: false, error: "Failed to cancel order" });
  }
};
