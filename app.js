const express = require('express')
const app = express()

const mongoose = require('mongoose')
const dbpath = require('./config/connection')
mongoose.connect(dbpath.dbpath,()=>{
  console.log("Database Connected.");
})

const bcrypt = require('bcrypt')

const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

const User = require('./models/userModel')
const Product = require('./models/productModel')

const path = require('path')

const session = require('express-session')
const config = require('./config/config')
app.use(session({secret:config.sessionSecret}))

adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/admin')
adminRoute.use('/',express.static('public'))
adminRoute.use('/',express.static('public/admin'))


userRoute.set('view engine','ejs')
userRoute.set('views','./views/users')
userRoute.use('/',express.static('public'))
userRoute.use('/',express.static('public/admin'))

userRoute.use(express.json())
userRoute.use(express.urlencoded({extended:true}))


  //clear cache when switching pages!!!
  app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  })



//for user routes
 app.use('/',userRoute)


//for admin routes
  app.use('/admin',adminRoute)

//for error pages
app.use(function (req, res) {
  res.status(404).redirect('/');
});

  app.listen(3000,()=>{
    console.log("Server is running...");
})

