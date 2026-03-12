const mongoose = require("../db")

const LectureSchema = new mongoose.Schema({

 subject:String,
 filename:String,

 createdAt:{
  type:Date,
  default:Date.now
 }

})

module.exports = mongoose.model("Lecture",LectureSchema)