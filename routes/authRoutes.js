const router = require("express").Router();
const { register, login, verifyOtp } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

module.exports = router;