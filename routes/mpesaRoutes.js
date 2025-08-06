const router = require("express").Router();
const { stkPush, mpesaCallback } = require("../controllers/mpesacontroller");

router.post("/stk", stkPush);
router.post("/callback", mpesaCallback);

module.exports = router;
