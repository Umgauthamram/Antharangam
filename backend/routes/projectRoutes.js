import express from 'express';
import { getProjects, getProjectById, getPostsBySource, createStrike, createAutomatedProject, analyzeProjectRisk, getProjectsForDashboard, updateProjectSources, generateProjectSummary, stopProject } from '../controllers/projectController.js';

const router = express.Router();


router.get('/', getProjects);

router.get('/main-projects', getProjectsForDashboard);

router.get('/by_source', getPostsBySource);

// Get single project
router.get('/:id', getProjectById);

// POST /api/projects/strike/twitter (Creates a Manual Strike)
router.post('/strike/twitter', createStrike);

// POST /api/projects/automated (Creates an Automated Project)
router.post('/automated', createAutomatedProject);

// Stop Project
router.post('/:id/stop', stopProject);

// POST /api/projects/:id/summarize (Runs On-Demand AI)
router.put('/:id/sources', updateProjectSources);

// Update source status
// router.put('/:id/sources', updateProjectSources);

// Run risk analysis
router.post('/:id/risk', analyzeProjectRisk);

router.get('/main-projects', getProjectsForDashboard);

router.post('/:id/summarize', generateProjectSummary);

export default router;  