require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")
const fs = require("fs")
const PDFDocument = require("pdfkit")

const { BOT_TOKEN, YA_API_KEY, AI_API_KEY, FOLDER_ID, ADMIN_IDS } = require("./config")

const bot = new TelegramBot(BOT_TOKEN, { polling: false })

console.log("🤖 Бот запущен")

if(!fs.existsSync("data")){
 fs.mkdirSync("data")
}

if(!fs.existsSync("users.json")){
 fs.writeFileSync("users.json",JSON.stringify({}))
}

let users = JSON.parse(fs.readFileSync("users.json"))

let authState = {}

const ADMIN_LOGIN="admin"
const ADMIN_PASSWORD="admin123"

let adminState={}
let adminAudio={}
let pendingLecture={}

let subjectsStore={}
let lecturesStore={}
let counter=0


function isAdmin(id){
 return ADMIN_IDS.includes(id)
}

function isAuthorized(id){
 return users[id] || isAdmin(id)
}

function saveUsers(){
 fs.writeFileSync("users.json",JSON.stringify(users,null,2))
}


// команды пользователя
bot.setMyCommands([
 {command:"lectures",description:"Посмотреть лекции"}
])

// команды админа
bot.setMyCommands(
[
 {command:"addlecture",description:"Добавить лекцию"},
 {command:"addsubject",description:"Создать предмет"},
 {command:"delsubject",description:"Удалить предмет"},
 {command:"dellecture",description:"Удалить лекцию"},
 {command:"lectures",description:"Посмотреть лекции"}
],
{
 scope:{
  type:"chat",
  chat_id:ADMIN_IDS[0]
 }
}
)

bot.setMyCommands(
[
 {command:"addlecture",description:"Добавить лекцию"},
 {command:"addsubject",description:"Создать предмет"},
 {command:"delsubject",description:"Удалить предмет"},
 {command:"dellecture",description:"Удалить лекцию"},
 {command:"lectures",description:"Посмотреть лекции"}
],
{
 scope:{
  type:"chat",
  chat_id:ADMIN_IDS[1]
 }
}
)


// создание PDF
function createPDF(path, subject, date, text){

 const doc = new PDFDocument({
  margin:50
 })

 doc.pipe(fs.createWriteStream(path))

 doc.font("Roboto-Regular.ttf")

 doc.fontSize(22).text(subject,{align:"center"})
 doc.moveDown()

 doc.fontSize(14).text(`Лекция от ${date}`,{align:"center"})
 doc.moveDown()
 doc.moveDown()

 doc.moveTo(50, doc.y)
 .lineTo(550, doc.y)
 .stroke()

 doc.moveDown()
 doc.moveDown()

 doc.fontSize(12).text(text,{
  align:"left"
 })

 doc.end()
}


// START
bot.onText(/\/start/,msg=>{

 const id = msg.from.id
 const chatId = msg.chat.id

 if(isAuthorized(id)){

  bot.sendMessage(chatId,
`👋 Привет!

Открой приложение чтобы смотреть лекции.`,
{
 reply_markup:{
  inline_keyboard:[
    [
    {
      text:"📚 Открыть лекции",
      web_app:{
      url:"https://app.kstubot.ru"
      }
    }
    ]
  ]
  }
})

 return
 }

 authState[id] = "login"

 bot.sendMessage(chatId,
`🔐 Регистрация

Введите логин от портала КСТУ`)
})


// обработка сообщений
bot.on("message",async msg=>{

 const chatId=msg.chat.id
 const userId=msg.from.id

 if(authState[userId]==="login"){

  authState[userId]={login:msg.text}

  bot.sendMessage(chatId,"🔐 Введите пароль")

  return
 }

if(authState[userId] && typeof authState[userId]==="object"){

  const login=authState[userId].login
  const pass=msg.text

  let token=null

  try{

    const response = await axios.post(
      "https://rest.kstu.ru/restapi/login/",
      {
      username:login,
      password:pass
      },
      {
      headers:{
        "accept":"*/*",
        "accept-language":"ru,en;q=0.9",
        "content-type":"application/json",
        "Referer":"https://one.kstu.ru/",
        "origin":"https://one.kstu.ru"
      }
      }
    )

    console.log("LOGIN RESPONSE:",response.data)

    token = response.data?.token || response.data?.access || null

    }catch(err){

    console.log("LOGIN API ERROR:",err.response?.data || err.message)

    }

  if(login===ADMIN_LOGIN && pass===ADMIN_PASSWORD && isAdmin(userId)){

   users[userId]={
    login,
    pass,
    token,
    role:"admin"
   }

   saveUsers()

   authState[userId]=null

   bot.sendMessage(chatId,"✅ Вы вошли как админ")

  }else{

   users[userId]={
    login,
    pass,
    token,
    role:"user"
   }

   saveUsers()

   authState[userId]=null

   bot.sendMessage(chatId,"✅ Регистрация завершена")
  }

  bot.sendMessage(chatId,
  `👋 Добро пожаловать!

  Открой приложение чтобы смотреть лекции.`,
  {
  reply_markup:{
    inline_keyboard:[
      [
      {
        text:"📚 Открыть лекции",
        web_app:{
        url:"https://app.kstubot.ru"
        }
      }
      ]
    ]
    }
  })

  return
 }

 if(!isAuthorized(userId)) return


 if(adminState[chatId]==="create_subject"){

  if(!isAdmin(userId)) return

  const subject=msg.text

  if(!fs.existsSync(`data/${subject}`)){
   fs.mkdirSync(`data/${subject}`)
  }

  bot.sendMessage(chatId,"✅ Предмет создан")

  adminState[chatId]=null
 }

})


// просмотр лекций
bot.onText(/📚 Посмотреть лекции/,msg=>{
 if(!isAuthorized(msg.from.id)) return
 showSubjects(msg.chat.id)
})

bot.onText(/\/lectures/,msg=>{
 if(!isAuthorized(msg.from.id)) return
 showSubjects(msg.chat.id)
})


function showSubjects(chatId){

 const subjects = fs.readdirSync("data")

 if(subjects.length===0){
  bot.sendMessage(chatId,"❌ Пока нет лекций")
  return
 }

 const buttons = subjects.map(s=>{

  const id="sub_"+(++counter)

  subjectsStore[id]=s

  return [{
   text:s,
   callback_data:id
  }]
 })

 bot.sendMessage(chatId,"📚 Выберите предмет",{
  reply_markup:{inline_keyboard:buttons}
 })

}


// создать предмет
bot.onText(/\/addsubject/,msg=>{

 if(!isAdmin(msg.from.id)) return
 if(!isAuthorized(msg.from.id)) return

 adminState[msg.chat.id]="create_subject"

 bot.sendMessage(msg.chat.id,"Введите название предмета")
})


// удалить предмет
bot.onText(/\/delsubject/,msg=>{

 if(!isAdmin(msg.from.id)) return
 if(!isAuthorized(msg.from.id)) return

 const subjects = fs.readdirSync("data")

 const buttons = subjects.map(s=>{

  const id="delsub_"+(++counter)

  subjectsStore[id]=s

  return [{
   text:s,
   callback_data:id
  }]
 })

 bot.sendMessage(msg.chat.id,"Выберите предмет для удаления",{
  reply_markup:{inline_keyboard:buttons}
 })
})


// добавить лекцию
bot.onText(/\/addlecture/,msg=>{

 if(!isAdmin(msg.from.id)) return
 if(!isAuthorized(msg.from.id)) return

 adminState[msg.chat.id]="waiting_audio"

 bot.sendMessage(msg.chat.id,"🎤 Отправьте голосовое сообщение")
})


// удалить лекцию
bot.onText(/\/dellecture/,msg=>{

 if(!isAdmin(msg.from.id)) return
 if(!isAuthorized(msg.from.id)) return

 const subjects = fs.readdirSync("data")

 const buttons = subjects.map(s=>{

  const id="delsublect_"+(++counter)

  subjectsStore[id]=s

  return [{
   text:s,
   callback_data:id
  }]
 })

 bot.sendMessage(msg.chat.id,"Выберите предмет",{
  reply_markup:{inline_keyboard:buttons}
 })
})


// голосовое
bot.on("voice",msg=>{

 if(!isAdmin(msg.from.id)) return
 if(adminState[msg.chat.id]!=="waiting_audio") return

 adminAudio[msg.chat.id]=msg.voice.file_id

 const subjects=fs.readdirSync("data")

 const buttons=subjects.map(s=>{

  const id="asub_"+(++counter)

  subjectsStore[id]=s

  return [{
   text:s,
   callback_data:id
  }]
 })

 bot.sendMessage(msg.chat.id,"📂 Выберите предмет",{
  reply_markup:{inline_keyboard:buttons}
 })
})


// GPT улучшение
async function improveText(text){

 try{

  const response = await axios.post(
   "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
   {
    modelUri:`gpt://${FOLDER_ID}/yandexgpt-lite/latest`,
    completionOptions:{
     stream:false,
     temperature:0.3,
     maxTokens:"2000"
    },
    messages:[
     {role:"system",text:"Сделай аккуратный конспект лекции"},
     {role:"user",text:text}
    ]
   },
   {
    headers:{
     Authorization:`Api-Key ${AI_API_KEY}`,
     "Content-Type":"application/json"
    }
   }
  )

  return response.data.result.alternatives[0].message.text

 }catch(err){

  console.log("GPT ERROR:",err.response?.data)

  return text
 }
}


// callback
bot.on("callback_query",async query=>{

 const data=query.data
 const chatId=query.message.chat.id

 if(data.startsWith("sub_")){

  const subject=subjectsStore[data]

  const files=fs.readdirSync(`data/${subject}`)

  const buttons=files.map(f=>{

   const id="lec_"+(++counter)

   lecturesStore[id]={subject,file:f}

   return [{
    text:f.replace(".pdf",""),
    callback_data:id
   }]
  })

  bot.sendMessage(chatId,"📅 Выберите лекцию",{
   reply_markup:{inline_keyboard:buttons}
  })
 }


 if(data.startsWith("lec_")){

  const lecture=lecturesStore[data]

  const path=`data/${lecture.subject}/${lecture.file}`

  bot.sendDocument(chatId,path)
 }


 if(data.startsWith("delsub_")){

  const subject=subjectsStore[data]

  fs.rmSync(`data/${subject}`,{recursive:true,force:true})

  bot.sendMessage(chatId,"🗑 Предмет удалён")
 }


 if(data.startsWith("delsublect_")){

  const subject=subjectsStore[data]

  const files=fs.readdirSync(`data/${subject}`)

  const buttons=files.map(f=>{

   const id="dellecture_"+(++counter)

   lecturesStore[id]={subject,file:f}

   return [{
    text:f.replace(".pdf",""),
    callback_data:id
   }]
  })

  bot.sendMessage(chatId,"Выберите лекцию для удаления",{
   reply_markup:{inline_keyboard:buttons}
  })
 }


 if(data.startsWith("dellecture_")){

  const lecture=lecturesStore[data]

  fs.unlinkSync(`data/${lecture.subject}/${lecture.file}`)

  bot.sendMessage(chatId,"🗑 Лекция удалена")
 }


 if(data.startsWith("asub_")){

  try{

   const subject=subjectsStore[data]

   bot.sendMessage(chatId,"🎧 Распознаю аудио...")

   const file=await bot.getFile(adminAudio[chatId])

   const url=`https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`

   const response=await axios({
    method:"GET",
    url,
    responseType:"arraybuffer"
   })

   const result=await axios.post(
   "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?lang=ru-RU&format=oggopus",
   response.data,
   {
    headers:{
     Authorization:`Api-Key ${YA_API_KEY}`,
     "Content-Type":"application/octet-stream"
    }
   }
   )

   const text=result.data.result || "Ошибка распознавания"

   pendingLecture[chatId]={subject,text}

   bot.sendMessage(chatId,
`📝 Текст распознан:

${text}

Что сделать?`,
{
 reply_markup:{
  inline_keyboard:[
   [{text:"🧠 Упорядочить текст",callback_data:"ai_fix"}],
   [{text:"📁 Сохранить как есть",callback_data:"save_raw"}]
  ]
 }
})

  }catch(err){

   console.log(err)

   bot.sendMessage(chatId,"Ошибка распознавания")
  }
 }


 if(data==="save_raw"){

  const lecture=pendingLecture[chatId]

  const date=new Date().toISOString().split("T")[0]

  const path=`data/${lecture.subject}/${date}.pdf`

  createPDF(path,lecture.subject,date,lecture.text)

  bot.sendMessage(chatId,"✅ Лекция сохранена")
 }


 if(data==="ai_fix"){

  const lecture=pendingLecture[chatId]

  const newText=await improveText(lecture.text)

  const date=new Date().toISOString().split("T")[0]

  const path=`data/${lecture.subject}/${date}.pdf`

  createPDF(path,lecture.subject,date,newText)

  bot.sendMessage(chatId,"✅ Лекция сохранена")
 }

})

bot.on("message", async msg => {

 if(!msg.text) return

 const linkRegex = /https:\/\/one\.kstu\.ru\/check-code\/([a-z0-9\-]+)/i
 const match = msg.text.match(linkRegex)

 if(!match) return

 const code = match[1]

 console.log("Найдена ссылка:",code)

 const userList = Object.entries(users)

 for(const [userId,user] of userList){

  if(!user.token) continue

  try{

   const response = await axios.post(
    "https://rest.kstu.ru/restapi/workbook/check-visit/",
    {
     curlid_code:code
    },
    {
     headers:{
      "accept":"*/*",
      "accept-language":"ru,en;q=0.9",
      "authorization":`Token ${user.token}`,
      "content-type":"application/json",
      "Referer":"https://one.kstu.ru/"
     }
    }
   )

   const status = response.data?.status

   if(status===true){

    bot.sendMessage(userId,`✅ Вы отмечены на лекции\n\nСтатус ответа: ${status}`)

   }

  }catch(err){

   console.log(`Ошибка для пользователя ${userId}:`,err.response?.data || err.message)

  }

 }

})

const processedCodes = new Set()

bot.on("message", async msg => {

 if(!msg.text) return
 if(msg.chat.type === "private") return

 const regex = /https:\/\/one\.kstu\.ru\/check-code\/([a-z0-9\-]+)/i
 const match = msg.text.match(regex)

 if(!match) return

 const code = match[1]

 if(processedCodes.has(code)){
  console.log("Ссылка уже обработана")
  return
 }

 processedCodes.add(code)

 console.log("Найдена ссылка:",code)

 const userList = Object.entries(users)

 let success=0
 let fail=0

 const requests = userList.map(async ([userId,user]) => {

  if(!user.token){
   fail++
   return
  }

  try{

   const response = await axios.post(
    "https://rest.kstu.ru/restapi/workbook/check-visit/",
    {
     curlid_code:code
    },
    {
     headers:{
      "accept":"*/*",
      "accept-language":"ru,en;q=0.9",
      "authorization":`Token ${user.token}`,
      "content-type":"application/json",
      "Referer":"https://one.kstu.ru/"
     }
    }
   )

   const status = response.data?.status

   if(status === true){

    success++

    await bot.sendMessage(userId,
`✅ Вы отмечены на лекции

Код: ${code}
Статус ответа: ${status}`
    )

   }else{

 fail++

 const errorText = response.data

 console.log(`API ответ для пользователя ${userId}:`, errorText)

 for(const admin of ADMIN_IDS){

  await bot.sendMessage(admin,
`⚠️ Пользователь не отмечен

👤 Пользователь: ${user.login}
🆔 ID: ${userId}

Код лекции:
${code}

Ответ API:
${JSON.stringify(errorText,null,2)}`
  )

 }

}

  }catch(err){

 fail++

 const errorText = err.response?.data || err.message

 console.log(`Ошибка пользователя ${userId}:`,errorText)

 for(const admin of ADMIN_IDS){

  bot.sendMessage(admin,
`❌ Ошибка отметки

👤 Пользователь: ${user.login}
🆔 ID: ${userId}

Код лекции:
${code}

Ошибка API:
${JSON.stringify(errorText,null,2)}`
  )

 }

}

 })

 await Promise.all(requests)

 const report = `
📊 Отчёт по отметке

Код: ${code}

✅ Успешно: ${success}
❌ Ошибки: ${fail}
👥 Всего пользователей: ${userList.length}
`

 for(const admin of ADMIN_IDS){

  bot.sendMessage(admin,report)

 }

})

module.exports = {bot}