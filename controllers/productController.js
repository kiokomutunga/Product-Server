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

  // Search in multiple fields (name, description, category)
  if (q.trim()) {
    const regex = new RegExp(q.trim(), "i");
    filter.$or = [
      { name: regex },
      { description: regex },
      { category: regex }
    ];
  }

  // Category filter
  if (cat) filter.category = cat;

  // Price filter
  if (min || max) {
    filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);
  }

  // Sort options
  let sortOption = {};
  if (sort === "price_low")  sortOption = { price: 1 };
  if (sort === "price_high") sortOption = { price: -1 };
  if (sort === "newest")     sortOption = { createdAt: -1 };

  try {
    // Paginated results
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Suggestions: first 5 product names for the search
    const suggestions = q.trim()
      ? await Product.find({ name: { $regex: q.trim(), $options: "i" } })
          .select("name")
          .limit(5)
      : [];

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      suggestions: suggestions.map(s => s.name) // Only names
    });
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
};


// ✅ Add Review
exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ error: "You already reviewed this product" });

    const review = {
      user: req.user._id,
      name: req.user.username || req.user.name,
      rating: Number(rating),
      comment,
      verifiedPurchase: true,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.averageRating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added", reviews: product.reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add review" });
  }
};

// ✅ Admin: Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.reviews = product.reviews.filter(r => r._id.toString() !== req.params.reviewId);
    product.numReviews = product.reviews.length;
    product.averageRating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
        : 0;

    await product.save();
    res.json({ message: "Review deleted", reviews: product.reviews });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review" });
  }
};

// ✅ Admin: Hide/Unhide Review
exports.toggleReviewVisibility = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    review.hidden = !review.hidden;
    await product.save();

    res.json({ message: "Review visibility updated", review });
  } catch (err) {
    res.status(500).json({ error: "Failed to update review visibility" });
  }
};
