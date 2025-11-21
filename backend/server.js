import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mainApiRouter from './routes/mainRoutes.js'; 
import { startScheduler } from './services/jobScheduler.js'; 

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use('/api', mainApiRouter);

app.get('/', (req, res) => {
  res.json({ status: "Antharangam backend is running!" });
});

app.listen(port, () => {
  console.log(`Antharangam backend running on http://localhost:${port}`);
  startScheduler(); 
});