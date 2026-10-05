import db from './db.js';

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const monthsAgo = (m, day) => {
  const maxDay = m === 0 ? today.getDate() : 28;
  return iso(new Date(Date.UTC(today.getFullYear(), today.getMonth() - m, Math.min(day, maxDay))));
};
const inDays = (n) => iso(new Date(Date.now() + n * 864e5));

db.exec('DELETE FROM transactions; DELETE FROM budgets; DELETE FROM goals; DELETE FROM subscriptions;');
const addTx = db.prepare('INSERT INTO transactions(type,amount,category,description,date,payment_method) VALUES(?,?,?,?,?,?)');

db.exec('BEGIN');
(() => {
  for (let m = 0; m < 6; m++) {
    const k = 1 - (m % 3) * 0.07; // small variation between months
    addTx.run('income', 5000, 'Salary', 'Monthly salary', monthsAgo(m, 1), 'bank');
    if (m % 2 === 0) addTx.run('income', 800, 'Freelance', 'Freelance project', monthsAgo(m, 10), 'bank');
    addTx.run('income', 200, 'Investment', 'Dividends', monthsAgo(m, 15), 'bank');
    addTx.run('expense', 1500, 'Housing', 'Rent', monthsAgo(m, 3), 'bank');
    for (const d of [5, 12, 20]) addTx.run('expense', Math.round(150 * k), 'Food', 'Groceries', monthsAgo(m, d), 'card');
    addTx.run('expense', Math.round(200 * k), 'Transport', 'Transport', monthsAgo(m, 8), 'card');
    addTx.run('expense', 80, 'Subscriptions', 'Streaming & apps', monthsAgo(m, 6), 'card');
    addTx.run('expense', Math.round(250 * k), 'Entertainment', 'Cinema & games', monthsAgo(m, 18), 'card');
    addTx.run('expense', Math.round(300 * k), 'Shopping', 'Clothes', monthsAgo(m, 22), 'card');
  }
  const budget = db.prepare('INSERT INTO budgets(category,limit_amount) VALUES(?,?)');
  [['Food', 500], ['Transport', 200], ['Entertainment', 150], ['Shopping', 300], ['Housing', 1600]].forEach((b) => budget.run(...b));

  const goal = db.prepare('INSERT INTO goals(name,target,current,deadline) VALUES(?,?,?,?)');
  goal.run('New Car', 20000, 7500, '2027-12-01');
  goal.run('Emergency Fund', 5000, 3200, '2027-03-01');

  const sub = db.prepare('INSERT INTO subscriptions(name,amount,period,next_date) VALUES(?,?,?,?)');
  [['Netflix', 15.99, 'month', 3], ['Spotify', 10.99, 'month', 7], ['YouTube Premium', 13.99, 'month', 11], ['GitHub', 4, 'month', 15], ['iCloud', 2.99, 'month', 20]]
    .forEach(([n, a, p, d]) => sub.run(n, a, p, inDays(d)));
})();
db.exec('COMMIT');

console.log('Seed complete');
