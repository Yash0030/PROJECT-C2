import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { initDB } from './db/client.js';
import { initRedis } from './db/redis.js';
import { initSocket } from './socket/index.js';
import { startCronJobs } from './jobs/index.js';

import sessionRoutes from './routes/session.js';
import groupRoutes   from './routes/groups.js';
import messageRoutes from './routes/messages.js';
import joinRoutes    from './routes/join.js';
import placesRoutes  from './routes/places.js';
import ghostRoutes   from './routes/ghost.js';
import authRouter    from './routes/auth.js';

const app = express();
const httpServer = createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/session',  sessionRoutes);
app.use('/api/groups',   groupRoutes);
app.use('/api/groups',   messageRoutes);
app.use('/api/groups',   joinRoutes);
app.use('/api/places',   placesRoutes);
app.use('/api/ghost',    ghostRoutes);
app.use('/api/auth',     authRouter);       // ← correct position

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Boot ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function boot() {
  await initDB();
  await initRedis();
  const io = initSocket(httpServer);
  app.set('io', io);
  startCronJobs();

  httpServer.listen(PORT, () => {
    console.log(`🚀  Lokaal server running on http://localhost:${PORT}`);
  });
}

boot().catch(err => {
  console.error('Boot failed:', err);
  process.exit(1);
});