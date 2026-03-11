const tg = window.Telegram.WebApp

tg.ready()
tg.expand()

const user = tg.initDataUnsafe?.user

if(!user){

 document.getElementById("app").innerHTML = `
 <h2>Откройте приложение через Telegram</h2>
 `

 throw new Error("No Telegram user")

}

const userId = user.id

init()

async function init(){

 const res = await fetch("/api/checkUser",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify({userId})
 })

 const data = await res.json()

 if(!data.registered){

  document.getElementById("app").innerHTML = `
  <h2>Вы не зарегистрированы</h2>
  <p>Напишите боту команду /start</p>
  `
  return
 }

 const adminCheck = await fetch("/api/checkAdmin",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify({userId})
 })

 const admin = await adminCheck.json()

 if(admin.admin){

  window.location = "admin.html"

 }else{

  window.location = "user.html"

 }

}