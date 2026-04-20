import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use DATABASE_URL if available (common for cloud providers), otherwise fallback to individual vars
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

export const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false }, // Required for AWS/Neon/Render etc.
          }
        : {
              user: process.env.DB_USER,
              host: process.env.DB_HOST,
              database: process.env.DB_NAME,
              password: process.env.DB_PASSWORD,
              port: parseInt(process.env.DB_PORT || '5432'),
              // If your DB_HOST isn't localhost, automatically attempt SSL
              ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
          }
);

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
