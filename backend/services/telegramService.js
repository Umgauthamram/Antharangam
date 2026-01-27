import dotenv from "dotenv";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram/tl/index.js";

dotenv.config(); //   MUST be first

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

let client = null;
let connectingPromise = null;

export async function connectTelegram() {
    if (client && client.connected) return client;
    if (connectingPromise) return connectingPromise;

    connectingPromise = (async () => {
        try {
            const session = process.env.TELEGRAM_SESSION || process.env["TELEGRAM_SESSION "];

            if (!session) {
                console.error("[TelegramAPI]     TELEGRAM_SESSION is missing (Checked standard and 'TELEGRAM_SESSION ' with space)");
                throw new Error("TELEGRAM_SESSION is missing in .env");
            }

            console.log("[TelegramAPI] Attempting connection via API...");
            const stringSession = new StringSession(session.trim());

            const newClient = new TelegramClient(
                stringSession,
                apiId,
                apiHash,
                {
                    connectionRetries: 5,
                    useWSS: true,
                    deviceModel: "Antharangam Server",
                    systemVersion: "Windows 10",
                    appVersion: "1.0.0"
                }
            );

            await newClient.connect();
            console.log("[TelegramAPI]   Connected successfully!");
            client = newClient;
            return client;
        } catch (err) {
            console.error("[TelegramAPI]     Connection failed:", err.message);
            connectingPromise = null; // Reset to allow retry
            throw err;
        } finally {
            connectingPromise = null;
        }
    })();

    return connectingPromise;
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
export async function searchGlobalMessages(keyword, limit = 100) {
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

    const discoveredChannels = [];
    result.chats.forEach(c => {
        if (c.className === "Channel" || c.className === "Chat") {
            discoveredChannels.push({
                id: c.id,
                title: c.title,
                username: c.username,
                url: c.username ? `https://t.me/${c.username}` : null
            });
        }
    });

    const messages = result.messages.map(msg => {
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
    }).filter(m => m.text);

    return { messages, discoveredChannels };
}
