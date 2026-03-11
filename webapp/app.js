const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

console.log("Telegram WebApp initialized");

const app = document.getElementById("app");

setTimeout(async () => {
    const user = tg.initDataUnsafe?.user;

    if (!user) {
        app.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2>❌ Ошибка</h2>
                <p>Не удалось получить данные пользователя Telegram</p>
                <p>Откройте приложение через бота в Telegram</p>
            </div>
        `;
        console.log("No user data:", tg.initDataUnsafe);
        return;
    }

    const userId = user.id;

    try {
        const res = await fetch("/api/checkUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data.registered) {
            app.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h2>⚠️ Вы не зарегистрированы</h2>
                    <p>Напишите боту команду /start</p>
                    <button onclick="window.Telegram.WebApp.close()">
                        Закрыть
                    </button>
                </div>
            `;
            return;
        }

        const adminCheck = await fetch("/api/checkAdmin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });

        const adminData = await adminCheck.json();

        if (adminData.admin) {
            window.location.href = "admin.html";
        } else {
            window.location.href = "user.html";
        }

    } catch (error) {
        console.error("Error:", error);
        app.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2>❌ Ошибка соединения</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">
                    🔄 Повторить
                </button>
            </div>
        `;
    }
}, 300);