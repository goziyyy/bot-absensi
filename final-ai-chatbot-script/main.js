const makeWASocket = require("@whiskeysockets/baileys").default;
const { default: XeonBotIncConnect, delay, PHONENUMBER_MCC, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto, Browsers } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const FileType = require('file-type');
const path = require('path');
const axios = require('axios');
const PhoneNumber = require('awesome-phonenumber');

const handleIncomingMessage = require('./messageHandler.js');

const myfunc = require('./lib/myfunc.js');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif.js');
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = myfunc;

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const prefix = "!";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    
    const bot = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Bot WhatsApp','Safari','1.0.0'],
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg.message || undefined;
            }
            return {
                conversation: 'Bot sedang aktif!'
            };
        }
    });

    store.bind(bot.ev);

    bot.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.badSession) {
                console.log(`Bad Session File, Please Delete Session and Scan Again`);
                bot.logout();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log("Connection closed, reconnecting....");
                startBot();
            } else if (reason === DisconnectReason.connectionLost) {
                console.log("Connection Lost from Server, reconnecting...");
                startBot();
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
                bot.logout();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(`Device Logged Out, Please Scan Again And Run.`);
                bot.logout();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log("Restart Required, Restarting...");
                startBot();
            } else if (reason === DisconnectReason.timedOut) {
                console.log("Connection TimedOut, Reconnecting...");
                startBot();
            } else bot.end(`Unknown DisconnectReason: ${reason}|${connection}`);
        }
        console.log('Connection...', update);
    });

    bot.ev.on('creds.update', saveCreds);

    bot.ev.on('messages.upsert', async (messageUpdate) => {
        const messages = messageUpdate.messages;
        for (const msg of messages) {
            if (!msg.message) continue;
    
            try {
                await handleIncomingMessage(bot, msg);
            } catch (error) {
                console.error('Error handling message:', error);
            }
        }
    });
    

    bot.sendText = (jid, text, quoted = '', options) => bot.sendMessage(jid, { text: text, ...options }, { quoted });

    bot.sendImage = async (jid, path, caption = '', quoted = '', options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await bot.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
    };

    bot.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await bot.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted });
    };

    bot.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await bot.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted });
    };

    bot.sendTextWithMentions = async (jid, text, quoted, options = {}) => bot.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted });

    bot.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }

        await bot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    bot.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }

        await bot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };
}

startBot();
