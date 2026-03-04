const express = require('express')
const router = express.Router()
const userController = require('../controller/UserController')

// CREATE + GET
router
  .route('/user')
  .get(userController.getUsers)
  .post(userController.createUser)

// UPDATE + DELETE
router
  .route('/user/:id')
  .patch(userController.updateUser)
  .get(userController.getUser)
  .delete(userController.deleteUser)

module.exports = router