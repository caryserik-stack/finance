import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = process.env.DB_FILE ? path.resolve(process.cwd(), process.env.DB_FILE) : path.join(dir, 'finance.db');
const db = new DatabaseSync(file);
db.exec('PRAGMA foreign_keys = ON');

const U = 'user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE';
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN('income','expense')), UNIQUE(name,type));
CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY, ${U},
  type TEXT NOT NULL CHECK(type IN('income','expense')), amount REAL NOT NULL CHECK(amount>0),
  category TEXT NOT NULL, description TEXT DEFAULT '', date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'card', currency TEXT DEFAULT 'USD', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS budgets(id INTEGER PRIMARY KEY, ${U}, category TEXT NOT NULL, limit_amount REAL NOT NULL CHECK(limit_amount>0), UNIQUE(user_id,category));
CREATE TABLE IF NOT EXISTS goals(id INTEGER PRIMARY KEY, ${U}, name TEXT NOT NULL, target REAL NOT NULL CHECK(target>0), current REAL NOT NULL DEFAULT 0, deadline TEXT);
CREATE TABLE IF NOT EXISTS subscriptions(id INTEGER PRIMARY KEY, ${U}, name TEXT NOT NULL, amount REAL NOT NULL CHECK(amount>0), period TEXT NOT NULL DEFAULT 'month' CHECK(period IN('week','month','year')), next_date TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO users(id,name) VALUES(1,'Demo User');
`);

const income = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];
const expense = ['Food', 'Transport', 'Housing', 'Utilities', 'Subscriptions', 'Shopping', 'Health', 'Entertainment', 'Education', 'Travel', 'Other'];
const add = db.prepare('INSERT OR IGNORE INTO categories(name,type) VALUES(?,?)');
income.forEach((n) => add.run(n, 'income'));
expense.forEach((n) => add.run(n, 'expense'));

export default db;
