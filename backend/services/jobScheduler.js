import { projects as projectsCollection } from './db.js';
import { runTwitterScrapeJob } from './harvester.js'; 

const DEFAULT_INTERVAL = 10 * 60 * 1000; 

async function runScheduledJobs() {
  console.log('[JobScheduler] Running automated jobs...');
  
  try {
    const projectsToRun = await projectsCollection.find({ 
      type: "Automated", 
      status: "Running" 
    }).toArray();
    
    console.log(`[JobScheduler] Found ${projectsToRun.length} active automated projects.`);

    for (const project of projectsToRun) {
      const keywords = project.keyword; 
      const projectId = project.projectId; 

      const sources = Array.isArray(project.sources) ? project.sources : [];
      
      for (const source of sources.filter(s => s.status === "Active")) {
        
        if (source.id === 'x') {
          console.log(`[JobScheduler] Running 'x' job for project: ${project.name}`);
          try {
            runTwitterScrapeJob(keywords, 100, null, null, projectId)
              .then(scrapedPosts => {
                 console.log(`[JobScheduler] 'x' job for ${project.name} found ${scrapedPosts.length} posts.`);
          
                 projectsCollection.updateOne(
                   { _id: project._id },
                   { $inc: { postCount: scrapedPosts.length } } 
                 );
              })
              .catch(err => console.error(`[JobScheduler] 'x' job for ${project.name} failed:`, err));
              
          } catch (error) {
            console.error(`[JobScheduler] Error starting 'x' job for ${project.name}:`, error);
          }
        }
        
        // else if (source.id === 'telegram') { ... }
      }
    }
  } catch (error) {
    console.error('[JobScheduler] Failed to run scheduled jobs:', error);
  }
}

export function startScheduler() {
  console.log('[JobScheduler] Starting scheduler...');
  runScheduledJobs(); 
  setInterval(runScheduledJobs, DEFAULT_INTERVAL);
}