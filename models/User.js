const mongoose = require("../db")

const UserSchema = new mongoose.Schema({

 telegramId:Number,
 login:String,
 password:String,
 token:String,
 role:String,

 createdAt:{
  type:Date,
  default:Date.now
 }

})

module.exports = mongoose.model("User",UserSchema)