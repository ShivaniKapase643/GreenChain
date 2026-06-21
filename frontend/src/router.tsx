import { useEffect, useMemo, useState } from 'react';

export interface RouteState {
  pathname: string;
  search: string;
  params: Record<string, string>;
}

const normalizePath = (path: string) => {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
};

const parseLocation = (): RouteState => {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', params: {} };
  }

  const pathname = normalizePath(window.location.pathname);
  return {
    pathname,
    search: window.location.search,
    params: {},
  };
};

export const navigate = (to: string) => {
  if (typeof window === 'undefined') return;
  const normalized = normalizePath(to);
  window.history.pushState({}, '', normalized);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export const useRouteState = () => {
  const [state, setState] = useState<RouteState>(parseLocation());

  useEffect(() => {
    const handlePopState = () => setState(parseLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return state;
};

export const useRouteMatcher = (route: string) => {
  const state = useRouteState();

  return useMemo(() => {
    const pathname = state.pathname;

    if (route.includes(':id')) {
      const base = route.split('/:id')[0];
      if (!pathname.startsWith(base + '/')) {
        return { matches: false, params: {} as Record<string, string> };
      }

      const id = pathname.slice(base.length + 1);
      return { matches: Boolean(id), params: { id } };
    }

    return { matches: normalizePath(route) === pathname, params: {} };
  }, [route, state.pathname]);
};
