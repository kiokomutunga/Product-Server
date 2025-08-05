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
      user: req.user._id,
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
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
  <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: #ffb300; padding: 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px;">Limpopo Furniture Stores</h1>
    </div>
    <div style="padding: 30px; text-align: center;">
      <h2 style="color: #333;">🎉 Your Order Has Been Placed!</h2>
      <p style="font-size: 16px; color: #555;">Thank you for shopping with us. Your order is now being processed.</p>
      
      <div style="margin: 20px 0; padding: 15px; background: #f1f1f1; border-radius: 8px;">
        <p style="margin: 0; font-size: 18px; color: #333;">
          <strong>Order ID:</strong> ${order._id}
        </p>
      </div>

      <p style="font-size: 15px; color: #777;">
        We’ll send you another email once your items are shipped.  
        You can track your order anytime from your account.
      </p>

      <a href="https://yourwebsite.com/orders/${order._id}" 
         style="display: inline-block; margin-top: 20px; padding: 12px 20px; background: #ffb300; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
         View My Order
      </a>
    </div>
    <div style="background: #333; color: #fff; text-align: center; padding: 15px; font-size: 12px;">
      © 2025 Limpopo Furniture Stores. All Rights Reserved.
    </div>
  </div>
</div>
`,
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

exports.getOrderById = async (req, res) => {
  try {
    // Populate product details in items
    const order = await Order.findById(req.params.id)
      .populate("items.product") // populate product info
      .populate("user", "firstName lastName email phone"); // optional: fetch user info

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Respond with a structured object including customer and shipping info
    res.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        // Include items with product details
        items: order.items.map(item => ({
          quantity: item.quantity,
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image || null
          }
        })),

        // Include customer info and shipping address
        customerInfo: order.customerInfo,
        shippingAddress: order.shippingAddress
      }
    });
  } catch (err) {
    console.error("Error fetching order by ID:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

