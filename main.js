const { default: makeWASocket, makeInMemoryStore, DisconnectReason, jidDecode, useMultiFileAuthState, Browsers, getContentType } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const { Boom } = require('@hapi/boom');
const { sendSlideWithButtons } = require('./sendSlide');
const students = require('./students.json');
const { smsg } = require('./hand');
const pkg = require('@whiskeysockets/baileys');
const { proto, generateWAMessageFromContent, generateWAMessageContent } = pkg;

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const Gita = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Bot WhatsApp', 'Safari', '1.0.0'],
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg.message || undefined;
            }
            return { conversation: 'Bot sedang aktif!' };
        }
    });

    store.bind(Gita.ev);

    Gita.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            switch (reason) {
                case DisconnectReason.badSession:
                    console.log(`Bad Session File, Please Delete Session and Scan Again`);
                    Gita.logout();
                    break;
                case DisconnectReason.connectionClosed:
                    console.log("Connection closed, reconnecting....");
                    startBot();
                    break;
                case DisconnectReason.connectionLost:
                    console.log("Connection Lost from Server, reconnecting...");
                    startBot();
                    break;
                case DisconnectReason.connectionReplaced:
                    console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
                    Gita.logout();
                    break;
                case DisconnectReason.loggedOut:
                    console.log(`Device Logged Out, Please Scan Again And Run.`);
                    Gita.logout();
                    break;
                case DisconnectReason.restartRequired:
                    console.log("Restart Required, Restarting...");
                    startBot();
                    break;
                case DisconnectReason.timedOut:
                    console.log("Connection TimedOut, Reconnecting...");
                    startBot();
                    break;
                default:
                    console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
                    startBot();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
        console.log('Connection...', update);
    });

    Gita.ev.on('creds.update', saveCreds);

    Gita.ev.on('messages.upsert', async (msg) => {
        const m = msg.messages[0];
        if (!m.message) return;

        await handleIncomingMessage(Gita, m);
    });

    Gita.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    Gita.ev.on('messages.update', async (msg) => {
        for (const { key, update } of msg) {
            if (update?.message?.buttonsResponseMessage) {
                const response = update.message.buttonsResponseMessage.selectedDisplayText;
                console.log(`Button response: ${response}`);
                const selectedStudent = students.find(student => student.name === response);
                if (selectedStudent) {
                    const message = `Pesan otomatis untuk ${selectedStudent.name}`;
                    await Gita.sendMessage(selectedStudent.whatsapp, { text: message });
                    console.log(`Pesan terkirim ke ${selectedStudent.name}`);
                }
            }
        }
    });
};

const generate = async (Gita, type, url) => {
    if (!fs.existsSync(url)) {
        throw new Error('File does not exist');
    }

    const mediaTypes = ['image', 'video', 'audio', 'document'];
    if (!mediaTypes.includes(type)) {
        throw new Error('Invalid media type');
    }

    const generated = await generateWAMessageContent({
        [type]: { url }
    }, {
        upload: Gita.waUploadToServer
    });
    return generated[`${type}Message`];
};

async function handleIncomingMessage(bot, message) {
    const m = smsg(bot, message, store);
    const messageType = getContentType(m.message);
    const fromMe = m.key.fromMe;
    const sender = fromMe ? m.key.remoteJid : (m.key.participant || m.key.remoteJid);
    const prefix = "!";

    if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
        const text = messageType === 'conversation' ? m.message.conversation : m.message.extendedTextMessage.text;
        console.log(`Received message: ${text}`);

        if (text.startsWith(prefix)) {
            const command = text.slice(prefix.length).trim().split(' ')[0].toLowerCase();
            switch (command) {
                case 'absen': {
                    const slides = students.map(student => [
                        student.photo,
                        student.name,
                        `Pesan untuk ${student.name}`,
                        'BotName',
                        'Klik di sini untuk menghubungi',
                        student.name,
                        'quick_reply',
                        '.chatstudent'
                    ]);

                    await sendSlideWithButtons(bot, m.key.remoteJid, 'XII PPLG 3', 'Absensi Reminder Command', 'Copyright Hilmy 2024', slides, sender, 'Gozi');
                    break;
                }
                case 'interactive': {
                    const imageMessage = await generate(bot, "image", "./namee/MUHAMMAD HILMY AL MUSTAFIDH_XISMKPPLG3.jpg");

                    const msg = generateWAMessageFromContent(m.key.remoteJid, {
                        interactiveMessage: {
                            headerType: 4,
                            imageMessage: imageMessage,
                            body: "This is the body text",
                            footer: "This is the footer text",
                            buttons: [
                                { buttonId: 'id1', buttonText: { displayText: 'Button 1' }, type: 1 },
                                { buttonId: 'id2', buttonText: { displayText: 'Button 2' }, type: 1 }
                            ],
                            title: 'This is the title',
                            description: 'This is the description'
                        }
                    }, {});

                    await bot.relayMessage(m.key.remoteJid, msg.message, {
                        messageId: msg.key.id
                    });
                    break;
                }
            }
        }
    } else if (messageType === 'buttonsResponseMessage') {
        const response = m.message.buttonsResponseMessage.selectedDisplayText;
        console.log(`Button response: ${response}`);
        const selectedStudent = students.find(student => student.name === response);
        if (selectedStudent) {
            const message = `Pesan otomatis untuk ${selectedStudent.name}`;
            await bot.sendMessage(selectedStudent.whatsapp, { text: message });
            console.log(`Pesan terkirim ke ${selectedStudent.name}`);
        }
    }
}

startBot();
