import express from 'express';
import { toggleFlag, getIntelStats, getIntelFeed } from '../controllers/intelController.js';

const router = express.Router();

// Middleware to mock user if needed or assume auth is handled at app level
// router.use(req, res, next) => { ... }

router.post('/flag/:id', toggleFlag);
router.get('/stats', getIntelStats);
router.get('/feed', getIntelFeed);

export default router;
