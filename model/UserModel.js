const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"]
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"]
  },
  country: {
    type: String,
    required: [true, "Country is required"]
  },
  address: {
    type: String,
    required: [true, "Address is required"]
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)