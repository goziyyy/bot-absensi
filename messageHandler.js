const { getContentType } = require('@whiskeysockets/baileys');

// Function to handle incoming messages
async function handleIncomingMessage(bot, message) {
    const messageType = getContentType(message.message);
    const fromMe = message.key.fromMe;
    const sender = fromMe ? message.key.remoteJid : (message.key.participant || message.key.remoteJid);
    const prefix = "!";

    if (messageType === 'conversation') {
        const text = message.message.conversation;
        console.log(`Received message: ${text}`);

        if (text.startsWith(prefix)) {
            const isCommand = text.slice(prefix.length).trim().split(' ')[0].toLowerCase();
            switch (isCommand) {
                case 'subscribe':
                    // Handle the subscribe command
                    await bot.sendMessage(message.key.remoteJid, { text: 'Thanks for subscribing!' }, { quoted: message });
                    break;
                case 'joinTelegram':
                    // Handle the joinTelegram command
                    await bot.sendMessage(message.key.remoteJid, { text: 'Thanks for joining our Telegram channel!' }, { quoted: message });
                    break;
                // Add more cases for other commands
                default:
                    await bot.sendMessage(message.key.remoteJid, { text: 'Unknown command.' }, { quoted: message });
            }
        }
    } else if (messageType === 'extendedTextMessage') {
        const text = message.message.extendedTextMessage.text;
        const quoted = message.message.extendedTextMessage.contextInfo?.quotedMessage;
        console.log(`Received extended message: ${text}`);

        if (text.startsWith(prefix)) {
            const isCommand = text.slice(prefix.length).trim().split(' ')[0].toLowerCase();
            switch (isCommand) {
                case 'subscribe':
                    // Handle the subscribe command
                    await bot.sendMessage(message.key.remoteJid, { text: 'Thanks for subscribing!' }, { quoted: message });
                    break;
                case 'joinTelegram':
                    // Handle the joinTelegram command
                    await bot.sendMessage(message.key.remoteJid, { text: 'Thanks for joining our Telegram channel!' }, { quoted: message });
                    break;
                // Add more cases for other commands
                default:
                    await bot.sendMessage(message.key.remoteJid, { text: 'Unknown command.' }, { quoted: message });
            }
        }
    } else {
        console.log(`Received message of type: ${messageType}`);
    }
}

// Export the function for use in other parts of the project
module.exports = handleIncomingMessage;