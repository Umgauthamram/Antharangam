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

export const optionalApiKey = async (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'];

    if (!authHeader) {
        return next();
    }

    let token = authHeader;
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    const keyRecord = await validateApiKey(token);

    if (keyRecord) {
        req.apiKey = keyRecord;
    }
    // If invalid key, we could ignore or fail. 
    // Usually if someone TRIES to auth and fails, we should reject.
    // But for 'optional', maybe loose? 
    // Let's reject if provided but invalid to avoid confusion.
    else {
        return res.status(403).json({ error: "Invalid API Key provided." });
    }

    next();
};
