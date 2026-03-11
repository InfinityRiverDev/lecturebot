const tg = window.Telegram.WebApp;

// Сообщаем Telegram, что приложение загрузилось
tg.ready();

// Разворачиваем Mini App
tg.expand();

console.log("Telegram object:", tg)
console.log("initData:", tg.initData)
console.log("initDataUnsafe:", tg.initDataUnsafe)

const app = document.getElementById("app");

// Ждём пока Telegram полностью отдаст данные
setTimeout(() => {

  const user = tg.initDataUnsafe?.user;

  if(!user){
    app.innerHTML = "Telegram user не найден";
    console.log("initData:", tg.initDataUnsafe);
    return;
  }

  const userId = user.id;

  init(userId);

}, 300);


async function init(userId){

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