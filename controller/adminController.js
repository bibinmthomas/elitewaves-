const User = require('../models/userModel')
const Product = require('../models/productModel')
const Order = require('../models/ordersModel')
const Category = require('../models/categoryModel')
const Offer = require('../models/offerModel')

const bcrypt = require('bcrypt')


let isAdminLoggedin
isAdminLoggedin = false
let adminSession = false || {}
let orderType = 'all'


const securePassword = async(password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash

    }catch(error){
        console.log(error.message);
    }
}

const path = require('path')
const multer = require('multer')
const { name } = require('ejs')
let Storage = multer.diskStorage({
    destination:"./public/assets/uploads/",
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
    }
})
let upload = multer({
    storage:Storage
}).single('gImage')


const loadAdminHome = async(req,res)=>{
    try {
        adminSession = req.session
        // const userData = await User.findById({_id:adminSession.userId})
        if(isAdminLoggedin){
            const categoryData = await Category.find()
            const categoryArray = []
            const orderGenreCount = []
            let totalSales = 0
            let countOrders = 0
            for(let key of categoryData){
                categoryArray.push(key.name)
                orderGenreCount.push(0)
            }
            const completeorder = []
            const orderData =await Order.find()

            for(let key of orderData){
                const uppend = await key.populate('products.item.productId')
                completeorder.push(uppend)
                totalSales += key.products.totalPrice
                countOrders++
                
            }
            
            for(let i=0;i<completeorder.length;i++){
                for(let j = 0;j<completeorder[i].products.item.length;j++){
                   const genre = completeorder[i].products.item[j].productId.genre
                   const isExisting = categoryArray.findIndex(category => {
                    return category === genre
                   })
                   orderGenreCount[isExisting]++
            }}

            // console.log('categoryArray:',categoryArray);
            // console.log('orderGenreCount:',orderGenreCount);
            // console.log('genre: ',completeorder[0].products.item[0].productId.genre);

            const productData = await Product.find()
            const userData = await User.find()
            const userCount = userData.reduce((acc,curr)=>{
                return acc+1
            },0)
            res.render('adminDashboard',{products:productData,users:userData,category:categoryArray,count:orderGenreCount,totalSales:totalSales,countOrders:countOrders,userCount:userCount})
        }
        else{
            res.redirect('/admin/login')
        }


    } catch (error) {
        console.log(error.message);
    }
}


const loadAdminProfile = async(req,res)=>{
    try {
        adminSession = req.session
        const userData = await User.findById({_id:adminSession.userId})
        if(isAdminLoggedin){
            res.render('adminProfile',{admin:userData})
        }
        else{
        res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = (req,res)=>{
    res.render('adminSignin')
}
const verifyLogin = async(req,res)=>{

    try {
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({email:email})
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password)
            if(passwordMatch){
                if(userData.isAdmin ===0){
            res.render('adminSignin',{message:"Email and password is incorrect."})
                }
                else{
                    adminSession = req.session
                    isAdminLoggedin = true
                    adminSession.userId = userData._id
                    res.redirect('/admin')
                    console.log('Admin logged in');
                }
            }else{
            res.render('adminSignin',{message:"Email and password is incorrect."})
            }

        }
        else{
            res.render('adminSignin',{message:"Email and password is incorrect."})
        }

    } catch (error) {
        console.log(error.message);
    }

}


const addProductLoad = async(req,res)=>{
    const categoryData = await Category.find()
    console.log(categoryData);
    res.render('add-product',{category:categoryData})
}
const updateAddProduct = async(req,res)=>{
    try {
        const categoryData = await Category.find()
        const spassword = await securePassword(req.body.password)
        const product =Product({
            name:req.body.gName,
            platform:req.body.gPlatform,
            price:req.body.gPrice,
            description:req.body.gDescription,
            rating:req.body.gRating,
            stock:req.body.stock,
            image:req.file.filename
        })
        console.log(req.body.genre);
        product.genre = req.body.genre
        console.log(product)
    //  await product.updateOne({name:req.body.name},{$push:{genre:{genreName:req.body.genre}}})
        const productData = await product.save()
        if(productData){
            res.render('add-product',{message:"Your registration was successfull.",category:categoryData})
        }else{
            res.render('add-product',{message:"Your registration was a failure"})
        }
    } catch (error) {
        console.log(error.message);
    }
}


const viewProduct = async(req,res)=>{
    const productData = await Product.find()
    res.render('adminProduct',{products:productData})
}
const viewUser = async(req,res)=>{
    const userData = await User.find({isAdmin:0})
    res.render('adminUser',{users:userData})
}


const viewCategory = async(req,res)=>{
    const categoryData = await Category.find()
    res.render('adminCategory',{category:categoryData})
}
const addCategory = async(req,res)=>{
    try {
        const checkCategory = await Category.find({name:req.body.category})
    if(checkCategory[0].name == req.body.category){
        res.redirect('/admin/adminCategory')
    }else{
        const category =Category({
            name:req.body.category
        })
        const categoryData = await category.save()
        res.redirect('/admin/adminCategory')
    }
    const category =Category({
        name:req.body.category
    })
    const categoryData = await category.save()
    res.redirect('/admin/adminCategory')
    } catch (error) {
        console.log(error.message);
    } 
}
const deleteCategory = async(req,res)=>{
    try {
        const id = req.query.id
        await Category.deleteOne({ _id:id })
        res.redirect('/admin/adminCategory')
    } catch (error) {
        console.log(error.message);
    }
}


const editProduct = async(req,res)=>{
    try {
        const id = req.query.id
        const productData =await Product.findById({ _id:id })
        if(productData){
            res.render('edit-product',{ product:productData })
        }
        else{
            res.redirect('/admin/view-product')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const updateEditProduct = async(req,res)=>{
    try {
        
        const productData = await Product.findByIdAndUpdate({ _id:req.body.id },{
             $set:{
                name:req.body.gName,
                platform:req.body.gPlatform,
                price:req.body.gPrice,
                description:req.body.gDescription,
                stock:req.body.stock,
                rating:req.body.gRating,
                image:req.file.filename
            } 
        })
        console.log(req.body.genre);
        // productData.genre.push(req.body.genre)
        productData.genre = req.body.genre
        await productData.save()
        console.log(productData);
        // productData.push({genre:req.body.genre})
        res.redirect('/admin/view-product')

    } catch (error) {
        console.log(error.message);
    }
}

const deleteProduct = async(req,res)=>{
    try {
        
        const id = req.query.id
        const productData = await Product.updateOne({ _id:id },{$set:{isAvailable:0}})
        res.redirect('/admin/view-product')

    } catch (error) {
        console.log(error.message);
    }
}

const blockUser = async(req,res)=>{
    try {
        const id = req.query.id
        const userData = await User.findById({ _id:id })
    if(userData.isVerified){
        await User.findByIdAndUpdate({_id:id},{ $set:{isVerified:0} })
    }
    else{
        await User.findByIdAndUpdate({_id:id},{ $set:{isVerified:1} })  
    }
        res.redirect('/admin/view-user')

    } catch (error) {
        console.log(error.message);
    }
}

const viewOrder = async(req,res)=>{
    const orderData = await Order.find()
    if(orderType == undefined){
        res.render('adminOrder',{order:orderData})
    }else{
        id = req.query.id
        res.render('adminOrder',{id:id,order:orderData})
    }
}
const adminCancelOrder = async(req,res)=>{
    const id = req.query.id
    await Order.deleteOne({ _id:id })
    res.redirect('/admin/adminOrder')
}
const adminConfirmorder = async(req,res)=>{
    const id = req.query.id
    await Order.updateOne({_id:id},{$set:{'status':'Comfirmed'}})
    res.redirect('/admin/adminOrder')
}
const adminDeliveredorder = async(req,res)=>{
    const id = req.query.id
    await Order.updateOne({_id:id},{$set:{'status':'Delivered'}})
    res.redirect('/admin/adminOrder')
}


const adminLoadOffer = async(req,res)=>{
    const offerData = await Offer.find()
    res.render('adminOffer',{offer:offerData})
}
const adminStoreOffer = async(req,res)=>{
    const offer =Offer({
        name:req.body.name,
        type:req.body.type,
        discount:req.body.discount
    })
    await offer.save()
    res.redirect('/admin/adminOffer')
}


const adminLogout = async(req,res)=>{
    adminSession = req.session
    adminSession.userId = false
    isAdminLoggedin = false
    console.log('Admin logged out');
    res.redirect('/admin')
}



module.exports = {
    loadAdminHome,
    loadLogin,
    verifyLogin,
    addProductLoad,
    updateAddProduct,
    viewProduct,
    viewUser,
    editProduct,
    updateEditProduct,
    viewCategory,
    addCategory,
    deleteCategory,
    deleteProduct,
    upload,
    blockUser,
    adminLogout,
    loadAdminProfile,
    viewOrder,
    adminCancelOrder,
    adminConfirmorder,
    adminDeliveredorder,
    adminLoadOffer,
    adminStoreOffer
}