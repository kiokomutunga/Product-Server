const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Image file filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
