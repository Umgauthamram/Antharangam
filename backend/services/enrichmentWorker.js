import Redis from 'ioredis';
import { posts as postsCollection } from './db.js';
import { analyzePostMultimodal } from './aiService.js';
import 'dotenv/config';

const ENRICHMENT_QUEUE_NAME = 'forensic-enrichment-jobs';
const REDIS_HOST = process.env.REDISHOST || '127.0.0.1';
const REDIS_PORT = process.env.REDISPORT || 6379;

let redisConnection = null;

export function startWorker() {
    if (redisConnection) {
        console.log('[EnrichmentWorker] Worker already running.');
        return;
    }

    console.log(`[EnrichmentWorker] Starting Node.js Worker (Gemini Powered) on ${ENRICHMENT_QUEUE_NAME}...`);

    redisConnection = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        maxRetriesPerRequest: null
    });

    redisConnection.on('error', (err) => console.error('[EnrichmentWorker] Redis Error:', err));

    processQueue();
}

async function processQueue() {
    while (true) {
        try {
            // Blocking pop: waits until a job is available
            const result = await redisConnection.blpop(ENRICHMENT_QUEUE_NAME, 0);

            if (result && result.length === 2) {
                const jobDataStr = result[1];
                try {
                    const jobData = JSON.parse(jobDataStr);
                    await handleJob(jobData);
                } catch (parseError) {
                    console.error('[EnrichmentWorker] Failed to parse job JSON:', parseError);
                }
            }

            // Rate Limit Throttling for Free Tier (Max ~15 RPM)
            // Increased to 10s to be extremely safe given persistent 429s
            await new Promise(resolve => setTimeout(resolve, 10000));

        } catch (error) {
            console.error('[EnrichmentWorker] Queue processing error:', error);
            // Wait a bit before retrying to avoid tight loops on connection errors
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function handleJob(jobData) {
    const start = Date.now();
    const { id } = jobData;

    // console.log(`[EnrichmentWorker] ⚡ Processing Post: ${id}`);

    try {
        // 1. Analyze with Gemini (Multimodal)
        const analysisResult = await analyzePostMultimodal(jobData);

        // 2. Prepare update payload
        const enrichedData = {
            risk_source: "Gemini AI (Node.js)",
            ner_entities: analysisResult.ner_entities || [],
            extracted_phones: analysisResult.extracted_phones || [],
            extracted_upis: analysisResult.extracted_upis || [],
            risk_flags: analysisResult.risk_flags || [],
            risk_score: analysisResult.risk_score || 0,
            ocr_text: analysisResult.ocr_text || null,
            summary: analysisResult.summary || null,
            isEnriched: true,
            processing_timestamp: Date.now() / 1000
        };

        // 3. Update MongoDB
        const updateResult = await postsCollection.updateOne(
            { twitterPostId: id }, // Ensure this matches how ID is stored (string vs int)
            {
                $set: {
                    enrichmentData: enrichedData,
                    risk: analysisResult.risk,
                    sentiment: analysisResult.sentiment
                }
            }
        );

        const duration = ((Date.now() - start) / 1000).toFixed(2);
        if (updateResult.matchedCount > 0) {
            console.log(`[EnrichmentWorker] ✅ Finished Post ${id} in ${duration}s | Risk: ${analysisResult.risk}`);
        } else {
            console.warn(`[EnrichmentWorker] ⚠️ Post ${id} analyzed but not found in DB to update.`);
        }

    } catch (err) {
        console.error(`[EnrichmentWorker] ❌ Error processing post ${id}:`, err);
    }
}

