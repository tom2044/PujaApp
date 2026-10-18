const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️ CHANGE THIS PASSWORD BEFORE DEPLOYING
const ADMIN_PASSWORD = 'puja2026';

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'registrations.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data folder + file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));

// Helpers
function readRegistrations() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeRegistrations(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============ PUBLIC API ============

// POST /api/register — Add new registration
app.post('/api/register', (req, res) => {
  const { name, game } = req.body;

  if (!name || !game) {
    return res.status(400).json({ error: 'Name and game are required' });
  }

  const allowedGames = ['Balloon Blast', 'Cup Pyramid', 'Biscuit Eating', 'Paper & Straw'];
  if (!allowedGames.includes(game)) {
    return res.status(400).json({ error: 'Invalid game' });
  }

  const registrations = readRegistrations();

  const newEntry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: name.trim(),
    game: game.trim(),
    year: 2026,
    timestamp: new Date().toISOString()
  };

  registrations.push(newEntry);
  writeRegistrations(registrations);

  res.status(201).json({ success: true, registration: newEntry });
});

// GET /api/registrations/count — Public count
app.get('/api/registrations/count', (req, res) => {
  res.json({ total: readRegistrations().length });
});

// ============ ADMIN API ============

function requireAdmin(req, res, next) {
  const password = req.headers['x-admin-password'] || req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET all registrations (with optional game filter)
app.get('/api/admin/registrations', requireAdmin, (req, res) => {
  let registrations = readRegistrations();

  const { game } = req.query;
  if (game) registrations = registrations.filter(r => r.game === game);

  registrations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({ total: registrations.length, registrations });
});

// DELETE one
app.delete('/api/admin/registrations/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const registrations = readRegistrations();
  const filtered = registrations.filter(r => r.id !== id);

  if (filtered.length === registrations.length) {
    return res.status(404).json({ error: 'Not found' });
  }

  writeRegistrations(filtered);
  res.json({ success: true, deleted: id });
});

// Export CSV
app.get('/api/admin/export', requireAdmin, (req, res) => {
  const registrations = readRegistrations();
  const header = 'ID,Name,Game,Year,Timestamp\n';
  const rows = registrations
    .map(r => `${r.id},"${r.name}","${r.game}",${r.year},${r.timestamp}`)
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="puja-registrations-2026.csv"');
  res.send(header + rows);
});

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============ START ============

app.listen(PORT, () => {
  console.log(`\n🎉 Durga Puja Games 2026 running!`);
  console.log(`📱 Frontend:    http://localhost:${PORT}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔑 Password:    ${ADMIN_PASSWORD}\n`);
});