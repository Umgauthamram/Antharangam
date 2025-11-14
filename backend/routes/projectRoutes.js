import express from 'express';
import { getProjects, createStrike, getPostsByKeyword} from '../controllers/strikeController.js';

const router = express.Router();

// GET /api/projects/
router.get('/', getProjects);

// POST /api/projects/strike/twitter
router.post('/strike/twitter', createStrike);

// GET /api/projects/posts
router.get('/posts', getPostsByKeyword);

export default router;