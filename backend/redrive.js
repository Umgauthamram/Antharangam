
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import 'dotenv/config';

const ENRICHMENTQUEUENAME = 'forensic-enrichment-jobs';

async function redrive() {
    const mongoClient = new MongoClient(process.env.MONGO_URI || "mongodb+srv://gauthamramum_db_user:1234@cluster0.vgrmif5.mongodb.net/?appName=Cluster0");
    const redis = new Redis({
        host: process.env.REDISHOST || '127.0.0.1',
        port: process.env.REDISPORT || 6379,
    });

    try {
        await mongoClient.connect();
        console.log("Connected to Mongo.");
        const db = mongoClient.db('gauthamramum_db_user');
        const postsCollection = db.collection('posts');

        // Find posts that are missing risk analysis
        const pendingPosts = await postsCollection.find({
            $or: [
                { risk: { $exists: false } },
                { risk: null },
                { "risk_source": "RuleEngine_V1 (BullMQ)" } // Catch the 'fake' python updates too
            ]
        }).toArray();

        console.log(`Found ${pendingPosts.length} posts needing analysis/repair.`);

        for (const post of pendingPosts) {
            const payload = {
                id: post.twitterPostId,
                content: post.content,
                platform: post.platform || 'twitter',
                source: post.source
            };
            await redis.rpush(ENRICHMENTQUEUENAME, JSON.stringify(payload));
        }

        console.log(`Successfully re-queued ${pendingPosts.length} jobs.`);

    } catch (e) {
        console.error("Redrive failed:", e);
    } finally {
        await mongoClient.close();
        redis.quit();
    }
}

redrive();
