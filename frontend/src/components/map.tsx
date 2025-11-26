'use client';

import { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Crosshair, Save, Loader2 } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker, Circle as LeafletCircle, Polyline as LeafletPolyline } from 'leaflet';
import { useGPSTracker } from '@/hooks/useGPSTracker';
import { supabase } from '@/lib/supabase';

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const accuracyCircleRef = useRef<LeafletCircle | null>(null);
  const pathLineRef = useRef<LeafletPolyline | null>(null);
  const pathPoints = useRef<[number, number][]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [showPath, setShowPath] = useState(false);
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null);

  const {
    position,
    error,
    isTracking,
    isLoading,
    getCurrentPosition,
    startTracking,
    stopTracking,
  } = useGPSTracker({
    enableHighAccuracy: true,
    autoStart: false,
  });

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return;
    if (mapInstance.current) return;

    import('leaflet').then((L) => {
      setLeaflet(L);
      
      if (!mapContainer.current || mapInstance.current) return;

      // Default to Manila
      mapInstance.current = L.map(mapContainer.current, {
        attributionControl: true,
        zoomControl: true,
      }).setView([14.5995, 120.9842], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      // Add custom CSS for Leaflet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update marker when position changes
  useEffect(() => {
    if (!position || !mapInstance.current || !leaflet) return;

    const { latitude, longitude, accuracy, heading, speed } = position;

    // Create or update marker
    if (!markerRef.current) {
      // Custom icon for current location
      const icon = leaflet.divIcon({
        className: 'custom-location-marker',
        html: `
          <div style="position: relative;">
            <div style="
              width: 20px;
              height: 20px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
            "></div>
            ${heading !== null ? `
              <div style="
                position: absolute;
                top: -15px;
                left: 7px;
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 15px solid #3b82f6;
                transform: rotate(${heading}deg);
                transform-origin: center bottom;
              "></div>
            ` : ''}
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      markerRef.current = leaflet.marker([latitude, longitude], { icon })
        .addTo(mapInstance.current);
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
    }

    // Update popup
    const speedText = speed !== null ? ` • ${(speed * 3.6).toFixed(1)} km/h` : '';
    markerRef.current.bindPopup(`
      <div style="text-align: center;">
        <strong>Current Location</strong><br/>
        ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br/>
        <small>±${accuracy.toFixed(0)}m${speedText}</small>
      </div>
    `);

    // Update accuracy circle
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = leaflet.circle([latitude, longitude], {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(mapInstance.current);
    } else {
      accuracyCircleRef.current.setLatLng([latitude, longitude]);
      accuracyCircleRef.current.setRadius(accuracy);
    }

    // Add to path
    if (showPath) {
      pathPoints.current.push([latitude, longitude]);
      
      if (!pathLineRef.current) {
        pathLineRef.current = leaflet.polyline(pathPoints.current, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
        }).addTo(mapInstance.current);
      } else {
        pathLineRef.current.setLatLngs(pathPoints.current);
      }
    }

    // Follow mode: center map on location
    if (followMode) {
      mapInstance.current.setView([latitude, longitude], mapInstance.current.getZoom());
    }
  }, [position, leaflet, followMode, showPath]);

  const handleCenterMap = () => {
    if (position && mapInstance.current) {
      mapInstance.current.setView([position.latitude, position.longitude], 16);
    }
  };

  const handleSaveLocation = async () => {
    if (!position) return;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('gps_logs')
        .insert({
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving GPS log:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearPath = () => {
    pathPoints.current = [];
    if (pathLineRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(pathLineRef.current);
      pathLineRef.current = null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Map Container */}
      <div className="bg-gray-900 dark:bg-gray-900 rounded-lg overflow-hidden flex-1 transition-colors relative">
        <div ref={mapContainer} className="w-full h-full"></div>
        
        {/* Floating Controls */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={isLoading}
            className={`p-2 rounded-lg shadow-lg transition-all ${
              isTracking
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
            title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Navigation size={20} className={isTracking ? 'animate-pulse' : ''} />
            )}
          </button>

          <button
            onClick={handleCenterMap}
            disabled={!position}
            className="p-2 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow-lg transition-all disabled:opacity-50"
            title="Center on Location"
          >
            <Crosshair size={20} />
          </button>

          <button
            onClick={() => setFollowMode(!followMode)}
            className={`p-2 rounded-lg shadow-lg transition-all ${
              followMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-800'
            }`}
            title="Follow Mode"
          >
            <MapPin size={20} />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-4 space-y-3">
        {error && (
          <div className="text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {position && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Latitude</p>
              <p className="text-white font-mono">{position.latitude.toFixed(6)}°</p>
            </div>
            <div>
              <p className="text-gray-400">Longitude</p>
              <p className="text-white font-mono">{position.longitude.toFixed(6)}°</p>
            </div>
            <div>
              <p className="text-gray-400">Accuracy</p>
              <p className="text-white">±{position.accuracy.toFixed(0)}m</p>
            </div>
            {position.speed !== null && (
              <div>
                <p className="text-gray-400">Speed</p>
                <p className="text-white">{(position.speed * 3.6).toFixed(1)} km/h</p>
              </div>
            )}
          </div>
        )}

        {saveSuccess && (
          <div className="text-green-400 text-sm">
            ✓ Location saved to database
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSaveLocation}
            disabled={!position || isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Location
          </button>

          <button
            onClick={() => setShowPath(!showPath)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showPath
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {showPath ? 'Hide' : 'Show'} Path
          </button>

          {showPath && (
            <button
              onClick={handleClearPath}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
