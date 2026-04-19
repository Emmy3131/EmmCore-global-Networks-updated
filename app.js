const express = require('express')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const app = express()
const hpp = require('hpp')
const userRoutes = require('./routes/UserRoutes')
const productRoutes = require('./routes/ProductRouter')
const orderRouter = require('./routes/orderRoutes')
const cartRouter = require('./routes/cartRoutes')
const categoryRoutes = require('./routes/CategoryRoutes')
const AppError = require('./utils/appError')
const globalErrorController = require('./controller/GlobalErrorController')



//Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 hour,
    message: "Too many requests from this IP, please try again in an hour"
})

app.use('/api', limiter)
app.use(hpp())

//Body Parser, reading data from body into req.body
app.use(express.json())


//Setting security HTTP headers
app.use(helmet())


//Data sanitization against nosql injection query
//app.use(mongoSanitize({ allowDots: true }))


//Data sanitization against xss
//app.use(xss())


app.set('query parser', 'extended')


//ROUTES
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/orders', orderRouter)
app.use('/api/v1/cart', cartRouter)
app.use('/api/v1/categories', categoryRoutes)

app.all(/.*/, (req, res, next)=>{
    const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404)
    next(error)
})

app.use(globalErrorController)


module.exports = app