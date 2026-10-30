const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA = path.join(__dirname, '../../data/notes.json');

function load() {
  try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); }
  catch { return { total: 0, generatedAt: null, projects: [], notes: [] }; }
}

// ====== GET /api/notes — 索引（不含正文，避免首屏拉几百 KB）======
router.get('/', (req, res) => {
  const payload = load();
  const project = String(req.query.project || '');
  const list = (payload.notes || []).filter((n) => !project || n.project === project);
  res.set('Cache-Control', 'public, max-age=600');
  res.json({
    total: list.length,
    generatedAt: payload.generated_at || null,
    projects: payload.projects || [],
    notes: list.map(({ body, ...rest }) => rest),
  });
});

// ====== GET /api/notes/detail?path=... — 单条全文（已脱敏）======
router.get('/detail', (req, res) => {
  const want = String(req.query.path || '');
  if (!want) return res.status(400).json({ message: 'path required' });
  const payload = load();
  const note = (payload.notes || []).find((n) => n.path === want);
  if (!note) return res.status(404).json({ message: 'note not found' });
  res.set('Cache-Control', 'public, max-age=600');
  res.json(note);
});

module.exports = router;
