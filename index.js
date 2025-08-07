require('dotenv').config();
const dotnev = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productroutes"));
app.use("/api/orders", require("./routes/orderroutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

const mpesaRoutes = require("./routes/mpesaRoutes");
app.use("/api/mpesa", mpesaRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log("Server running")))
  .catch(err => console.error(err));