import { useContext } from 'react';
import { api } from '../api.js';
import { AppCtx, useT } from '../context.js';
import { FormModal } from './ui.jsx';

// Add/edit a transaction. Pass `type` to lock it to income or expense.
export default function TxModal({ initial, type, onClose }) {
  const { cats } = useContext(AppCtx);
  const t = useT();
  const fields = [
    ...(type ? [] : [{ name: 'type', label: 'Type', options: () => ['expense', 'income'], resets: 'category', required: true }]),
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    { name: 'category', label: 'Category', options: (v) => cats.filter((c) => c.type === (type || v.type)).map((c) => c.name), required: true },
    { name: 'description', label: 'Description' },
    { name: 'date', label: 'Date', type: 'date', required: true },
  ];
  const start = { type: type || 'expense', date: new Date().toISOString().slice(0, 10), ...initial };
  const save = (v) => (v.id ? api.put(`/transactions/${v.id}`, v) : api.post('/transactions', { ...v, type: type || v.type }));
  return <FormModal title={t(initial?.id ? 'Edit transaction' : 'Add transaction')} fields={fields} initial={start} onSave={save} onClose={onClose} />;
}
