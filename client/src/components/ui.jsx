import { motion } from 'framer-motion';
import { useState } from 'react';
import { useT } from '../context.js';

export function Empty({ children }) {
  const t = useT();
  return (
    <motion.div className="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <div style={{ fontSize: 40 }}>🪙</div>{children ?? t('Nothing here yet')}
    </motion.div>
  );
}

// Skeleton while loading, error text, empty state, otherwise children.
export function Status({ loading, error, empty, children }) {
  if (loading) return <div className="grid">{[1, 2, 3].map((i) => <div key={i} className="card skeleton" />)}</div>;
  if (error) return <div className="empty err">{error}</div>;
  if (empty) return <Empty />;
  return children;
}

export const Progress = ({ pct, status = 'ok' }) => (
  <div className={`bar ${status}`}>
    <motion.i initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
  </div>
);

// Generic form modal. field: {name,label,type,options(v)=>[],required,min,resets}
export function FormModal({ title, fields, initial, onSave, onClose }) {
  const t = useT();
  const [v, setV] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (f, value) => setV((p) => ({ ...p, [f.name]: value, ...(f.resets ? { [f.resets]: '' } : {}) }));

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...v };
    for (const f of fields) {
      const x = v[f.name];
      if (f.required && (x === '' || x == null)) return setError(t('{0} is required', t(f.label)));
      if (f.type === 'number' && x !== '' && x != null) {
        if (Number(x) < (f.min ?? 0.01)) return setError(t(f.min === 0 ? '{0} must be 0 or more' : '{0} must be greater than 0', t(f.label)));
        if (Number(x) > 1e9) return setError(t('{0} must not exceed {1}', t(f.label), '1 000 000 000'));
        payload[f.name] = Number(x);
      }
    }
    setBusy(true);
    try { await onSave(payload); onClose(true); } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <motion.div className="modal" onClick={() => onClose(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.form className="card" onClick={(e) => e.stopPropagation()} onSubmit={submit}
        initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
        <h3>{title}</h3>
        {fields.map((f) => (
          <label key={f.name}><span className="label">{t(f.label)}</span>
            {f.options ? (
              <select value={v[f.name] ?? ''} onChange={(e) => change(f, e.target.value)}>
                <option value="">{t('Select…')}</option>
                {f.options(v).map((o) => <option key={o} value={o}>{t(o)}</option>)}
              </select>
            ) : (
              <input type={f.type || 'text'} step="any" value={v[f.name] ?? ''} onChange={(e) => change(f, e.target.value)} />
            )}
          </label>
        ))}
        {error && <motion.div className="err" initial={{ x: -8 }} animate={{ x: 0 }}>{error}</motion.div>}
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => onClose(false)}>{t('Cancel')}</button>
          <motion.button whileTap={{ scale: 0.95 }} className="btn" disabled={busy}>{busy ? t('Saving…') : t('Save')}</motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
