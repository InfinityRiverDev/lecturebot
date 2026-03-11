const tg = window.Telegram.WebApp

tg.ready()
tg.expand()

const user = tg.initDataUnsafe?.user

const app = document.getElementById("app")

if(!user){

 app.innerHTML="Откройте Mini App через Telegram"

 throw new Error("No telegram user")

}

const userId = user.id

init()

async function init(){

 // проверка регистрации
 const res = await fetch("/api/checkUser",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify({userId})
 })

 const data = await res.json()

 if(!data.registered){

  app.innerHTML = `
  <h2>Вы не зарегистрированы</h2>
  <p>Напишите боту команду /start</p>
  `
  return

 }

 // проверяем админа

 const adminCheck = await fetch("/api/checkAdmin",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify({userId})
 })

 const adminData = await adminCheck.json()

 if(adminData.admin){

  window.location="admin.html"

 }else{

  window.location="user.html"

 }

}