const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// === НАСТРОЙКИ ===
// Вы можете задать юзернейм прямо здесь или через переменные окружения Railway (Variables)
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'ВАШ_ТИКТОК_ЮЗЕРНЕЙМ'; 

// ВАЖНО ДЛЯ RAILWAY: Сервер должен слушать порт, который выдаст хостинг
const PORT = process.env.PORT || 3000;

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
        giftId: data.giftId,
        cost: data.diamondCount,
        icon: data.giftPictureUrl
    });
    
    console.log(`🎁 ${data.uniqueId} отправил ${data.giftName}`);
});

// === ЗАПУСК СЕРВЕРА ===
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}!`);
});
