const mongoose = require("mongoose")

const uri = process.env.MONGO_URI

if(!uri){
 throw new Error("❌ MONGO_URI не задан")
}

mongoose.connect(uri)

mongoose.connection.on("connected", () => {
 console.log("✅ MongoDB connected")
})

mongoose.connection.on("error", (err) => {
 console.log("❌ MongoDB error:", err)
})

module.exports = mongoose