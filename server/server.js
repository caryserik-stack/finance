import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import api from './routes/index.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());
app.use('/api', api);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err.message);
  const status = err.status || (String(err.code).startsWith('SQLITE') ? 400 : 500);
  res.status(status).json({ error: err.message });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API: http://localhost:${port}/api`));
