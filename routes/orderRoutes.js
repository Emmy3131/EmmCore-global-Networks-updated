const express = require('express');
const router = express.Router();
const OrderController = require('../controller/OrderController');
const authController = require('../controller/authController');

// Protect all routes after this middleware
router.use(authController.protect);

router.post('/checkout', OrderController.getCheckoutSession);
router.post('/create-order', OrderController.handlePayStackWebhook);

// CREATE + GET ALL
router
  .route('/')
  .get(OrderController.getAllOrders)
 


// SINGLE ORDER
router
  .route('/:id')
  .get(OrderController.getOrder)
  .delete(OrderController.deleteOrder);

module.exports = router;