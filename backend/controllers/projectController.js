
import { projects as projectsCollection } from '../services/db.js';
import { runTwitterScrapeJob } from '../services/harvester.js';
import { generateAnalysis } from '../services/aiService.js';
import { ObjectId } from 'mongodb';

// GET /api/projects
export const getProjects = async (req, res) => {
  console.log("[API] Received GET /api/projects");
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
    const posts = await projectsCollection.db.collection('posts').find({
      source: source 
    })
    .sort({ timestamp: -1 })
    .toArray();
    console.log(`[API] Found ${posts.length} posts for source: ${source}`);
    res.json(posts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// POST /api/projects/strike/twitter (Manual Strike)
export const createStrike = async (req, res) => {
  const { projectName, description, keyword, startDate, endDate } = req.body;
  const limit = 100;
  const sourceTag = `strike-twitter-${keyword}`; // Unique tag for this one-time scrape

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
  
    runTwitterScrapeJob(keyword, limit, startDate, endDate, sourceTag)
      .then(async (scrapedPosts) => {
        await projectsCollection.updateOne(
          { _id: savedProject.insertedId },
          {
            $set: {
              status: "Completed",
              postCount: scrapedPosts.length,
            }
          }
        );
        console.log(`[Strike] Completed scrape for ${projectName}, found ${scrapedPosts.length} posts.`);
      })
      .catch(err => {
        console.error(`[Strike] Scrape failed for ${projectName}:`, err);
        projectsCollection.updateOne(
          { _id: savedProject.insertedId },
          { $set: { status: "Failed" } }
        );
      });

    res.status(200).json({ ...newProject, _id: savedProject.insertedId });

  } catch (error) {
    console.error("[Strike] Failed:", error);
    res.status(500).json({ error: "Strike failed" });
  }
};

// POST /api/projects/automated (New Automated Project)
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
      sources: sources // e.g., [{ id: 'x', name: 'X (Twitter)', status: 'Active' }]
    };
    
    await projectsCollection.insertOne(newProject);
    
    
    
    res.status(201).json(newProject);
    
  } catch (error) {
    console.error("[Harvester] Failed to create project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

// POST /api/projects/:id/summarize (On-Demand AI)
export const generateProjectSummary = async (req, res) => {
  const { id } = req.params;
  
  try {
    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const sourceIdentifier = project.type === 'Automated' ? project.projectId : project.sourceTag;
    
    const posts = await projectsCollection.db.collection('posts').find({
      source: sourceIdentifier
    }).toArray();
    
    if (posts.length === 0) {
      return res.status(200).json({ summary: "No posts found for this project, cannot generate summary." });
    }
    
    const postSample = posts.length > 35 ? [...posts].sort(() => 0.5 - Math.random()).slice(0, 35) : posts;
    
    const aiSummary = await generateAnalysis(project.keyword, postSample, posts.length);
    
    await projectsCollection.updateOne(
      { _id: project._id },
      { $set: { summary: aiSummary } }
    );
    
    res.status(200).json({ summary: aiSummary });
    
  } catch (error) {
    console.error("[Summary] Failed:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
};