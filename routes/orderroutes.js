const router = require("express").Router();
const { authenticateUser, requireAdmin } = require("../middleware/auth");

const {
  placeOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  markOrderDelivered,
  cancelOrder,
} = require("../controllers/ordercontroller");

//  User places order
router.post("/place", placeOrder);

//  Get user's own orders
//router.get("/user", authenticateUser, getUserOrders);
router.get("/user", getUserOrders);
//  Admin fetches all orders
router.get("/admin", authenticateUser, requireAdmin, getAllOrders);

// Admin updates order status (e.g., Processing → Shipped)
router.put("/status/:id", authenticateUser, requireAdmin, updateOrderStatus);

// Admin marks order as delivered (triggers delivery email)
router.put("/deliver/:id", authenticateUser, requireAdmin, markOrderDelivered);

// Admin cancels order
router.put("/cancel/:id", authenticateUser, requireAdmin, cancelOrder);

module.exports = router;
