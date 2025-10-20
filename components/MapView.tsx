'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertLog } from '@/lib/webserial';

interface MapViewProps {
  alerts: AlertLog[];
  currentLat: number;
  currentLng: number;
}

export default function MapView({
  alerts,
  currentLat,
  currentLng,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet only on client
    import('leaflet').then((L) => {
      // Initialize map
      const map = L.map(mapRef.current).setView(
        [currentLat || 5.55602, currentLng || -0.196278],
        16
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add current location marker
      const blueMarkerUrl =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzMzODhmZiIgb3BhY2l0eT0iMC43Ii8+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzMzODhmZiIvPjwvc3ZnPg==';
      const currentMarker = L.marker([currentLat || 5.55602, currentLng || -0.196278], {
        icon: L.icon({
          iconUrl: blueMarkerUrl,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).bindPopup('Current Device Location');
      currentMarker.addTo(map);

      // Add alert markers
      alerts.forEach((alert) => {
        const color =
          alert.theft > 0.7 ? '#dc2626' : alert.theft > 0.5 ? '#f97316' : '#eab308';
        const marker = L.circleMarker([alert.lat, alert.lng], {
          radius: 8,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7,
        });

        marker.bindPopup(`
          <div class="text-sm">
            <p class="font-semibold">Alert Log</p>
            <p>Theft: ${alert.theft.toFixed(2)}</p>
            <p>V: ${alert.voltage.toFixed(1)}V</p>
            <p>I: ${alert.current.toFixed(3)}A</p>
            <p>${new Date(alert.timestamp).toLocaleString()}</p>
          </div>
        `);
        marker.addTo(map);
      });

      mapInstanceRef.current = map;
    });
  }, [isClient, alerts, currentLat, currentLng]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-lg shadow-lg border border-gray-300 bg-gray-600"
      style={{ minHeight: '400px' }}
    />
  );
}
