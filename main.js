const { default: makeWASocket, makeInMemoryStore, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs')
const { Boom } = require('@hapi/boom');
const { sendSlideWithButtons } = require('./sendSlide'); // Import the sendSlide function

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const startBot = async () => {

    const { state, saveCreds } = await useMultiFileAuthState(`./session`);

    const Gita = makeWASocket({
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

    store.bind(Gita.ev);

    Gita.ev.on('connection.update', async (update) => {
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

    Gita.ev.on('creds.update', saveCreds);

    Gita.ev.on('messages.upsert', async (msg) => {
        const m = msg.messages[0];
        if (!m.message) return;

        const messageType = Object.keys(m.message)[0];
        const fromMe = m.key.fromMe;
        const sender = fromMe ? m.key.remoteJid : (m.key.participant || m.key.remoteJid);
        const text = m.message.conversation || m.message.extendedTextMessage?.text;

        console.log(`Received message: ${text}`);

        if (text && text.startsWith('http')) {
            try {
                const buttonData = new URL(text).pathname.substring(1);
                await handleButtonPress(buttonData);
            } catch (e) {
                console.error('Failed to handle button press', e);
            }
        }

        if (text) {
            const prefix = "!";
            if (text.startsWith(prefix)) {
                const isCommand = text.slice(prefix.length).trim().split(' ')[0].toLowerCase();
                switch (isCommand) {
                    case 'absen': {
                        const slides = [
                            [
                                './namee/MUHAMMAD HILMY AL MUSTAFIDH_XISMKPPLG3.jpg',
                                '',
                                `Muhammad Hilmy Al Mustafidh`,
                                'BotName',
                                'Visit',
                                'https://youtube.com/@dgxeon',
                                'cta_url',
                                'https://youtube.com/@dgxeon'
                            ],
                            [
                                './namee/Ahmad Dhani Prasetya_XISMKPPLG3.jpg',
                                '',
                                `Ahmad Dhani Prasetya`,
                                'BotName',
                                'Visit',
                                'http://t.me/xeonbotinc',
                                'cta_url',
                                'http://t.me/xeonbotinc'
                            ],
                            [
                                './namee/ALFFYA PUTRI EFENDI_XISMKPPLG3.jpg',
                                '',
                                `Alffya Putri Efendi`,
                                'BotName',
                                'Visit',
                                'https://github.com/DGXeon',
                                'cta_url',
                                'https://github.com/DGXeon'
                            ],
                            [
                                './namee/GHAURA FURQON NUGRAHA_XISMKPPLG3.jpg',
                                '',
                                `Ghaura Furqon Nugraha`,
                                'BotName',
                                'Visit',
                                'https://www.instagram.com/unicorn_xeon13',
                                'cta_url',
                                'https://www.instagram.com/unicorn_xeon13'
                            ],
                            [
                                './namee/MOHAMAD ADRIANO DWIANTORO_XISMKPPLG3.jpg',
                                '',
                                `Mohamad Adriano Dwiantoro`,
                                'BotName',
                                'Visit',
                                'https://Wa.me/916909137213',
                                'cta_url',
                                'https://Wa.me/916909137213'
                            ],
                            [
                                './namee/MUHAMMAD DHIYAEL HAQ_XISMKPPLG3.jpg',
                                '',
                                'Muhammad Dhiyael Haq',
                                'Footer Text',
                                'Send',
                                JSON.stringify({ action: 'send_message', numbers: ['6285155277080', '6281316432311'] }),
                                'cta_url',
                                'https://Wa.me/628979464311' // This URL will be parsed by the bot to determine action
                            ],
                            [
                                './namee/MUTIA AZZAHRA _XISMKPPLG3.jpg',
                                '',
                                'Mutia Azzahra',
                                'Footer Text',
                                'Send',
                                JSON.stringify({ action: 'send_message', numbers: ['6281219769477', '6281316432311'] }),
                                'cta_url',
                                'https://Wa.me/628979464311' // This URL will be parsed by the bot to determine action
                            ]
                        ];

                        await sendSlideWithButtons(Gita, m.key.remoteJid, 'XII PPLG 3', 'Absensi Reminder Command', 'Copyright Hilmy 2024', slides, sender, 'Gozi');
                        break;
                    }
                }
            }
        }
    });

    Gita.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });

    Gita.ev.on('creds.update', saveCreds);
};

startBot();