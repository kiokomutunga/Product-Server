const Product = require("../models/Product");

// Create a new product
exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, commission, stock, category } = req.body;
    const images = req.files.map(file => file.path);
    const product = new Product({ name, description, price, commission, stock, category, images });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to add product" });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const updates = req.body;
    if (req.files?.length > 0) {
      updates.images = req.files.map(file => file.path);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
};

//Search products with filters
exports.searchProducts = async (req, res) => {
  const {
    q = "",
    cat,
    min,
    max,
    sort,
    page = 1,
    limit = 20
  } = req.query;

  const filter = {};

  // Full-text search
  if (q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  // Category filter
  if (cat) {
    filter.category = cat;
  }

  // Price filter
  if (min || max) {
    filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);
  }

  // Sort options
  let sortOption = { score: { $meta: "textScore" } }; // default: relevance
  if (sort === "price_low")  sortOption = { price: 1 };
  if (sort === "price_high") sortOption = { price: -1 };
  if (sort === "newest")     sortOption = { createdAt: -1 };

  try {
    const products = await Product
      .find(filter, q ? { score: { $meta: "textScore" } } : {})
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
};
