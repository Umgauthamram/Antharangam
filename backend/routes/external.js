import express from 'express';
import { requireApiKey } from '../middleware/authMiddleware.js';
import { analyzePostMultimodal } from '../services/aiService.js';
import { apiKeys, posts as postsCollection } from '../services/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

/**
 * POST /api/v1/scan
 * Body: { content: string, platform?: string }
 * Returns: Analysis result
 */
router.post('/scan', requireApiKey, async (req, res) => {
    try {
        const { content, platform } = req.body;

        if (!content) {
            return res.status(400).json({ error: "Missing 'content' field." });
        }

        // Run Local Analysis
        const analysis = await analyzePostMultimodal({ content, id: 'api-request' });

        // Return result
        res.json({
            meta: {
                scanned_at: new Date(),
                platform: platform || 'unknown',
                api_key_prefix: req.apiKey.prefix
            },
            analysis: {
                risk: analysis.risk,
                score: analysis.risk_score,
                sentiment: analysis.sentiment,
                flags: analysis.risk_flags,
                entities: analysis.ner_entities,
                financial: {
                    phones: analysis.extracted_phones,
                    upis: analysis.extracted_upis
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Scan failed." });
    }
});

/**
 * GET /api/v1/keys/me
 * Returns information about the current key owner
 */
router.get('/keys/me', requireApiKey, (req, res) => {
    res.json({
        key_id: req.apiKey.keyId,
        owner_id: req.apiKey.ownerId,
        created_at: req.apiKey.createdAt,
        name: req.apiKey.name
    });
});

export default router;
