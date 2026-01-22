import express from 'express';
import projectRoutes from './projectRoutes.js';
import harvesterRoutes from './harvesterRoutes.js';
import alertRoutes from './alertRoutes.js';
import { getPostsBySource } from '../controllers/projectController.js';
import injestRoutes from './ingestionRoutes.js';
import authRoutes from './authRoutes.js';

import { createKey, getMyKeys, revokeKey } from '../controllers/apiKeyController.js';

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/projects', projectRoutes);        // GET /api/projects

router.use('/posts', projectRoutes);           // POST /api/posts

router.use('/harvesters', harvesterRoutes);    // POST /api/harvesters

router.use('/alerts', alertRoutes);            // GET /api/alerts

// Key Management
router.get('/keys', getMyKeys);
router.post('/keys', createKey);
router.delete('/keys/:id', revokeKey);

router.get('/posts/by_source', getPostsBySource);

router.get('/ingest', injestRoutes);

export default router;

