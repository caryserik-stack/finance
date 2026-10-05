import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useState } from 'react';
import { api } from '../api.js';
import TxModal from '../components/TxModal.jsx';
import { Status } from '../components/ui.jsx';
import { AppCtx, useMoney, useT } from '../context.js';
import { useFetch } from '../hooks/useFetch.js';

const PAGE_SIZE = 10;

// One page for all transactions, or only income / expenses when `type` is set.
export default function Transactions({ type, title }) {
  const money = useMoney();
  const t = useT();
  const { cats } = useContext(AppCtx);
  const [f, setF] = useState({ q: '', type: '', category: '', month: '', sort: 'date', dir: 'desc' });
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState(null);

  const activeType = type || f.type;
  const params = new URLSearchParams(Object.entries({ ...f, type: activeType }).filter(([, v]) => v));
  const { data, loading, error, reload } = useFetch('/transactions?' + params);

  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setPage(0); };
  const rows = (data || []).slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.ceil((data?.length || 0) / PAGE_SIZE);
  const catNames = [...new Set(cats.filter((c) => !activeType || c.type === activeType).map((c) => c.name))];

  const remove = async (x) => {
    if (!confirm(t('Delete this transaction?'))) return;
    try { await api.del(`/transactions/${x.id}`); reload(); } catch (e) { alert(e.message); }
  };

  return (
    <>
      <div className="head"><h2>{t(title)}</h2><motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={() => setEdit({})}>{t('+ Add Transaction')}</motion.button></div>
      <div className="card">
        <div className="filters">
          <input className="f-search" placeholder={t('Search…')} value={f.q} onChange={(e) => set('q', e.target.value)} />
          {!type && <select value={f.type} onChange={(e) => set('type', e.target.value)}><option value="">{t('All types')}</option><option value="income">{t('income')}</option><option value="expense">{t('expense')}</option></select>}
          <select value={f.category} onChange={(e) => set('category', e.target.value)}><option value="">{t('All categories')}</option>{catNames.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select>
          <input type="month" value={f.month} onChange={(e) => set('month', e.target.value)} />
          <button className="btn ghost" onClick={() => set('month', new Date().toISOString().slice(0, 7))}>{t('This month')}</button>
          <select value={`${f.sort}:${f.dir}`} onChange={(e) => { const [s, d] = e.target.value.split(':'); setF((p) => ({ ...p, sort: s, dir: d })); }}>
            <option value="date:desc">{t('Newest first')}</option><option value="date:asc">{t('Oldest first')}</option>
            <option value="amount:desc">{t('Amount ↓')}</option><option value="amount:asc">{t('Amount ↑')}</option>
          </select>
        </div>
        <Status loading={loading && !data} error={error} empty={data && !data.length}>
          <div className="scroll"><table className="tx">
            <thead><tr>{['Date', 'Type', 'Category', 'Description', 'Amount', 'Actions'].map((h) => <th key={h}>{t(h)}</th>)}</tr></thead>
            <tbody><AnimatePresence initial={false}>{rows.map((x) => (
              <motion.tr key={x.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <td className="c-date">{x.date}</td>
                <td className="c-type"><span className={`pill-tag ${x.type}`}>{t(x.type)}</span></td>
                <td className="c-cat">{t(x.category)}</td>
                <td className="c-desc">{x.description}</td>
                <td className={`c-amt ${x.type === 'income' ? 'green' : 'red'}`}><b>{x.type === 'income' ? '+' : '−'}{money(x.amount)}</b></td>
                <td className="c-act"><button className="btn ghost sm" onClick={() => setEdit(x)}>{t('Edit')}</button> <button className="btn ghost sm red" onClick={() => remove(x)}>{t('Delete')}</button></td>
              </motion.tr>
            ))}</AnimatePresence></tbody>
          </table></div>
          {pages > 1 && <div className="row" style={{ marginTop: 14 }}>
            <button className="btn ghost sm" disabled={page === 0} onClick={() => setPage(page - 1)}>{t('← Prev')}</button>
            <span className="label">{t('Page')} {page + 1} / {pages}</span>
            <button className="btn ghost sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>{t('Next →')}</button>
          </div>}
        </Status>
      </div>
      {edit && <TxModal type={edit.id ? undefined : type} initial={edit} onClose={(ok) => { setEdit(null); ok && reload(); }} />}
    </>
  );
}
