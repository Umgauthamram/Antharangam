import { projects as projectsCollection, posts as postsCollection } from '../services/db.js';
import { ObjectId } from 'mongodb';

// POST /api/intel/flag/:id
export const toggleFlag = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || 'officer'; // Fallback

    try {
        const post = await postsCollection.findOne({ _id: new ObjectId(id) });

        if (!post) return res.status(404).json({ error: "Post not found" });

        // Toggle logic
        const newStatus = !post.isManuallyFlagged;

        await postsCollection.updateOne(
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

const parseDate = (str) => {
    if (!str) return new Date(0);
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;

    // Handle DD/MM/YYYY
    const parts = str.split(/[/-]/);
    if (parts.length === 3) {
        // Assume DD/MM/YYYY if first part is < 31
        if (parseInt(parts[0]) <= 31) {
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
    }
    return d;
};

// GET /api/intel/stats
export const getIntelStats = async (req, res) => {
    const { platform, search, risk } = req.query;

    try {
        const posts = postsCollection;

        // Build base filters
        const filters = [];
        if (platform) {
            if (platform.includes(',')) filters.push({ platform: { $in: platform.split(',') } });
            else filters.push({ platform: platform });
        }

        if (search) {
            filters.push({
                $or: [
                    { content: { $regex: search, $options: 'i' } },
                    { author: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (risk === 'high') {
            filters.push({ risk: { $in: ['High', 'Critical'] } });
        }

        const baseFilter = filters.length > 0 ? { $and: filters } : {};

        // console.log("[DEBUG-STATS] platform:", platform, "search:", search, "risk:", risk);
        // console.log("[DEBUG-STATS] baseFilter:", JSON.stringify(baseFilter));

        const systemFilter = filters.length > 0
            ? { $and: [...filters, { risk: { $in: ['High', 'Critical'] } }] }
            : { risk: { $in: ['High', 'Critical'] } };

        const manualFilter = filters.length > 0
            ? { $and: [...filters, { isManuallyFlagged: true }] }
            : { isManuallyFlagged: true };

        // 1. Current Snapshot Counts
        const systemFlaggedCount = await posts.countDocuments(systemFilter);
        const manualFlaggedCount = await posts.countDocuments(manualFilter);

        // 2. Trend Data (Last 7 Days) - Calculate in-memory for resilience against mixed formats
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch all matching posts from last 7 days to process in JS
        const latestPosts = await posts.find({
            ...baseFilter,
            timestamp: { $exists: true }
        }).toArray();

        // Group by date in JS
        const trendMap = {};
        latestPosts.forEach(p => {
            const d = parseDate(p.timestamp);
            if (isNaN(d.getTime())) return;
            if (d < sevenDaysAgo) return;

            const dateStr = d.toISOString().split('T')[0];
            if (!trendMap[dateStr]) trendMap[dateStr] = { system: 0, manual: 0 };

            if (p.isManuallyFlagged) trendMap[dateStr].manual++;
            else if (['High', 'Critical'].includes(p.risk)) trendMap[dateStr].system++;
        });

        // Fill missing days with 0
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = trendMap[dateStr] || { system: 0, manual: 0 };
            trendData.push({ date: dateStr, system: dayData.system, manual: dayData.manual });
        }

        // 3. Platform Distribution
        const platformDistribution = await posts.aggregate([
            {
                $match: filters.length > 0
                    ? { $and: [...filters, { $or: [{ risk: { $in: ['High', 'Critical'] } }, { isManuallyFlagged: true }] }] }
                    : { $or: [{ risk: { $in: ['High', 'Critical'] } }, { isManuallyFlagged: true }] }
            },
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
    const { type, platform, search, risk } = req.query; // 'system' or 'manual'

    try {
        const filters = [];

        if (platform) {
            if (platform.includes(',')) filters.push({ platform: { $in: platform.split(',') } });
            else filters.push({ platform: platform });
        }

        // Apply API Key Scope if present
        if (req.apiKey && req.apiKey.allowedPlatforms && !req.apiKey.allowedPlatforms.includes('all')) {
            const allowed = req.apiKey.allowedPlatforms;
            // If user requested specific platforms, intersect them
            if (platform) {
                // If the requested platform is NOT in allowed, we effectively return nothing or intersection
                // But simplified: Add an AND clause that platform MUST be in allowed
                filters.push({ platform: { $in: allowed } });
            } else {
                // If no platform requested, restrict to allowed
                filters.push({ platform: { $in: allowed } });
            }
        }

        if (search) {
            filters.push({
                $or: [
                    { content: { $regex: search, $options: 'i' } },
                    { author: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (risk === 'high') {
            filters.push({ risk: { $in: ['High', 'Critical'] } });
        }

        if (type === 'manual') {
            filters.push({ isManuallyFlagged: true });
        } else {
            filters.push({ risk: { $in: ['High', 'Critical'] } });
        }

        const query = filters.length > 1 ? { $and: filters } : (filters[0] || {});

        // console.log("[DEBUG-FEED] type:", type, "platform:", platform, "search:", search);
        // console.log("[DEBUG-FEED] query:", JSON.stringify(query));

        const posts = await postsCollection
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
