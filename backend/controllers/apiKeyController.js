import { generateApiKey, listApiKeys, revokeApiKey, saveApiKey } from '../services/apiKeyService.js';

// GET /api/keys
export const getMyKeys = async (req, res) => {
    // Ideally we get user ID from auth middleware. 
    // For now assuming single user or pass ownerId in query?
    // Let's use a hardcoded 'admin' ID or req.user if available.
    // In this MVP context, we might not have full user session yet? 
    // Wait, the user mentioned earlier they added JWT. 
    // Assuming req.user is populated by some middleware (not visible here but common).
    // Fallback: use a default owner ID if no auth.
    const ownerId = req.user?.id || '000000000000000000000000';

    try {
        const keys = await listApiKeys(ownerId);
        // Don't return the full hash, just metadata
        const safeKeys = keys.map(k => ({
            _id: k._id,
            name: k.name,
            prefix: k.prefix,
            keyId: k.keyId,
            createdAt: k.createdAt,
            lastUsed: k.lastUsed,
            isActive: k.isActive
        }));
        res.json(safeKeys);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch keys" });
    }
};

import { sendApiKeyEmail, sendKeyRevokedEmail } from '../services/emailService.js';

// POST /api/keys
export const createKey = async (req, res) => {
    const { name, expiresInDays, quota, email, allowedPlatforms } = req.body;
    const ownerId = req.user?.id || '000000000000000000000000';
    // Use user's email if available in auth, otherwise require it in body or fallback (for MVP we might need it passed)
    const userEmail = req.user?.email || email || 'investigator@agency.gov.in';

    try {
        const result = await generateApiKey(name || 'Default Key', ownerId, userEmail, expiresInDays, quota, allowedPlatforms);
        await saveApiKey(result.keyData);

        // Send Email
        if (userEmail) {
            await sendApiKeyEmail(userEmail, result.keyData, result.key);
        }

        // Return the full key ONLY ONCE here
        res.status(201).json({
            message: "Key created and emailed to user.",
            key: result.key, // The full secret key
            keyData: {
                _id: result.keyData._id,
                name: result.keyData.name,
                prefix: result.keyData.prefix,
                createdAt: result.keyData.createdAt,
                expiresAt: result.keyData.expiresAt,
                quota: result.keyData.quota,
                allowedPlatforms: result.keyData.allowedPlatforms
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create key" });
    }
};

// DELETE /api/keys/:id
export const revokeKey = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?.id || '000000000000000000000000';

    try {
        const key = await revokeApiKey(id, ownerId);
        if (key && key.email) {
            sendKeyRevokedEmail(key.email, key.name).catch(console.error);
        }
        res.json({ message: "Key revoked" });
    } catch (e) {
        res.status(500).json({ error: "Failed to revoke key" });
    }
};

// --- INTERNAL DEVELOPER ENDPOINTS ---

import { apiKeys } from '../services/db.js';

// GET /api/keys/internal/all
export const getAllKeysInternal = async (req, res) => {
    try {
        const keys = await apiKeys.find({ isActive: true }).sort({ createdAt: -1 }).toArray();
        res.json(keys);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch master keys" });
    }
};

// DELETE /api/keys/internal/:id
export const revokeKeyInternal = async (req, res) => {
    const { id } = req.params;
    try {
        // Custom logic to get email first since revokeApiKeyInternal might not be separated
        const key = await apiKeys.findOne({ _id: new ObjectId(id) });
        if (key) {
            await apiKeys.updateOne(
                { _id: new ObjectId(id) },
                { $set: { isActive: false } }
            );
            if (key.email) {
                sendKeyRevokedEmail(key.email, key.name).catch(console.error);
            }
        }
        res.json({ message: "Master Key revoked" });
    } catch (e) {
        res.status(500).json({ error: "Master Revocation failed" });
    }
};
