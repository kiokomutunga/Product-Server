const router = require("express").Router();
const { sendContactEmail, sendSubscriptionEmail } = require("../controllers/emailController");

router.post("/contact", sendContactEmail);
router.post("/subscribe", sendSubscriptionEmail);

module.exports = router;
