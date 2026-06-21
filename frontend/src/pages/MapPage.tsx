import React, { useCallback, useMemo, useState } from 'react';
import { useShipments } from '../../hooks/useShipments';
import { ShipmentMap, MapSummaryBar } from '../components/MapView';
import { Card, Icon, SectionTitle } from '../components/UI';
import { navigate } from '../router';
import { PageHero } from '../components/Shell';
import { theme } from '../theme';

const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a',
  B: '#65a30d',
  C: '#f59e0b',
  D: '#f97316',
  F: '#dc2626',
};

const GRADE_LABELS: Record<string, string> = {
  A: 'Excellent · low emissions',
  B: 'Good · moderate emissions',
  C: 'Average · industry baseline',
  D: 'Below average · review',
  F: 'Critical · immediate action',
};

const vehicleLabel = (vehicle: string) =>
  vehicle.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

export const MapPage: React.FC = () => {
  const { shipments, loading } = useShipments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string | null>(null);

  const selectedShipment = useMemo(
    () => shipments.find(shipment => shipment.shipment_id === selectedId) ?? null,
    [shipments, selectedId],
  );

  const vehicleTypes = useMemo(
    () => Array.from(new Set(shipments.map(shipment => shipment.vehicle_type))),
    [shipments],
  );

  const openShipment = useCallback((shipmentId: string) => setSelectedId(shipmentId), []);
  const closePanel = useCallback(() => setSelectedId(null), []);
  const openDetail = useCallback((shipmentId: string) => navigate(`/shipment/${shipmentId}`), []);

  return (
    <div className="gc-page">
      <PageHero
        title="Live Fleet Tracking"
        subtitle="Click any A, B, C marker or live truck pin to see shipment intelligence."
        icon="map"
      />

      <MapSummaryBar shipments={shipments} />

      <Card className="gc-map-shell">
        <div className="gc-map-toolbar">
          <button
            className={`gc-chip ${!filterVehicle ? 'is-active' : ''}`}
            onClick={() => setFilterVehicle(null)}
          >
            <Icon name="layers" size={14} color={!filterVehicle ? '#ffffff' : theme.colors.primaryDeep} />
            All ({shipments.length})
          </button>
          {vehicleTypes.map(vehicle => {
            const active = filterVehicle === vehicle;
            const count = shipments.filter(s => s.vehicle_type === vehicle).length;
            const icon =
              vehicle.includes('train') ? 'train' :
              vehicle.includes('ev') ? 'electric_bolt' :
              vehicle.includes('ship') ? 'directions_boat' :
              'local_shipping';
            return (
              <button
                key={vehicle}
                className={`gc-chip ${active ? 'is-active' : ''}`}
                onClick={() => setFilterVehicle(active ? null : vehicle)}
              >
                <Icon name={icon} size={14} color={active ? '#ffffff' : theme.colors.primaryDeep} />
                {vehicleLabel(vehicle)} ({count})
              </button>
            );
          })}
        </div>

        <div className="gc-map-grid">
          <ShipmentMap
            shipments={shipments}
            selectedId={selectedId}
            filterVehicle={filterVehicle}
            onSelectShipment={openShipment}
            onMapClick={closePanel}
            onOpenDetail={openDetail}
          />

          <div className="gc-map-legend">
            <SectionTitle title="Legend" subtitle="What the colors mean" icon="legend_toggle" />

            <p style={{ margin: '12px 0 8px', fontSize: '0.78rem', color: theme.colors.textSoft, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Green Score grades
            </p>
            <div className="gc-legend-list">
              {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
                <div key={grade} className="gc-legend-list__item">
                  <span style={{ background: GRADE_COLORS[grade] }} />
                  <div>
                    <strong style={{ color: theme.colors.text }}>{grade}</strong>
                    <div style={{ fontSize: '0.78rem', color: theme.colors.textSoft, fontWeight: 500 }}>
                      {GRADE_LABELS[grade]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ margin: '18px 0 8px', fontSize: '0.78rem', color: theme.colors.textSoft, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Markers
            </p>
            <div className="gc-legend-list">
              <div className="gc-legend-list__item" style={{ alignItems: 'flex-start' }}>
                <span style={{ background: '#16a34a', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', flex: 'none' }} />
                <div>
                  <strong style={{ color: theme.colors.text }}>A, B, C…</strong>
                  <div style={{ fontSize: '0.78rem', color: theme.colors.textSoft }}>
                    Origin city — click for details
                  </div>
                </div>
              </div>
              <div className="gc-legend-list__item" style={{ alignItems: 'flex-start' }}>
                <span style={{ background: '#f97316', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', flex: 'none' }} />
                <div>
                  <strong style={{ color: theme.colors.text }}>A', B', C'…</strong>
                  <div style={{ fontSize: '0.78rem', color: theme.colors.textSoft }}>
                    Destination city
                  </div>
                </div>
              </div>
              <div className="gc-legend-list__item" style={{ alignItems: 'flex-start' }}>
                <span style={{ background: '#ffffff', border: '3px solid #16a34a', flex: 'none' }} />
                <div>
                  <strong style={{ color: theme.colors.text }}>Pulsing pin</strong>
                  <div style={{ fontSize: '0.78rem', color: theme.colors.textSoft }}>
                    Live current position
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {loading && shipments.length === 0 ? (
        <Card><div className="gc-inline-state">Loading live shipments…</div></Card>
      ) : null}

      {selectedShipment ? (
        <Card className="gc-detail-panel">
          <div className="gc-detail-panel__head">
            <div
              className="gc-score-circle"
              style={{
                background: `linear-gradient(135deg, ${GRADE_COLORS[selectedShipment.green_score ?? 'C']}, ${GRADE_COLORS[selectedShipment.green_score ?? 'C']}cc)`,
              }}
            >
              {selectedShipment.green_score ?? '?'}
            </div>
            <div className="gc-detail-panel__copy">
              <strong>{selectedShipment.shipment_id}</strong>
              <span>{selectedShipment.origin} → {selectedShipment.destination}</span>
            </div>
            <button className="gc-icon-button" onClick={closePanel}>
              <Icon name="close" size={18} color={theme.colors.textSoft} />
            </button>
          </div>

          <div className="gc-detail-panel__status">
            <span className={`dot ${selectedShipment.status === 'in_transit' ? 'dot--green' : 'dot--amber'}`} />
            {selectedShipment.status.replace(/_/g, ' ')}
          </div>

          <div className="gc-detail-panel__metrics">
            <div>
              <Icon name="speed" size={16} color={theme.colors.secondary} />
              <strong>{typeof selectedShipment.speed_kmh === 'number' ? `${Math.round(selectedShipment.speed_kmh)}` : '—'}</strong>
              <span>km/h</span>
            </div>
            <div>
              <Icon name="route" size={16} color={theme.colors.primaryDeep} />
              <strong>{typeof selectedShipment.distance_covered_km === 'number' ? `${Math.round(selectedShipment.distance_covered_km)}` : '—'}</strong>
              <span>km covered</span>
            </div>
            <div>
              <Icon name="eco" size={16} color={theme.colors.success} />
              <strong>{typeof selectedShipment.total_co2_kg === 'number' ? `${selectedShipment.total_co2_kg.toFixed(1)}` : '—'}</strong>
              <span>kg CO₂</span>
            </div>
            <div>
              <Icon name="schedule" size={16} color={theme.colors.info} />
              <strong>
                {typeof selectedShipment.eta_minutes === 'number' && selectedShipment.eta_minutes > 0
                  ? `${Math.round(selectedShipment.eta_minutes / 60)}h`
                  : 'Done'}
              </strong>
              <span>ETA</span>
            </div>
          </div>

          {typeof selectedShipment.distance_covered_km === 'number' &&
          typeof selectedShipment.total_distance_km === 'number' &&
          selectedShipment.total_distance_km > 0 ? (
            <div className="gc-detail-panel__progress">
              <div className="gc-detail-panel__progress-head">
                <span>Journey progress</span>
                <strong>
                  {Math.round((selectedShipment.distance_covered_km / selectedShipment.total_distance_km) * 100)}%
                </strong>
              </div>
              <div className="gc-progress__track">
                <div
                  className="gc-progress__fill"
                  style={{
                    width: `${Math.min(
                      100,
                      (selectedShipment.distance_covered_km / selectedShipment.total_distance_km) * 100,
                    )}%`,
                    background: `linear-gradient(90deg, ${GRADE_COLORS[selectedShipment.green_score ?? 'C']}, ${GRADE_COLORS[selectedShipment.green_score ?? 'C']}cc)`,
                  }}
                />
              </div>
              <div className="gc-detail-panel__progress-head">
                <span>{selectedShipment.origin}</span>
                <span>{selectedShipment.destination}</span>
              </div>
            </div>
          ) : null}

          <button
            className="gc-button gc-button--primary gc-detail-panel__action"
            onClick={() => navigate(`/shipment/${selectedShipment.shipment_id}`)}
          >
            <Icon name="analytics" size={16} color="#ffffff" />
            View full intelligence
          </button>
        </Card>
      ) : null}
    </div>
  );
};
