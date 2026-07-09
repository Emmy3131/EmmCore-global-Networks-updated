const express = require("express");
const router = express.Router();
const userController = require("../controller/UserController");
const authController = require("../controller/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.get("/me", authController.protect, authController.getMe);
router.patch("/:id/toggle-status", userController.toggleUserStatus);
router.patch("/updateMe", userController.updateMe);

//router.post('/login', userController.login)

// CREATE + GET
router.route("/").get(userController.getUsers).post(userController.createUser);

// UPDATE + DELETE
router
  .route("/:id")
  .patch(userController.updateUser)
  .get(userController.getUser)
  .delete(userController.deleteUser);

router
  .route("/:id/orders")
  .get(authController.protect, userController.getAllOrderByAUser);



module.exports = router;
