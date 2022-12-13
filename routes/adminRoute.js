const express = require('express')
const adminRoute = express()

const Product = require('../models/productModel')
const User = require('../models/userModel')
const Order = require('../models/ordersModel')
const Category = require('../models/categoryModel')
const Offer = require('../models/offerModel')

const adminController = require('../controller/adminController')
const adminMiddleware = require('../middleware/adminMiddleware')


adminRoute.use(express.json())
adminRoute.use(express.urlencoded({extended:true}))


let isAdminLoggedin = false

const securePassword = async(password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash

    }catch(error){
        console.log(error.message);
    }
}

adminRoute.get('/',adminController.loadAdminHome)
adminRoute.get('/adminProfile',adminMiddleware.isLogin,adminController.loadAdminProfile)
adminRoute.get('/adminProducts',adminMiddleware.isLogin,adminController.viewProduct)


adminRoute.get('/adminCategory',adminMiddleware.isLogin,adminController.viewCategory)
adminRoute.post('/adminCategory',adminMiddleware.isLogin,adminController.addCategory)
adminRoute.get('/delete-category',adminMiddleware.isLogin,adminController.deleteCategory)

adminRoute.get('/adminUsers',adminMiddleware.isLogin,adminController.viewUser)
adminRoute.get('/adminOrder',adminMiddleware.isLogin,adminController.viewOrder)

adminRoute.get('/login',adminMiddleware.isLogout,adminController.loadLogin)
adminRoute.post('/login',adminController.verifyLogin)


adminRoute.get('/add-product',adminMiddleware.isLogin,adminController.addProductLoad)
adminRoute.post('/add-product',adminController.upload,adminController.updateAddProduct)


adminRoute.get('/view-product',adminMiddleware.isLogin,adminController.viewProduct)
adminRoute.get('/view-user',adminController.viewUser)


adminRoute.get('/edit-product',adminMiddleware.isLogin,adminController.editProduct)
adminRoute.post('/edit-product',adminController.upload,adminController.updateEditProduct)
adminRoute.get('/delete-product',adminMiddleware.isLogin,adminController.deleteProduct)

adminRoute.get('/block-user',adminMiddleware.isLogin,adminController.blockUser)

adminRoute.get('/admin-cancel-order',adminMiddleware.isLogin,adminController.adminCancelOrder)
adminRoute.get('/admin-confirm-order',adminMiddleware.isLogin,adminController.adminConfirmorder)
adminRoute.get('/admin-delivered-order',adminMiddleware.isLogin,adminController.adminDeliveredorder)


adminRoute.get('/adminOffer',adminMiddleware.isLogin,adminController.adminLoadOffer)
adminRoute.post('/adminOffer',adminMiddleware.isLogin,adminController.adminStoreOffer)



adminRoute.get('/adminlogout',adminMiddleware.isLogin,adminController.adminLogout)


adminRoute.get('*',(req,res)=>{
    res.redirect('/admin')
})


module.exports = adminRoute