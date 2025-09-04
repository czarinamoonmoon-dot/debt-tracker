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

function readMasterlist() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeMasterlist(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

app.get('/api/masterlist', (req, res) => {
  res.json(readMasterlist());
});

app.post('/api/transaction', (req, res) => {
  const { from, to, amount } = req.body;
  if (!from || !to || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transaction' });
  }
  const masterlist = readMasterlist();
  masterlist.push({ from, to, amount });
  writeMasterlist(masterlist);
  res.status(201).json({ success: true });
});

app.get('/api/balances', (req, res) => {
  const masterlist = readMasterlist();
  const balances = {};
  masterlist.forEach(({ from, to, amount }) => {
    balances[from] = (balances[from] || 0) - amount;
    balances[to] = (balances[to] || 0) + amount;
  });
  res.json(balances);
});

app.listen(PORT, () => {
  console.log(`Debt Tracker server running at http://localhost:${PORT}`);
});
