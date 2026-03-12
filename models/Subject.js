const mongoose = require("../db")

const SubjectSchema = new mongoose.Schema({

 name:String

})

module.exports = mongoose.model("Subject",SubjectSchema)