import express from 'express';
import { getAlerts } from '../controllers/alertController.js';

const router = express.Router();

// GET /api/alerts/
router.get('/', getAlerts);

export default router;