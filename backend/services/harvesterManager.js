import { runTwitterScrapeJob } from './harvester.js';
import { projects as projectsCollection } from './db.js'; 

const activeJobs = new Map();

const DEFAULT_INTERVAL = 10 * 60 * 1000;


export async function startHarvester(id, name, keywords) {
  if (activeJobs.has(id)) {
    console.log(`[HarvesterManager] Job for '${id}' is already running.`);
    return; 
  }

  const query = keywords.join(' OR ');
  const sourceTag = `harvester-${id}`;
  const projectId = `harvester-${id}`; 

  console.log(`[HarvesterManager] Starting job for '${id}'. Keywords: ${query}`);

  try {
    await projectsCollection.updateOne(
      { projectId: projectId }, 
      {
        $set: {
          name: `Automated: ${name}`,
          description: "Continuous automated monitoring harvester.",
          keyword: query,
          startDate: new Date(),
          status: "Running",
          projectId: projectId, 
          type: "Automated" 
        },
        $unset: { endDate: "" } 
      },
      { upsert: true } 
    );
  } catch (dbError) {
    console.error(`[HarvesterManager] Failed to update project for '${id}':`, dbError);
  }

  const job = async () => {
    console.log(`[HarvesterManager] Running automated job for '${id}'...`);
    try {
      await runTwitterScrapeJob(query, 50, null, null, sourceTag);
    } catch (error) {
      console.error(`[HarvesterManager] Error in job for '${id}':`, error);
    }
  };

  job();
  const intervalId = setInterval(job, DEFAULT_INTERVAL);

  activeJobs.set(id, intervalId);
}

export async function stopHarvester(id) {
  if (!activeJobs.has(id)) {
    console.log(`[HarvesterManager] No active job found for '${id}'.`);
    return; 
  }

  const projectId = `harvester-${id}`;

  const intervalId = activeJobs.get(id);
  clearInterval(intervalId);
  activeJobs.delete(id);

  try {
    await projectsCollection.updateOne(
      { projectId: projectId },
      {
        $set: {
          status: "Stopped",
          endDate: new Date()
        }
      }
    );
  } catch (dbError) {
    console.error(`[HarvesterManager] Failed to update project for '${id}':`, dbError);
  }

  console.log(`[HarvesterManager] Stopped job for '${id}'.`);
}