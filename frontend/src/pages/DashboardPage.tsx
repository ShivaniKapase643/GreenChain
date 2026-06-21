import React, { useMemo } from 'react';
import { useShipments } from '../../hooks/useShipments';
import { useAlerts } from '../../hooks/useAlerts';
import { AlertBanner, ShipmentCard } from '../components/Cards';
import { Badge, Card, EmptyState, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';
import { navigate } from '../router';

export const DashboardPage: React.FC = () => {
  const { shipments, loading, refetch } = useShipments();
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts();

  const visibleAlerts = useMemo(
    () => alerts.filter(alert => !alert.is_read).slice(0, 3),
    [alerts],
  );

  return (
    <div className="gc-page">
      <PageHero
        title="GreenChain Dashboard"
        subtitle="Real-time shipment tracking, alerts, and sustainability progress."
        icon="local_shipping"
        actions={
          <>
            <Badge tone={unreadCount > 0 ? 'amber' : 'green'}>{unreadCount} unread alerts</Badge>
            <button className="gc-button gc-button--secondary" onClick={() => refetch()}>Refresh</button>
          </>
        }
      />

      <div className="gc-grid gc-grid--stats">
        <Card>
          <div className="gc-stat">
            <span>Active shipments</span>
            <strong>{shipments.length}</strong>
          </div>
        </Card>
        <Card>
          <div className="gc-stat">
            <span>Open alerts</span>
            <strong>{unreadCount}</strong>
          </div>
        </Card>
        <Card>
          <div className="gc-stat">
            <span>Refresh cadence</span>
            <strong>30 sec</strong>
          </div>
        </Card>
      </div>

      <Card className="gc-panel gc-panel--soft">
        <SectionTitle
          title="Notifications"
          subtitle="Prioritize shipments that need attention now."
          icon="notifications_active"
          action={unreadCount > 0 ? <button className="gc-link-button" onClick={markAllAsRead}>Mark all read</button> : null}
        />

        {loading && shipments.length === 0 ? (
          <div className="gc-inline-state">Loading alerts...</div>
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
        subtitle={`${shipments.length} active shipments in view`}
        icon="inventory_2"
      />

      <div className="gc-stack">
        {loading && shipments.length === 0 ? (
          <Card><div className="gc-inline-state">Loading shipments...</div></Card>
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
