require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Allowed origins list
const allowedOrigins = [
  "https://furnish-ease-shop.vercel.app",      // User site
  "https://product-order-command-hub.vercel.app" // Admin site
];

// CORS setup
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true // allow cookies/tokens
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productroutes"));
app.use("/api/orders", require("./routes/orderroutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/mpesa", require("./routes/mpesaRoutes"));

// DB connection & server start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error("❌ DB connection error:", err));
