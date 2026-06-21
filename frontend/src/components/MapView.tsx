import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Shipment } from './Cards';
import { Icon } from './UI';
import { theme } from '../theme';

declare global {
  interface Window {
    L?: any;
  }
}

let leafletLoader: Promise<void> | null = null;

const ensureLeaflet = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet requires a browser environment'));
  }

  if (window.L) {
    return Promise.resolve();
  }

  if (!leafletLoader) {
    leafletLoader = new Promise((resolve, reject) => {
      const existingCss = document.querySelector('link[data-leaflet-css]');
      if (!existingCss) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet-css', 'true');
        document.head.appendChild(link);
      }

      const existingScript = document.querySelector('script[data-leaflet-js]');
      if (existingScript) {
        if (window.L) {
          resolve();
        } else {
          existingScript.addEventListener('load', () => resolve(), { once: true });
        }
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

export const ShipmentMap: React.FC<{
  shipments: Shipment[];
  selectedId: string | null;
  filterVehicle: string | null;
  onSelectShipment: (shipmentId: string) => void;
  onMapClick?: () => void;
}> = ({ shipments, selectedId, filterVehicle, onSelectShipment, onMapClick }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);

  const visibleShipments = useMemo(
    () => shipments.filter(shipment => !filterVehicle || shipment.vehicle_type === filterVehicle),
    [shipments, filterVehicle],
  );

  useEffect(() => {
    let cancelled = false;
    ensureLeaflet()
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.L) {
      return;
    }

    if (!mapRef.current) {
      const map = window.L.map(containerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      map.on('click', () => onMapClick?.());
      mapRef.current = map;
    }

    const map = mapRef.current;
    const existingMarkers = markersRef.current;

    Object.values(existingMarkers).forEach(marker => marker.remove());
    markersRef.current = {};

    visibleShipments.forEach(shipment => {
      if (shipment.current_lat == null || shipment.current_lng == null) {
        return;
      }

      const color = gradeColor(shipment.green_score);
      const isActive = shipment.shipment_id === selectedId;
      const marker = window.L.marker([shipment.current_lat, shipment.current_lng], {
        icon: window.L.divIcon({
          className: '',
          html: `
            <div class="gc-map-pin ${isActive ? 'is-active' : ''}" style="background:${color}">
              <span>${shipment.green_score ?? 'C'}</span>
            </div>
            <div class="gc-map-label">${shipment.shipment_id}</div>
          `,
          iconSize: [72, 62],
          iconAnchor: [36, 14],
        }),
      }).addTo(map);

      marker.on('click', (event: any) => {
        event?.originalEvent?.stopPropagation?.();
        onSelectShipment(shipment.shipment_id);
      });

      markersRef.current[shipment.shipment_id] = marker;
    });

    if (selectedId) {
      const shipment = visibleShipments.find(item => item.shipment_id === selectedId);
      if (shipment?.current_lat != null && shipment.current_lng != null) {
        map.flyTo([shipment.current_lat - 1.5, shipment.current_lng], 7, { duration: 0.6 });
      }
    }

    return () => {
      // Keep the map instance alive between updates.
    };
  }, [ready, visibleShipments, selectedId, onMapClick, onSelectShipment]);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) {
      return;
    }

    Object.entries(markersRef.current).forEach(([shipmentId, marker]) => {
      const shipment = visibleShipments.find(item => item.shipment_id === shipmentId);
      if (!shipment) {
        marker.remove();
        delete markersRef.current[shipmentId];
        return;
      }

      const color = gradeColor(shipment.green_score);
      const isActive = shipment.shipment_id === selectedId;
      marker.setIcon(
        window.L.divIcon({
          className: '',
          html: `
            <div class="gc-map-pin ${isActive ? 'is-active' : ''}" style="background:${color}">
              <span>${shipment.green_score ?? 'C'}</span>
            </div>
            <div class="gc-map-label">${shipment.shipment_id}</div>
          `,
          iconSize: [72, 62],
          iconAnchor: [36, 14],
        }),
      );
    });
  }, [visibleShipments, selectedId, ready]);

  if (!ready) {
    return (
      <div className="gc-map-fallback">
        <Icon name="map" size={44} color={theme.colors.textSoft} />
        <p>Loading live map...</p>
      </div>
    );
  }

  return <div ref={containerRef} className="gc-map-canvas" />;
};

export const MapSummaryBar: React.FC<{ shipments: Shipment[] }> = ({ shipments }) => {
  const active = shipments.filter(shipment => shipment.status === 'in_transit').length;
  const completed = shipments.filter(shipment => shipment.status === 'completed').length;

  return (
    <div className="gc-map-summary">
      <div><span className="dot dot--green" /> {active} Active</div>
      <div><span className="dot dot--amber" /> {completed} Completed</div>
      <div><Icon name="location_on" size={14} color={theme.colors.textSoft} /> {shipments.length} Total</div>
    </div>
  );
};
