const express = require("express");
const router = express.Router();
const CartController = require("../controller/CartController");
const authController = require("../controller/authController");

//Protect all routes after this middleware
router.use(authController.protect);
// CREATE + GET
router
  .route("/")
  .get(CartController.getCart)
  .post(CartController.addToCart)
  .delete(CartController.clearCart);

// UPDATE + DELETE
router
  .route("/:id")
  .patch(CartController.updateCartItem)
  .delete(CartController.removeFromCart);



module.exports = router;