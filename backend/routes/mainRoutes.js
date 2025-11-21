import express from 'express';
import projectRoutes from './projectRoutes.js';
import harvesterRoutes from './harvesterRoutes.js';
import alertRoutes from './alertRoutes.js';
import { getPostsBySource } from '../controllers/projectController.js';

const router = express.Router();

router.use('/projects', projectRoutes);        // GET /api/projects

router.use('/posts', projectRoutes);           // POST /api/posts

router.use('/harvesters', harvesterRoutes);    // POST /api/harvesters

router.use('/alerts', alertRoutes);            // GET /api/alerts

router.get('/posts/by_source', getPostsBySource);

export default router;