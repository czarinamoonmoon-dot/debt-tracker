const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const data = JSON.parse(fs.readFileSync('./data/masterlist.json', 'utf8'));

async function migrate() {
  for (const tx of data) {
    await pool.query(
      'INSERT INTO transactions (from_user, to_user, amount) VALUES ($1, $2, $3)',
      [tx.from, tx.to, tx.amount]
    );
  }
  console.log('Migration complete!');
  pool.end();
}

migrate();
