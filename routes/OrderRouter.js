const express = require('express')
const router = express.Router()
const OrderController = require('../controller/OrderController')

// CREATE + GET
router
  .route('/order')
  .get(OrderController.getOrders)
  .post(OrderController.createOrder)

// GET SINGLE ORDER
router
  .route('/order/:id')
  .get(OrderController.getOrder)
  .patch(OrderController.updateOrder)
  .delete(OrderController.deleteOrder)