const mongoose = require("../db")

const ReportSchema = new mongoose.Schema({

 code:String,
 success:Number,
 fail:Number,
 total:Number,

 createdAt:{
  type:Date,
  default:Date.now
 }

})

module.exports = mongoose.model("Report",ReportSchema)