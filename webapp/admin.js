const tg = window.Telegram.WebApp

const user = tg.initDataUnsafe.user

fetch("/api/checkAdmin",{
 method:"POST",
 headers:{
  "Content-Type":"application/json"
 },
 body:JSON.stringify({
  userId:user.id
 })
})
.then(r=>r.json())
.then(data=>{

 if(!data.admin){

  document.body.innerHTML="⛔ Доступ только для администраторов"

  return
 }

 loadUsers()

})

function loadUsers(){

 fetch("/api/users")
 .then(r=>r.json())
 .then(users=>{

  const container = document.getElementById("users")

  container.innerHTML=""

  Object.entries(users).forEach(([id,user])=>{

   const div=document.createElement("div")

   div.innerHTML=`
   ${user.login} 
   <button onclick="deleteUser('${id}')">Удалить</button>
   `

   container.appendChild(div)

  })

 })

}

function deleteUser(id){

 fetch("/api/deleteUser",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify({userId:id})
 })
 .then(()=>loadUsers())

}

function sendBroadcast(){

 const text = document.getElementById("broadcastText").value

 fetch("/api/broadcast",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify({text})
 })

}