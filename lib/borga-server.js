'use strict'

const express = require('express')
const hbs = require('hbs')
hbs.registerPartials( `${__dirname}/../views/partials`, function (err) {})

const app = express()

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const webAPI = require('./borga-web-api')
app.use('/api', webAPI.router)

const webAPP = require('./borga-web-site')
const passport = require('passport')
app.use(webAPP.router)

app.set('view engine', 'hbs')

const PORT = 3000


//** Setup logging
app.use((req, res, next) => {
    let current_datetime = new Date();
    const year = current_datetime.getFullYear()
    const month = (current_datetime.getMonth() + 1)
    const day = current_datetime.getDate()
    const hours = current_datetime.getHours()
    const minutes = current_datetime.getMinutes()
    const seconds = current_datetime.getSeconds()
    let method = req.method
    let url = req.url
    let status = res.statusCode
    let log = `[${hours}:${minutes}:${seconds} ${day}-${month}-${year}] ${method} ${url} ${status}`
    console.log(log);
    next();
  })

app.listen(PORT)
