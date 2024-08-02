const { generateWAMessageFromContent, proto, getContentType } = require('@whiskeysockets/baileys');

// Function to handle API request
async function handleApiRequest(bot, message, text) {
    try {
        const fetch = (await import('node-fetch')).default;
        const chat_id = message.key.remoteJid;
        let gpt = await (await fetch(`https://itzpire.com/ai/gpt-web?chat_id=${encodeURIComponent(chat_id)}&q=${encodeURIComponent(text)}`)).json();
        console.log(gpt); // Log the response to see its structure

        let botname = "Asqiya"; // Change this to your bot's name

        // Ensure the result is accessed correctly
        let resultText = gpt.result || "No result found";

        // Create a simple text message
        let textMessage = `${botname}\n\n${resultText}`;

        // Send the text message
        await bot.sendMessage(message.key.remoteJid, { text: textMessage }, { quoted: message });
    } catch (e) {
        console.error('Error calling API:', e);
        await bot.sendMessage(message.key.remoteJid, { text: '`*Error*`' }, { quoted: message });
    }
}

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
            await handleApiRequest(bot, message, text.slice(prefix.length).trim());
        }
    } else if (messageType === 'extendedTextMessage') {
        const text = message.message.extendedTextMessage.text;
        const quoted = message.message.extendedTextMessage.contextInfo?.quotedMessage;
        console.log(`Received extended message: ${text}`);
        if (text.startsWith(prefix)) {
            await handleApiRequest(bot, message, text.slice(prefix.length).trim());
        }

        if (quoted) {
            const quotedText = quoted.conversation || quoted.extendedTextMessage?.text;
            const participant = quoted.key?.fromMe ? sender : (quoted.participant || quoted.key?.participant || quoted.key?.remoteJid);
            console.log(`Quoted message: ${quotedText}`);
        } else {
            console.log('No quoted message found.');
        }
    } else {
        console.log(`Received message of type: ${messageType}`);
    }
}

// Export the function for use in other parts of the project
module.exports = handleIncomingMessage;
