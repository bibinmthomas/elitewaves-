const User = require('../models/userModel')
const Product = require('../models/productModel')
const Orders = require('../models/ordersModel')
const Offer = require('../models/offerModel')



const bcrypt = require('bcrypt')
const Razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk')
const  mongoose = require('mongoose')
const fast2sms = require('fast-two-sms')

const express = require('express')
const { query } = require('express')
const app = express()

const cors = require('cors')
const { ObjectID } = require('bson')
app.use(cors())

let isLoggedin
isLoggedin = false
// let req.session = false || {}
let newUser
let newOtp
let offer = {
    name:'None',
    type:'None',
    discount:0,
    usedBy:false
}
let couponTotal = 0

//OTP 
const sendMessage =  function(mobile,res){
    let randomOTP = Math.floor(Math.random()*10000)
    var options = {
      authorization:'MSOj0bTnaP8phCARmWqtzkgEV4ZN2Ff9eUxXI7iJQ5HcDBKsL1vYiamnRcMxrsjDJboyFEXl0Sk37pZq',
      message:`your OTP verification code is ${randomOTP}`,
      numbers:[mobile]
    }
    //send this message 
    fast2sms.sendMessage(options)
    .then((response)=>{
      console.log("otp sent succcessfully")
    }).catch((error)=>{
      console.log(error)
    })
    return randomOTP;
   }


const securePassword = async(password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash

    }catch(error){
        console.log(error.message);
    }
}


const loadLogin = (req,res)=>{
    res.render('../signin')
}
const verifyLogin = async(req,res)=>{
    try{
        
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({email:email})
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password)
            if(passwordMatch){
                if(userData.isVerified ===0 ){
                    res.render('../signin',{message:"please verify your OTP"})
                }
                else{
                    if(userData.isAdmin ===1){
                        res.render('../signin',{message:"Not user"})
                    }else{
                        // req.session = req.session
                        req.session.userId = userData._id
                        isLoggedin = true
                        res.redirect('/')
                        console.log("logged in")
                    }
                    
                }
            }else{
                res.render('../signin',{message:"Email and password is incorrect"})
            }

        }else{
            res.render('../signin',{message:"Email and password is incorrect"})
        }

    }catch(error){
        console.log(error);
    }
}


const loadStore = async(req,res)=>{
    // req.session = req.session
    //coupon initialize
    if(req.session.offer){}else{
        req.session.offer = offer
        req.session.couponTotal = couponTotal
    }
    // console.log('req.session:',req.session);
    const productData = await Product.find()
    res.render('store',{isLoggedin,products:productData,id:req.session.userId})
}
const loadCatalog =async(req,res)=>{
    // req.session = req.session
    //search
    let search = ''
    if (req.query.search) {
        search = req.query.search
    }

    let page = 1
    if (req.query.page) {
        page = req.query.page
    }
    const limit = 6

    const productData = await Product.find({
        $or:[
            {name:{ $regex:'.*'+search+'.*',$options:'i' }}
        ]
    })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec()

    const count = await Product.find({
        $or:[
            {name:{ $regex:'.*'+search+'.*',$options:'i' }}
        ]
    }).countDocuments()

    res.render('store-catalog',{
        isLoggedin,
        products:productData,
        id:req.session.userId,
        totalPages:Math.ceil(count/limit),
        currentPage:new Number(page),
        previous:new Number(page)-1,
        next:new Number(page)+1
    })
}


const loadSignup = (req,res)=>{
    res.render('../signup')
}
const storeSignup =async (req,res)=>{
    try{
        const userCheck = await User.findOne({email:req.body.email})
        if(userCheck){
            res.render('../signup',{message:"User already exists."})
        }else{
            if(req.body.password == req.body.passwordCheck){
                const spassword = await securePassword(req.body.password)
                const user =User({
                name:req.body.name,
                email:req.body.email,
                mobile:req.body.mno,
                password:spassword,
                isAdmin:0,
            })
            const userData =  await user.save()
            newUser = userData._id
            if(userData){
                res.redirect('/verifyOtp')
            }else{
                res.render('../signup',{message:"Your registration was a failure"})
            }
            }else{
                res.render('../signup',{message:"Different Passwords entered."})
            }
        }
    }catch(error){
        console.log(error.message);
    }
}


const loadOtp = async(req,res)=>{
    const userData = await User.findById({_id:newUser})
    const otp = sendMessage(userData.mobile,res)
    newOtp = otp
    console.log('otp:',otp);
    res.render('../otpVerify',{otp:otp,user:newUser})
}
const verifyOtp = async(req,res)=>{
    try {
        const otp = newOtp
        const userData = await User.findById({_id:req.body.user})
        if(otp == req.body.otp){
            userData.isVerified = 1
            const user = await userData.save()
            if(user){
                res.redirect('/login')
            }
        }else{
            res.render('../otpVerify',{message:"Invalid OTP"})
        }
        
    } catch (error) {
        console.log(error.message);
    }
}


const userDashboard = async(req,res)=>{
    try {
        const orderData = await Orders.find({userId:req.session.userId})
        const userData = await User.findById({_id:req.session.userId})
        res.render('dashboard',{user:userData,userOrders:orderData})
    } catch (error) {
        console.log(error.message)
    }
}
const userTrasactions = async(req,res)=>{
    try {
        const orderData = await Orders.find({userId:req.session.userId})
        const userData = await User.findById({_id:req.session.userId})
        res.render('trasactions',{user:userData,userOrders:orderData})
    } catch (error) {
        console.log(error.message)
    }
}
const userLogout = async(req,res)=>{
    // req.session = req.session
    req.session.userId = false
    isLoggedin = false
    console.log("logged out");
    res.redirect('/')
}


const viewProductPage = async(req,res)=>{
    try {
        
        const id = req.query.id
        const products = await Product.find()
        const productData =await Product.findById({ _id:id })
        if(productData){
            res.render('viewProductPage',{isLoggedin,product:productData,products:products,userSession:req.session.userId})
        }
        else{
            res.redirect('/catalog')
        }


    } catch (error) {
        console.log(error.message);
    }

}


const editUser = async(req,res)=>{
    const id = req.query.id
    const userData =await User.findById({ _id:id })
    res.render('edit-user',{user:userData})
}
const updateUser = async(req,res)=>{
    const productData = await User.findByIdAndUpdate({ _id:req.body.id },{ $set:{name:req.body.name,email:req.body.email,mobile:req.body.mno} })
    res.redirect('/dashboard')
}
const cancelOrder = async(req,res)=>{
    const id = req.query.id
    console.log(id);
    await Orders.deleteOne({ _id:id })
    res.redirect('/dashboard')

}
const viewOrder = async(req,res)=>{
    try {
        // req.session = req.session
        if(req.session.userId){
            const id = req.query.id
            req.session.currentOrder = id
            const orderData = await Orders.findById({_id:id})
            const userData =await User.findById({ _id:req.session.userId })
            await orderData.populate('products.item.productId')
            // console.log(orderData.products.item);
            res.render("viewOrder",{order:orderData,user:userData})
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const returnProduct = async(req,res)=>{
    try {
        // req.session = req.session
        if(req.session = req.session){
            const id = req.query.id
            // console.log('id',new String(id));
            const productOrderData = await Orders.findById({_id:ObjectID(req.session.currentOrder)})
            // console.log('productOrderData.products.item[i].productId',new String(productOrderData.products.item[0].productId));
            const productData = await Product.findById({_id:id})
            if(productOrderData){
                for(let i=0;i<productOrderData.products.item.length;i++){
                    if(new String(productOrderData.products.item[i].productId).trim() === new String(id).trim()){
                        productData.stock += productOrderData.products.item[i].qty
                        productOrderData.productReturned[i] = 1
                        console.log('found!!!');
                        console.log('productData.stock',productData.stock);
                        await productData.save().then(()=>{
                            console.log('productData saved');
                        })
                        console.log('productOrderData.productReturned[i]',productOrderData.productReturned[i]);
                        await productOrderData.save().then(()=>{
                            console.log('productOrderData saved');
                        })
                        
                    }else{
                        // console.log('Not at position: ',i);
                    }
                }
                res.redirect('/dashboard')
            }
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
    }
}



const loadWishlist = async(req,res)=>{
    try {
        // req.session = req.session
        if(req.session.userId){
            const userData =await User.findById({ _id:req.session.userId })
            const completeUser = await userData.populate('wishlist.item.productId')

            res.render('wishlist',{isLoggedin,id:req.session.userId,wishlistProducts:completeUser.wishlist})
        }else{
            res.render('wishlist',{isLoggedin,id:req.session.userId})  
        }
    } catch (error) {
        console.log(error.message);
    }
}

const addToWishlist = async(req,res)=>{
    const productId = req.query.id
    // req.session = req.session
    const userData =await User.findById({_id:req.session.userId})
    const productData =await Product.findById({ _id:productId })
    userData.addToWishlist(productData)
    res.redirect('/catalog')
}
const addCartdelWishlsit = async(req,res)=>{
    const productId = req.query.id
    console.log(productId);
    // req.session = req.session
    const userData =await User.findById({_id:req.session.userId})
    const productData =await Product.findById({ _id:productId })
    const add = userData.addToCart(productData)
    if(add){
        userData.removefromWishlist(productId)
    }
    res.redirect('/cart')
}
const deleteWishlist = async(req,res)=>{
    const productId = req.query.id
    // req.session = req.session
    const userData =await User.findById({_id:req.session.userId})
    userData.removefromWishlist(productId)
    res.redirect('/wishlist')
}


const loadCart = async(req,res)=>{
    try {
        // req.session = req.session
        if(req.session.userId){
            const userData =await User.findById({ _id:req.session.userId })
            const completeUser = await userData.populate('cart.item.productId')
            if( userData.cart.item.length == 0 ){
                req.session.couponTotal = 0
            }
            if(req.session.couponTotal == 0){
                //update coupon
                req.session.couponTotal = userData.cart.totalPrice
            }
            if(req.session.coupon <= userData.cart.totalPrice){
                req.session.couponTotal = userData.cart.totalPrice
            }
            // if(req.session.offer =='None'){
            //     req.session.couponTotal = userData.cart.totalPrice
            // }
            console.log(req.session)
            console.log(req.session.couponTotal);
            res.render('cart',{isLoggedin,id:req.session.userId,cartProducts:completeUser.cart,offer:req.session.offer,couponTotal:req.session.couponTotal})
        }else{
            res.render('cart',{isLoggedin,id:req.session.userId,offer:req.session.offer,couponTotal:req.session.couponTotal})  
        }
            } catch (error) {
        console.log(error);
    }
}

const addToCart = async(req,res,next)=>{
    const productId = req.query.id
    // req.session = req.session
    const userData =await User.findById({_id:req.session.userId})
    const productData =await Product.findById({ _id:productId })
    const usertemp =await userData.addToCart(productData)
    if(usertemp){
        req.session.couponTotal = usertemp.cart.totalPrice
        req.session.offer = offer
        console.log('usertemp:',usertemp);
    }
    res.redirect('/catalog')
}

const deleteCart = async(req,res,next)=>{
    const productId = req.query.id
    // req.session = req.session
    const userData =await User.findById({_id:req.session.userId})
    const usertemp =await userData.removefromCart(productId)
    if(usertemp){
        // req.session.couponTotal = usertemp.cart.totalPrice
        req.session.couponTotal = usertemp.cart.totalPrice
        req.session.offer = offer
        console.log('usertemp:',usertemp);
    }
    res.redirect('/cart')
}

const editQty = async(req,res)=>{
   try {
    id = req.query.id
    console.log(id,' : ',req.body.qty)
    // req.session = req.session
    const userData =await User.findById({_id:req.session.userId})
    const foundProduct = userData.cart.item.findIndex(objInItems => objInItems._id == id)
    console.log('product found at: ',foundProduct)

    userData.cart.item[foundProduct].qty = req.body.qty
    console.log(userData.cart.item[foundProduct]);
    userData.cart.totalPrice = 0

    const totalPrice = userData.cart.item.reduce((acc,curr)=>{
        return acc+(curr.price * curr.qty)
    },0)
    //update coupon
    req.session.couponTotal =totalPrice - (totalPrice*offer.discount)/100
    userData.cart.totalPrice = totalPrice
    req.session.offer = offer
    await userData.save()

    
    res.redirect('/cart')
   } catch (error) {
    console.log(error.message);
   }
}


const loadCheckout = async(req,res)=>{
    try {
        // req.session = req.session
        if(req.session.userId){
            console.log(req.session);
            console.log(req.session.couponTotal);
            const userData =await User.findById({ _id:req.session.userId })
            const completeUser = await userData.populate('cart.item.productId')
            // console.log('UserData: ',userData);
            // console.log('completeUser: ',completeUser);
            // console.log(req.session.couponTotal);
            res.render('checkout',{isLoggedin,id:req.session.userId,cartProducts:completeUser.cart,offer:req.session.offer,couponTotal:req.session.couponTotal})
        }else{
            res.render('checkout',{isLoggedin,id:req.session.userId,offer:req.session.offer,couponTotal:req.session.couponTotal})
        }
    } catch (error) {
        console.log(error.message);
    }
}

const storeOrder = async(req,res)=>{
    try{
        // req.session = req.session
        if(req.session.userId){
            const userData =await User.findById({ _id:req.session.userId })
            const completeUser = await userData.populate('cart.item.productId')
            // console.log('CompleteUser: ',completeUser);

            userData.cart.totalPrice = req.session.couponTotal
            const updatedTotal = await userData.save()

            if(completeUser.cart.totalPrice > 0){ 
            const order =Orders({
                userId:req.session.userId,
                payment:req.body.payment,
                country:req.body.country,
                address:req.body.address,
                city:req.body.city,
                state:req.body.state,
                zip:req.body.zip,
                products:completeUser.cart,
                offer:req.session.offer.name
            })
            let orderProductStatus =[]
            for(let key of order.products.item){
                orderProductStatus.push(0)
            }
            // console.log('orderProductStatus',orderProductStatus);
            order.productReturned = orderProductStatus

            const orderData =  await order.save()

            req.session.currentOrder = orderData._id
            // console.log('req.session.currentOrder',req.session.currentOrder);
            
            const offerUpdate =await Offer.updateOne({name:req.session.offer.name},{$push:{usedBy:req.session.userId}})
            
                if(req.body.payment == 'Cash-on-Dilevery'){
                    res.redirect('/order-success')
                }else if(req.body.payment == 'RazorPay'){
                    res.render('razorpay',{userId:req.session.userId,total:completeUser.cart.totalPrice})
                }else if(req.body.payment == 'PayPal'){
                    res.render('paypal',{userId:req.session.userId,total:completeUser.cart.totalPrice})
                }else{
                    res.redirect('/catalog')
                }
            
        }else{res.redirect('/checkout')}
        }else{
            res.redirect('/catalog')
        }
    }catch(error){
        console.log(error.message);
    }
}

const loadSuccess = async(req,res)=>{
    try {
        // req.session = req.session
        if(req.session.userId){
            const userData =await User.findById({ _id:req.session.userId })
            const productData = await Product.find()
            for(let key of userData.cart.item){
                console.log(key.productId,' + ',key.qty);
                for(let prod of productData){
                    if(new String(prod._id).trim() == new String(key.productId).trim()){                        
                        prod.stock = prod.stock - key.qty
                        await prod.save()
                    }
                }
            }
            
            // const orderData = await Orders.find({userId:req.session.userId})
            // for(let key of orderData.products.item){
            //     orderProductStatus.push(0)
            // }
            // console.log('orderProductStatus',orderProductStatus);
            // orderData = orderProductStatus
            // await orderData.save()
            
            await Orders.updateOne({userId:req.session.userId,_id:req.session.currentOrder},{$set:{'status':'Build'}})
            await User.updateOne({_id:req.session.userId},{$set:{'cart.item':[],'cart.totalPrice':'0'}},{multi:true})
            console.log("Order Built and Cart is Empty.");
        }
        req.session.couponTotal = 0 
        res.render('orderSuccess')
    } catch (error) {
        console.log(error.message);
    }
}

const razorpayCheckout = async(req,res)=>{
    // req.session = req.session
    const userData =await User.findById({ _id:req.session.userId })
    const completeUser = await userData.populate('cart.item.productId')
    var instance = new Razorpay({ key_id: 'rzp_test_0dGOmkN53nGuBg', key_secret: 'mEkJrYGMckakFAOXVahtu30g' })
    console.log(req.body);
    console.log(completeUser.cart.totalPrice);
                let order = await instance.orders.create({
                  amount: completeUser.cart.totalPrice*100,
                  currency: "INR",
                  receipt: "receipt#1",
                })
                res.status(201).json({
                    success: true,
                    order
                })
}

const paypalCheckout = async(req,res)=>{
    // req.session = req.session
    // const userData =await User.findById({ _id:req.session.userId })
    // const completeUser = await userData.populate('cart.item.productId')
}

const addCoupon = async(req,res)=>{
    try {
        // req.session = req.session
        if(req.session.userId){
            const userData =await User.findById({ _id:req.session.userId })
            const offerData = await Offer.findOne({name:req.body.offer})

            if(offerData){
                if(offerData.usedBy != req.session.userId){
                    req.session.offer.name = offerData.name
                    req.session.offer.type = offerData.type 
                    req.session.offer.discount = offerData.discount 
                    
                    let updatedTotal =userData.cart.totalPrice - (userData.cart.totalPrice * req.session.offer.discount)/100
                    req.session.couponTotal = updatedTotal
                    console.log(req.session)
                    res.redirect('/cart')    
                }else{
                    req.session.offer.usedBy = true
                    res.redirect('/cart')
                }

                
            }else{

                res.redirect('/cart')

            }

        }else{
            res.redirect('/cart')
        }

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = { 
    verifyLogin,
    loadStore,
    loadLogin,
    userDashboard,
    userTrasactions,
    loadSignup,
    storeSignup,
    loadOtp,
    verifyOtp,
    verifyLogin,
    userLogout,
    loadCatalog,
    editUser,
    cancelOrder,
    viewOrder,
    returnProduct,
    updateUser,
    viewProductPage,
    loadCart,
    addToCart,
    deleteCart,
    editQty,
    loadCheckout,
    storeOrder,
    razorpayCheckout,
    paypalCheckout,
    loadSuccess,
    addCoupon,
    loadWishlist,
    addToWishlist,
    deleteWishlist,
    addCartdelWishlsit
 }