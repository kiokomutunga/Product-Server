const router = require("express").Router();
const { authenticateUser, requireAdmin } = require("../middleware/auth");

const {
  placeOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  markOrderDelivered,
  cancelOrder,
  getOrderById,
} = require("../controllers/ordercontroller");

//  User places order
router.post("/place",authenticateUser, placeOrder);

//  Get user's own orders
router.get("/user", authenticateUser, getUserOrders);
//  Admin fetches all orders
router.get("/", authenticateUser, requireAdmin, getAllOrders);
//router.get("/", getAllOrders); // in routes/orderRoutes.js


// Admin updates order status (e.g., Processing → Shipped)
router.put("/status/:id", authenticateUser, requireAdmin, updateOrderStatus);

// Admin marks order as delivered (triggers delivery email)
router.put("/deliver/:id",requireAdmin, markOrderDelivered);

// Admin cancels order
router.put("/cancel/:id", authenticateUser,requireAdmin, cancelOrder);
//get orders by id
router.get("/:id", getOrderById);

module.exports = router;
