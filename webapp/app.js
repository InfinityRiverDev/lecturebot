const tg = window.Telegram.WebApp

tg.expand()

const userId = tg.initDataUnsafe.user.id



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

  document.body.innerHTML = `
  <div style="padding:30px;text-align:center;font-family:sans-serif">

  <h2>Вы не зарегистрированы</h2>

  <p>Напишите боту команду</p>

  <b>/start</b>

  </div>
  `

  return
 }



 // проверяем админ ли пользователь

 const adminCheck = await fetch("/api/checkAdmin",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify({userId})
 })

 const adminData = await adminCheck.json()

 if(adminData.admin){

  window.location = "admin.html"

 }else{

  window.location = "user.html"

 }

}



init()