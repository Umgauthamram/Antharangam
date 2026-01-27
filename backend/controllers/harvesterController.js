import { startHarvester, stopHarvester } from '../services/harvesterManager.js';
import { projects as projectsCollection } from '../services/db.js';

// POST /api/harvesters/stop
export const stopHarvesterJob = async (req, res) => {
  const { id } = req.body;
  console.log(`[API] Received POST /api/harvesters/stop for ID: ${id}`);

  if (!id) {
    return res.status(400).json({ error: "id is required." });
  }

  try {
    await stopHarvester(id);

    // UPDATE DB TO "Stopped"
    const result = await projectsCollection.updateOne(
      { projectId: id },
      { $set: { status: "Stopped", endDate: new Date() } }
    );

    if (result.matchedCount === 0) {
      console.warn(`[Harvester] No project found with projectId: ${id}`);
      return res.status(404).json({ error: "Project not found" });
    }

    console.log(`[Harvester] Successfully stopped project ${id} and updated DB`);
    res.status(200).json({ message: `Harvester '${id}' stopped successfully.` });
  } catch (e) {
    console.error("[Harvester] Stop failed:", e);
    res.status(500).json({ error: "Failed to stop harvester." });
  }
};

// GET /api/harvesters/status
export const getHarvestersStatus = async (req, res) => {
  console.log("[API] Received GET /api/harvesters/status");
  try {
    const harvesters = await projectsCollection.find({ type: "Automated" }).toArray();

    res.json(harvesters);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch harvester status" });
  }
};

// POST /api/harvesters/start
export const startHarvesterJob = async (req, res) => {
  const { id, name, keywords, platform } = req.body;
  console.log(`[API] Received POST /api/harvesters/start for ID: ${id} Platform: ${platform}`);

  if (!id || !name || !keywords || keywords.length === 0) {
    return res.status(400).json({ error: "id, name, and a keywords array are required." });
  }

  try {
    const platformToStart = platform || 'twitter';
    await startHarvester(id, name, keywords, platformToStart);

    // UPDATE DB TO "Running"
    await projectsCollection.updateOne(
      { projectId: id },
      { $set: { status: "Running" } }
    );
    await projectsCollection.updateOne(
      { projectId: id },
      { $set: { status: "Running" } }
    );

    res.status(200).json({ message: `Harvester '${id}' started successfully.` });
  } catch (e) {
    console.error("[Harvester] Start failed:", e);
    res.status(500).json({ error: "Failed to start harvester." });
  }
};