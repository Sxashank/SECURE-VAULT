import { pool } from './src/db/index';

async function migrate() {
  try {
    console.log('Running migration: Adding clerk_id to users...');
    
    // Check if column exists first (optional but safer)
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='clerk_id';
    `);

    if (checkRes.rows.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255) UNIQUE;');
      console.log('Column clerk_id added successfully.');
    } else {
      console.log('Column clerk_id already exists.');
    }

    // Make password_hash nullable
    await pool.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;');
    console.log('password_hash set to nullable.');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
