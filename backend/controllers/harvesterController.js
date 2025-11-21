import { startHarvester, stopHarvester } from '../services/harvesterManager.js';
import { projects as projectsCollection } from '../services/db.js';



//POST- /api/harvester/stop
export const stopHarvesterJob = async (req, res) => {
  const { id } = req.body;
  console.log(`API Received POST- /api/harvester/stop for ID: ${id}`);

  if (!id) {
    return res.status(400).json({ error: "id is required." });
  }

  try {
    await stopHarvester(id); 
    
    res.status(200).json({ message: `Harvester '${id}' stopped successfully.` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to stop harvester." });
  }
};

//GET - /api/harvesters/status
export const getHarvestersStatus = async (req, res) => {
  console.log("[API] Received GET /api/harvesters/status");
  try {
    // Find all projects which are Automated
    const harvesters = await projectsCollection.find({ type: "Automated" }).toArray();
    
    res.json(harvesters);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch harvester status" });
  }
};

//POST - /api/harvester/start
export const startHarvesterJob = async (req, res) => {
  const { id, name, keywords } = req.body;
  console.log(`API Received POST- /api/harvester/start for ID: ${id}`);

  if (!id || !name || !keywords || keywords.length === 0) {
    return res.status(400).json({ error: "id, name, and a keywords array are required." });
  }

  try {
    startHarvester(id, name, keywords);
    
    res.status(200).json({ message: `Harvester '${id}' started successfully.` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to start harvester." });
  }
};

