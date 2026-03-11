const {bot} = require("./index")

async function startBot(){

 try{

  await bot.deleteWebHook({ drop_pending_updates:true })

  await bot.startPolling({
   interval:300
  })

  console.log("🤖 Bot polling started")

 }catch(err){

  console.log("Polling error:",err.message)

 }

}

startBot()

const express = require("express")
const fs = require("fs")
const cors = require("cors")

const { ADMIN_IDS } = require("./config")

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static("webapp"))

function loadUsers(){
 return JSON.parse(fs.readFileSync("users.json"))
}

function saveUsers(users){
 fs.writeFileSync("users.json",JSON.stringify(users,null,2))
}

function isAdmin(id){
 return ADMIN_IDS.includes(Number(id))
}






// проверить админа
app.post("/api/checkAdmin",(req,res)=>{

 const {userId} = req.body

 res.json({admin:isAdmin(userId)})

})






// список пользователей
app.get("/api/users",(req,res)=>{

 const users = loadUsers()

 res.json(users)

})






// удалить пользователя
app.post("/api/deleteUser",(req,res)=>{

 const {userId} = req.body

 const users = loadUsers()

 delete users[userId]

 saveUsers(users)

 res.json({success:true})

})






// рассылка
app.post("/api/broadcast",(req,res)=>{

 const {text} = req.body

 const users = loadUsers()

 const bot = require("./index").bot

 Object.keys(users).forEach(id=>{
  bot.sendMessage(id,text)
 })

 res.json({success:true})

})






// список предметов
app.get("/api/subjects",(req,res)=>{

 const subjects = fs.readdirSync("data")

 res.json(subjects)

})






// лекции предмета
app.get("/api/lectures/:subject",(req,res)=>{

 const subject = req.params.subject

 const files = fs.readdirSync(`data/${subject}`)

 res.json(files)

})






// скачать лекцию
app.get("/api/lecture/:subject/:file",(req,res)=>{

 const {subject,file} = req.params

 res.sendFile(__dirname + `/data/${subject}/${file}`)

})






// создать предмет
app.post("/api/addSubject",(req,res)=>{

 const {name} = req.body

 if(!fs.existsSync(`data/${name}`)){
  fs.mkdirSync(`data/${name}`)
 }

 res.json({success:true})

})






// удалить предмет
app.post("/api/deleteSubject",(req,res)=>{

 const {name} = req.body

 fs.rmSync(`data/${name}`,{recursive:true,force:true})

 res.json({success:true})

})






// удалить лекцию
app.post("/api/deleteLecture",(req,res)=>{

 const {subject,file} = req.body

 fs.unlinkSync(`data/${subject}/${file}`)

 res.json({success:true})

})


app.post("/api/checkUser",(req,res)=>{

 const {userId} = req.body

 const users = JSON.parse(fs.readFileSync("users.json"))

 if(users[userId]){
  res.json({registered:true})
 }else{
  res.json({registered:false})
 }

})






const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{

 console.log("Mini App server started on port "+PORT)

})