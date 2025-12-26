import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const TARGET_ID = "1999767508329656344"; 

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function huntForPost() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Cluster.");
        
        const admin = client.db().admin();
        const { databases } = await admin.listDatabases();
        
        console.log("\n🔎 Hunting for Post ID:", TARGET_ID);
        
        for (const dbInfo of databases) {
            const dbName = dbInfo.name;
            const db = client.db(dbName);
            
            const post = await db.collection('posts').findOne({ twitterPostId: TARGET_ID });
            
            if (post) {
                console.log(`\n🎉 FOUND IT!`);
                console.log(`✅ Database Name: "${dbName}"`);
                console.log(`✅ Collection: "posts"`);
                console.log(`-----------------------------------------------`);
                return;
            } else {
                process.stdout.write(`Checked DB '${dbName}'... ❌\n`);
            }
        }
        
        console.log("\n💀 CRITICAL: The post was NOT found in any database.");
        console.log("This means the Node.js Harvester is NOT actually saving data, despite saying it is.");

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

huntForPost();