import { createContext, useContext } from 'react';
import { dict } from './i18n.js';

export const AppCtx = createContext({ cats: [], currency: 'USD', setCurrency() {}, lang: 'en', setLang() {} });

const LOCALES = { en: 'en-US', ru: 'ru-RU', tk: 'tk-TM' };
const TMT_SUFFIX = { en: 'TMT', ru: 'ман.', tk: 'm' }; // Turkmen manat
const COMPACT = { notation: 'compact', maximumFractionDigits: 1 };
const num = (lang, opts) => new Intl.NumberFormat(LOCALES[lang], opts);

// t('key', ...args): translates, replacing {0}, {1}… with args. Unknown keys are shown as-is.
export const useT = () => {
  const { lang } = useContext(AppCtx);
  return (key, ...args) => args.reduce((s, v, i) => s.replace(`{${i}}`, v), dict[lang]?.[key] ?? key);
};

// Formats money in the selected currency. Values >= 1e9 are shortened (e.g. $1.2B) so they never overflow the UI.
export const useMoney = () => {
  const { currency, lang } = useContext(AppCtx);
  return (n = 0) => {
    const big = Math.abs(n) >= 1e9;
    if (currency === 'TMT') {
      return `${num(lang, big ? COMPACT : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} ${TMT_SUFFIX[lang]}`;
    }
    return num(lang, { style: 'currency', currency, ...(big ? COMPACT : {}) }).format(n);
  };
};

// Short numbers for chart axes and labels.
export const useCompact = () => {
  const { lang } = useContext(AppCtx);
  const fmt = num(lang, COMPACT);
  return (n) => fmt.format(n);
};
