import React, { useEffect, useMemo, useState } from 'react';
import { useShipments } from '../../hooks/useShipments';
import { apiService } from '../../lib/api';
import { GreenScoreBadge } from '../components/Cards';
import { GaugeCard, LineChartCard } from '../components/Charts';
import { RouteCompareModal, type RouteAlternative } from '../components/Modal';
import { Card, EmptyState, Icon, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';
import { navigate } from '../router';
import { theme } from '../theme';

const vehicleIcon = (type: string) => {
  const lower = (type || '').toLowerCase();
  if (lower.includes('train') || lower.includes('rail')) return 'train';
  if (lower.includes('ev') || lower.includes('electric')) return 'electric_bolt';
  if (lower.includes('ship') || lower.includes('boat')) return 'directions_boat';
  return 'local_shipping';
};

const formatHoursMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const ShipmentPage: React.FC<{ shipmentId: string }> = ({ shipmentId }) => {
  const { shipments, loading } = useShipments();
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeAlternatives, setRouteAlternatives] = useState<RouteAlternative[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [emissionPoints, setEmissionPoints] = useState<{ x: string; y: number }[]>([]);

  const shipment = shipments.find(item => item.shipment_id === shipmentId) ?? null;

  useEffect(() => {
    if (!shipmentId) return;
    let cancelled = false;
    apiService.getEmissionsByShipmentId(shipmentId).then(response => {
      if (cancelled) return;
      if (response.success && Array.isArray(response.data)) {
        const points = response.data
          .map((row: any) => ({
            x: new Date(row.recorded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            y: Number(row.co2_kg ?? 0),
          }))
          .filter(p => !Number.isNaN(p.y));
        setEmissionPoints(points);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [shipmentId]);

  useEffect(() => {
    if (!showRouteModal || !shipmentId) return;
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
    return () => { cancelled = true; };
  }, [showRouteModal, shipmentId]);

  const progress = useMemo(() => {
    if (!shipment) return 0;
    if (!shipment.distance_covered_km || !shipment.total_distance_km) return 0;
    return Math.min(100, (shipment.distance_covered_km / shipment.total_distance_km) * 100);
  }, [shipment]);

  if (loading && !shipment) {
    return (
      <div className="gc-page">
        <PageHero title="Shipment Details" subtitle="Loading shipment..." icon="inventory_2" />
        <Card><div className="gc-inline-state">Loading shipment details…</div></Card>
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 18px 18px' }}>
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
        icon={vehicleIcon(shipment.vehicle_type)}
        actions={
          <>
            <button className="gc-button gc-button--secondary" onClick={() => navigate('/map')}>
              <Icon name="map" size={14} color={theme.colors.primaryDeep} />
              Track on map
            </button>
            <button className="gc-button gc-button--primary" onClick={() => setShowRouteModal(true)}>
              <Icon name="alt_route" size={14} color="#ffffff" />
              Route alternatives
            </button>
          </>
        }
      />

      <div className="gc-kpi-strip">
        <div className="gc-kpi">
          <div className="gc-kpi__label"><Icon name="speed" size={14} color={theme.colors.primaryDeep} />Speed</div>
          <div className="gc-kpi__value">{shipment.speed_kmh?.toFixed(0) ?? '—'}</div>
          <div className="gc-kpi__sub">km/h</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label"><Icon name="route" size={14} color={theme.colors.primaryDeep} />Distance</div>
          <div className="gc-kpi__value">{shipment.distance_covered_km?.toFixed(0) ?? '—'}</div>
          <div className="gc-kpi__sub">/ {shipment.total_distance_km} km</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label"><Icon name="schedule" size={14} color={theme.colors.primaryDeep} />ETA</div>
          <div className="gc-kpi__value">
            {shipment.eta_minutes && shipment.eta_minutes > 0 ? formatHoursMinutes(shipment.eta_minutes) : 'Arrived'}
          </div>
          <div className="gc-kpi__sub">{shipment.status.replace(/_/g, ' ')}</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label"><Icon name="eco" size={14} color={theme.colors.primaryDeep} />CO₂</div>
          <div className="gc-kpi__value">{shipment.total_co2_kg?.toFixed(1) ?? '0'}</div>
          <div className="gc-kpi__sub">kg emitted so far</div>
        </div>
      </div>

      <Card>
        <SectionTitle title="Journey progress" subtitle={`${progress.toFixed(0)}% of route covered`} icon="route" />
        <div style={{ padding: '0 18px 18px' }}>
          <div className="gc-progress__track" style={{ height: 12 }}>
            <div className="gc-progress__fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: theme.colors.textSoft, fontSize: '0.86rem', fontWeight: 600 }}>
            <span>{shipment.origin}</span>
            <span>{shipment.destination}</span>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }} className="gc-shipment-grid">
        <GaugeCard
          title="Predicted final emissions"
          value={shipment.predicted_final_co2_kg ?? 0}
          maxValue={Math.max(100, (shipment.predicted_final_co2_kg ?? 0) * 1.5)}
          unit="kg CO₂"
          label="ML forecast for full journey"
        />
        <Card>
          <SectionTitle title="Green Score" subtitle="Sustainability rating for this shipment" icon="star" />
          <div style={{ padding: '12px 18px 18px', display: 'flex', justifyContent: 'center' }}>
            <GreenScoreBadge
              score={shipment.green_score ?? 'B'}
              value={shipment.green_score_value ?? 75}
              label="Shipment grade"
              size="large"
            />
          </div>
        </Card>
      </div>

      {emissionPoints.length > 0 ? (
        <LineChartCard
          title="Emissions Timeline"
          subtitle="kg CO₂ recorded across journey segments"
          data={emissionPoints}
          unit="kg"
          color={theme.colors.primary}
        />
      ) : null}

      <Card>
        <SectionTitle title="Operational details" subtitle="Full vehicle and journey state" icon="stacks" />
        <div className="gc-detail-table">
          <Row label="Shipment ID" value={shipment.shipment_id} />
          <Row label="Vehicle Type" value={shipment.vehicle_type.replace(/_/g, ' ')} />
          <Row label="Cargo Weight" value={shipment.cargo_weight_tons != null ? `${shipment.cargo_weight_tons} tons` : '—'} />
          <Row label="Origin" value={shipment.origin} />
          <Row label="Destination" value={shipment.destination} />
          <Row label="Distance covered" value={`${shipment.distance_covered_km?.toFixed(1) ?? '—'} km`} />
          <Row label="Total distance" value={`${shipment.total_distance_km} km`} />
          <Row label="Fuel consumed" value={shipment.fuel_consumed_liters != null ? `${shipment.fuel_consumed_liters.toFixed(1)} L` : '—'} />
          <Row label="CO₂ per km" value={shipment.co2_per_km != null ? `${shipment.co2_per_km.toFixed(2)} kg/km` : '—'} />
          <Row
            label="Driver Score"
            value={shipment.driver_score != null ? shipment.driver_score.toFixed(0) : '—'}
            tone={
              typeof shipment.driver_score === 'number' && shipment.driver_score >= 80
                ? 'green'
                : typeof shipment.driver_score === 'number' && shipment.driver_score >= 60
                  ? 'amber'
                  : 'red'
            }
          />
          <Row label="Status" value={shipment.status.replace(/_/g, ' ')} />
          <Row label="Last updated" value={new Date(shipment.updated_at).toLocaleString('en-IN')} />
        </div>
      </Card>

      <Card className="gc-inline-banner gc-inline-banner--action" onClick={() => setShowRouteModal(true)} role="button">
        <Icon name="alt_route" size={18} color={theme.colors.primaryDeep} />
        <span>Compare alternative routes and see CO₂ savings</span>
        <Icon name="arrow_forward" size={16} color={theme.colors.primaryDeep} />
      </Card>

      <RouteCompareModal
        visible={showRouteModal}
        shipmentId={shipment.shipment_id}
        alternatives={loadingAlternatives ? [] : routeAlternatives}
        loading={loadingAlternatives}
        onClose={() => setShowRouteModal(false)}
        onConfirm={alternative => {
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
