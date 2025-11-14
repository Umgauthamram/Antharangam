import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mainApiRouter from './routes/index.js'; 

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api', mainApiRouter);

app.get('/', (req, res) => {
  res.json({ status: "Antharangam Node.js API is running!" });
});

app.listen(port, () => {
  console.log(`[Server] Antharangam backend listening on http://localhost:${port}`);
});