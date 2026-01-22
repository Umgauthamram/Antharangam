import { apiKeys } from './db.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

const SALT_ROUNDS = 10;

/**
 * Generates a new API Key.
 * Format: sk_live_<keyId>_<randomHex>
 * Returns: { key: "plain_text_key", keyParams: { ...toSaveInDb } }
 */
export const generateApiKey = async (name, ownerId, expiresInDays = null, quota = null) => {
    // 1. Generate a unique ID for the key (16 chars hex)
    const keyId = crypto.randomBytes(8).toString('hex');

    // 2. Generate the secret part (32 chars hex)
    const secret = crypto.randomBytes(16).toString('hex');

    // 3. Construct the full key
    const fullKey = `sk_live_${keyId}_${secret}`;

    // 4. Hash ONLY the full key
    const hashedKey = await bcrypt.hash(fullKey, SALT_ROUNDS);

    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(expiresInDays));
        expiresAt = date;
    }

    const keyData = {
        keyId: keyId, // Publicly indexable ID
        name,
        prefix: `sk_live_${keyId}...`,
        hash: hashedKey,
        ownerId: ownerId ? new ObjectId(ownerId) : null,
        expiresAt: expiresAt,
        quota: quota ? parseInt(quota) : null,
        usage: 0, // Track usage
        createdAt: new Date(),
        lastUsed: null,
        isActive: true
    };

    return { key: fullKey, keyData };
};

export const saveApiKey = async (keyData) => {
    await apiKeys.insertOne(keyData);
    return keyData;
};

export const validateApiKey = async (extractedKey) => {
    try {
        // Expected format: sk_live_<keyId>_<secret>
        const parts = extractedKey.split('_');
        if (parts.length !== 4 || parts[0] !== 'sk' || parts[1] !== 'live') {
            return null;
        }

        const keyId = parts[2];

        // 1. Fast lookup by keyId
        const keyRecord = await apiKeys.findOne({ keyId: keyId });
        if (!keyRecord) return null;

        if (!keyRecord.isActive) return null;

        // 2. Check Expiration
        if (keyRecord.expiresAt && new Date() > new Date(keyRecord.expiresAt)) {
            // Optional: Deactivate expired key to save future checks
            // apiKeys.updateOne({ _id: keyRecord._id }, { $set: { isActive: false } });
            return null;
        }

        // 3. Secure comparison
        const match = await bcrypt.compare(extractedKey, keyRecord.hash);
        if (match) {
            // Update last used asynchronously
            apiKeys.updateOne({ _id: keyRecord._id }, {
                $set: { lastUsed: new Date() },
                $inc: { usage: 1 }
            });
            return keyRecord;
        }

        return null;
    } catch (e) {
        console.error("Key validation error", e);
        return null;
    }
};

export const listApiKeys = async (ownerId) => {
    return await apiKeys.find({ ownerId: new ObjectId(ownerId), isActive: true }).sort({ createdAt: -1 }).toArray();
};

export const revokeApiKey = async (id, ownerId) => {
    return await apiKeys.updateOne(
        { _id: new ObjectId(id), ownerId: new ObjectId(ownerId) },
        { $set: { isActive: false } }
    );
};
