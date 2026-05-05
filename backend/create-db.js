const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres'
});

async function createDatabase() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'marketing_activity'"
    );
    
    if (result.rows.length === 0) {
      await client.query('CREATE DATABASE marketing_activity');
      console.log('Database marketing_activity created successfully');
    } else {
      console.log('Database marketing_activity already exists');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createDatabase();
