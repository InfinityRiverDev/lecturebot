require("dotenv").config()

const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")

const multer = require("multer")
const upload = multer({ dest: "audio/" })

const { bot } = require("./index")
const { BOT_TOKEN } = require("./config")

const app = express()

app.use(bodyParser.json())

const fs = require("fs")
const { ADMIN_IDS } = require("./config")

app.post("/api/me",(req,res)=>{

 const { id } = req.body

 if(!id){
  return res.json({error:"no id"})
 }

 // если админ
 if(ADMIN_IDS.includes(Number(id))){
  return res.json({
   role:"admin"
  })
 }

 const users = JSON.parse(fs.readFileSync("users.json"))

 const user = users[id]

 if(!user){
  return res.json({role:"guest"})
 }

 res.json({
  role:"user",
  login:user.login
 })

})

app.post("/api/upload-lecture", upload.single("audio"), async (req,res)=>{

 const fs = require("fs")
 const axios = require("axios")

 const subject = req.body.subject
 const filePath = req.file.path

 try{

  // читаем аудио
  const audio = fs.readFileSync(filePath)

  // отправляем в STT
  const result = await axios.post(
   "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?lang=ru-RU",
   audio,
   {
    headers:{
     Authorization:`Api-Key ${process.env.YA_API_KEY}`,
     "Content-Type":"application/octet-stream"
    }
   }
  )

  const text = result.data.result || "Ошибка распознавания"

    let finalText = text

    if(mode === "ai"){
    finalText = await improveText(text)
    }

  const date = new Date().toISOString().split("T")[0]

  const pdfPath = `data/${subject}/${date}.pdf`

  const { createPDF, improveText } = require("./index")

  createPDF(pdfPath,subject,date,finalText)

  res.json({success:true})

 }catch(err){

  console.log(err)

  res.json({error:true})

 }

})

app.get("/api/subjects",(req,res)=>{

 const fs = require("fs")

 try{

  const subjects = fs.readdirSync("data")

  res.json(subjects)

 }catch(err){

  res.json([])

 }

})

app.get("/api/lectures/:subject",(req,res)=>{

 const fs = require("fs")

 const subject = req.params.subject
 const mode = req.body.mode

 try{

  const lectures = fs.readdirSync(`data/${subject}`)

  res.json(lectures)

 }catch(err){

  res.json([])

 }

})

app.post("/api/create-subject",(req,res)=>{

 const fs = require("fs")
 const { subject } = req.body

 if(!subject){
  return res.json({error:"no subject"})
 }

 const path = `data/${subject}`

 if(!fs.existsSync(path)){
  fs.mkdirSync(path)
 }

 res.json({success:true})

})

app.post("/api/delete-subject",(req,res)=>{

 const fs = require("fs")

 const { subject } = req.body

 if(!subject){
  return res.json({error:"no subject"})
 }

 const path = `data/${subject}`

 if(fs.existsSync(path)){
  fs.rmSync(path,{recursive:true,force:true})
 }

 res.json({success:true})

})

app.post(`/bot${BOT_TOKEN}`, (req,res)=>{
 bot.processUpdate(req.body)
 res.sendStatus(200)
})

app.use(express.static(path.join(__dirname,"webapp")))
app.use("/data",express.static("data"))

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