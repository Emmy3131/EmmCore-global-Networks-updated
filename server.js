const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })
const app = require('./app')
const port = 5000
const mongoose = require("mongoose")





let DB = process.env.DATABASE_LOCAL
mongoose.connect(DB).then(()=> console.log('Database connected successfully!!'))
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})