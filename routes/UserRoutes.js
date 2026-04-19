const express = require('express')
const router = express.Router()
const userController = require('../controller/UserController')
const authController = require('../controller/authController')

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)
//router.post('/login', userController.login)

// CREATE + GET
router
  .route('/')
  .get(userController.getUsers)
  .post(userController.createUser)

// UPDATE + DELETE
router
  .route('/user/:id')
  .patch(userController.updateUser)
  .get(userController.getUser)
  .delete(userController.deleteUser)

module.exports = router