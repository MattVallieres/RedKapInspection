const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const { information } = require('./handler')

const app = express()
const port = 8000

app.use(morgan('tiny'))
app.use(express.json())

// Enable CORS for all routes
app.use(cors())

app.post('/api/information', information)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})