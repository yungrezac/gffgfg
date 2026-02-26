const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// === НАСТРОЙКИ ===
// Впишите сюда ваш @username из TikTok (без собачки)
const TIKTOK_USERNAME = 'ВАШ_ТИКТОК_ЮЗЕРНЕЙМ'; 
const PORT = 3000;

// Раздаем наш HTML файл для корня и для /settings
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'tiktok-widget.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'tiktok-widget.html'));
});

// === ПОДКЛЮЧЕНИЕ К TIKTOK ===
const tiktokLiveConnection = new WebcastPushConnection(TIKTOK_USERNAME);

tiktokLiveConnection.connect().then(state => {
    console.log(`✅ Успешно подключено к стриму ${TIKTOK_USERNAME} (Room ID: ${state.roomId})`);
}).catch(err => {
    console.error(`❌ Ошибка подключения к TikTok:`, err);
});

// Слушаем события подарков
tiktokLiveConnection.on('gift', data => {
    // Отправляем данные о подарке всем подключенным виджетам (в браузер/OBS)
    io.emit('tiktok-gift', {
        username: data.uniqueId,
        giftName: data.giftName,
        giftId: data.giftId, // Уникальный ID подарка в TikTok
        cost: data.diamondCount,
        icon: data.giftPictureUrl // Иконка подарка от TikTok
    });
    
    console.log(`🎁 ${data.uniqueId} отправил ${data.giftName} (x${data.repeatCount})`);
});

// === ЗАПУСК СЕРВЕРА ===
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен!`);
    console.log(`📺 Ссылка для OBS (Виджет): http://localhost:${PORT}/`);
    console.log(`⚙️ Ссылка для браузера (Настройки): http://localhost:${PORT}/settings`);
});
