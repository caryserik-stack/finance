import { Router } from 'express';
import db from '../db/db.js';

const MAX_AMOUNT = 1e9;

// Generic REST CRUD for a table. `positive` lists fields that must be numbers > 0.
export default function crud(table, fields, required, { positive = [] } = {}) {
  const router = Router();
  const clean = (b) => Object.fromEntries(fields.filter((f) => b[f] !== undefined && b[f] !== '').map((f) => [f, b[f]]));
  const find = (id) => db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id);
  const validate = (d, isNew) => {
    const missing = isNew ? required.filter((f) => d[f] === undefined) : [];
    if (missing.length) return `Required: ${missing.join(', ')}`;
    const bad = positive.find((f) => d[f] !== undefined && !(Number(d[f]) > 0));
    if (bad) return `${bad} must be a positive number`;
    const big = ['amount', 'limit_amount', 'target', 'current'].find((f) => Number(d[f]) > MAX_AMOUNT);
    return big ? `${big} must not exceed ${MAX_AMOUNT}` : null;
  };

  router.get('/', (req, res) => res.json(db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all()));

  router.post('/', (req, res) => {
    const data = clean(req.body);
    const error = validate(data, true);
    if (error) return res.status(400).json({ error });
    const keys = Object.keys(data);
    const info = db.prepare(`INSERT INTO ${table}(${keys}) VALUES(${keys.map((k) => '@' + k)})`).run(data);
    res.status(201).json(find(info.lastInsertRowid));
  });

  router.put('/:id', (req, res) => {
    if (!find(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const data = clean(req.body);
    const error = validate(data, false);
    if (error) return res.status(400).json({ error });
    const keys = Object.keys(data);
    if (keys.length) db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k}=@${k}`)} WHERE id=@id`).run({ ...data, id: req.params.id });
    res.json(find(req.params.id));
  });

  router.delete('/:id', (req, res) => {
    const { changes } = db.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id);
    changes ? res.status(204).end() : res.status(404).json({ error: 'Not found' });
  });

  return router;
}
