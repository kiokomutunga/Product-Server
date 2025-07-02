const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const fileFilter = (req, file, cb) => cb(null, [".jpg", ".jpeg", ".png"].includes(path.extname(file.originalname).toLowerCase()));
module.exports = multer({ storage, fileFilter });
