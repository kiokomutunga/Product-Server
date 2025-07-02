const router = require("express").Router();
const { authenticateUser } = require("../middleware/auth");
const { initiateSTKPush, mpesaCallback } = require("../controllers/paymentController");

router.post("/stk", authenticateUser, initiateSTKPush);
router.post("/callback", mpesaCallback);

module.exports = router;