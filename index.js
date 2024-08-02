const pkg = require('@whiskeysockets/baileys');
const { proto, generateWAMessageFromContent, generateWAMessageContent } = pkg;


// Placeholder: Initialize `sock` properly
// This is an example, make sure to replace it with actual initialization code
const sock = {
    waUploadToServer: async (file) => {
        // Example upload function
        return {
            mediaUrl: 'https://example.com/uploadedfile.jpg', // Example URL
        };
    },
    relayMessage: async (jid, message, options) => {
        // Example relay function
        console.log(`Relaying message to ${jid}:`, message);
    },
};

const generate = async (type, url) => {
    const generated = await generateWAMessageContent({
        [type]: { url }
    }, {
        upload: sock.waUploadToServer
    });
    return generated[`${type}Message`];
};

const sendMessage = async () => {
    const imageMessage = await generate("image", "./namee/MUHAMMAD HILMY AL MUSTAFIDH_XISMKPPLG3.jpg");

    const msg = generateWAMessageFromContent(m.key.remoteJid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: "body text (optional)"
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                        text: "footer text (optional)"
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        title: "some title",
                        hasMediaAttachment: true, // false if you don't want to send media with it
                        imageMessage: imageMessage,
                        // videoMessage: await generate("video", "url/path to video"), // if it's a video
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [{
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "button 1", // <-- displayed text
                                id: ".menu" // <-- this is the id or you may call it command 🤷‍♂️
                            }) // REMEMBER TO USE "JSON.stringify()" BECAUSE "buttonParamsJson" ONLY ACCEPTS STRING JSON, NOT AN OBJECT
                        },{
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "subscribe my Youtube!",
                                url: "https://youtube.com/@fannmods",
                                merchant_url: "https://youtube.com"
                            })
                        }]
                    })
                })
            }
        }
    }, {});

    await sock.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
    });
};

// Placeholder: Define `m` properly
// Replace this with the actual definition of `m`
const m = {
    key: {
        remoteJid: 'example_jid',
        id: 'example_id'
    }
};

// Make sure to call the async function
sendMessage().catch(console.error);
