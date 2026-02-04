import express from 'express';
import { getHarvestersStatus, startHarvesterJob, stopHarvesterJob } from '../controllers/harvesterController.js';

const router = express.Router();


router.get('/status', getHarvestersStatus);

router.post('/start', startHarvesterJob);

router.post('/stop', stopHarvesterJob);

export default router;