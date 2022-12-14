const session = require("express-session");

// let req.session = false || {}
let isLoggedin 

const isLogin = async(req,res,next)=>{
    try {
        if(req.session.userId){}
        else{
            res.redirect('/login')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}
const isLogout = async(req,res,next)=>{
    try {
        if(req.session.userId){
            isLoggedin = true
            res.redirect('/')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}