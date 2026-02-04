import { projects as projectsCollection, posts as postsCollection } from '../services/db.js';
import { runUniversalScraper } from '../services/harvester.js';

import { analyzeRiskBatch, runFullProjectAnalysis } from '../services/aiService.js';

import { addEnrichmentJob } from '../services/queueService.js';
import { startHarvester, stopHarvester } from '../services/harvesterManager.js';
import { ObjectId } from 'mongodb';


export const getProjects = async (req, res) => {
  try {
    const projects = await projectsCollection.find().sort({ createdAt: -1 }).toArray();

    // FETCH REAL COUNTS PER PROJECT
    const counts = await postsCollection.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]).toArray();

    const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));

    const enrichedProjects = projects.map(p => {
      const sourceId = p.type === 'Automated' ? `harvester-${p.projectId}` : p.sourceTag;
      return {
        ...p,
        postCount: countMap[sourceId] || countMap[p.projectId] || 0
      };
    });

    res.json(enrichedProjects);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const sourceId = project.type === 'Automated' ? `harvester-${project.projectId}` : project.sourceTag;
    const actualCount = await postsCollection.countDocuments({
      source: { $in: [sourceId, project.projectId, project.sourceTag] }
    });

    res.json({ ...project, postCount: actualCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch project details" });
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
    console.log(`[API DEBUG] Querying postsCollection for source: ${source}`);
    if (!postsCollection) throw new Error("postsCollection is undefined in controller");

    let posts = await postsCollection.find({ source: source }).sort({ timestamp: -1 }).toArray();
    console.log(`[API DEBUG] Initial fetch found ${posts.length} posts`);

    if (posts.length === 0) {
      console.log(`[API] No posts for '${source}'. Trying 'harvester-${source}'...`);
      posts = await postsCollection.find({ source: `harvester-${source}` }).sort({ timestamp: -1 }).toArray();
      console.log(`[API DEBUG] Harvester fallback found ${posts.length} posts`);
    }

    if (posts.length === 0 && !source.startsWith('strike-')) {
      try {
        console.log(`[API DEBUG] Attempting project lookup for ID: ${source}`);
        const project = await projectsCollection.findOne({ _id: new ObjectId(source) });
        if (project && project.keyword) {
          const manualTag = `strike-twitter-${project.keyword}`;
          console.log(`[API] Trying manual tag: '${manualTag}'...`);
          posts = await postsCollection.find({ source: manualTag }).sort({ timestamp: -1 }).toArray();
          console.log(`[API DEBUG] Manual tag fallback found ${posts.length} posts`);
        }
      } catch (e) {
        console.log(`[API DEBUG] Project lookup failed for ${source}: ${e.message}`);
      }
    }

    console.log(`[API] Returning ${posts.length} posts.`);
    posts = posts.map(p => ({
      ...p,
      url: p.sourceUrl || p.url,
      username: p.author || p.username || 'Unknown'
    }));
    res.json(posts);

  } catch (e) {
    console.error("[API ERROR] Error in getPostsBySource:", e);
    res.status(500).json({
      error: "Failed to fetch posts",
      details: e.message,
      stack: e.stack
    });
  }
};


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
      sourceTag,
      platform: req.body.platform || 'twitter'
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

    runUniversalScraper(req.body.platform || 'twitter', keyword, limit, sourceTag, handleBatch)
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
  const { projectName, keywords, sources, investigator, legalAuth, caseType } = req.body;

  if (!projectName || !keywords || !sources || sources.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const activeProject = await projectsCollection.findOne({ type: "Automated", status: "Running" });
    if (activeProject) {
      return res.status(400).json({
        error: "Active investigation in progress",
        message: `Please stop the currently running case "${activeProject.name}" before starting a new one.`
      });
    }

    // --- CACHING LOGIC ---
    // Check if a similar COMPLETED project exists
    const cachedProject = await projectsCollection.findOne({
      keyword: keywords, // Exact string match for now
      status: "Completed",
      type: "Automated"
    }, { sort: { createdAt: -1 } });

    if (cachedProject) {
      console.log(`[Cache] Found existing project ${cachedProject.projectId} for keywords: ${keywords}`);

      const projectId = new ObjectId().toHexString();
      const newProject = {
        _id: new ObjectId(projectId),
        projectId: projectId,
        name: projectName,
        keyword: keywords,
        status: "Completed", // Set immediately to completed
        caseStatus: "Open", // Forensic Case Status
        investigator: investigator || "Unknown",
        legalAuth: legalAuth || "OSINT",
        caseType: caseType || "General",
        postCount: cachedProject.postCount || 0,
        summary: cachedProject.summary || null,
        createdAt: new Date(),
        type: "Automated",
        sources: sources,
        evidenceHash: null,
        cachedFrom: cachedProject.projectId // Track lineage
      };

      const result = await projectsCollection.insertOne(newProject);

      // Copy posts
      const sourceIdOld = `harvester-${cachedProject.projectId}`;
      const newSourceId = `harvester-${projectId}`;

      // Find old posts
      const oldPosts = await postsCollection.find({ source: sourceIdOld }).toArray();

      if (oldPosts.length > 0) {
        const newPosts = oldPosts.map(p => {
          const { _id, ...rest } = p; // remove old _id
          return {
            ...rest,
            source: newSourceId,
            projectId: projectId,
            scrapedAt: new Date() // Refresh timestamp for "newness" feel? Or keep original? User said "provide the result". Let's keep original data but maybe add a cached note.
          };
        });

        if (newPosts.length > 0) {
          await postsCollection.insertMany(newPosts);
          console.log(`[Cache] Copied ${newPosts.length} posts from ${sourceIdOld} to ${newSourceId}`);
        }
      }

      return res.status(201).json(newProject);
    }
    // --- END CACHING LOGIC ---

    const projectId = new ObjectId().toHexString();
    const newProject = {
      _id: new ObjectId(projectId),
      projectId: projectId,
      name: projectName,
      keyword: keywords,
      status: "Running", // Scraper Status
      caseStatus: "Open", // Forensic Case Status
      investigator: investigator || "Unknown",
      legalAuth: legalAuth || "OSINT", // Warrant / OSINT
      caseType: caseType || "General",
      postCount: 0,
      summary: null,
      createdAt: new Date(),
      type: "Automated",
      sources: sources,
      evidenceHash: null // Will be updated on close/export
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


export const analyzeProjectRisk = async (req, res) => {
  const { id } = req.params;
  const MAX_BATCH_SIZE = 20;

  try {
    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const sourceIdentifier = project.type === 'Automated' ? project.projectId : project.sourceTag;

    const posts = await postsCollection.find({
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
      await postsCollection.bulkWrite(bulkOps);
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

  try {
    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const sourceIdentifier = project.type === 'Automated' ? project.projectId : project.sourceTag;

    let posts = await postsCollection.find({
      source: sourceIdentifier
    }).toArray();

    if (posts.length === 0) {
      console.log(`[Summary] No posts for '${sourceIdentifier}'. Trying 'harvester-${sourceIdentifier}'...`);
      posts = await postsCollection.find({
        source: `harvester-${sourceIdentifier}`
      }).toArray();
    }

    if (posts.length === 0) {
      posts = await postsCollection.find({
        source: `strike-twitter-${project.keyword}`
      }).toArray();
    }

    if (posts.length === 0) {
      return res.status(200).json({ summary: "No posts found in database. Scraper may still be running." });
    }

    // --- STEP 1: FORCE ANALYSIS ON ALL POSTS (Local is fast) ---
    console.log(`[Summary] analyzing ${posts.length} posts locally before summarizing...`);
    const enrichedPosts = await analyzeRiskBatch(posts);

    // --- STEP 2: SAVE ANALYSIS TO DB ---
    // This ensures the "Live Feed" shows tags immediately after this returns.
    const bulkOps = enrichedPosts.map(p => ({
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            risk: p.risk,
            sentiment: p.sentiment,
            risk_score: p.risk_score,
            enrichmentData: p.enrichmentData
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await postsCollection.bulkWrite(bulkOps);
      console.log(`[Summary] Updated ${bulkOps.length} posts with local analysis data.`);
    }

    // --- STEP 3: GENERATE SUMMARY ---
    // Use the ENRICHED posts for the summary so stats match DB
    let finalSummary = project.summary;
    // runFullProjectAnalysis (Local) uses the risk data we just generated
    // FIXED: Use ALL enriched posts for summary, not a sample, to ensure counts match
    const analysis = await runFullProjectAnalysis(project.keyword, enrichedPosts, enrichedPosts.length);
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

    const manualProjectsRaw = allProjects.filter(p => p.type === 'Manual');
    const automatedProjectsRaw = allProjects.filter(p => p.type === 'Automated');

    // FETCH REAL COUNTS FOR ENRICHMENT
    const countsAggregation = await postsCollection.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]).toArray();
    const countMap = Object.fromEntries(countsAggregation.map(c => [c._id, c.count]));

    const enrichProject = (p) => {
      const sourceId = p.type === 'Automated' ? `harvester-${p.projectId}` : p.sourceTag;
      return {
        ...p,
        postCount: countMap[sourceId] || countMap[p.projectId] || 0
      };
    };

    const manualProjects = manualProjectsRaw.map(enrichProject);
    const automatedProjects = automatedProjectsRaw.map(enrichProject);

    const totalPostsCount = await postsCollection.countDocuments({});

    // FETCH RECENT POSTS
    const recentPosts = await postsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    // FETCH THREAT STATS (AGGREGATION)
    const riskAggregation = await postsCollection.aggregate([
      { $match: { risk: { $exists: true, $ne: null } } },
      { $group: { _id: "$risk", count: { $sum: 1 } } }
    ]).toArray();

    const riskStats = riskAggregation.map(r => ({ name: r._id, value: r.count }));

    // FETCH ACTIVITY STATS
    const activityStats = await postsCollection.aggregate([
      {
        $project: {
          dateStr: { $substr: ["$timestamp", 0, 10] }
        }
      },
      {
        $group: {
          _id: "$dateStr",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 14 }
    ]).toArray();

    // FETCH PROMINENT CRITICAL CASES
    // Aggregate by 'source' to count high-risk items per project
    const criticalCasesAggregation = await postsCollection.aggregate([
      { $match: { risk: { $in: ['High', 'Critical'] } } },
      { $group: { _id: "$source", highRiskCount: { $sum: 1 } } },
      { $sort: { highRiskCount: -1 } },
      { $limit: 5 }
    ]).toArray();

    // Map these counts back to project details
    const criticalCases = criticalCasesAggregation.map(c => {
      // Try to find matching project by sourceTag or projectId
      const project = allProjects.find(p => p.sourceTag === c._id || p.projectId === c._id || p.projectId === c._id.replace('harvester-', ''));
      return {
        id: project ? project._id : c._id,
        name: project ? project.name : c._id, // Fallback if orphaned
        projectId: project ? project.projectId : 'N/A',
        highRiskCount: c.highRiskCount,
        projectObj: project // details for navigation
      };
    }).filter(c => c.name !== undefined);

    res.json({
      manual: manualProjects,
      automated: automatedProjects,
      totalPosts: totalPostsCount,
      recentPosts: recentPosts.map(p => ({
        ...p,
        id: p._id,
        date: p.timestamp,
        formattedDate: new Date(p.timestamp).toLocaleString()
      })),
      riskStats: riskStats.length > 0 ? riskStats : [{ name: 'Low', value: 1 }],
      activityStats: activityStats.map(a => ({ date: a._id, count: a.count })),
      criticalCases: criticalCases // New Data Field
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

    if (project) {
      for (const source of sources) {
        const platform = source.platformKey || source.id;
        if (source.status === 'Active') {
          console.log(`[API] Starting Harvester for ${project.projectId} on ${platform}`);
          const keywordsArray = typeof project.keyword === 'string' ? project.keyword.split(' OR ') : project.keyword;
          await startHarvester(project.projectId, project.name, keywordsArray, platform);
        } else if (source.status === 'Stopped') {
          console.log(`[API] Stopping Harvester for ${project.projectId} on ${platform}`);
          await stopHarvester(project.projectId, platform);
        }
      }
    }

    res.json({ message: "Sources updated successfully" });
  } catch (error) {
    console.error("Update sources failed:", error);
    res.status(500).json({ error: "Failed to update sources" });
  }
};

export const stopProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!project) return res.status(404).json({ error: "Project not found" });

    console.log(`[API] Stopping investigation: ${project.name} (${project.projectId})`);

    // 1. Stop all harvesters in the manager
    await stopHarvester(project.projectId);

    // 2. Update all sources in DB to stopped
    const stoppedSources = (project.sources || []).map(s => ({ ...s, status: 'Stopped' }));

    await projectsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "Stopped",
          sources: stoppedSources,
          endDate: new Date()
        }
      }
    );

    res.json({ message: "Investigation stopped successfully" });
  } catch (error) {
    console.error("Stop project failed:", error);
    res.status(500).json({ error: "Failed to stop project" });
  }
};