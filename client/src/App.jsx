import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { AppCtx, useT } from './context.js';
import { LANGS } from './i18n.js';
import Dashboard from './pages/Dashboard.jsx';
import { Budgets, Goals, Subscriptions } from './pages/Lists.jsx';
import Settings from './pages/Settings.jsx';
import Transactions from './pages/Transactions.jsx';

const NAV = [['/', 'Dashboard', '🏠'], ['/transactions', 'Transactions', '🔁'], ['/income', 'Income', '📈'], ['/expenses', 'Expenses', '📉'], ['/budgets', 'Budgets', '🎯'], ['/goals', 'Goals', '🏆'], ['/subscriptions', 'Subscriptions', '🔔'], ['/settings', 'Settings', '⚙️']];

function Shell({ theme, setTheme }) {
  const t = useT();
  const { lang, setLang } = useContext(AppCtx);
  const location = useLocation();
  return (
    <div className="app">
      <nav className="side">
        <div className="logo">💰 <span>Finance</span></div>
        {NAV.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => <>{isActive && <motion.span layoutId="pill" className="pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}<span className="nav-label">{icon} {t(label)}</span></>}
          </NavLink>
        ))}
        <div className="side-foot">
          <div className="seg">{Object.entries(LANGS).map(([k, label]) => <button key={k} className={lang === k ? 'on' : ''} onClick={() => setLang(k)}>{label}</button>)}</div>
          <motion.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? `🌙 ${t('Dark')}` : `☀️ ${t('Light')}`}</motion.button>
        </div>
      </nav>
      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions title="Transactions" />} />
              <Route path="/income" element={<Transactions type="income" title="Income" />} />
              <Route path="/expenses" element={<Transactions type="expense" title="Expenses" />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [cats, setCats] = useState([]);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; localStorage.setItem('lang', lang); }, [lang]);
  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/settings')])
      .then(([c, s]) => { setCats(c); if (s.currency) setCurrency(s.currency); })
      .catch(console.error);
  }, []);

  return (
    <AppCtx.Provider value={{ cats, currency, setCurrency, lang, setLang }}>
      <Shell theme={theme} setTheme={setTheme} />
    </AppCtx.Provider>
  );
}
