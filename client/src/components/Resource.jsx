import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { api } from '../api.js';
import { useMoney, useT } from '../context.js';
import { useFetch } from '../hooks/useFetch.js';
import { Card, Stagger } from './motion.jsx';
import { FormModal, Status } from './ui.jsx';

// Generic list page: fetch, add, edit, delete. `render(item, money)` draws one card.
export default function Resource({ title, path, fields, defaults = {}, header, render }) {
  const money = useMoney();
  const t = useT();
  const { data, loading, error, reload } = useFetch(path);
  const [edit, setEdit] = useState(null);

  const save = (v) => (v.id ? api.put(`${path}/${v.id}`, v) : api.post(path, v));
  const remove = async (item) => {
    if (!confirm(t('Delete this item?'))) return;
    try { await api.del(`${path}/${item.id}`); reload(); } catch (e) { alert(e.message); }
  };

  return (
    <>
      <div className="head"><h2>{t(title)}</h2><motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={() => setEdit({})}>{t('+ Add')}</motion.button></div>
      <Status loading={loading && !data} error={error} empty={data && !data.length}>
        {data && header?.(data, money)}
        <Stagger className="grid">
          <AnimatePresence>
            {data?.map((item) => (
              <Card key={item.id} layout exit={{ opacity: 0, scale: 0.9 }}>
                {render(item, money)}
                <div className="row" style={{ marginTop: 14 }}>
                  <button className="btn ghost sm" onClick={() => setEdit(item)}>{t('Edit')}</button>
                  <button className="btn ghost sm red" onClick={() => remove(item)}>{t('Delete')}</button>
                </div>
              </Card>
            ))}
          </AnimatePresence>
        </Stagger>
      </Status>
      {edit && <FormModal title={t(edit.id ? 'Edit' : 'New')} fields={fields} initial={{ ...defaults, ...edit }} onSave={save} onClose={(ok) => { setEdit(null); ok && reload(); }} />}
    </>
  );
}
