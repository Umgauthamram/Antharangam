import express from 'express';
import { startHarvesterController, stopHarvesterController } from '../controllers/harvesterController.js';

const router = express.Router();

// POST /api/harvesters/start
router.post('/start', startHarvesterController);

// POST /api/harvesters/stop
router.post('/stop', stopHarvesterController);

export default router;