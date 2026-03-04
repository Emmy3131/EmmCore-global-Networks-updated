const express = require('express')
const app = express()
const userRoutes = require('./routes/UserRoutes')
const productRoutes = require('./routes/ProductRouter')
const orderRoutes = require('./routes/OrderRouter')

app.use(express.json())

app.use('/api/v1/app', userRoutes)
app.use('/api/v1/app', orderRoutes)
app.use('/api/v1/app', productRoutes)

module.exports = app