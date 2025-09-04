// Neon PostgreSQL setup
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '../data/masterlist.json');

app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});



// SQL: Get all transactions
app.get('/api/masterlist', async (req, res) => {
  try {
    const result = await pool.query('SELECT from_user AS from, to_user AS to, amount FROM transactions ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// SQL: Add a transaction
app.post('/api/transaction', async (req, res) => {
  const { from, to, amount } = req.body;
  if (!from || !to || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transaction' });
  }
  try {
    await pool.query(
      'INSERT INTO transactions (from_user, to_user, amount) VALUES ($1, $2, $3)',
      [from, to, amount]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// SQL: Calculate balances
app.get('/api/balances', async (req, res) => {
  try {
    const result = await pool.query('SELECT from_user, to_user, amount FROM transactions');
    const balances = {};
    result.rows.forEach(({ from_user, to_user, amount }) => {
      balances[from_user] = (balances[from_user] || 0) - amount;
      balances[to_user] = (balances[to_user] || 0) + amount;
    });
    res.json(balances);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Debt Tracker server running at http://localhost:${PORT}`);
});
