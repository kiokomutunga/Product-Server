const router = require("express").Router();
const upload = require("../middleware/multer");
const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

router.post("/add", upload.array("images", 5), addProduct);
router.get("/", getProducts);
router.put("/:id", upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct); // <- works now

module.exports = router;

//const router = require("express").Router();
//const { authenticateUser, requireAdmin } = require("../middleware/auth");
//const upload = require("../middleware/multer");
//const { addProduct, getProducts, updateProduct, deleteProduct } = require("../controllers/productController");

//router.post("/add", authenticateUser, requireAdmin, upload.array("images", 5), addProduct);
//router.post("/add", upload.array("images", 5), addProduct);
//router.get("/", getProducts);
//router.put("/:id", authenticateUser, requireAdmin, upload.array("images", 5), updateProduct);// to include authorization
//router.put("/:id",upload.array("images", 5), updateProduct);
//router.delete("/:id", authenticateUser, deleteProduct);
