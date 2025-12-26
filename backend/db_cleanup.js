// G:\Antharangam\backend\db_cleanup.js

import { MongoClient } from 'mongodb';
import 'dotenv/config'; 

// Use the same MONGO_URI as in your .env
const uri = process.env.MONGO_URI; 
const client = new MongoClient(uri);

async function cleanupPosts() {
    try {
        await client.connect();
        const database = client.db(process.env.DBNAME || 'antharangam');
        const postsCollection = database.collection('posts');

        console.log("Starting cleanup operation...");

        // 1. Mark ALL existing posts as ENRICHED. This tells the Python worker 
        //    to ignore them, solving the ghost job problem.
        const updateResult = await postsCollection.updateMany(
            {}, 
            { 
                $set: { 
                    isEnriched: true,
                    enrichmentStatus: "Cleaned" // Optional: gives you a marker
                } 
            }
        );

        console.log(`✅ Successfully updated ${updateResult.modifiedCount} posts to 'isEnriched: true'`);
        
    } catch (e) {
        console.error("❌ MongoDB Cleanup failed:", e);
    } finally {
        await client.close();
    }
}

cleanupPosts();