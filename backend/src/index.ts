import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import authRoutes from './routes/auth.router.js';
import analyticsRoutes from './routes/analytics.router.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'https://melodious-pothos-c2f031.netlify.app'],
  credentials: true,
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  console.log('[health] Check');
  res.json({ status: 'ok' });
});

app.use('/api', authRoutes);
app.use('/api', analyticsRoutes);

app.use(errorMiddleware);

async function main() {
  console.log('[main] Connecting to database...');
  await prisma.$connect();
  console.log('[main] Database connected');
  app.listen(PORT, () => {
    console.log(`[main] Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
