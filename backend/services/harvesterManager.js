// import { runTwitterScrapeJob, closeActiveBrowser } from './harvester.js';
// import { projects as projectsCollection } from './db.js';
// import { addEnrichmentJob } from './queueService.js';
// import { runUniversalScraper } from './harvester.js';

// const activeJobs = new Map();
// const DEFAULT_INTERVAL = 10 * 60 * 1000; 

// let isBrowserBusy = false;

// const executeScrapeAndEnrich = async (id, query, sourceTag) => {
//     if (isBrowserBusy) {
//         console.log(`[HarvesterManager] SKIPPING job for '${id}' - Browser is currently busy.`);
//         return; 
//     }
//     console.log(`[HarvesterManager] Starting scrape job for '${id}'...`);
    
//     isBrowserBusy = true;
    
//     try {
//         const handleBatch = async (postsBatch) => {
//             console.log(`[HarvesterManager] ⚡ Sending batch of ${postsBatch.length} posts to Queue...`);
            
//             const queuePromises = postsBatch.map(post => {
//                 return addEnrichmentJob({
//                     id: post.twitterPostId,
//                     content: post.content,
//                     platform: 'X (Twitter)',
//                     source: sourceTag
//                 });
//             });
//             await Promise.allSettled(queuePromises);

//             await projectsCollection.updateOne(
//                 { projectId: id }, 
//                 { $inc: { postCount: postsBatch.length } } 
//             );
//         };

//         // await runTwitterScrapeJob(query, 100, null, null, sourceTag, handleBatch); 

//         await runUniversalScraper(platform, query, 100, sourceTag, handleBatch);

//     } catch (error) {
//         console.error(`[HarvesterManager] Error executing scrape for '${id}':`, error);
//     } finally {
//         isBrowserBusy = false; 
//         console.log(`[HarvesterManager] Browser released.`);
//     }
// };

// export async function startHarvester(id, name, keywords) {
//     if (activeJobs.has(id)) {
//         console.log(`[HarvesterManager] Job for '${id}' is already running.`);
//         return; 
//     }

//     const query = Array.isArray(keywords) ? keywords.join(' OR ') : keywords;
//     const sourceTag = `harvester-${id}`; 

//     console.log(`[HarvesterManager] Starting NEW job interval for: ${name}`);

//     await projectsCollection.updateOne(
//         { projectId: id }, 
//         { $set: { status: "Running", keyword: query, platform: platform } },
//         { upsert: true }
//     );
    
//     executeScrapeAndEnrich(id, query, sourceTag, platform);

//     const job = () => executeScrapeAndEnrich(id, query, sourceTag, platform);
//     const intervalId = setInterval(job, DEFAULT_INTERVAL);

//     activeJobs.set(id, intervalId);
// }

// export async function stopHarvester(id) {
//     if (activeJobs.has(id)) {
//         const intervalId = activeJobs.get(id);
//         clearInterval(intervalId); 
//         activeJobs.delete(id);
//         console.log(`[HarvesterManager] Stopped schedule for '${id}'.`);
//     }

//     if (isBrowserBusy) {
//         console.log(`[HarvesterManager] Force-closing active browser for stop request...`);
//         await closeActiveBrowser();
//         isBrowserBusy = false;
//     }

//     try {
//         await projectsCollection.updateOne(
//             { projectId: id },
//             { $set: { status: "Stopped", endDate: new Date() } }
//         );
//     } catch (dbError) {
//         console.error(`[HarvesterManager] Failed to update DB status:`, dbError);
//     }
// }

// export async function initializeHarvesters() {
//     console.log('[HarvesterManager] Initializing active harvesters...');
//     const activeProjects = await projectsCollection.find({ type: "Automated", status: "Running" }).toArray();
    
//     for (const project of activeProjects) {
//         const keywordsArray = typeof project.keyword === 'string' ? project.keyword.split(' OR ') : project.keyword;
//         if (project.sources?.some(s => s.id === 'x' && s.status === 'Active')) {
//              startHarvester(project.projectId, project.name, keywordsArray); 
//         }
//         await new Promise(r => setTimeout(r, 2000)); 
//     }
//     console.log(`[HarvesterManager] Initialization complete.`);
// }

import { runUniversalScraper } from './harvester.js';
import { projects as projectsCollection } from './db.js';
import { addEnrichmentJob } from './queueService.js';

const activeJobs = new Map();
const DEFAULT_INTERVAL = 10 * 60 * 1000;

let isBrowserBusy = false;

const executeScrapeAndEnrich = async (id, query, sourceTag, platform = 'twitter') => {
    if (isBrowserBusy) {
        console.log(`[HarvesterManager] SKIPPING job for '${id}' - Browser is currently busy.`);
        return;
    }
    console.log(`[HarvesterManager] Starting scrape job for '${id}'...`);
    
    isBrowserBusy = true;
    
    try {
        const handleBatch = async (postsBatch) => {
            console.log(`[HarvesterManager] ⚡ Sending batch of ${postsBatch.length} posts to Queue...`);
            
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

        await runUniversalScraper(platform, query, 100, sourceTag, handleBatch);

    } catch (error) {
        console.error(`[HarvesterManager] Error executing scrape for '${id}':`, error);
    } finally {
        isBrowserBusy = false;
        console.log(`[HarvesterManager] Browser released.`);
    }
};

export async function startHarvester(id, name, keywords, platform = 'twitter') {
    const jobKey = `${id}-${platform}`;

    // if (activeJobs.has(id)) {
    //     console.log(`[HarvesterManager] Job for '${id}' is already running.`);
    //     return;
    // }

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
    
    executeScrapeAndEnrich(id, query, sourceTag, platform);

    const job = () => executeScrapeAndEnrich(id, query, sourceTag, platform);
    const intervalId = setInterval(job, DEFAULT_INTERVAL);

    activeJobs.set(id, intervalId);
}

export async function stopHarvester(id) {
    let stoppedCount = 0;

    for (const [key, intervalId] of activeJobs.entries()) {
        if (key.startsWith(`${id}-`)) {
            clearInterval(intervalId);
            activeJobs.delete(key);
            stoppedCount++;
        }
    }
    if (stoppedCount > 0) {
        console.log(`[HarvesterManager] Stopped ${stoppedCount} schedules for '${id}'.`);
    } else {
        console.log(`[HarvesterManager] No active schedules found for '${id}'.`);
    }

    if (isBrowserBusy) {
        console.log(`[HarvesterManager] Force-closing active browser for stop request...`);
        await closeActiveBrowser();
        isBrowserBusy = false;
    }

    try {
        await projectsCollection.updateOne(
            { projectId: id },
            { $set: { status: "Stopped", endDate: new Date() } }
        );
    } catch (dbError) {
        console.error(`[HarvesterManager] Failed to update DB status:`, dbError);
    }
}

//     if (activeJobs.has(id)) {
//         const intervalId = activeJobs.get(id);
//         clearInterval(intervalId);
//         activeJobs.delete(id);
//         console.log(`[HarvesterManager] Stopped schedule for '${id}'.`);
//     }

//     if (isBrowserBusy) {
//         console.log(`[HarvesterManager] Force-closing active browser for stop request...`);
//         await closeActiveBrowser();
//         isBrowserBusy = false;
//     }

//     try {
//         await projectsCollection.updateOne(
//             { projectId: id },
//             { $set: { status: "Stopped", endDate: new Date() } }
//         );
//     } catch (dbError) {
//         console.error(`[HarvesterManager] Failed to update DB status:`, dbError);
//     }    
// }

export async function initializeHarvesters() {
    console.log('[HarvesterManager] Initializing active harvesters...');
    const activeProjects = await projectsCollection.find({ type: "Automated", status: "Running" }).toArray();
    
    for (const project of activeProjects) {
        const keywordsArray = typeof project.keyword === 'string' ? project.keyword.split(' OR ') : project.keyword;
        if (project.sources?.some(s => s.id === 'x' && s.status === 'Active')) {
             startHarvester(project.projectId, project.name, keywordsArray, 'twitter'); 
        }
        await new Promise(r => setTimeout(r, 2000)); 
    }
    console.log(`[HarvesterManager] Initialization complete.`);
}