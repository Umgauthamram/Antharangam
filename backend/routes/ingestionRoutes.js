import express from 'express';
import { ingestRawPost } from '../controllers/ingestionController.js';

const router = express.Router();

router.post('/raw', ingestRawPost);

export default router;