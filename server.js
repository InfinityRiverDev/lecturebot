require("dotenv").config()

const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")

const { bot } = require("./index")

const app = express()

app.use(bodyParser.json())

// WEBHOOK endpoint
app.post(`/bot${process.env.BOT_TOKEN}`, (req,res)=>{
 bot.processUpdate(req.body)
 res.sendStatus(200)
})

// MINI APP
app.use(express.static(path.join(__dirname,"webapp")))

app.get("/",(req,res)=>{
 res.sendFile(path.join(__dirname,"webapp","index.html"))
})

const PORT = process.env.PORT || 3000

app.listen(PORT, async ()=>{

 console.log("🌐 Server started")

 const url = `https://app.kstubot.ru/bot${process.env.BOT_TOKEN}`

 await bot.setWebHook(url)

 console.log("✅ Webhook set:",url)

})