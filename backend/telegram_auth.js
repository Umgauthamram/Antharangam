import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import dotenv from "dotenv";

dotenv.config();

const apiId = Number(process.env.TELEGRAM_API_ID || 27694939);
const apiHash = process.env.TELEGRAM_API_HASH || "dbf97022026850a58276dfe6539bf461";

async function main() {
    console.log("Loading interactive Telegram login...");

    const client = new TelegramClient(
        new StringSession(""),
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

    await client.start({
        phoneNumber: async () =>
            await input.text("📱 Enter your phone number (e.g. +91...): "),
        password: async () =>
            await input.text("🔐 Enter your 2FA password (if enabled): "),
        phoneCode: async () =>
            await input.text("📩 Enter the OTP you received: "),
        onError: (err) => console.error(err),
    });

    console.log("\n  Telegram login successful!");
    console.log("🔑 Save this session string in your .env file as TELEGRAM_SESSION:\n");
    console.log(client.session.save());

    await client.disconnect();
    process.exit(0);
}

main();
