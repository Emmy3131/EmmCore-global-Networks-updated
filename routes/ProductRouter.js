const express = require('express')
const router = express.Router()
const productController = require('../controller/ProductController')
const authController = require('./../controller/authController')

//GetProductByCategory
router.get("/category/:id", productController.getProductsByCategory);
router.get("/isTrending", productController.getTrendingProducts);
router.get("/isFlashSale", productController.getFlashSaleProducts);
router.get("/new-arrivals", productController.getNewArrivals);
router.get("/search", productController.searchProducts);
// CREATE + GET
router
  .route('/')
  .get(productController.getProducts)
  .post(authController.protect, authController.restrictTo('admin'), productController.createProduct)

// UPDATE + DELETE
router
  .route('/:id')
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct)

module.exports = router