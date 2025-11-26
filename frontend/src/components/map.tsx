'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    // Prevent re-initialization if map already exists
    if (mapInstance.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Check again if container still exists
      if (!mapContainer.current) return;

      // Only initialize if not already done
      if (!mapInstance.current) {
        mapInstance.current = L.map(mapContainer.current, {
          attributionControl: true,
        }).setView([14.5995, 120.9842], 12); // Manila coordinates

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current);

        L.marker([14.5995, 120.9842])
          .bindPopup('Manila, Philippines')
          .addTo(mapInstance.current)
          .openPopup();
      }
    });

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-900 dark:bg-gray-900 rounded-lg overflow-hidden flex-1 transition-colors">
        <div ref={mapContainer} className="w-full h-full"></div>
      </div>
    </div>
  );
}
