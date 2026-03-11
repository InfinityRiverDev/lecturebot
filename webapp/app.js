const tg = window.Telegram.WebApp

tg.ready()
tg.expand()

const user = tg.initDataUnsafe?.user

const userDiv = document.getElementById("user")

if(!user){

 userDiv.innerHTML = "Откройте приложение через Telegram"

}else{

 userDiv.innerHTML = `
 <p>ID: ${user.id}</p>
 <p>Имя: ${user.first_name}</p>
 <p>Username: ${user.username}</p>
 `

}