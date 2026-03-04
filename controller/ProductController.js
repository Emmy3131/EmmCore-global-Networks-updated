const Product = require('../model/ProductModel')

// ✅ GET ALL PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
    res.status(200).json({
      status: "success",
      results: products.length,
      data: products
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    })
    }
}

// ✅ GET SINGLE PRODUCT
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params
    const product = await Product.findById(id)

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found"
      })
    }

    res.status(200).json({
      status: "success",
      data: product
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    })
  }
}

// ✅ CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { image, name, description, price, category, stock } = req.body
    if (!image || !name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required"
      })
    }
    
    const newProduct = new Product({
      image,
      name,
      description,
      price,
      category,
      stock
    })

    const savedProduct = await newProduct.save()
    res.status(201).json({
      status: "success",
      data: savedProduct
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    })
  }
}

// ✅ UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true })

    if (!updatedProduct) {
      return res.status(404).json({
        status: "error",
        message: "Product not found"
      })
    }
    res.status(200).json({
      status: "success",
      data: updatedProduct
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    })
  }
}

// ✅ DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    const deletedProduct = await Product.findByIdAndDelete(id)
    if (!deletedProduct) {
      return res.status(404).json({
        status: "error",
        message: "Product not found"
      })
    }
    res.status(200).json({
      status: "success",
      message: "Product deleted successfully"
    })
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message
      })
    }
}