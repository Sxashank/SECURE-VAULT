import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';
import auditRoutes from './routes/auditRoutes';
import statsRoutes from './routes/statsRoutes';
import userRoutes from './routes/userRoutes';
import { pool } from './db';

import { clerkMiddleware } from '@clerk/express';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

const runCompatibilityMigrations = async () => {
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE');
  await pool.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');
};

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5200',
      'http://127.0.0.1:5200',
      'http://localhost:5201',
      'http://127.0.0.1:5201',
      'http://localhost:5173', // Vite default
      'http://127.0.0.1:5173'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Clerk-Auth-Token'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.use(clerkMiddleware());

app.use((req, res, next) => {
  console.log('GLOBAL REQUEST:', req.method, req.url);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('SecureDocs API is up and running. Use the frontend app to interact with the system.');
});

runCompatibilityMigrations()
  .then(() => {
    app.listen(port as number, '0.0.0.0', () => {
      console.log(`[server]: Server is running at http://localhost:${port} and http://0.0.0.0:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to run compatibility migrations:', err);
    process.exit(1);
  });
