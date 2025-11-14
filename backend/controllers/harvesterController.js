import { startHarvester, stopHarvester } from '../services/harvesterManager.js';

export const startHarvesterController = async (req, res) => {
  const { id, name, keywords } = req.body;

  if (!id || !name || !keywords || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Missing id, name, or keywords array.' });
  }

  try {
    startHarvester(id, name, keywords);
    res.status(202).json({ message: `Harvester '${id}' job accepted.` });
  } catch (error) {
    console.error(`[Controller] Error starting harvester ${id}:`, error);
    res.status(500).json({ error: 'Failed to start harvester.' });
  }
};

export const stopHarvesterController = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id.' });
  }

  try {
    await stopHarvester(id);
    res.status(200).json({ message: `Harvester '${id}' stopped successfully.` });
  } catch (error) {
    console.error(`[Controller] Error stopping harvester ${id}:`, error);
    res.status(500).json({ error: 'Failed to stop harvester.' });
  }
};
