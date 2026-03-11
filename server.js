require("dotenv").config()

const express = require("express")
const path = require("path")

require("./index") // запускаем бота

const app = express()

app.use(express.json())

app.use(express.static(path.join(__dirname,"webapp")))

app.get("/",(req,res)=>{
 res.sendFile(path.join(__dirname,"webapp","index.html"))
})

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
 console.log("🌐 WebApp server started on",PORT)
})