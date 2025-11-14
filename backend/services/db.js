import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const client = new MongoClient(uri);
let db;

try {
  await client.connect();
  db = client.db(dbName);
  console.log(`[Database] Successfully connected to MongoDB at ${uri}`);
} catch (e) {
  console.error("[Database] Could not connect to MongoDB", e);
  process.exit(1);
}

export const posts = db.collection('posts');
export const cases = db.collection('cases');
export const projects = db.collection('projects');