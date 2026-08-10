import cors, { type CorsOptions } from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import accountRoutes from './routes/account';
import authRoutes from './routes/auth';
import creditRoutes from './routes/credit';
import paymentOrderRoutes from './routes/paymentOrders';
import gameRoutes from './routes/game';
import profileRoutes from './routes/profile';
import economyRoutes from './routes/economy';

function allowedOrigins(): string[] {
  const configured = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return [...new Set([...configured, 'http://localhost:8081', 'http://localhost:19006'])];
}

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins().includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new Error('Origem não permitida pelo CORS.'));
  },
};

const app = express();
app.disable('x-powered-by');
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(accountRoutes);
app.use(authRoutes);
app.use(creditRoutes);
app.use(paymentOrderRoutes);
app.use(profileRoutes);
app.use(economyRoutes);
app.use('/games', gameRoutes);
app.use((_req, res) => res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada.' } }));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled request error:', error instanceof Error ? error.message : 'Unknown error');
  return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor.' } });
});

export default app;

