import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    api.get(path).then((data) => setState({ data, loading: false, error: '' })).catch((e) => setState({ data: null, loading: false, error: e.message }));
  }, [path]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}
