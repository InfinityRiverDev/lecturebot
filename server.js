require("./index")
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

app.post("/api/checkAdmin",(req,res)=>{

 const {userId} = req.body

 if(ADMIN_IDS.includes(userId)){
  res.json({admin:true})
 }else{
  res.json({admin:false})
 }

})

app.get("/api/users",(req,res)=>{

 const users = loadUsers()

 res.json(users)

})

app.post("/api/deleteUser",(req,res)=>{

 const {userId} = req.body

 const users = loadUsers()

 delete users[userId]

 saveUsers(users)

 res.json({success:true})

})

app.post("/api/broadcast",(req,res)=>{

 const {text} = req.body

 const users = loadUsers()

 const bot = require("./index").bot

 Object.keys(users).forEach(id=>{

  bot.sendMessage(id,text)

 })

 res.json({success:true})

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
 console.log("Mini App server started on port " + PORT)
})