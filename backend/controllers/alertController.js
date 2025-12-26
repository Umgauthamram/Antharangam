import { posts as postsCollection } from '../services/db.js';

export const getAlerts = async (req, res) => {
  console.log("[API] Received GET /api/alerts");
  try {
    const posts = await postsCollection.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    res.json(posts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};