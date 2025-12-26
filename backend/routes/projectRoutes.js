import express from 'express';
import { getProjects, createStrike,  createAutomatedProject,   analyzeProjectRisk, getProjectsForDashboard, updateProjectSources, generateProjectSummary} from '../controllers/projectController.js';

const router = express.Router();


router.get('/', getProjects);

// POST /api/projects/strike/twitter (Creates a Manual Strike)
router.post('/strike/twitter', createStrike);

// POST /api/projects/automated (Creates an Automated Project)
router.post('/automated', createAutomatedProject);

// POST /api/projects/:id/summarize (Runs On-Demand AI)
router.put('/:id/sources', updateProjectSources);

// Update source status
// router.put('/:id/sources', updateProjectSources);

// Run risk analysis
router.post('/:id/risk', analyzeProjectRisk);

router.get('/main-projects', getProjectsForDashboard);

router.post('/:id/summarize', generateProjectSummary);

export default router;  