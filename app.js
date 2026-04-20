import express from 'express';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ALLOWED_TABLES = new Set([
  'categories', 'projects', 'income_sources', 'expenses', 'incomes', 'budgets'
]);

export const TABLE_COLS = {
  categories:     ['name', 'icon', 'color'],
  projects:       ['name', 'description', 'color'],
  income_sources: ['name', 'color'],
  expenses:       ['amount', 'description', 'date', 'category_id', 'project_id', 'notes'],
  incomes:        ['amount', 'description', 'date', 'source_id', 'notes'],
  budgets:        ['category_id', 'amount', 'month', 'year'],
};

export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT DEFAULT '📦',
    color TEXT DEFAULT '#6366f1',
    created TEXT DEFAULT (datetime('now')), updated TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created TEXT DEFAULT (datetime('now')), updated TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS income_sources (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT DEFAULT '#22c55e',
    created TEXT DEFAULT (datetime('now')), updated TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY, amount REAL NOT NULL, description TEXT, date TEXT,
    category_id TEXT, project_id TEXT, notes TEXT,
    created TEXT DEFAULT (datetime('now')), updated TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS incomes (
    id TEXT PRIMARY KEY, amount REAL NOT NULL, description TEXT, date TEXT,
    source_id TEXT, notes TEXT,
    created TEXT DEFAULT (datetime('now')), updated TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY, category_id TEXT, amount REAL NOT NULL,
    month INTEGER NOT NULL, year INTEGER NOT NULL,
    created TEXT DEFAULT (datetime('now')), updated TEXT DEFAULT (datetime('now'))
  );
`;

export function parseFilter(filter) {
  if (!filter) return { where: '', params: [] };
  const clean = filter.replace(/^\(|\)$/g, '');
  const parts = [], params = [];
  for (const cond of clean.split('&&').map(s => s.trim())) {
    const m = cond.match(/^(\w+)\s*(>=|<=|!=|=|>|<)\s*'?([^']*)'?$/);
    if (!m) continue;
    const [, field, op, raw] = m;
    parts.push(`${field} ${op} ?`);
    params.push(raw !== '' && !isNaN(raw) ? Number(raw) : raw);
  }
  return { where: parts.length ? 'WHERE ' + parts.join(' AND ') : '', params };
}

export function parseSort(sort) {
  if (!sort) return '';
  const field = sort.startsWith('-') ? sort.slice(1) : sort;
  if (!/^\w+$/.test(field)) return '';
  return `ORDER BY ${field} ${sort.startsWith('-') ? 'DESC' : 'ASC'}`;
}

function newId() {
  return randomUUID().replace(/-/g, '').slice(0, 15);
}

export function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(__dirname));

  app.get('/api/collections/:col/records', (req, res) => {
    const { col } = req.params;
    if (!ALLOWED_TABLES.has(col)) return res.status(404).json({ error: 'Not found' });
    const { filter, sort, perPage = 500 } = req.query;
    const { where, params } = parseFilter(filter);
    const order = parseSort(sort);
    try {
      const items = db.prepare(`SELECT * FROM ${col} ${where} ${order} LIMIT ?`).all(...params, Number(perPage));
      res.json({ items, totalItems: items.length, page: 1, perPage: Number(perPage), totalPages: 1 });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/collections/:col/records', (req, res) => {
    const { col } = req.params;
    if (!ALLOWED_TABLES.has(col)) return res.status(404).json({ error: 'Not found' });
    const data = { id: newId() };
    for (const key of TABLE_COLS[col]) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const keys = Object.keys(data);
    try {
      db.prepare(`INSERT INTO ${col} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...Object.values(data));
      res.status(201).json(db.prepare(`SELECT * FROM ${col} WHERE id = ?`).get(data.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/collections/:col/records/:id', (req, res) => {
    const { col, id } = req.params;
    if (!ALLOWED_TABLES.has(col)) return res.status(404).json({ error: 'Not found' });
    const updates = {};
    for (const key of TABLE_COLS[col]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
    const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    try {
      db.prepare(`UPDATE ${col} SET ${sets}, updated = datetime('now') WHERE id = ?`).run(...Object.values(updates), id);
      res.json(db.prepare(`SELECT * FROM ${col} WHERE id = ?`).get(id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/collections/:col/records/:id', (req, res) => {
    const { col, id } = req.params;
    if (!ALLOWED_TABLES.has(col)) return res.status(404).json({ error: 'Not found' });
    try {
      db.prepare(`DELETE FROM ${col} WHERE id = ?`).run(id);
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return app;
}
