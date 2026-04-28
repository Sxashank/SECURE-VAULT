import { pool } from './src/db/index';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('Seeding demo data...');

    // Hash password 'password123'
    const passwordHash = await bcrypt.hash('password123', 10);

    // Ensure roles exist
    await pool.query("INSERT INTO roles (id, name) VALUES (1, 'ADMIN'), (2, 'MANAGER'), (3, 'USER') ON CONFLICT DO NOTHING");
    await pool.query("INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'HR'), (3, 'Finance'), (4, 'Sales'), (5, 'Operations') ON CONFLICT DO NOTHING");

    // Insert Team
    const teamRes = await pool.query("INSERT INTO teams (name, invite_code) VALUES ('Galactic Enterprise', 'DEMOTEAM123') RETURNING id");
    const teamId = teamRes.rows[0].id;

    // Insert Admin
    const adminRes = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role_id, team_id, department_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      ['Commander Shepard (Admin)', 'admin@demo.com', passwordHash, 1, teamId, 1]
    );
    const adminId = adminRes.rows[0].id;

    // Insert Demo Users
    const usersData = [
      ['Garrus Vakarian', 'demo1@demo.com', passwordHash, 3, teamId, 1],
      ['Tali Zorah', 'demo2@demo.com', passwordHash, 3, teamId, 1],
      ['Liara Tsoni', 'demo3@demo.com', passwordHash, 3, teamId, 2],
      ['Urdnot Wrex', 'demo4@demo.com', passwordHash, 3, teamId, 5],
      ['Admin Demo', 'admin_demo@demo.com', passwordHash, 1, teamId, 1],
      ['Student Demo', 'student_demo@demo.com', passwordHash, 3, teamId, 1],
      ['Manager Demo', 'manager_demo@demo.com', passwordHash, 2, teamId, 1],
      ['Extra User 1', 'user1@demo.com', passwordHash, 3, teamId, 1],
      ['Extra User 2', 'user2@demo.com', passwordHash, 3, teamId, 1],
      ['Extra Manager', 'manager1@demo.com', passwordHash, 2, teamId, 1]
    ];

    for (const u of usersData) {
      await pool.query(
        "INSERT INTO users (full_name, email, password_hash, role_id, team_id, department_id) VALUES ($1, $2, $3, $4, $5, $6)",
        u
      );
    }

    // Admin uploads 3 documents
    const doc1 = await pool.query(
      "INSERT INTO documents (title, category, team_id, department_id, uploaded_by, is_public_to_team) VALUES ($1, $2, $3, $4, $5, true) RETURNING id",
      ['Project Zero Gravity Specs', 'Engineering', teamId, 1, adminId]
    );
    await pool.query("INSERT INTO document_versions (document_id, version_number, encrypted_path, uploaded_by) VALUES ($1, 1, 'secure_vault/specs_v1.enc', $2)", [doc1.rows[0].id, adminId]);

    const doc2 = await pool.query(
      "INSERT INTO documents (title, category, team_id, department_id, uploaded_by, is_public_to_team) VALUES ($1, $2, $3, $4, $5, true) RETURNING id",
      ['Q3 Financial Report', 'Finance', teamId, 3, adminId]
    );
    await pool.query("INSERT INTO document_versions (document_id, version_number, encrypted_path, uploaded_by) VALUES ($1, 1, 'secure_vault/financials_q3.enc', $2)", [doc2.rows[0].id, adminId]);

    const doc3 = await pool.query(
      "INSERT INTO documents (title, category, team_id, department_id, uploaded_by, is_public_to_team) VALUES ($1, $2, $3, $4, $5, true) RETURNING id",
      ['Employee Handbook', 'HR', teamId, 2, adminId]
    );
    await pool.query("INSERT INTO document_versions (document_id, version_number, encrypted_path, uploaded_by) VALUES ($1, 1, 'secure_vault/hr_handbook.enc', $2)", [doc3.rows[0].id, adminId]);

    console.log('Successfully seeded 1 Admin, 4 Demo Users, and 3 Documents for Galactic Enterprise team.');
    console.log('Login credentials => email: admin@demo.com / demo1@demo.com, password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
