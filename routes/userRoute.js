const express = require('express')
const userRoute = express()

const Product = require('../models/productModel')
const User = require('../models/userModel')
const Orders = require('../models/ordersModel')
const Offer = require('../models/offerModel')

const userController = require('../controller/userController')
const userMiddleware = require('../middleware/userMiddleware')

const cors = require('cors')
userRoute.use(cors())

userRoute.use(express.json())
userRoute.use(express.urlencoded({extended:true}))

let isLoggedin
isLoggedin = false
let userSession = false || {}


const securePassword = async(password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash

    }catch(error){
        console.log(error.message)
    }
}


// const paypal = require('paypal-rest-sdk')
// paypal.configure({
//     'mode': 'sandbox', //sandbox or live
//     'client_id': 'AaSaTLn6P8dEP56FaRh-FMMZj2c2NrWwc9aqu2ravuX-Bad5uGkkJ90LAFoWTzoV2hEyaKkyWITW2RVc',
//     'client_secret': 'EKiJRKlWpzelTn4ahxDfWGZm_jGCbVlqDkTUpcXGTKmRgfOpqFlsFnUU3A4Kv7oFPZBL8sU_E5AnFEuR'
//   });



userRoute.get('/register',userMiddleware.isLogout, userController.loadSignup)
userRoute.post('/register', userController.storeSignup)

userRoute.get('/verifyOtp', userController.loadOtp)
userRoute.post('/verifyOtp', userController.verifyOtp)


userRoute.get('/',userController.loadStore)

userRoute.get('/login',userMiddleware.isLogout,userController.loadLogin) 
userRoute.post('/login',userController.verifyLogin)

userRoute.get('/dashboard',userMiddleware.isLogin,userController.userDashboard)
userRoute.get('/trasactions',userMiddleware.isLogin,userController.userTrasactions)

userRoute.get('/edit-user',userMiddleware.isLogin,userController.editUser)
userRoute.post('/edit-user',userController.updateUser)
userRoute.get('/cancel-order',userMiddleware.isLogin,userController.cancelOrder)
userRoute.get('/view-order',userMiddleware.isLogin,userController.viewOrder)
userRoute.get('/return-product',userMiddleware.isLogin,userController.returnProduct)

userRoute.get('/catalog',userController.loadCatalog)
userRoute.get('/view-product',userController.viewProductPage)

userRoute.get('/cart',userController.loadCart)
userRoute.get('/add-to-cart',userController.addToCart)
userRoute.get('/delete-cart',userController.deleteCart)
userRoute.post('/edit-qty',userController.editQty)

userRoute.get('/wishlist',userController.loadWishlist)
userRoute.post('/add-to-wishlist',userController.addToWishlist)
userRoute.get('/delete-wishlist',userController.deleteWishlist)
userRoute.get('/add-to-cart-delete-wishlist',userController.addCartdelWishlsit)

userRoute.post('/add-coupon',userController.addCoupon)


userRoute.get('/checkout',userController.loadCheckout)
userRoute.post('/checkout',userMiddleware.isLogin,userController.storeOrder)
userRoute.get('/order-success',userMiddleware.isLogin,userController.loadSuccess)

userRoute.post('/razorpay',userMiddleware.isLogin,userController.razorpayCheckout)
userRoute.post('paypal',userMiddleware.isLogin,userController.paypalCheckout)

userRoute.get('/logout',userMiddleware.isLogin,userController.userLogout)


// userRoute.post('/pay', (req, res) => {
//     const create_payment_json = {
//       "intent": "sale",
//       "payer": {
//           "payment_method": "paypal"
//       },
//       "redirect_urls": {
//           "return_url": "http://localhost:3000/order-success",
//           "cancel_url": "http://localhost:3000/checkout"
//       },
//       "transactions": [{
//           "item_list": {
//               "items": [{
//                   "name": "Red Sox Hat",
//                   "sku": "001",
//                   "price": "25.00",
//                   "currency": "USD",
//                   "quantity": 1
//               }]
//           },
//           "amount": {
//               "currency": "USD",
//               "total": "25.00"
//           },
//           "description": "Hat for the best team ever"
//       }]
//   };
//   userRoute.get('/success', (req, res) => {
//     const payerId = req.query.PayerID;
//     const paymentId = req.query.paymentId;
  
//     const execute_payment_json = {
//       "payer_id": payerId,
//       "transactions": [{
//           "amount": {
//               "currency": "USD",
//               "total": "25.00"
//           }
//       }]
//     };
  
//     paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
//       if (error) {
//           console.log(error.response);
//           throw error;
//       } else {
//           console.log(JSON.stringify(payment));
//           res.send('Success');
//       }
//   });
//   });
//     paypal.payment.create(create_payment_json, function (error, payment) {
//         if (error) {
//             throw error;
//         } else {
//             for(let i = 0;i < payment.links.length;i++){
//               if(payment.links[i].rel === 'approval_url'){
//                 res.redirect(payment.links[i].href);
//               }
//             }
//         }
//       });
      
//       });
//   userRoute.get('/cancel', (req, res) => res.send('Cancelled'));


module.exports = userRoute