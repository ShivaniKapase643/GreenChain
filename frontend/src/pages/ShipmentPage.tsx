import React, { useEffect, useState } from 'react';
import { useShipments } from '../../hooks/useShipments';
import { apiService } from '../../lib/api';
import { ShipmentCard } from '../components/Cards';
import { GaugeCard } from '../components/Charts';
import { RouteCompareModal, type RouteAlternative } from '../components/Modal';
import { Card, EmptyState, Icon, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';
import { navigate } from '../router';
import { theme } from '../theme';

export const ShipmentPage: React.FC<{ shipmentId: string }> = ({ shipmentId }) => {
  const { shipments, loading } = useShipments();
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeAlternatives, setRouteAlternatives] = useState<RouteAlternative[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  const shipment = shipments.find(item => item.shipment_id === shipmentId) ?? null;

  useEffect(() => {
    if (!showRouteModal || !shipmentId) {
      return;
    }

    let cancelled = false;
    setLoadingAlternatives(true);
    apiService.getRouteAlternatives(shipmentId).then(response => {
      if (cancelled) return;
      setLoadingAlternatives(false);
      if (response.success && response.data) {
        setRouteAlternatives(Array.isArray(response.data) ? response.data : []);
      } else {
        setRouteAlternatives([]);
      }
    }).catch(() => {
      if (!cancelled) {
        setLoadingAlternatives(false);
        setRouteAlternatives([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showRouteModal, shipmentId]);

  if (loading && !shipment) {
    return (
      <div className="gc-page">
        <PageHero title="Shipment Details" subtitle="Loading shipment..." icon="inventory_2" />
        <Card><div className="gc-inline-state">Loading shipment details...</div></Card>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="gc-page">
        <PageHero title="Shipment Details" subtitle="Not found" icon="inventory_2" />
        <Card>
          <EmptyState
            title="Shipment not found"
            subtitle={shipmentId ? `No shipment with ID "${shipmentId}"` : 'No shipment ID provided'}
            icon="package_2"
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button className="gc-button gc-button--secondary" onClick={() => navigate('/')}>Go back</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="gc-page">
      <PageHero
        title={`Shipment ${shipment.shipment_id}`}
        subtitle={`${shipment.origin} → ${shipment.destination}`}
        icon="inventory_2"
      />

      <ShipmentCard shipment={shipment} onClick={() => undefined} />

      <GaugeCard
        title="Emissions Overview"
        label="Predicted final emissions"
        value={shipment.predicted_final_co2_kg || 0}
        maxValue={100}
        unit="kg CO₂"
      />

      <Card>
        <SectionTitle title="Shipment Details" subtitle="Operational metrics and state" icon="stacks" />
        <div className="gc-detail-table">
          <Row label="Vehicle Type" value={shipment.vehicle_type.replace(/_/g, ' ')} />
          <Row label="Cargo Weight" value={`${shipment.cargo_weight_tons ?? '—'} tons`} />
          <Row label="Distance" value={`${shipment.distance_covered_km ?? '—'} / ${shipment.total_distance_km} km`} />
          <Row label="ETA" value={shipment.eta_minutes ? `${Math.round(shipment.eta_minutes / 60)}h ${shipment.eta_minutes % 60}m` : 'Arrived'} />
          <Row label="Driver Score" value={shipment.driver_score?.toFixed(0) ?? '—'} tone={typeof shipment.driver_score === 'number' && shipment.driver_score >= 80 ? 'green' : typeof shipment.driver_score === 'number' && shipment.driver_score >= 60 ? 'amber' : 'red'} />
        </div>
      </Card>

      <Card className="gc-inline-banner gc-inline-banner--action" onClick={() => setShowRouteModal(true)} role="button">
        <Icon name="route" size={16} color={theme.colors.primaryDeep} />
        <span>View route alternatives</span>
      </Card>

      <RouteCompareModal
        visible={showRouteModal}
        shipmentId={shipment.shipment_id}
        alternatives={loadingAlternatives ? [] : routeAlternatives}
        loading={loadingAlternatives}
        onClose={() => setShowRouteModal(false)}
        onConfirm={alternative => {
          // This can be wired to the backend later; for now we keep it client-side and visible.
          console.log('Selected alternative', alternative);
        }}
      />
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; tone?: 'green' | 'amber' | 'red' }> = ({ label, value, tone }) => (
  <div className="gc-detail-table__row">
    <span>{label}</span>
    <strong className={tone ? `gc-text-${tone}` : ''}>{value}</strong>
  </div>
);
