import React, { useCallback, useMemo, useState } from 'react';
import { useShipments } from '../../hooks/useShipments';
import { ShipmentMap, MapSummaryBar } from '../components/MapView';
import { Card, Icon, SectionTitle } from '../components/UI';
import { navigate } from '../router';
import { PageHero } from '../components/Shell';
import { theme } from '../theme';

const gradeColor = (grade?: string) => {
  switch ((grade ?? 'C').toUpperCase()) {
    case 'A':
    case 'A+':
      return theme.colors.primary;
    case 'B':
      return theme.colors.primaryDeep;
    case 'C':
      return theme.colors.accent;
    case 'D':
      return theme.colors.secondary;
    case 'F':
      return theme.colors.danger;
    default:
      return '#64748b';
  }
};

const vehicleLabel = (vehicle: string) => vehicle.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

export const MapPage: React.FC = () => {
  const { shipments } = useShipments();
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

  const openShipment = useCallback((shipmentId: string) => {
    setSelectedId(shipmentId);
  }, []);

  const closePanel = useCallback(() => setSelectedId(null), []);

  return (
    <div className="gc-page">
      <PageHero
        title="Live Tracking"
        subtitle="Track shipments in real-time and filter by vehicle type."
        icon="map"
      />

      <MapSummaryBar shipments={shipments} />

      <Card className="gc-map-shell">
        <div className="gc-map-toolbar">
          <button className={`gc-chip ${!filterVehicle ? 'is-active' : ''}`} onClick={() => setFilterVehicle(null)}>
            <Icon name="layers" size={14} color={!filterVehicle ? '#fff' : theme.colors.textSoft} />
            All ({shipments.length})
          </button>
          {vehicleTypes.map(vehicle => {
            const active = filterVehicle === vehicle;
            return (
              <button
                key={vehicle}
                className={`gc-chip ${active ? 'is-active' : ''}`}
                onClick={() => setFilterVehicle(active ? null : vehicle)}
              >
                <Icon name="local_shipping" size={14} color={active ? '#fff' : theme.colors.textSoft} />
                {vehicleLabel(vehicle)}
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
          />

          <div className="gc-map-legend">
            <SectionTitle title="Score legend" subtitle="Green grades for each shipment" icon="legend_toggle" />
            <div className="gc-legend-list">
              {['A', 'B', 'C', 'D', 'F'].map(grade => (
                <div key={grade} className="gc-legend-list__item">
                  <span style={{ background: gradeColor(grade) }} />
                  <strong>{grade}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {selectedShipment ? (
        <Card className="gc-detail-panel">
          <div className="gc-detail-panel__head">
            <div className="gc-score-circle" style={{ background: gradeColor(selectedShipment.green_score) }}>
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
            <div><Icon name="speed" size={16} color={theme.colors.secondary} /><strong>{typeof selectedShipment.speed_kmh === 'number' ? `${Math.round(selectedShipment.speed_kmh)} km/h` : '—'}</strong><span>Speed</span></div>
            <div><Icon name="route" size={16} color={theme.colors.primaryDeep} /><strong>{typeof selectedShipment.distance_covered_km === 'number' ? `${Math.round(selectedShipment.distance_covered_km)} km` : '—'}</strong><span>Covered</span></div>
            <div><Icon name="eco" size={16} color={theme.colors.accent} /><strong>{typeof selectedShipment.total_co2_kg === 'number' ? `${selectedShipment.total_co2_kg.toFixed(1)} kg` : '—'}</strong><span>CO₂</span></div>
            <div><Icon name="schedule" size={16} color={theme.colors.info} /><strong>{typeof selectedShipment.eta_minutes === 'number' && selectedShipment.eta_minutes > 0 ? `${Math.round(selectedShipment.eta_minutes / 60)}h` : 'Done'}</strong><span>ETA</span></div>
          </div>

          {typeof selectedShipment.distance_covered_km === 'number' && typeof selectedShipment.total_distance_km === 'number' && selectedShipment.total_distance_km > 0 ? (
            <div className="gc-detail-panel__progress">
              <div className="gc-detail-panel__progress-head">
                <span>Journey progress</span>
                <strong>{Math.round((selectedShipment.distance_covered_km / selectedShipment.total_distance_km) * 100)}%</strong>
              </div>
              <div className="gc-progress__track">
                <div
                  className="gc-progress__fill"
                  style={{
                    width: `${Math.min(100, (selectedShipment.distance_covered_km / selectedShipment.total_distance_km) * 100)}%`,
                    background: gradeColor(selectedShipment.green_score),
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
            onClick={() => {
              closePanel();
              navigate(`/shipment/${selectedShipment.shipment_id}`);
            }}
          >
            <Icon name="analytics" size={16} color="#fff" />
            View Full Detail
          </button>
        </Card>
      ) : null}
    </div>
  );
};
