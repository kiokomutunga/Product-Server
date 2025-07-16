const jwt = require("jsonwebtoken");
const User = require("../models/User"); // adjust path if different

exports.authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password"); // exclude password
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // now req.user has full user object, including .id
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
