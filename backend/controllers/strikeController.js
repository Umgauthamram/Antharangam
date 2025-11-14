import { projects as projectsCollection } from '../services/db.js';
import { runTwitterScrapeJob } from '../services/harvester.js';
import { generateAnalysis } from '../services/aiService.js'; 

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

export const getPostsByKeyword = async (req, res) => {
  const { keyword } = req.query; 

  if (!keyword) {
    return res.status(400).json({ error: "Missing 'keyword' query parameter" });
  }

  console.log(`[API] Received GET /api/posts/by_keyword for: ${keyword}`);
  try {
    const posts = await projectsCollection.db.collection('posts').find({
      source: `strike-twitter-${keyword}`
    })
    .sort({ timestamp: -1 })
    .toArray();
    
    res.json(posts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};


export const createStrike = async (req, res) => {
  console.log("[API] Received POST /api/strike/twitter");
  
  const { projectName, description, keyword, startDate, endDate, limit = 50 } = req.body;

  if (!keyword || !projectName) {
    return res.status(400).json({ error: "Project Name and Keyword are required" });
  }

  const sourceTag = `strike-twitter-${keyword}`;

  try {
    const newProject = {
      name: projectName,
      description: description,
      keyword: keyword,
      startDate: new Date(startDate), 
      endDate: new Date(endDate),   
      status: "Running",
      createdAt: new Date(),
      type: "Manual",
      sourceTag: sourceTag
    };
    const savedProject = await projectsCollection.insertOne(newProject);
    console.log(`[API] Saved new project: ${projectName}`);

    const scrapedPosts = await runTwitterScrapeJob(keyword, limit, startDate, endDate, sourceTag);

    console.log(`[API] Sending ${scrapedPosts.length} posts to AI for analysis...`);
    const aiSummary = await generateAnalysis(keyword, scrapedPosts);

    await projectsCollection.updateOne(
      { _id: savedProject.insertedId },
      {
        $set: {
          status: "Completed",
          postCount: scrapedPosts.length,
          summary: aiSummary
        }
      }
    );
    console.log(`[API] Finished strike for: ${projectName}`);

    res.status(200).json({ posts: scrapedPosts, summary: aiSummary });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occurred during scraping." });
  }
};