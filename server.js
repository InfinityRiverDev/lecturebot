require("dotenv").config()

require("./db")

const User = require("./models/User")
const Report = require("./models/Report")
const Subject = require("./models/Subject")
const Lecture = require("./models/Lecture")

const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")

const { createPDF, improveText } = require("./index")

const multer = require("multer")
const upload = multer({ dest: "audio/" })

const { bot } = require("./index")
const { BOT_TOKEN } = require("./config")

const app = express()

app.use(bodyParser.json())

const fs = require("fs")
const { ADMIN_IDS } = require("./config")

app.post("/api/me", async (req,res)=>{

 const { id } = req.body

 if(!id){
  return res.json({error:"no id"})
 }

 if(ADMIN_IDS.includes(Number(id))){
  return res.json({role:"admin"})
 }

 const user = await User.findOne({telegramId:id})

 if(!user){
  return res.json({role:"guest"})
 }

 res.json({
  role:user.role,
  login:user.login
 })

})




app.post("/api/upload-lecture", upload.single("audio"), async (req,res)=>{

 const fs = require("fs")
 const axios = require("axios")

 const subject = req.body?.subject
 const mode = req.body?.mode || "raw"

 if(!req.file){
  return res.json({error:"no audio file"})
 }

 if(!subject){
  return res.json({error:"no subject"})
 }

 const filePath = req.file.path

 try{

  const audio = fs.readFileSync(filePath)

  const result = await axios.post(
   "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?lang=ru-RU&format=oggopus",
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

  createPDF(pdfPath,subject,date,finalText)

  await Lecture.create({
    subject,
    filename:`${date}.pdf`
    })

  res.json({success:true})

 }catch(err){

  console.log(err)

  res.json({error:true})

 }

})

app.get("/api/subjects", async (req,res)=>{

 const subjects = await Subject.find()

 res.json(subjects.map(s=>s.name))

})

app.get("/api/lectures/:subject", async (req,res)=>{

 const subject = req.params.subject

 const lectures = await Lecture.find({subject})

 res.json(lectures.map(l=>l.filename))

})

app.post("/api/create-subject", async (req,res)=>{

 const { subject } = req.body

 if(!subject){
  return res.json({error:"no subject"})
 }

 await Subject.create({name:subject})

 if(!fs.existsSync(`data/${subject}`)){
  fs.mkdirSync(`data/${subject}`)
 }

 res.json({success:true})

})

app.post("/api/delete-subject", async (req,res)=>{

 const { subject } = req.body

 if(!subject){
  return res.json({error:"no subject"})
 }

 await Subject.deleteOne({name:subject})

 if(fs.existsSync(`data/${subject}`)){
  fs.rmSync(`data/${subject}`,{recursive:true,force:true})
 }

 res.json({success:true})

})

app.get("/api/reports", async (req,res)=>{

 const reports = await Report
  .find()
  .sort({createdAt:-1})
  .limit(20)

 res.json(reports)

})

app.post("/api/broadcast", async (req,res)=>{

 const { text } = req.body

 if(!text){
  return res.json({error:"no text"})
 }

 const users = await User.find()

 let sent=0

 for(const u of users){

  try{
   await bot.sendMessage(u.telegramId,text)
   sent++
  }catch(e){}

 }

 res.json({sent})

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

app.listen(PORT, async () => {

 console.log("🌐 Server started")

 const url = `https://app.kstubot.ru/bot${BOT_TOKEN}`

 await bot.deleteWebHook()

 await bot.setWebHook(url)

 console.log("✅ Webhook set:",url)

})