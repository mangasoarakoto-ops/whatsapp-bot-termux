const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { exec } = require('child_process');
const fs = require('fs');
const express = require('express');

// Mampandeha server kely mba ho velona foana ny Render
const app = express();
app.get('/', (req, res) => res.send('Bot velona 24h/24!'));
app.listen(process.env.PORT || 3000);

// Mamoaka ny session raha vao manomboka ny server
if (fs.existsSync('session.zip')) {
    console.log('Mamoaka ny session...');
    exec('unzip -o session.zip');
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('>>> BINGO! TAFIDITRA SOA AMAN-TSARA ANY AMIN\'NY RENDER! <<<');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const text = msg.message?.conversation || "";
            if (text.toLowerCase() === 'salama') {
                await sock.sendMessage(msg.key.remoteJid, { text: 'Salama! Bot mandeha 24h/24 avy any amin\'ny Render ity.' });
            }
        }
    });
    sock.ev.on('creds.update', saveCreds);
}
connectToWhatsApp();
