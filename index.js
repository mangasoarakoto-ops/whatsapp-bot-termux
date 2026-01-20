const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { execSync } = require('child_process');
const fs = require('fs');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot mandeha 24h/24!'));
app.listen(process.env.PORT || 3000, () => console.log('Server Express efa velona!'));

// 1. Manery ny famoahana ny session.zip
if (fs.existsSync('session.zip')) {
    try {
        console.log('Fichier session.zip hita, manomboka mamoaka azy...');
        execSync('unzip -o session.zip');
        console.log('Vita soa aman-tsara ny famoahana (unzip)!');
    } catch (err) {
        console.log('Fahadisoana tamin\'ny unzip: ' + err.message);
    }
} else {
    console.log('Tsy hita ny session.zip! Hamarino raha nampiakatra azy ianao.');
}

async function connectToWhatsApp() {
    console.log('Andrana fampifandraisana amin\'ny WhatsApp...');
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        logger: pino({ level: 'info' }), // Nalefa 'info' mba hahitana izay mitranga
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) console.log('MIPITRA NY QR CODE: Midika izany fa tsy voavaky ny session-nao!');
        
        if (connection === 'close') {
            console.log('Nikatona ny fifandraisana, mamerina indray...');
            connectToWhatsApp();
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
