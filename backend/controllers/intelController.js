import { projects as projectsCollection } from '../services/db.js';
import { ObjectId } from 'mongodb';

// POST /api/intel/flag/:id
export const toggleFlag = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || 'officer'; // Fallback

    try {
        const db = projectsCollection.db;
        const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });

        if (!post) return res.status(404).json({ error: "Post not found" });

        // Toggle logic
        const newStatus = !post.isManuallyFlagged;

        await db.collection('posts').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    isManuallyFlagged: newStatus,
                    flaggedBy: newStatus ? userId : null,
                    flaggedAt: newStatus ? new Date() : null
                }
            }
        );

        res.json({
            message: newStatus ? "Post flagged as suspicious" : "Flag removed",
            isManuallyFlagged: newStatus
        });

    } catch (e) {
        console.error("Flag toggle failed:", e);
        res.status(500).json({ error: "Failed to toggle flag" });
    }
};

// GET /api/intel/stats
export const getIntelStats = async (req, res) => {
    try {
        const db = projectsCollection.db;
        const posts = db.collection('posts');

        // 1. Current Snapshot Counts
        const systemFlaggedCount = await posts.countDocuments({ risk: { $in: ['High', 'Critical'] } });
        const manualFlaggedCount = await posts.countDocuments({ isManuallyFlagged: true });

        // 2. Trend Data (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trendAggregation = await posts.aggregate([
            { $match: { timestamp: { $gte: sevenDaysAgo } } },
            {
                $project: {
                    dateStr: { $substr: ["$timestamp", 0, 10] }, // YYYY-MM-DD
                    isSystemHigh: { $in: ["$risk", ["High", "Critical"]] },
                    isManual: "$isManuallyFlagged"
                }
            },
            {
                $group: {
                    _id: "$dateStr",
                    system: { $sum: { $cond: ["$isSystemHigh", 1, 0] } },
                    manual: { $sum: { $cond: ["$isManual", 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        // Fill missing days with 0
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = trendAggregation.find(t => t._id.startsWith(dateStr)) || { system: 0, manual: 0 };
            trendData.push({ date: dateStr, system: dayData.system, manual: dayData.manual });
        }

        // 3. Platform Distribution (for flagged items only)
        const platformDistribution = await posts.aggregate([
            { $match: { $or: [{ risk: { $in: ['High', 'Critical'] } }, { isManuallyFlagged: true }] } },
            { $group: { _id: "$platform", count: { $sum: 1 } } }
        ]).toArray();

        res.json({
            counts: { system: systemFlaggedCount, manual: manualFlaggedCount },
            trends: trendData,
            distribution: platformDistribution.map(p => ({ platform: p._id || 'Unknown', count: p.count }))
        });

    } catch (e) {
        console.error("Intel stats failed:", e);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};

// GET /api/intel/feed
export const getIntelFeed = async (req, res) => {
    const { type } = req.query; // 'system' or 'manual'

    try {
        const db = projectsCollection.db;
        let query = {};

        if (type === 'manual') {
            query = { isManuallyFlagged: true };
        } else {
            // System: High/Critical risks that are NOT manually flagged (to avoid dupes in UI logic if needed, or just all)
            // Let's just return all High/Critical
            query = { risk: { $in: ['High', 'Critical'] } };
        }

        const posts = await db.collection('posts')
            .find(query)
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        res.json(posts.map(p => ({
            ...p,
            id: p._id,
            timestamp: new Date(p.timestamp).toLocaleString()
        })));

    } catch (e) {
        console.error("Intel feed failed:", e);
        res.status(500).json({ error: "Failed to fetch feed" });
    }
};
