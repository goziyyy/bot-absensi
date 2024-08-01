const {
    proto,
    delay,
    generateWAMessage,
    areJidsSameUser,
    getContentType,
    default: downloadContentFromMessage
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const Crypto = require('crypto');
const axios = require('axios');
const child_process = require('child_process');
const moment = require('moment-timezone');
const { unlink } = require('fs').promises;
const { sizeFormatter } = require('human-readable');
const util = require('util');
const Jimp = require('jimp');
const { defaultMaxListeners } = require('stream');

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000);

const totalcase = () => {
    var file = fs.readFileSync("../XeonCheems10.js").toString();
    var jumlah = (file.match(/case '/g) || []).length;
    return jumlah;
};

const generateMessageTag = (epoch) => {
    let tag = unixTimestampSeconds().toString();
    if (epoch) tag += '.--' + epoch; // attach epoch if provided
    return tag;
};

const processTime = (timestamp, now) => {
    return moment.duration(now - moment(timestamp * 1000)).asSeconds();
};

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

const getBuffer = async (url, options) => {
    try {
        options ? options : {};
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

const fetchJson = async (url, options) => {
    try {
        options ? options : {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

const fetchBuffer = async (url, options) => {
    try {
        options ? options : {};
        const res = await axios({
            method: "GET",
            url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

const runtime = (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
};

const clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
};

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'));
};

const getTime = (format, date) => {
    if (date) {
        return moment(date).locale('id').format(format);
    } else {
        return moment.tz('Asia/Kolkata').locale('id').format(format);
    }
};

const formatDate = (n, locale = 'id') => {
    let d = new Date(n);
    return d.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
};

const formatp = sizeFormatter({
    std: 'JEDEC', //'SI' = default | 'IEC' | 'JEDEC'
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
});

const json = (string) => {
    return JSON.stringify(string, null, 2);
};

const logic = (check, inp, out) => {
    if (inp.length !== out.length) throw new Error('Input and Output must have same length');
    for (let i in inp)
        if (util.isDeepStrictEqual(check, inp[i])) return out[i];
    return null;
};

const generateProfilePicture = async (buffer) => {
    const jimp = await Jimp.read(buffer);
    const min = jimp.getWidth();
    const max = jimp.getHeight();
    const cropped = jimp.crop(0, 0, min, max);
    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
        preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
    };
};

const bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getSizeMedia = (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            axios.get(path)
                .then((res) => {
                    let length = parseInt(res.headers['content-length']);
                    let size = bytesToSize(length, 3);
                    if (!isNaN(length)) resolve(size);
                });
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path);
            let size = bytesToSize(length, 3);
            if (!isNaN(length)) resolve(size);
        } else {
            reject('I dont know what the error is');
        }
    });
};

const parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
};

const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : '';
    }
    return admins || [];
};

smsg = (XeonBotInc, m, store) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
      m.id = m.key.id;
      m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
      m.chat = m.key.Jidremote;
      m.fromMe = m.key.fromMe;
      m.isGroup = m.chat.endsWith('@g.us');
      m.sender = XeonBotInc.decodeJid(m.fromMe && XeonBotInc.user.id || m.participant || m.key.participant || m.chat || '');
      if (m.isGroup) m.participant = XeonBotInc.decodeJid(m.key.participant) || '';
    }
    if (m.message) {
      m.mtype = getContentType(m.message);
      m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]);
      m.body = m.message.conversation || m.msg.caption || m.msg.selectedId || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text;
      let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
      m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
      if (m.quoted) {
        let type = Object.keys(m.quoted)[0];
        m.quoted = m.quoted[type];
        if (['productMessage'].includes(type)) {
          type = Object.keys(m.quoted)[0];
          m.quoted = m.quoted[type];
        }
        if (typeof m.quoted === 'string') m.quoted = {
          text: m.quoted
        };
        m.quoted.mtype = type;
        m.quoted.id = m.msg.contextInfo.stanzaId;
        m.quoted.chat = m.msg.contextInfo.Jidremote || m.chat;
        m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
        m.quoted.sender = XeonBotInc.decodeJid(m.msg.contextInfo.participant);
        m.quoted.fromMe = m.quoted.sender === XeonBotInc.decodeJid(XeonBotInc.user.id);
        m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
        m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        m.getQuotedObj = m.getQuotedMessage = async () => {
          if (!m.quoted.id) return false;
          let q = await store.loadMessage(m.chat, m.quoted.id, conn);
          return exports.smsg(conn, q, store);
        };
        let vM = m.quoted.fakeObj = M.fromObject({
          key: {
            Jidremote: m.quoted.chat,
            fromMe: m.quoted.fromMe,
            id: m.quoted.id
          },
          message: quoted,
          ...(m.isGroup ? {
            participant: m.quoted.sender
          } : {})
        });
        m.quoted.delete = () => XeonBotInc.sendMessage(m.quoted.chat, {
          delete: vM.key
        });
        m.quoted.copyNForward = (jid, forceForward = false, options = {}) => XeonBotInc.copyNForward(jid, vM, forceForward, options);
        m.quoted.download = () => XeonBotInc.downloadMediaMessage(m.quoted);
      }
    }
    if (m.msg.url) m.download = () => XeonBotInc.downloadMediaMessage(m.msg);
    m.text = m.msg.text || m.msg.caption || m.message.conversation  || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || m.msg.selectedId || '';
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? XeonBotInc.sendMedia(chatId, text, 'file', '', m, {
      ...options
    }) : XeonBotInc.sendText(chatId, text, m, {
      ...options
    });
    m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => XeonBotInc.copyNForward(jid, m, forceForward, options);
    XeonBotInc.appenTextMessage = async (text, chatUpdate) => {
      let messages = await generateWAMessage(m.chat, {
        text: text,
        mentions: m.mentionedJid
      }, {
        userJid: XeonBotInc.user.id,
        quoted: m.quoted && m.quoted.fakeObj
      });
      messages.key.fromMe = areJidsSameUser(m.sender, XeonBotInc.user.id);
      messages.key.id = m.key.id;
      messages.pushName = m.pushName;
      if (m.isGroup) messages.participant = m.sender;
      let msg = {
        ...chatUpdate,
        messages: [proto.WebMessageInfo.fromObject(messages)],
        type: 'append'
      };
      XeonBotInc.ev.emit('messages.upsert', msg);
    };
    return m;
};

const serialize = (XeonBotInc, m) => smsg(XeonBotInc, m);

module.exports = {
    unixTimestampSeconds,
    totalcase,
    generateMessageTag,
    processTime,
    getRandom,
    getBuffer,
    fetchJson,
    fetchBuffer,
    runtime,
    clockString,
    sleep,
    isUrl,
    getTime,
    formatDate,
    formatp,
    json,
    logic,
    generateProfilePicture,
    bytesToSize,
    getSizeMedia,
    parseMention,
    getGroupAdmins,
    smsg,
    serialize
};
