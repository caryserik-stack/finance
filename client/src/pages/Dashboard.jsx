import { motion } from 'framer-motion';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CountUp, Stagger } from '../components/motion.jsx';
import TxModal from '../components/TxModal.jsx';
import { Progress, Status } from '../components/ui.jsx';
import { useCompact, useMoney, useT } from '../context.js';
import { useFetch } from '../hooks/useFetch.js';

const COLORS = ['#7c5cff', '#16a34a', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316'];
const HEALTH_COLOR = { Excellent: '#16a34a', Good: '#0ea5e9', 'Needs Attention': '#f59e0b', Critical: '#ef4444' };
const TIP = { contentStyle: { borderRadius: 12, border: 'none', background: 'var(--card)', color: 'var(--text)', boxShadow: '0 8px 24px rgba(0,0,0,.15)' } };
const grid = <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />;

const Stat = ({ icon, label, value, format, cls }) => (
  <Card><div className="row"><span className="label">{label}</span><span className="icon">{icon}</span></div>
    <div className={`big ${cls || ''}`}><CountUp value={value} format={format} /></div></Card>
);
const Chart = ({ title, children }) => <Card><b>{title}</b><div style={{ height: 240, marginTop: 10 }}><ResponsiveContainer>{children}</ResponsiveContainer></div></Card>;

export default function Dashboard() {
  const money = useMoney();
  const t = useT();
  const compact = useCompact();
  const { data: d, loading, error, reload } = useFetch('/dashboard');
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="head"><h2>{t('Dashboard')}</h2><motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={() => setAdding(true)}>{t('+ Add Transaction')}</motion.button></div>
      <Status loading={loading && !d} error={error}>
        {d && <>
          <Stagger className="grid stats">
            <Stat icon="💼" label={t('Balance')} value={d.balance} format={money} />
            <Stat icon="📈" label={t('Income (this month)')} value={d.income} format={money} cls="green" />
            <Stat icon="📉" label={t('Expenses (this month)')} value={d.expenses} format={money} cls="red" />
            <Stat icon="🐷" label={t('Savings rate')} value={d.savingsRate} format={(v) => `${v.toFixed(1)}%`} />
            <Stat icon="🏦" label={t('Savings (goals)')} value={d.savings} format={money} />
            <Stat icon="🧾" label={t('Remaining this month')} value={d.income - d.expenses} format={money} />
            <Card className="hero"><div className="label">{t('Financial Health')}</div>
              <div className="big"><CountUp value={d.health.score} format={(v) => `${Math.round(v)}/100`} /></div>
              <span className="badge" style={{ background: HEALTH_COLOR[d.health.label] }}>{t(d.health.label)}</span></Card>
          </Stagger>

          <Stagger className="grid wide">
            <Chart title={t('Income vs Expenses')}><BarChart data={d.monthly}>{grid}<XAxis dataKey="month" /><YAxis width={56} tickFormatter={compact} /><Tooltip {...TIP} formatter={(v) => money(v)} /><Legend /><Bar dataKey="income" name={t('Income')} fill="#16a34a" radius={6} /><Bar dataKey="expenses" name={t('Expenses')} fill="#ef4444" radius={6} /></BarChart></Chart>
            <Chart title={t('Expenses by category')}><PieChart><Pie data={d.byCategory.map((c) => ({ ...c, name: t(c.name) }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3} label={(e) => compact(e.value)}>{d.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip {...TIP} formatter={(v) => money(v)} /></PieChart></Chart>
            <Chart title={t('Balance trend')}><LineChart data={d.monthly}>{grid}<XAxis dataKey="month" /><YAxis width={56} tickFormatter={compact} /><Tooltip {...TIP} formatter={(v) => money(v)} /><Line dataKey="balance" stroke="#7c5cff" strokeWidth={3} dot={{ r: 4 }} /></LineChart></Chart>
            <Chart title={t('Saved per month')}><BarChart data={d.monthly}>{grid}<XAxis dataKey="month" /><YAxis width={56} tickFormatter={compact} /><Tooltip {...TIP} formatter={(v) => money(v)} /><Bar dataKey="saved" fill="#7c5cff" radius={6} /></BarChart></Chart>
          </Stagger>

          <Stagger className="grid wide">
            <Card><b>{t('Budgets')}</b>{d.budgets.length ? d.budgets.map((b) => (
              <div key={b.id}><div className="row"><span>{t(b.category)}</span><span className="label">{money(b.spent)} / {money(b.limit_amount)}</span></div><Progress pct={b.pct} status={b.status} /></div>
            )) : <div className="empty">{t('No budgets')}</div>}</Card>
            <Card><b>{t('Goals')}</b>{d.goals.length ? d.goals.map((g) => (
              <div key={g.id}><div className="row"><span>{g.name}</span><span className="label">{Math.round((g.current / g.target) * 100)}%</span></div><Progress pct={(g.current / g.target) * 100} /></div>
            )) : <div className="empty">{t('No goals')}</div>}</Card>
            <Card><b>{t('Upcoming payments')}</b> <span className="label">({money(d.subscriptionsMonthly)}{t('/mo')})</span>{d.upcoming.length ? d.upcoming.map((s) => (
              <div className="row" key={s.id} style={{ marginTop: 10 }}><span>{s.name}</span><span className="label">{s.next_date} · {money(s.amount)}</span></div>
            )) : <div className="empty">{t('No subscriptions')}</div>}</Card>
          </Stagger>
        </>}
      </Status>
      {adding && <TxModal onClose={(ok) => { setAdding(false); ok && reload(); }} />}
    </>
  );
}
