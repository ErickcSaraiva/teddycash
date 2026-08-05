import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import accountRoutes from './routes/account';
import authRoutes from './routes/auth';
import creditRoutes from './routes/credit';
import paymentOrderRoutes from './routes/paymentOrders';
import gameRoutes from './routes/game';
import profileRoutes from './routes/profile';
import economyRoutes from './routes/economy';

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
app.use(paymentOrderRoutes);
app.use(profileRoutes);
app.use(economyRoutes);
app.use('/games', gameRoutes);
app.use((_req, res) => {
  return res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Rota nao encontrada.' } });
});
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled request error:', error);
  return res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor.' },
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${port}`);
});

server.on('error', (error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});
