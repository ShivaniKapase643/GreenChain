import React from 'react';
import { AppShell } from './components/Shell';
import { useRouteState } from './router';
import { DashboardPage } from './pages/DashboardPage';
import { EmissionsPage } from './pages/EmissionsPage';
import { InsightsPage } from './pages/InsightsPage';
import { MapPage } from './pages/MapPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MLPage } from './pages/MLPage';
import { ScorePage } from './pages/ScorePage';
import { ShipmentPage } from './pages/ShipmentPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { Card, EmptyState } from './components/UI';

const NotFoundPage: React.FC = () => (
  <div className="gc-page">
    <Card>
      <EmptyState title="Page not found" subtitle="The route you requested does not exist." icon="search_off" />
    </Card>
  </div>
);

export const App: React.FC = () => {
  const { pathname } = useRouteState();

  let page: React.ReactNode;
  if (pathname === '/') {
    page = <DashboardPage />;
  } else if (pathname === '/emissions') {
    page = <EmissionsPage />;
  } else if (pathname === '/insights') {
    page = <InsightsPage />;
  } else if (pathname === '/map') {
    page = <MapPage />;
  } else if (pathname === '/analytics') {
    page = <AnalyticsPage />;
  } else if (pathname === '/ml') {
    page = <MLPage />;
  } else if (pathname === '/score') {
    page = <ScorePage />;
  } else if (pathname === '/auth/login') {
    page = <LoginPage />;
  } else if (pathname === '/auth/register') {
    page = <RegisterPage />;
  } else if (pathname.startsWith('/shipment/')) {
    page = <ShipmentPage shipmentId={pathname.replace('/shipment/', '')} />;
  } else {
    page = <NotFoundPage />;
  }

  return <AppShell pathname={pathname}>{page}</AppShell>;
};
