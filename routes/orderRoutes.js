const express = require("express");
const router = express.Router();

const orderController = require("../controller/OrderController");
const authController = require("../controller/authController");

router.post(
  "/webhook",
  express.raw({ type: "application/json" }), orderController.handlePayStackWebhook,
);

/* ================= CHECKOUT ================= */
router.post(
  "/checkout",
  authController.protect,
  orderController.getCheckoutSession,
);

/* ================= VERIFY PAYMENT ================= */
router.get(
  "/verify-payment",
  authController.protect,
  orderController.verifyPayment,
);

/* ================= PAYSTACK WEBHOOK ================= */
/* NO AUTH HERE */

// router.post("/webhook", orderController.handlePayStackWebhook);

/* ================= ORDERS ================= */
router.route("/").get(authController.protect, orderController.getAllOrders);

router.get("/my-orders", authController.protect, orderController.getMyOrders);

router
  .route("/:id")
  .get(authController.protect, orderController.getOrder)
  .delete(authController.protect, orderController.deleteOrder)
  .patch(authController.protect, orderController.updateOrderStatus);

module.exports = router;
