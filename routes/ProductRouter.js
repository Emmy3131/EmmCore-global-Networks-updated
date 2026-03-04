const express = require('express')
const router = express.Router()
const productController = require('../controller/ProductController')
// CREATE + GET
router
  .route('/product')
  .get(productController.getProducts)
  .post(productController.createProduct)

// UPDATE + DELETE
router
  .route('/product/:id')
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct)

module.exports = router