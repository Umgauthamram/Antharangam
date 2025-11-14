import express from 'express';
import projectRoutes from './projectRoutes.js';
import harvesterRoutes from './harvesterRoutes.js';
import alertRoutes from './alertRoutes.js';

const router = express.Router();

router.use('/projects', projectRoutes);

router.use('/harvesters', harvesterRoutes);

router.use('/alerts', alertRoutes);

export default router;