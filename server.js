const { bot } = require("./index")
const express = require("express")
const fs = require("fs")
const cors = require("cors")

const { ADMIN_IDS } = require("./config")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("webapp"))

// Функции для работы с пользователями
function loadUsers() {
    return JSON.parse(fs.readFileSync("users.json"))
}

function saveUsers(users) {
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2))
}

function isAdmin(id) {
    return ADMIN_IDS.includes(Number(id))
}

// API endpoints
app.post("/api/checkAdmin", (req, res) => {
    const { userId } = req.body
    res.json({ admin: isAdmin(userId) })
})

app.get("/api/users", (req, res) => {
    const users = loadUsers()
    res.json(users)
})

app.post("/api/deleteUser", (req, res) => {
    const { userId } = req.body
    const users = loadUsers()
    delete users[userId]
    saveUsers(users)
    res.json({ success: true })
})

app.post("/api/broadcast", (req, res) => {
    const { text } = req.body
    const users = loadUsers()
    Object.keys(users).forEach(id => {
        bot.sendMessage(id, text).catch(err => console.log(err))
    })
    res.json({ success: true })
})

app.get("/api/subjects", (req, res) => {
    const subjects = fs.readdirSync("data")
    res.json(subjects)
})

app.get("/api/lectures/:subject", (req, res) => {
    const subject = req.params.subject
    const files = fs.readdirSync(`data/${subject}`)
    res.json(files)
})

app.get("/api/lecture/:subject/:file", (req, res) => {
    const { subject, file } = req.params
    res.sendFile(__dirname + `/data/${subject}/${file}`)
})

app.post("/api/addSubject", (req, res) => {
    const { name } = req.body
    if (!fs.existsSync(`data/${name}`)) {
        fs.mkdirSync(`data/${name}`)
    }
    res.json({ success: true })
})

app.post("/api/deleteSubject", (req, res) => {
    const { name } = req.body
    fs.rmSync(`data/${name}`, { recursive: true, force: true })
    res.json({ success: true })
})

app.post("/api/deleteLecture", (req, res) => {
    const { subject, file } = req.body
    fs.unlinkSync(`data/${subject}/${file}`)
    res.json({ success: true })
})

app.post("/api/checkUser", (req, res) => {
    const { userId } = req.body
    const users = JSON.parse(fs.readFileSync("users.json"))
    res.json({ registered: !!users[userId] })
})

// Webhook endpoint для Telegram
app.post("/webhook", (req, res) => {
    bot.processUpdate(req.body)
    res.sendStatus(200)
})

const PORT = process.env.PORT || 3000
const WEBHOOK_URL = `https://app.kstubot.ru/webhook` // Убедитесь, что URL правильный

app.listen(PORT, async () => {
    console.log("🚀 Mini App server started on port " + PORT)

    try {
        // Останавливаем polling если он был запущен
        await bot.stopPolling()
        console.log("✅ Polling stopped")
        
        // Устанавливаем webhook
        await bot.setWebHook(WEBHOOK_URL)
        console.log("✅ Webhook set to:", WEBHOOK_URL)
        
        // Проверяем статус webhook
        const webhookInfo = await bot.getWebHookInfo()
        console.log("📡 Webhook info:", webhookInfo)
        
    } catch (err) {
        console.error("❌ Error setting up webhook:", err.message)
    }
})

// Обработка ошибок
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error)
})