require("dotenv").config()

module.exports = {

 BOT_TOKEN: process.env.BOT_TOKEN,
 YA_API_KEY: process.env.YA_API_KEY,
 AI_API_KEY: process.env.AI_API_KEY,
 FOLDER_ID: process.env.FOLDER_ID,

 ADMIN_IDS: [
  Number(process.env.ADMIN_ID1),
  Number(process.env.ADMIN_ID2)
 ],

 ADMIN_ACCOUNTS: [
  {
   telegramId:Number(process.env.ADMIN_ID1),
   login:process.env.ADMIN1_LOGIN,
   password:process.env.ADMIN1_PASSWORD
  },
  {
   telegramId:Number(process.env.ADMIN_ID2),
   login:process.env.ADMIN2_LOGIN,
   password:process.env.ADMIN2_PASSWORD
  }
 ]

}