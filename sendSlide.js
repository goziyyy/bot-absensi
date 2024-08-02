const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const fs = require('fs');

const sendSlideWithButtons = async (client, jid, title, message, footer, slides, sender, ownername) => {
    try {
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
                    break;
            }

            let imageBuffer;
            try {
                imageBuffer = fs.readFileSync(image);
            } catch (error) {
                console.error(`Error reading image file: ${image}`, error);
                throw new Error("Image not found");
            }

            const header = image ? 
                {
                    title: titMess,
                    hasMediaAttachment: true,
                    ...(await prepareWAMessageMedia(
                        { image: imageBuffer },
                        { upload: client.waUploadToServer },
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
                            name: buttonType,
                            buttonParamsJson: JSON.stringify(buttonParamsJson)
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

        await client.relayMessage(jid, msg.message, {
            messageId: msg.key.id,
        });
    } catch (error) {
        console.error('Error sending slide with buttons:', error);
    }
};

module.exports = { sendSlideWithButtons };
