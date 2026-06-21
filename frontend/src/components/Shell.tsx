import React from 'react';
import { navigate } from '../router';
import { authRoutes, routeMeta, theme } from '../theme';
import { Badge, Icon } from './UI';

export const AppShell: React.FC<React.PropsWithChildren<{ pathname: string }>> = ({ pathname, children }) => {
  const isAuth = authRoutes.includes(pathname);

  if (isAuth) {
    return <div className="gc-auth-shell">{children}</div>;
  }

  return (
    <div className="gc-app-shell">
      <aside className="gc-sidebar">
        <div className="gc-brand">
          <div className="gc-brand__mark">G</div>
          <div>
            <strong>GreenChain</strong>
            <span>Supply chain intelligence</span>
          </div>
        </div>

        <nav className="gc-nav">
          {routeMeta.map(route => {
            const active = pathname === route.path;
            return (
              <button
                key={route.path}
                className={`gc-nav-item ${active ? 'is-active' : ''}`}
                onClick={() => navigate(route.path)}
              >
                <Icon name={route.icon} size={18} color={active ? theme.colors.primary : theme.colors.textSoft} />
                <span>{route.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="gc-sidebar__footer">
          <Badge tone="green">Live API</Badge>
          <p>Browser React build with the same backend hooks.</p>
        </div>
      </aside>

      <div className="gc-workspace">
        <header className="gc-topbar">
          <div>
            <span className="gc-topbar__eyebrow">Green logistics control center</span>
            <h1>Operational visibility for every shipment</h1>
          </div>

          <div className="gc-topbar__actions">
            <button className="gc-topbar__link" onClick={() => navigate('/auth/login')}>Sign in</button>
            <button className="gc-topbar__link gc-topbar__link--solid" onClick={() => navigate('/auth/register')}>Create account</button>
          </div>
        </header>

        <main className="gc-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export const PageHero: React.FC<{
  title: string;
  subtitle: string;
  icon: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, icon, actions }) => (
  <div className="gc-hero">
    <div className="gc-hero__icon">
      <Icon name={icon} size={24} color="#fff" />
    </div>
    <div className="gc-hero__copy">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
    {actions ? <div className="gc-hero__actions">{actions}</div> : null}
  </div>
);
