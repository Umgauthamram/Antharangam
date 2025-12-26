//This new controller receives the payload from your JavaScript scraper and immediately pushes it to Redis.

import { addEnrichmentJob } from '../services/queueService.js';

export const ingestRawPost = async (req, res) => {
    const rawPostData = req.body; 

    if (!rawPostData || !rawPostData.id) {
        return res.status(400).json({ error: "Missing required post data." });
    }

    try {
        // Push the job to the Redis queue for the Python worker to pick up
        const job = await addEnrichmentJob(rawPostData); 

        res.status(202).json({ 
            message: "Post successfully queued for enrichment.", 
            jobId: job.id 
        });

    } catch (error) {
        console.error("[Ingestion] Failed to add job to queue:", error);
        res.status(500).json({ error: "Failed to queue post for processing." });
    }
};