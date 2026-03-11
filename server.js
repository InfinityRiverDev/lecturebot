require("dotenv").config()

const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")

const { bot } = require("./index")
const { BOT_TOKEN } = require("./config")

const app = express()

app.use(bodyParser.json())

app.post(`/bot${BOT_TOKEN}`, (req,res)=>{
 bot.processUpdate(req.body)
 res.sendStatus(200)
})

app.use(express.static(path.join(__dirname,"webapp")))

app.get("/",(req,res)=>{
 res.sendFile(path.join(__dirname,"webapp","index.html"))
})

const PORT = process.env.PORT || 3000

app.listen(PORT, async ()=>{

 console.log("🌐 Server started")

 const url = `https://app.kstubot.ru/bot${BOT_TOKEN}`

 await bot.setWebHook(url)

 console.log("✅ Webhook set:",url)

})