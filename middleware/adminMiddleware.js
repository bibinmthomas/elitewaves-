const session = require("express-session");

let isAdminLoggedin = false
let adminSession = false || {}

const isLogin = async(req,res,next)=>{
    try {
        adminSession = req.session
        if(adminSession.userId){}
        else{
            res.redirect('/admin/login')
        }
        next()

    } catch (error) {
        console.log(error.message);
    }
}
const isLogout = async(req,res,next)=>{
    try {
        adminSession = req.session
        if(adminSession.userId){
            isAdminLoggedin = true
            res.redirect('/admin')
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