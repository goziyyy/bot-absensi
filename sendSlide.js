const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

const fs = require('fs');

const botname = "Gita";
const ownername = "Gozi";
const prefix = "!"; 

const sendMessagesToNumbers = async (numbers, message) => {
    for (const number of numbers) {
        await sock.sendMessage(number, { text: message });
    }
};


const handleButtonPress = async (buttonData) => {
    const { action, numbers } = JSON.parse(buttonData);
    if (action === 'send_message') {
        await sendMessagesToNumbers(numbers, 'Your custom message here');
    }
};


const generateButton = (textCommand, command, buttonType, url) => {
    let buttonParamsJson = {};
    switch (buttonType) {
        case "cta_url":
            buttonParamsJson = {
                display_text: textCommand,
                url: url,
                merchant_url: url,
            };
            break;
        case "cta_call":
            buttonParamsJson = { display_text: textCommand, id: command };
            break;
        case "cta_copy":
            buttonParamsJson = {
                display_text: textCommand,
                id: "",
                copy_code: command,
            };
            break;
        case "cta_reminder":
        case "cta_cancel_reminder":
        case "address_message":
            buttonParamsJson = { display_text: textCommand, id: command };
            break;
        case "send_location":
            buttonParamsJson = {};
            break;
        case "quick_reply":
            buttonParamsJson = { display_text: textCommand, id: command };
            break;
        default:
            throw new Error(`Unsupported button type: ${buttonType}`);
    }
    return JSON.stringify(buttonParamsJson);
};



const sendSlideWithButtons = async (XeonBotInc, jid, title, message, footer, slides, sender, ownername) => {
    const cards = await Promise.all(slides.map(async slide => {
        const [
            image,
            titMess,
            boMessage,
            fooMess,
            textCommand,
            command,
            buttonType,
            url,
        ] = slide;

        const imageBuffer = fs.readFileSync(image);

        const buttonParamsJsonString = generateButton(textCommand, command, buttonType, url);

        const header = image ? 
            {
                title: titMess,
                hasMediaAttachment: true,
                ...(await prepareWAMessageMedia(
                    { image: imageBuffer },
                    { upload: XeonBotInc.waUploadToServer },
                )),
            } :
            {
                title: titMess,
                hasMediaAttachment: false,
            };

        return {
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: boMessage,
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: fooMess,
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject(header),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                    {
                        "name": "single_select",
                        "buttonParamsJson":
                            `{"title":"MENU 🌺",
                            "sections":[{"title":"${ownername}",
                            "highlight_label":"Ketua's Favourite",
                            "rows":[{"header":"Absen Reminder",
                            "title":"Absensi PKL",
                            "description":"Bangunin orang ini buat PKL!",
                            "id":"${prefix}absen"}]
                            }]
                            }`
                    },
                ],
            }),
        };
    }));

    const msg = generateWAMessageFromContent(
        jid,
        {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: message,
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: footer,
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: title,
                            subtitle: title,
                            hasMediaAttachment: false,
                        }),
                        carouselMessage:
                            proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                cards: cards,
                            }),
                            contextInfo: {
                   mentionedJid: [sender], 
                   forwardingScore: 999,
                   isForwarded: true,
                 forwardedNewsletterMessageInfo: {
                   newsletterJid: '@newsletter',
                   newsletterName: ownername,
                   serverMessageId: 143
                 }
                 }
                    }),
                },
            },
        },
        {}
    );

    await XeonBotInc.relayMessage(jid, msg.message, {
        messageId: msg.key.id,
    });
};


module.exports = { sendSlideWithButtons };
