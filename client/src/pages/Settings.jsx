import { useContext, useState } from 'react';
import { api } from '../api.js';
import { Card, Stagger } from '../components/motion.jsx';
import { AppCtx, useT } from '../context.js';
import { LANGS } from '../i18n.js';

export default function Settings() {
  const { currency, setCurrency, lang, setLang } = useContext(AppCtx);
  const t = useT();
  const [msg, setMsg] = useState('');
  const change = async (value) => {
    try { await api.put('/settings', { currency: value }); setCurrency(value); setMsg(t('Saved')); } catch (e) { setMsg(e.message); }
  };
  return (
    <>
      <div className="head"><h2>{t('Settings')}</h2></div>
      <Stagger className="grid">
        <Card>
          <label><span className="label">{t('Main currency (display only, no conversion)')}</span>
            <select value={currency} onChange={(e) => change(e.target.value)}>{['USD', 'EUR', 'GBP', 'RUB', 'TMT'].map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          {msg && <div className="label" style={{ marginTop: 8 }}>{msg}</div>}
        </Card>
        <Card>
          <label><span className="label">{t('Language')}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>{Object.keys(LANGS).map((l) => <option key={l} value={l}>{{ en: 'English', ru: 'Русский', tk: 'Türkmençe' }[l]}</option>)}</select>
          </label>
        </Card>
      </Stagger>
    </>
  );
}
