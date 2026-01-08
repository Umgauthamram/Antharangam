
import { runUniversalScraper, closeActiveBrowser } from './harvester.js';
import { projects as projectsCollection } from './db.js';
import { addEnrichmentJob } from './queueService.js';

const activeJobs = new Map();
const DEFAULT_INTERVAL = 10 * 60 * 1000;

const executeScrapeAndEnrich = async (id, query, sourceTag, platform = 'twitter', abortSignal) => {
    console.log(`[HarvesterManager] Starting scrape job for '${id}'...`);

    try {
        const handleBatch = async (postsBatch) => {
            console.log(`[HarvesterManager] ⚡ Sending batch of ${postsBatch.length} posts...`);

            const queuePromises = postsBatch.map(post => {
                return addEnrichmentJob({
                    id: post.twitterPostId,
                    content: post.content,
                    platform: platform,
                    source: sourceTag,
                    screenshotPath: post.screenshotPath
                });
            });
            await Promise.allSettled(queuePromises);

            await projectsCollection.updateOne(
                { projectId: id },
                { $inc: { postCount: postsBatch.length } }
            );
        };

        await runUniversalScraper(platform, query, 100, sourceTag, handleBatch, abortSignal);

    } catch (error) {
        console.error(`[HarvesterManager] Error executing scrape for '${id}':`, error);
    }
};

export async function startHarvester(id, name, keywords, platform = 'twitter') {
    const jobKey = `${id}-${platform}`;


    if (activeJobs.has(jobKey)) {
        console.log(`[HarvesterManager] Job '${jobKey}' is already running.`);
        return;
    }

    const query = Array.isArray(keywords) ? keywords.join(' OR ') : keywords;
    const sourceTag = `harvester-${id}`;

    console.log(`[HarvesterManager] Starting NEW job interval for: ${name} on ${platform}`);

    await projectsCollection.updateOne(
        { projectId: id },
        { $set: { status: "Running", keyword: query } },
        { upsert: true }
    );

    const controller = new AbortController();

    const job = () => executeScrapeAndEnrich(id, query, sourceTag, platform, controller.signal);

    // Run immediately
    executeScrapeAndEnrich(id, query, sourceTag, platform, controller.signal);

    const intervalId = setInterval(job, DEFAULT_INTERVAL);

    activeJobs.set(jobKey, { intervalId, controller });
}

export async function stopHarvester(id, platform = null) {
    let stoppedCount = 0;

    if (platform) {
        // Stop specific platform
        const jobKey = `${id}-${platform}`;
        if (activeJobs.has(jobKey)) {
            const { intervalId, controller } = activeJobs.get(jobKey);
            clearInterval(intervalId);
            controller.abort(); // Signal cancellation to running scraper
            activeJobs.delete(jobKey);
            console.log(`[HarvesterManager] Stopped schedule for '${jobKey}'.`);
            stoppedCount++;
        }
    } else {
        // Stop ALL for this project
        for (const [key, { intervalId, controller }] of activeJobs.entries()) {
            if (key.startsWith(`${id}-`)) {
                clearInterval(intervalId);
                controller.abort(); // Signal cancellation
                activeJobs.delete(key);
                stoppedCount++;
            }
        }
        console.log(`[HarvesterManager] Stopped ${stoppedCount} schedules for '${id}' (ALL).`);
    }

    if (stoppedCount === 0) {
        console.log(`[HarvesterManager] No active schedules found to stop for '${id}' ${platform ? `(${platform})` : ''}.`);
    }


    // Close active browser calls are now handled internally by runUniversalScraper per job.
    // We rely on the job finishing naturally or the interval being cleared preventing new runs.

    let remainingJobs = 0;
    for (const key of activeJobs.keys()) {
        if (key.startsWith(`${id}-`)) remainingJobs++;
    }

    if (remainingJobs === 0) {
        try {
            await projectsCollection.updateOne(
                { projectId: id },
                { $set: { status: "Stopped", endDate: new Date() } }
            );
        } catch (dbError) {
            console.error(`[HarvesterManager] Failed to update DB status:`, dbError);
        }
    }
}
export async function initializeHarvesters() {
    console.log('[HarvesterManager] Initializing active harvesters...');
    const activeProjects = await projectsCollection.find({ type: "Automated", status: "Running" }).toArray();

    for (const project of activeProjects) {
        if (project.sources && Array.isArray(project.sources)) {
            const keywordsArray = typeof project.keyword === 'string' ? project.keyword.split(' OR ') : project.keyword;

            for (const source of project.sources) {
                if (source.status === 'Active') {
                    const platform = source.platformKey || source.id;
                    console.log(`[HarvesterInit] Starting ${platform} for ${project.name}`);
                    startHarvester(project.projectId, project.name, keywordsArray, platform);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log(`[HarvesterManager] Initialization complete.`);
}