import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import accountRoutes from './routes/account';
import authRoutes from './routes/auth';
import creditRoutes from './routes/credit';
import gameRoutes from './routes/game';
import profileRoutes from './routes/profile';

const app = express();
const port = Number(process.env.PORT ?? 8000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  return res.json({ status: 'ok' });
});

app.use(accountRoutes);
app.use(authRoutes);
app.use(creditRoutes);
app.use(profileRoutes);
app.use('/games', gameRoutes);
app.use((_req, res) => {
  return res.status(404).json({ error: 'Route not found.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${port}`);
});

server.on('error', (error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});
