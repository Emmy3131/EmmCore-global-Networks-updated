const express = require('express');
const router = express.Router();
const HeroBannerController = require('../controller/HeroBannerController');
const authController = require('../controller/authController');

router.
route('/')
.get(HeroBannerController.getHeroBanners)
.post(authController.protect, authController.restrictTo('admin'), HeroBannerController.createHeroBanner);


router
.route('/:id')
.get(HeroBannerController.getHeroBanner)
.patch(authController.protect, authController.restrictTo('admin'), HeroBannerController.updateHeroBanner)
.delete(authController.protect, authController.restrictTo('admin'), HeroBannerController.deleteHeroBanner);

module.exports = router;