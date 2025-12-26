import { projects as projectsCollection } from '../services/db.js';
// import { runTwitterScrapeJob } from '../services/harvester.js';

import { analyzeRiskBatch, runFullProjectAnalysis } from '../services/aiService.js';

import { addEnrichmentJob } from '../services/queueService.js';
import { startHarvester,stopHarvester } from '../services/harvesterManager.js';
import { ObjectId } from 'mongodb';


export const getProjects = async (req, res) => {
  // console.log("[API] Received GET /api/projects");
  try {
    const projects = await projectsCollection.find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(projects);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// GET /api/posts/by_source
export const getPostsBySource = async (req, res) => {
  const { source } = req.query;
  if (!source) {
    return res.status(400).json({ error: "Missing 'source' query parameter" });
  }
  console.log(`[API] Received GET /api/posts/by_source for: ${source}`);
  try {
    const db = projectsCollection.db;

    let posts = await db.collection('posts').find({ source: source }).sort({ timestamp: -1 }).toArray();

   if (posts.length === 0) {
      console.log(`[API] No posts for '${source}'. Trying 'harvester-${source}'...`);
      posts = await db.collection('posts').find({ source: `harvester-${source}` }).sort({ timestamp: -1 }).toArray();
    }

    if (posts.length === 0 && !source.startsWith('strike-')) {
        try {
            const project = await projectsCollection.findOne({ _id: new ObjectId(source) });
            if (project && project.keyword) {
                const manualTag = `strike-twitter-${project.keyword}`;
                console.log(`[API] Trying manual tag: '${manualTag}'...`);
                posts = await db.collection('posts').find({ source: manualTag }).sort({ timestamp: -1 }).toArray();
            }
        } catch(e) { }
    }

    console.log(`[API] Returning ${posts.length} posts.`);
    res.json(posts);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// export const createStrike = async (req, res) => {
//   const { projectName, description, keyword, startDate, endDate } = req.body;
//   const limit = 100;
//   const sourceTag = `strike-twitter-${keyword}`;

//   if (!keyword || !projectName) {
//     return res.status(400).json({ error: "Project Name and Keyword required" });
//   }

//   try {
//     const newProject = {
//       name: projectName,
//       description,
//       keyword,
//       startDate: startDate ? new Date(startDate) : null,
//       endDate: endDate ? new Date(endDate) : null,
//       status: "Running",
//       postCount: 0,
//       summary: null,
//       createdAt: new Date(),
//       type: "Manual",
//       sourceTag
//     };
//     const savedProject = await projectsCollection.insertOne(newProject);

//     res.status(200).json({ ...newProject, _id: savedProject.insertedId });

//     const handleBatch = async (batchOfPosts) => {
//         console.log(` Sending batch of ${batchOfPosts.length} to Python Queue...`);
//         const queuePromises = batchOfPosts.map(post => {
//             return addEnrichmentJob({ 
//                 id: post.twitterPostId,  
//                 content: post.content, 
//                 platform: 'X (Twitter)',
//                 sourceTag: sourceTag,
//                 screenshotPath: post.screenshotPath 
//             }); 
//         });
//         await Promise.allSettled(queuePromises);
//     };

// runTwitterScrapeJob(keyword, limit, startDate, endDate, sourceTag, handleBatch)
//       .then(async (totalCount) => {
//         console.log(`[Strike] Finished. Total Scraped: ${totalCount}`);
//         await projectsCollection.updateOne(
//           { _id: savedProject.insertedId },
//           { $set: { status: "Completed", postCount: totalCount } }
//         );
//       })
//       .catch(err => {
//         console.error(`[Strike] Failed:`, err);
//         projectsCollection.updateOne(
//           { _id: savedProject.insertedId },
//           { $set: { status: "Failed" } }
//         );
//       });

//   } catch (error) {
//     console.error("[Strike] Error:", error);
//     if (!res.headersSent) res.status(500).json({ error: "Strike creation failed" });
//   }
// };

export const createStrike = async (req, res) => {
  const { projectName, description, keyword, startDate, endDate } = req.body;
  const limit = 100;
  const sourceTag = `strike-twitter-${keyword}`;

  if (!keyword || !projectName) {
    return res.status(400).json({ error: "Project Name and Keyword required" });
  }

  try {
    const newProject = {
      name: projectName,
      description,
      keyword,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: "Running",
      postCount: 0,
      summary: null,
      createdAt: new Date(),
      type: "Manual",
      sourceTag
    };
    const savedProject = await projectsCollection.insertOne(newProject);

    res.status(200).json({ ...newProject, _id: savedProject.insertedId });

    const handleBatch = async (batchOfPosts) => {
        console.log(` Sending batch of ${batchOfPosts.length} to Python Queue...`);
        const queuePromises = batchOfPosts.map(post => {
            return addEnrichmentJob({
                id: post.twitterPostId,  
                content: post.content,
                platform: 'twitter',
                sourceTag: sourceTag,
                screenshotPath: post.screenshotPath
            });
        });
        await Promise.allSettled(queuePromises);
    };

    runUniversalScraper('twitter', keyword, limit, sourceTag, handleBatch)
      .then(async (totalCount) => {
        console.log(`[Strike] Finished. Total Scraped: ${totalCount}`);
        await projectsCollection.updateOne(
          { _id: savedProject.insertedId },
          { $set: { status: "Completed", postCount: totalCount } }
        );
      })
      .catch(err => {
        console.error(`[Strike] Failed:`, err);
        projectsCollection.updateOne(
          { _id: savedProject.insertedId },
          { $set: { status: "Failed" } }
        );
      });

  } catch (error) {
    console.error("[Strike] Error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Strike creation failed" });
  }
};

// POST /api/projects/automated 
export const createAutomatedProject = async (req, res) => {
  const { projectName, keywords, sources } = req.body;
  
  if (!projectName || !keywords || !sources || sources.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const projectId = new ObjectId().toHexString();

  try {
    const newProject = {
      _id: new ObjectId(projectId),
      projectId: projectId,
      name: projectName,
      keyword: keywords, 
      status: "Running",
      postCount: 0,
      summary: null,
      createdAt: new Date(),
      type: "Automated",
      sources: sources
    };

    await projectsCollection.insertOne(newProject);

    const keywordsArray = typeof keywords === 'string' ? keywords.split(' OR ') : keywords;
    
    for (const source of sources) {
        if (source.status === 'Active') {
            const platform = source.platformKey || source.id;
            console.log(`[Controller] Launching harvester for ${platform}...`);
            
            startHarvester(projectId, projectName, keywordsArray, platform);
        }
    }

    res.status(201).json(newProject);

  } catch (error) {
    console.error("[Harvester] Failed to create project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

// export const createAutomatedProject = async (req, res) => {
//   const { projectName, keywords, sources } = req.body;
//   if (!projectName || !keywords || !sources || sources.length === 0) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   const projectId = new ObjectId().toHexString();

//   try {
//     const newProject = {
//       _id: new ObjectId(projectId),
//       projectId: projectId,
//       name: projectName,
//       keyword: keywords, 
//       status: "Running",
//       postCount: 0,
//       summary: null,
//       createdAt: new Date(),
//       type: "Automated",
//       sources: sources
//     };

//     await projectsCollection.insertOne(newProject);

//     const keywordsArray = typeof keywords === 'string' ? keywords.split(' OR ') : keywords;
//     if (sources.some(s => s.id === 'x' && s.status === 'Active')) {
//         startHarvester(projectId, projectName, keywordsArray);
//     }

//     res.status(201).json(newProject);

//   } catch (error) {
//     console.error("[Harvester] Failed to create project:", error);
//     res.status(500).json({ error: "Failed to create project" });
//   }
// };

export const analyzeProjectRisk = async (req, res) => {
  const { id } = req.params;
  const MAX_BATCH_SIZE = 20; 

  try {
    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const sourceIdentifier = project.type === 'Automated' ? project.projectId : project.sourceTag;

    const posts = await projectsCollection.db.collection('posts').find({
      source: sourceIdentifier,
      $or: [
        { risk: { $exists: false } },
        { risk: null }
      ]
    }).limit(MAX_BATCH_SIZE).toArray();

    if (posts.length === 0) {
      return res.json({ message: "No new posts to analyze or all posts have been tagged." });
    }

    const analysisResults = await analyzeRiskBatch(posts);

    // 🔧 CHANGE: Update by twitterPostId instead of _id
    const bulkOps = analysisResults.map(result => ({
      updateOne: {
        filter: { twitterPostId: result.twitterPostId || result.id },  // Fallback to id
        update: { $set: { risk: result.risk, sentiment: result.sentiment } }
      }
    }));

    if (bulkOps.length > 0) {
      await projectsCollection.db.collection('posts').bulkWrite(bulkOps);
    }

    res.json({ message: `Analyzed ${bulkOps.length} posts.`, postsAnalyzed: bulkOps.length });

  } catch (error) {
    console.error("[Risk] Analysis failed:", error);
    res.status(500).json({ error: "Risk analysis failed" });
  }
};

function samplePosts(posts, maxSample) {
  if (posts.length <= maxSample) {
    return posts;
  }

  const shuffled = [...posts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, maxSample);
}

export const generateProjectSummary = async (req, res) => {
    const { id } = req.params;
    const SUMMARY_SAMPLE_SIZE = 50; 
    const RISK_BATCH_SIZE = 100;

    try {
        const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        const sourceIdentifier = project.type === 'Automated' ? project.projectId : project.sourceTag;

        let posts = await projectsCollection.db.collection('posts').find({
            source: sourceIdentifier
        }).toArray();

        if (posts.length === 0) {
            console.log(`[Summary] No posts for '${sourceIdentifier}'. Trying 'harvester-${sourceIdentifier}'...`);
            posts = await projectsCollection.db.collection('posts').find({
                source: `harvester-${sourceIdentifier}`
            }).toArray();
        }

        if (posts.length === 0) {
            posts = await projectsCollection.db.collection('posts').find({
                source: `strike-twitter-${project.keyword}`
            }).toArray();
        }

        if (posts.length === 0) {
            return res.status(200).json({ summary: "No posts found in database. Scraper may still be running." });
        }

        let finalSummary = project.summary;
        let allBulkOps = [];

        const summaryPosts = samplePosts(posts, SUMMARY_SAMPLE_SIZE);
        
        const analysis = await runFullProjectAnalysis(project.keyword, summaryPosts, posts.length);
        finalSummary = analysis.summary;

        await projectsCollection.updateOne(
            { _id: project._id },
            { $set: { summary: finalSummary } }
        );

        res.status(200).json({ summary: finalSummary, postsUpdated: posts.length });

    } catch (error) {
        console.error("Summary Failed:", error);
        res.status(500).json({ error: "Failed to generate summary" });
    }
};


export const getProjectsForDashboard = async (req, res) => {
  // console.log("[API] Received GET /api/projects/main-projects");
  try {
    const allProjects = await projectsCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();

    const manualProjects = allProjects.filter(p => p.type === 'Manual');
    const automatedProjects = allProjects.filter(p => p.type === 'Automated');

    const totalPostsCount = await projectsCollection.db.collection('posts').countDocuments({}); 
    res.json({
      manual: manualProjects,
      automated: automatedProjects,
      totalPosts: totalPostsCount
    });
  } catch (e) {
    console.error("Error fetching projects for dashboard:", e);
    res.status(500).json({ error: "Failed to fetch dashboard project data" });
  }
};


export const updateProjectSources = async (req, res) => {
  const { id } = req.params;
  const { sources } = req.body;

  try {
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { sources: sources } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Project not found" });

    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
    const twitterSource = sources.find(s => s.id === 'x');

    if (twitterSource && project) {
      if (twitterSource.status === 'Stopped') {
        console.log(`[API] Stopping Harvester for ${project.projectId}`);
 
        await stopHarvester(project.projectId); 
      } else if (twitterSource.status === 'Active') {
        console.log(`[API] Starting Harvester for ${project.projectId}`);
        const keywordsArray = typeof project.keyword === 'string' ? project.keyword.split(' OR ') : project.keyword;
        await startHarvester(project.projectId, project.name, keywordsArray);
      }
    }

    res.json({ message: "Sources updated successfully" });
  } catch (error) {
    console.error("Update sources failed:", error);
    res.status(500).json({ error: "Failed to update sources" });
  }
};