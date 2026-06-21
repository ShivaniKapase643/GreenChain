import React, { useEffect, useMemo } from 'react';
import { useShipments } from '../../hooks/useShipments';
import { useAlerts } from '../../hooks/useAlerts';
import { AlertBanner, ShipmentCard } from '../components/Cards';
import { Badge, Card, EmptyState, Icon, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';
import { useToast } from '../components/Toast';
import { navigate } from '../router';
import { theme } from '../theme';
import { notificationService } from '../../lib/notifications';

const QUICK_ACTIONS: Array<{ icon: string; title: string; subtitle: string; path: string; toast?: string }> = [
  { icon: 'map', title: 'Live Map', subtitle: 'Track shipments in real time', path: '/map' },
  { icon: 'eco', title: 'Emissions', subtitle: 'Monitor CO₂ output', path: '/emissions' },
  { icon: 'analytics', title: 'Analytics', subtitle: 'Trends and benchmarks', path: '/analytics' },
  { icon: 'psychology', title: 'AI Insights', subtitle: 'Ask questions, get answers', path: '/insights' },
  { icon: 'smart_toy', title: 'ML Models', subtitle: '7 predictive engines', path: '/ml' },
  { icon: 'star', title: 'Green Score', subtitle: 'Credits and milestones', path: '/score' },
  { icon: 'add_circle', title: 'New Shipment', subtitle: 'Plan a route', path: '/map', toast: 'Open the Live Map and pick origin/destination markers to plan a new run.' },
  { icon: 'download', title: 'Export Report', subtitle: 'Fleet summary CSV', path: '/analytics', toast: 'Heading to Analytics — fleet summary export will be wired here.' },
];

export const DashboardPage: React.FC = () => {
  const { shipments, loading, refetch } = useShipments();
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts();
  const toast = useToast();

  // Subscribe to push-style alerts and surface them as in-app toasts
  useEffect(() => {
    const sub = notificationService.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (data?.type !== 'alert') return;
      const severity = String(data.severity ?? 'low');
      const tone = severity === 'critical' || severity === 'high'
        ? 'error'
        : severity === 'medium'
          ? 'warning'
          : 'info';
      toast.show({
        tone,
        title: `${severity.toUpperCase()} · ${data.shipment_id}`,
        message: String(data.message ?? 'New alert'),
        duration: 6000,
      });
    });
    return () => sub.remove();
  }, [toast]);

  const visibleAlerts = useMemo(
    () => alerts.filter(alert => !alert.is_read).slice(0, 3),
    [alerts],
  );

  const stats = useMemo(() => {
    const active = shipments.filter(s => s.status === 'in_transit').length;
    const completed = shipments.filter(s => s.status === 'completed').length;
    const totalCO2 = shipments.reduce((sum, s) => sum + (s.total_co2_kg ?? 0), 0);
    const avgGreen = shipments.length > 0
      ? shipments.reduce((sum, s) => sum + (s.green_score_value ?? 0), 0) / shipments.length
      : 0;
    return { active, completed, totalCO2, avgGreen };
  }, [shipments]);

  return (
    <div className="gc-page">
      <PageHero
        title="GreenChain Dashboard"
        subtitle="Real-time shipment tracking, alerts, and sustainability progress."
        icon="dashboard"
        actions={
          <>
            <Badge tone={unreadCount > 0 ? 'amber' : 'green'}>{unreadCount} unread alerts</Badge>
            <button
              className="gc-button gc-button--secondary"
              onClick={() => {
                refetch();
                toast.info('Pulling latest shipment data…', 'Refreshing');
              }}
            >
              <Icon name="refresh" size={14} color={theme.colors.primaryDeep} />
              Refresh
            </button>
          </>
        }
      />

      <div className="gc-kpi-strip">
        <div className="gc-kpi">
          <div className="gc-kpi__label"><Icon name="local_shipping" size={14} color={theme.colors.primaryDeep} />Total shipments</div>
          <div className="gc-kpi__value">{shipments.length}</div>
          <div className="gc-kpi__sub">{stats.active} live · {stats.completed} done</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label"><Icon name="eco" size={14} color={theme.colors.primaryDeep} />Fleet CO₂</div>
          <div className="gc-kpi__value">{stats.totalCO2.toFixed(0)} kg</div>
          <div className="gc-kpi__sub">across all live shipments</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label"><Icon name="star" size={14} color={theme.colors.primaryDeep} />Avg green score</div>
          <div className="gc-kpi__value">{stats.avgGreen.toFixed(1)}</div>
          <div className="gc-kpi__sub">out of 100</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label"><Icon name="notifications_active" size={14} color={theme.colors.primaryDeep} />Open alerts</div>
          <div className="gc-kpi__value">{unreadCount}</div>
          <div className="gc-kpi__sub">need attention</div>
        </div>
      </div>

      <Card>
        <SectionTitle title="Quick actions" subtitle="Jump straight into the workflow you need." icon="bolt" />
        <div className="gc-action-grid">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.title}
              className="gc-action-tile"
              onClick={() => {
                if (action.toast) {
                  toast.info(action.toast, action.title);
                }
                navigate(action.path);
              }}
            >
              <div className="gc-action-tile__icon">
                <Icon name={action.icon} size={20} color={theme.colors.primaryDeep} />
              </div>
              <div>
                <strong>{action.title}</strong>
                <span>{action.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Notifications"
          subtitle="Prioritize shipments that need attention now."
          icon="notifications_active"
          action={unreadCount > 0 ? (
            <button
              className="gc-link-button"
              onClick={() => {
                markAllAsRead();
                toast.success('All alerts marked as read.', 'Inbox cleared');
              }}
            >
              Mark all read
            </button>
          ) : null}
        />

        {loading && shipments.length === 0 ? (
          <div className="gc-inline-state">Loading alerts…</div>
        ) : visibleAlerts.length === 0 ? (
          <EmptyState title="No active alerts" subtitle="Everything is calm right now." icon="task_alt" />
        ) : (
          <div className="gc-stack">
            {visibleAlerts.map(alert => (
              <AlertBanner
                key={alert.id}
                alert={alert}
                onDismiss={markAsRead}
                onClick={id => {
                  markAsRead(id);
                  navigate(`/shipment/${alert.shipment_id}`);
                }}
              />
            ))}
          </div>
        )}
      </Card>

      <SectionTitle
        title="Shipments"
        subtitle={`${shipments.length} shipments in view`}
        icon="inventory_2"
        action={
          <button className="gc-link-button" onClick={() => navigate('/map')}>
            View on map →
          </button>
        }
      />

      <div className="gc-stack">
        {loading && shipments.length === 0 ? (
          <Card><div className="gc-inline-state">Loading shipments…</div></Card>
        ) : shipments.length === 0 ? (
          <Card><EmptyState title="No shipments available" subtitle="Connect the backend seed or try again shortly." icon="local_shipping" /></Card>
        ) : (
          shipments.map(shipment => (
            <ShipmentCard key={shipment.id} shipment={shipment} onClick={() => navigate(`/shipment/${shipment.shipment_id}`)} />
          ))
        )}
      </div>
    </div>
  );
};
