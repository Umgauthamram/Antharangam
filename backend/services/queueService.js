import Redis from 'ioredis';
import { config } from 'dotenv';

config();

const redisConnection = new Redis({
    host: process.env.REDISHOST || '127.0.0.1',
    port: process.env.REDISPORT || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

redisConnection.on('error', (error) => {
    console.error('Redis Connection Error: Failed to connect to Redis server.', error.message);
});

export const ENRICHMENTQUEUENAME = 'forensic-enrichment-jobs';

export const addEnrichmentJob = async (postData) => {
    const postId = postData.twitterPostId || postData.id?.toHexString?.() || String(postData.id);
    if (!postId) {
        throw new Error('Post data must contain a valid ID for queueing.');
    }

    const jobPayload = {
        id: postId,
        content: postData.content,
        rawhtmlpath: postData.rawhtmlpath || null,
        screenshotpath: postData.screenshotpath || null,
        platform: postData.platform || 'unknown',
        source: postData.source
    };

    try {
        const result = await redisConnection.rpush(ENRICHMENTQUEUENAME, JSON.stringify(jobPayload));
        console.log(`Queue Service: Queued Post ${postId}. Queue Length: ${result}`);
        return { id: postId, queueLength: result };
    } catch (error) {
        console.error(`Queue Service: Failed to queue post ${postId}:`, error.message);
        throw error;
    }
};

process.on('SIGINT', async () => {
    console.log('Shutting down Redis connection...');
    await redisConnection.quit();
    process.exit(0);
});
