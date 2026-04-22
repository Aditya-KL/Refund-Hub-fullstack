import { useCallback, useEffect, useState } from 'react';

type UseHistoryViewOptions<T extends string> = {
  stateKey: string;
  defaultView: T;
  validViews: readonly T[];
  buildHash?: (view: T) => string;
  parseHash?: (hash: string) => T | null;
};

const buildUrlWithHash = (hash: string) =>
  `${window.location.pathname}${window.location.search}${hash}`;

export function useHistoryView<T extends string>({
  stateKey,
  defaultView,
  validViews,
  buildHash,
  parseHash,
}: UseHistoryViewOptions<T>) {
  const isValidView = useCallback(
    (value: unknown): value is T =>
      typeof value === 'string' && validViews.includes(value as T),
    [validViews]
  );

  const getViewFromHistoryState = useCallback((): T | null => {
    const value = window.history.state?.[stateKey];
    return isValidView(value) ? value : null;
  }, [isValidView, stateKey]);

  const getViewFromHash = useCallback((): T | null => {
    if (!parseHash) return null;
    const parsed = parseHash(window.location.hash);
    return parsed && isValidView(parsed) ? parsed : null;
  }, [isValidView, parseHash]);

  const [view, setView] = useState<T>(() => {
    return getViewFromHistoryState() ?? getViewFromHash() ?? defaultView;
  });

  useEffect(() => {
    const normalizedView = getViewFromHistoryState() ?? getViewFromHash() ?? view;
    const nextState = { ...(window.history.state || {}), [stateKey]: normalizedView };
    const nextHash = buildHash ? buildHash(normalizedView) : window.location.hash;
    window.history.replaceState(nextState, '', buildUrlWithHash(nextHash));
    if (normalizedView !== view) setView(normalizedView);
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const fromState = event.state?.[stateKey];
      if (isValidView(fromState)) {
        setView(fromState);
        return;
      }

      const fromHash = getViewFromHash();
      setView(fromHash ?? defaultView);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [defaultView, getViewFromHash, isValidView, stateKey]);

  const navigate = useCallback(
    (nextView: T) => {
      if (!isValidView(nextView) || nextView === view) return;
      const nextState = { ...(window.history.state || {}), [stateKey]: nextView };
      const nextHash = buildHash ? buildHash(nextView) : window.location.hash;
      window.history.pushState(nextState, '', buildUrlWithHash(nextHash));
      setView(nextView);
    },
    [buildHash, isValidView, stateKey, view]
  );

  return [view, navigate] as const;
}

