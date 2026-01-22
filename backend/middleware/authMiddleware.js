import { validateApiKey } from '../services/apiKeyService.js';

export const requireApiKey = async (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'];

    if (!authHeader) {
        return res.status(401).json({ error: "Missing API Key. Provide 'x-api-key' header or Bearer token." });
    }

    let token = authHeader;
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    const keyRecord = await validateApiKey(token);

    if (!keyRecord) {
        return res.status(403).json({ error: "Invalid or inactive API Key." });
    }

    // Attach key info to request for downstream usage
    req.apiKey = keyRecord;
    next();
};
