import dotenv from "dotenv";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram/tl/index.js";

dotenv.config(); // ✅ MUST be first

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

let client = null;

export async function connectTelegram() {
    if (client) return client;

    if (!process.env.TELEGRAM_SESSION) {
        throw new Error("❌ TELEGRAM_SESSION is missing in .env");
    }

    console.log("[TelegramAPI] Connecting...");

    const stringSession = new StringSession(process.env.TELEGRAM_SESSION);

    client = new TelegramClient(
        stringSession,
        apiId,
        apiHash,
        {
            connectionRetries: 5,
            useWSS: true,
            testServers: false,
            deviceModel: "Desktop",
            systemVersion: "Windows 10",
            appVersion: "1.0.0"
        }
    );

    await client.connect();

    console.log("[TelegramAPI] Connected!");
    return client;
}

export async function searchGlobal(keyword, limit = 5) {
    const client = await connectTelegram();

    const result = await client.invoke(
        new Api.contacts.Search({
            q: keyword,
            limit
        })
    );

    const channels = result.chats.filter(
        c => c.className === "Channel" && !c.left
    );

    return channels.map(c => ({
        id: c.id,
        title: c.title,
        username: c.username,
        url: c.username ? `https://t.me/${c.username}` : null
    }));
}

// 📥 Harvest Messages
export async function harvestMessages(channelUsername, limit = 20) {
    const client = await connectTelegram();

    const messages = await client.getMessages(channelUsername, {
        limit
    });

    return messages.map(msg => ({
        id: msg.id,
        text: msg.message,
        date: msg.date,
        views: msg.views,
        url: `https://t.me/${channelUsername}/${msg.id}`
    }));
}
// 🌍 Global Message Search (The "Data" finder)
export async function searchGlobalMessages(keyword, limit = 50) {
    const client = await connectTelegram();

    const result = await client.invoke(
        new Api.messages.SearchGlobal({
            q: keyword,
            filter: new Api.InputMessagesFilterEmpty(),
            minDate: 0,
            maxDate: 0,
            offsetRate: 0,
            offsetPeer: new Api.InputPeerEmpty(),
            offsetId: 0,
            limit: limit
        })
    );

    // Create a map of ID -> Chat/User for resolution
    const chatMap = new Map();
    result.chats.forEach(c => chatMap.set(c.id.toString(), c));
    result.users.forEach(u => chatMap.set(u.id.toString(), u));

    return result.messages.map(msg => {
        let authorName = "Unknown";
        let username = null;
        let peerId = null;

        if (msg.peerId) {
            if (msg.peerId.channelId) peerId = msg.peerId.channelId.toString();
            else if (msg.peerId.userId) peerId = msg.peerId.userId.toString();
            else if (msg.peerId.chatId) peerId = msg.peerId.chatId.toString();
        }

        const chat = chatMap.get(peerId);
        if (chat) {
            authorName = chat.title || chat.username || chat.firstName || "Unknown";
            username = chat.username;
        }

        // Construct URL if public username exists
        const url = username ? `https://t.me/${username}/${msg.id}` : null;

        return {
            id: msg.id,
            text: msg.message,
            date: msg.date,
            views: msg.views || 0,
            url: url,
            author: authorName,
            username: username
        };
    }).filter(m => m.text); // Filter empty messages
}
