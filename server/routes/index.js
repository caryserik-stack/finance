import { Router } from 'express';
import db from '../db/db.js';
import crud from './crud.js';
import * as fin from '../services/finance.js';

const api = Router();

// Transactions (+ /income and /expenses shortcuts)
const tx = crud('transactions', ['type', 'amount', 'category', 'description', 'date', 'payment_method', 'currency'], ['type', 'amount', 'category', 'date'], { positive: ['amount'] });
api.get('/transactions', (req, res) => res.json(fin.listTransactions(req.query)));
api.use('/transactions', tx);
for (const [path, type] of [['income', 'income'], ['expenses', 'expense']]) {
  api.get(`/${path}`, (req, res) => res.json(fin.listTransactions({ ...req.query, type })));
  api.post(`/${path}`, (req, res, next) => { req.body = { ...req.body, type }; req.url = '/'; tx(req, res, next); });
}

// Budgets, goals, subscriptions
api.get('/budgets', (req, res) => res.json(fin.budgetStatus(req.query.month || fin.currentMonth())));
api.use('/budgets', crud('budgets', ['category', 'limit_amount'], ['category', 'limit_amount'], { positive: ['limit_amount'] }));
api.use('/goals', crud('goals', ['name', 'target', 'current', 'deadline'], ['name', 'target'], { positive: ['target'] }));
api.get('/subscriptions', (req, res) => res.json(db.prepare('SELECT * FROM subscriptions ORDER BY next_date').all().map(fin.withMonthly)));
api.use('/subscriptions', crud('subscriptions', ['name', 'amount', 'period', 'next_date'], ['name', 'amount', 'next_date'], { positive: ['amount'] }));

// Reference data, dashboard, settings
api.get('/categories', (req, res) => res.json(db.prepare('SELECT name, type FROM categories ORDER BY id').all()));
api.get('/dashboard', (req, res) => res.json(fin.dashboard(req.query.month)));
api.get('/settings', (req, res) => res.json(Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((s) => [s.key, s.value]))));
api.put('/settings', (req, res) => {
  const { currency } = req.body;
  if (currency && !['USD', 'EUR', 'GBP', 'RUB', 'TMT'].includes(currency)) return res.status(400).json({ error: 'Unsupported currency' });
  const up = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  if (currency) up.run('currency', currency);
  res.json({ ok: true });
});

export default api;
