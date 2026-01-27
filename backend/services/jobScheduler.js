
import cron from 'node-cron';
import { initializeHarvesters } from './harvesterManager.js';
import { getExpiringKeys, markWarningSent, deactivateExpiredKeys } from './apiKeyService.js';
import { sendKeyExpiringEmail, sendKeyExpiredEmail } from './emailService.js';

export function startScheduler() {
    console.log('[JobScheduler] Starting scheduler...');

    initializeHarvesters();

    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('[JobScheduler] Running daily key expiration check...');

        // 1. Warn about expiring keys
        const { expiringSoon } = await getExpiringKeys();
        for (const key of expiringSoon) {
            if (key.email) {
                console.log(`[JobScheduler] Sending warning for key ${key.keyId}`);
                await sendKeyExpiringEmail(key.email, key.name, key.expiresAt);
                await markWarningSent(key._id);
            }
        }

        // 2. Deactivate and notify expired keys
        const expiredKeys = await deactivateExpiredKeys();
        for (const key of expiredKeys) {
            if (key.email) {
                console.log(`[JobScheduler] Sending expired notice for key ${key.keyId}`);
                await sendKeyExpiredEmail(key.email, key.name);
            }
        }
    });
}