const router = require("express").Router();
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const { placeOrder, getUserOrders, getAllOrders, confirmOrder, cancelOrder } = require("../controllers/orderController");

router.post("/place", authenticateUser, placeOrder);
router.get("/user", authenticateUser, getUserOrders);
router.get("/admin", authenticateUser, requireAdmin, getAllOrders);
router.put("/confirm/:id", authenticateUser, requireAdmin, confirmOrder);
router.put("/cancel/:id", authenticateUser, requireAdmin, cancelOrder);

module.exports = router;