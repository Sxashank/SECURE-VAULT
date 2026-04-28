const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: '271905', host: 'localhost', port: 5432, database: 'secure_docs' });
async function run() {
  const res = await pool.query("INSERT INTO document_versions (document_id, version_number, encrypted_path, content, uploaded_by) VALUES (7, 3, 'test.enc', $1, 3) RETURNING id", ['']);
  console.log("Inserted ID:", res.rows[0].id);
  const check = await pool.query("SELECT length(content) FROM document_versions WHERE id = $1", [res.rows[0].id]);
  console.log("Length:", check.rows[0].length);
  await pool.end();
}
run();
