import { useContext } from 'react';
import Resource from '../components/Resource.jsx';
import { Progress } from '../components/ui.jsx';
import { AppCtx, useT } from '../context.js';

export function Budgets() {
  const { cats } = useContext(AppCtx);
  const t = useT();
  const fields = [
    { name: 'category', label: 'Category', required: true, options: () => cats.filter((c) => c.type === 'expense').map((c) => c.name) },
    { name: 'limit_amount', label: 'Monthly limit', type: 'number', required: true },
  ];
  return (
    <Resource title="Budgets (this month)" path="/budgets" fields={fields} render={(b, money) => (
      <>
        <div className="row"><b>{t(b.category)}</b>{b.status !== 'ok' && <span className={`pill-tag ${b.status}`}>{t(b.status === 'over' ? 'Over budget' : 'Near limit')}</span>}</div>
        <Progress pct={b.pct} status={b.status} />
        <div className="label">{t('Spent')} {money(b.spent)} · {t('Limit')} {money(b.limit_amount)} · {t('Left')} {money(b.remaining)}</div>
      </>
    )} />
  );
}

const monthsLeft = (deadline) => (deadline ? Math.max(1, Math.ceil((new Date(deadline) - Date.now()) / (30.44 * 864e5))) : 1);

export function Goals() {
  const t = useT();
  const fields = [
    { name: 'name', label: 'Name', required: true },
    { name: 'target', label: 'Target', type: 'number', required: true },
    { name: 'current', label: 'Saved so far', type: 'number', min: 0 },
    { name: 'deadline', label: 'Deadline', type: 'date' },
  ];
  return (
    <Resource title="Goals" path="/goals" fields={fields} defaults={{ current: 0 }} render={(g, money) => {
      const pct = Math.round((g.current / g.target) * 100);
      const left = Math.max(0, g.target - g.current);
      return (
        <>
          <div className="row"><b>{g.name}</b><span className="big sm">{pct}%</span></div>
          <Progress pct={pct} />
          <div className="label">{money(g.current)} / {money(g.target)} · {money(left)} {t('left')}</div>
          {g.deadline && <div className="label">{t('By')} {g.deadline} · {t('Save {0}/month', money(left / monthsLeft(g.deadline)))}</div>}
        </>
      );
    }} />
  );
}

export function Subscriptions() {
  const t = useT();
  const fields = [
    { name: 'name', label: 'Name', required: true },
    { name: 'amount', label: 'Cost', type: 'number', required: true },
    { name: 'period', label: 'Period', options: () => ['week', 'month', 'year'], required: true },
    { name: 'next_date', label: 'Next payment', type: 'date', required: true },
  ];
  return (
    <Resource title="Subscriptions" path="/subscriptions" fields={fields} defaults={{ period: 'month' }}
      header={(items, money) => <div className="card hero"><span className="label">{t('Total per month')}</span><div className="big">{money(items.reduce((a, s) => a + s.monthly_cost, 0))}</div></div>}
      render={(s, money) => (
        <>
          <div className="row"><b>{s.name}</b><span>{money(s.amount)} / {t(s.period)}</span></div>
          <div className="label">{t('Next payment')}: {s.next_date}</div>
        </>
      )} />
  );
}
