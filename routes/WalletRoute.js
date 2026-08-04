const router = require("express").Router();

const walletController = require("../controller/WalletController");

const authController = require("../controller/authController");

router.use(authController.protect);

router.get("/", walletController.getWallet);

module.exports = router;
