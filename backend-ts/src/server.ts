import 'dotenv/config';
import app from './app';
const port = Number(process.env.PORT ?? 8000);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${port}`);
});

server.on('error', (error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});
