const Product = require("../models/Product");

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

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updates = req.body;
    if (req.files?.length > 0) updates.images = req.files.map(file => file.path);
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
};
