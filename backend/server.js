import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mainApiRouter from './routes/mainRoutes.js';
import { startScheduler } from './services/jobScheduler.js';
import { startWorker } from './services/enrichmentWorker.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use('/api', mainApiRouter);

app.use('/evidence', express.static(path.join(__dirname, 'public/evidence')));

app.get('/', (req, res) => {
  res.json({ status: "Antharangam backend is running!" });
});

app.listen(port, () => {
  console.log(`Antharangam backend running on http://localhost:${port}`);
  startScheduler();
  startWorker(); // Consumer for Risk/Intel analysis
});