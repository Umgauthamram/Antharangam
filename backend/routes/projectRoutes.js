import express from 'express';
import { getProjects, createStrike,  createAutomatedProject, generateProjectSummary} from '../controllers/projectController.js';

const router = express.Router();


router.get('/', getProjects);

// POST /api/projects/strike/twitter (Creates a Manual Strike)
router.post('/strike/twitter', createStrike);

// POST /api/projects/automated (Creates an Automated Project)
router.post('/automated', createAutomatedProject);

// POST /api/projects/:id/summarize (Runs On-Demand AI)
router.post('/:id/summarize', generateProjectSummary);

export default router;  