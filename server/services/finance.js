import db from '../db/db.js';

export const currentMonth = () => new Date().toISOString().slice(0, 7);
const round2 = (n) => Math.round(n * 100) / 100;
const PERIOD_TO_MONTH = { month: 1, year: 1 / 12, week: 52 / 12 };
export const withMonthly = (s) => ({ ...s, monthly_cost: round2(s.amount * (PERIOD_TO_MONTH[s.period] ?? 1)) });

export function listTransactions({ type, category, q, month, from, to, sort, dir } = {}) {
  const where = [];
  const params = [];
  const add = (sql, ...p) => { where.push(sql); params.push(...p); };
  if (type) add('type=?', type);
  if (category) add('category=?', category);
  if (q) add('(description LIKE ? OR category LIKE ?)', `%${q}%`, `%${q}%`);
  if (month) add('substr(date,1,7)=?', month);
  if (from) add('date>=?', from);
  if (to) add('date<=?', to);
  const col = ['date', 'amount', 'category'].includes(sort) ? sort : 'date';
  const order = dir === 'asc' ? 'ASC' : 'DESC';
  return db.prepare(`SELECT * FROM transactions ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${col} ${order}, id DESC`).all(...params);
}

export function budgetStatus(month) {
  const rows = db.prepare(`SELECT b.*, COALESCE((SELECT SUM(amount) FROM transactions t
    WHERE t.type='expense' AND t.category=b.category AND substr(t.date,1,7)=?),0) AS spent
    FROM budgets b ORDER BY b.category`).all(month);
  return rows.map((b) => {
    const pct = (b.spent / b.limit_amount) * 100;
    return { ...b, spent: round2(b.spent), remaining: round2(b.limit_amount - b.spent), pct: Math.round(pct), status: pct > 100 ? 'over' : pct >= 80 ? 'warning' : 'ok' };
  });
}

export function dashboard(month = currentMonth()) {
  const sum = (where, ...p) => db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM transactions WHERE ${where}`).get(...p).v;
  const income = sum("type='income' AND substr(date,1,7)=?", month);
  const expenses = sum("type='expense' AND substr(date,1,7)=?", month);
  const savingsRate = income ? Math.round(((income - expenses) / income) * 1000) / 10 : 0;

  const rows = db.prepare(`SELECT substr(date,1,7) month,
    SUM(CASE WHEN type='income' THEN amount ELSE 0 END) income,
    SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) expenses
    FROM transactions GROUP BY month ORDER BY month`).all();
  let running = 0;
  const monthly = rows.map((r) => ({ ...r, saved: round2(r.income - r.expenses), balance: round2((running += r.income - r.expenses)) })).slice(-6);

  const byCategory = db.prepare(`SELECT category name, ROUND(SUM(amount),2) value FROM transactions
    WHERE type='expense' AND substr(date,1,7)=? GROUP BY category ORDER BY value DESC`).all(month);
  const budgets = budgetStatus(month);
  const goals = db.prepare('SELECT * FROM goals ORDER BY id').all();
  const subs = db.prepare('SELECT * FROM subscriptions ORDER BY next_date').all().map(withMonthly);
  const subscriptionsMonthly = round2(subs.reduce((a, s) => a + s.monthly_cost, 0));

  // Financial health: start at 100 and subtract penalties.
  let score = 100;
  score -= Math.min(40, Math.max(0, 20 - savingsRate) * 2);
  score -= Math.min(30, budgets.filter((b) => b.status === 'over').length * 10 + budgets.filter((b) => b.status === 'warning').length * 5);
  if (!goals.some((g) => g.current > 0)) score -= 15;
  if (income && subscriptionsMonthly / income > 0.1) score -= 10;
  score = Math.max(0, Math.round(score));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Attention' : 'Critical';

  return {
    month, income: round2(income), expenses: round2(expenses),
    balance: round2(running), savingsRate,
    savings: round2(goals.reduce((a, g) => a + g.current, 0)),
    monthly, byCategory, budgets, goals, upcoming: subs.slice(0, 5), subscriptionsMonthly,
    health: { score, label },
  };
}
