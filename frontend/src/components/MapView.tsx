import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Shipment } from './Cards';
import { Icon } from './UI';
import { theme, cityToCoords } from '../theme';

declare global {
  interface Window {
    L?: any;
    __gcOpenShipment?: (shipmentId: string) => void;
  }
}

let leafletLoader: Promise<void> | null = null;

const ensureLeaflet = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet requires a browser environment'));
  }

  if (window.L) return Promise.resolve();

  if (!leafletLoader) {
    leafletLoader = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-leaflet-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet-css', 'true');
        document.head.appendChild(link);
      }

      const existing = document.querySelector('script[data-leaflet-js]');
      if (existing) {
        if (window.L) return resolve();
        existing.addEventListener('load', () => resolve(), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.setAttribute('data-leaflet-js', 'true');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.body.appendChild(script);
    });
  }

  return leafletLoader;
};

// ── Color helpers ────────────────────────────────────────────────────────────

const gradeColor = (grade?: string) => {
  switch ((grade ?? 'C').toUpperCase()) {
    case 'A':
    case 'A+':
      return '#16a34a';
    case 'B':
      return '#65a30d';
    case 'C':
      return '#f59e0b';
    case 'D':
      return '#f97316';
    case 'F':
      return '#dc2626';
    default:
      return theme.colors.textMuted;
  }
};

const vehicleIcon = (type: string) => {
  const lower = (type || '').toLowerCase();
  if (lower.includes('train') || lower.includes('rail')) return 'train';
  if (lower.includes('ev') || lower.includes('electric')) return 'electric_bolt';
  if (lower.includes('ship') || lower.includes('boat')) return 'directions_boat';
  return 'local_shipping';
};

const vehicleLabel = (type: string) =>
  (type || '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// ── Popup HTML builder ───────────────────────────────────────────────────────

const buildPopupHtml = (shipment: Shipment): string => {
  const grade = shipment.green_score ?? 'C';
  const color = gradeColor(grade);
  const progress = shipment.distance_covered_km
    ? Math.min(100, (shipment.distance_covered_km / Math.max(1, shipment.total_distance_km)) * 100)
    : 0;
  const speed = typeof shipment.speed_kmh === 'number' ? `${Math.round(shipment.speed_kmh)} km/h` : '—';
  const co2 = typeof shipment.total_co2_kg === 'number' ? `${shipment.total_co2_kg.toFixed(1)} kg` : '—';
  const distance = typeof shipment.distance_covered_km === 'number'
    ? `${Math.round(shipment.distance_covered_km)} / ${Math.round(shipment.total_distance_km)} km`
    : '—';
  const eta = typeof shipment.eta_minutes === 'number' && shipment.eta_minutes > 0
    ? `${Math.round(shipment.eta_minutes / 60)}h ${shipment.eta_minutes % 60}m`
    : 'Arrived';
  const statusLabel = shipment.status.replace(/_/g, ' ');

  return `
    <div class="gc-popup">
      <div class="gc-popup__head">
        <div>
          <div class="gc-popup__id">${escapeHtml(shipment.shipment_id)}</div>
          <div style="font-size: 0.78rem; color: ${theme.colors.textSoft}; font-weight: 600; text-transform: capitalize; margin-top: 2px;">
            ${escapeHtml(vehicleLabel(shipment.vehicle_type))} · ${escapeHtml(statusLabel)}
          </div>
        </div>
        <div class="gc-popup__grade" style="background: linear-gradient(135deg, ${color}, ${color}cc);">${escapeHtml(grade)}</div>
      </div>

      <div class="gc-popup__route">
        <div><span style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">From</span><strong>${escapeHtml(shipment.origin)}</strong></div>
        <span class="arrow">→</span>
        <div style="text-align:right;"><span style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">To</span><strong>${escapeHtml(shipment.destination)}</strong></div>
      </div>

      <div class="gc-popup__metrics">
        <div class="gc-popup__metric"><span>Speed</span><strong>${escapeHtml(speed)}</strong></div>
        <div class="gc-popup__metric"><span>CO₂</span><strong>${escapeHtml(co2)}</strong></div>
        <div class="gc-popup__metric"><span>Progress</span><strong>${escapeHtml(distance)}</strong></div>
        <div class="gc-popup__metric"><span>ETA</span><strong>${escapeHtml(eta)}</strong></div>
      </div>

      <div class="gc-popup__progress">
        <div class="gc-popup__progress-bar">
          <div class="gc-popup__progress-fill" style="width:${progress}%; background: linear-gradient(90deg, ${color}, ${color}cc);"></div>
        </div>
        <div class="gc-popup__progress-text">
          <span>${Math.round(progress)}% covered</span>
          <span>${escapeHtml(shipment.destination)}</span>
        </div>
      </div>

      <button class="gc-popup__cta" data-shipment="${escapeHtml(shipment.shipment_id)}">
        View full details →
      </button>
    </div>
  `;
};

// ── Map component ────────────────────────────────────────────────────────────

interface ShipmentMapProps {
  shipments: Shipment[];
  selectedId: string | null;
  filterVehicle: string | null;
  onSelectShipment: (shipmentId: string) => void;
  onMapClick?: () => void;
  onOpenDetail?: (shipmentId: string) => void;
}

export const ShipmentMap: React.FC<ShipmentMapProps> = ({
  shipments,
  selectedId,
  filterVehicle,
  onSelectShipment,
  onMapClick,
  onOpenDetail,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const truckRefsRef = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);

  const visibleShipments = useMemo(
    () => shipments.filter(shipment => !filterVehicle || shipment.vehicle_type === filterVehicle),
    [shipments, filterVehicle],
  );

  // Bridge popup CTA clicks back to React
  useEffect(() => {
    window.__gcOpenShipment = (id: string) => onOpenDetail?.(id);
    return () => {
      delete window.__gcOpenShipment;
    };
  }, [onOpenDetail]);

  // Load Leaflet once
  useEffect(() => {
    let cancelled = false;
    ensureLeaflet()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!ready || !containerRef.current || !window.L || mapRef.current) return;

    const map = window.L.map(containerRef.current, {
      center: [22.0, 79.0],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Soft, light Carto basemap that pairs nicely with green theme
    window.L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      },
    ).addTo(map);

    map.on('click', () => onMapClick?.());

    // Layer group for all shipment artifacts (markers + routes)
    layerRef.current = window.L.layerGroup().addTo(map);
    mapRef.current = map;

    // Delegate clicks for popup CTA buttons
    map.getContainer().addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const cta = target.closest('.gc-popup__cta') as HTMLButtonElement | null;
      if (cta?.dataset.shipment) {
        event.stopPropagation();
        window.__gcOpenShipment?.(cta.dataset.shipment);
      }
    });
  }, [ready, onMapClick]);

  // Render markers + routes whenever shipments / selection change
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L || !layerRef.current) return;

    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();
    truckRefsRef.current = {};

    if (visibleShipments.length === 0) {
      map.setView([22.0, 79.0], 5);
      return;
    }

    const allBounds: [number, number][] = [];

    visibleShipments.forEach((shipment, index) => {
      const stopLetter = String.fromCharCode(65 + (index % 26)); // A, B, C…
      const originCoords = cityToCoords(shipment.origin);
      const destCoords = cityToCoords(shipment.destination);
      const currentCoords =
        shipment.current_lat != null && shipment.current_lng != null
          ? ([shipment.current_lat, shipment.current_lng] as [number, number])
          : null;

      const grade = (shipment.green_score ?? 'C').toUpperCase();
      const color = gradeColor(grade);
      const isActive = shipment.shipment_id === selectedId;

      // Origin marker (labeled A, B, C…)
      if (originCoords) {
        const originIcon = window.L.divIcon({
          className: '',
          html: `<div class="gc-map-stop" title="${escapeHtml(shipment.origin)}"><span>${stopLetter}</span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });
        const originMarker = window.L.marker(originCoords, { icon: originIcon, title: `${stopLetter} · ${shipment.origin}` })
          .bindTooltip(`<strong>${escapeHtml(stopLetter)} · ${escapeHtml(shipment.origin)}</strong><br/>Origin · ${escapeHtml(shipment.shipment_id)}`, {
            direction: 'top',
            offset: [0, -32],
            className: 'gc-map-tooltip',
          })
          .addTo(layer);
        originMarker.on('click', () => onSelectShipment(shipment.shipment_id));
        allBounds.push(originCoords);
      }

      // Destination marker (labeled too, with end style)
      if (destCoords) {
        const destIcon = window.L.divIcon({
          className: '',
          html: `<div class="gc-map-stop gc-map-stop--end" title="${escapeHtml(shipment.destination)}"><span>${stopLetter}'</span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });
        const destMarker = window.L.marker(destCoords, { icon: destIcon, title: `${stopLetter}' · ${shipment.destination}` })
          .bindTooltip(`<strong>${escapeHtml(stopLetter)}' · ${escapeHtml(shipment.destination)}</strong><br/>Destination · ${escapeHtml(shipment.shipment_id)}`, {
            direction: 'top',
            offset: [0, -32],
            className: 'gc-map-tooltip',
          })
          .addTo(layer);
        destMarker.on('click', () => onSelectShipment(shipment.shipment_id));
        allBounds.push(destCoords);
      }

      // Route polylines: solid for covered segment, dashed for remaining
      if (originCoords && destCoords) {
        const routePoints = currentCoords ? [originCoords, currentCoords] : [originCoords];
        if (currentCoords) {
          window.L.polyline(routePoints, {
            color,
            weight: isActive ? 5 : 4,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(layer);

          window.L.polyline([currentCoords, destCoords], {
            color,
            weight: isActive ? 4 : 3,
            opacity: 0.45,
            dashArray: '6, 8',
            lineCap: 'round',
          }).addTo(layer);
        } else {
          // No current position — just draw the planned route dashed
          window.L.polyline([originCoords, destCoords], {
            color,
            weight: 3,
            opacity: 0.5,
            dashArray: '6, 8',
          }).addTo(layer);
        }
      }

      // Live truck marker at current position
      if (currentCoords) {
        const html = `
          <div class="gc-map-truck gc-map-truck--${grade.replace('+', '')} ${isActive ? 'is-active' : ''}">
            <span class="gc-map-truck__pulse"></span>
            <span class="gc-map-truck__core" title="${escapeHtml(shipment.shipment_id)}">${escapeHtml(grade)}</span>
          </div>
        `;
        const truckIcon = window.L.divIcon({
          className: '',
          html,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        });
        const truckMarker = window.L.marker(currentCoords, { icon: truckIcon, title: shipment.shipment_id, riseOnHover: true });

        truckMarker
          .bindPopup(buildPopupHtml(shipment), {
            maxWidth: 320,
            minWidth: 280,
            closeButton: true,
            autoPan: true,
            offset: [0, -10],
          })
          .addTo(layer);

        truckMarker.on('click', () => {
          onSelectShipment(shipment.shipment_id);
        });

        truckRefsRef.current[shipment.shipment_id] = truckMarker;
        allBounds.push(currentCoords);
      }
    });

    // Auto-fit on first render or when filter changes
    if (allBounds.length > 1) {
      const leafletBounds = window.L.latLngBounds(allBounds);
      map.fitBounds(leafletBounds, { padding: [60, 60], maxZoom: 7, animate: true });
    } else if (allBounds.length === 1) {
      map.setView(allBounds[0], 6, { animate: true });
    }
  }, [ready, visibleShipments, selectedId, onSelectShipment]);

  // When a shipment is selected, fly to it and open its popup
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedId) return;
    const marker = truckRefsRef.current[selectedId];
    if (!marker) return;
    const latlng = marker.getLatLng();
    mapRef.current.flyTo([latlng.lat, latlng.lng], 7, { duration: 0.6 });
    marker.openPopup();
  }, [selectedId, ready]);

  if (!ready) {
    return (
      <div className="gc-map-fallback">
        <Icon name="map" size={44} color={theme.colors.textSoft} />
        <p>Loading live map…</p>
      </div>
    );
  }

  return (
    <div className="gc-map-canvas" style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 580, borderRadius: 22 }} />
      <MapStatsOverlay shipments={visibleShipments} />
    </div>
  );
};

const MapStatsOverlay: React.FC<{ shipments: Shipment[] }> = ({ shipments }) => {
  const active = shipments.filter(s => s.status === 'in_transit').length;
  const completed = shipments.filter(s => s.status === 'completed').length;

  return (
    <div className="gc-map-stats">
      <div className="gc-map-stats__item">
        <span className="dot dot--green" />
        {active} live
      </div>
      <div className="gc-map-stats__item">
        <span className="dot dot--amber" />
        {completed} arrived
      </div>
      <div className="gc-map-stats__item">
        <Icon name="local_shipping" size={14} color={theme.colors.primaryDeep} />
        {shipments.length} total
      </div>
    </div>
  );
};

export const MapSummaryBar: React.FC<{ shipments: Shipment[] }> = ({ shipments }) => {
  const active = shipments.filter(shipment => shipment.status === 'in_transit').length;
  const completed = shipments.filter(shipment => shipment.status === 'completed').length;
  const totalCO2 = shipments.reduce((sum, s) => sum + (s.total_co2_kg ?? 0), 0);

  return (
    <div className="gc-map-summary">
      <div><span className="dot dot--green" /> {active} Active</div>
      <div><span className="dot dot--amber" /> {completed} Completed</div>
      <div><Icon name="local_shipping" size={14} color={theme.colors.primaryDeep} /> {shipments.length} Total</div>
      <div><Icon name="eco" size={14} color={theme.colors.primaryDeep} /> {totalCO2.toFixed(1)} kg CO₂</div>
    </div>
  );
};
