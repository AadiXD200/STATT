import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { HospitalWithWaitTime } from '../lib/types';

interface MapboxViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

export function MapboxView({
  hospitals,
  onHospitalSelect,
  onTravelTimeCalculated,
}: MapboxViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithWaitTime | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with OSM tiles
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
            maxzoom: 19
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [-79.3832, 43.6532], // Toronto default
      zoom: 11,
      pitch: 0, // Start flat
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          
          if (map.current) {
            map.current.flyTo({
              center: coords,
              zoom: 12,
              pitch: 45,
              bearing: 0,
              duration: 2000,
              essential: true,
              easing: (t) => t * (2 - t),
            });

            // Add user location marker
            new maplibregl.Marker({
              color: '#3b82f6',
              scale: 0.8,
            })
              .setLngLat(coords)
              .addTo(map.current);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Map is ready to use after initialization

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update hospital markers when data changes (without recreating map)
  useEffect(() => {
    if (!map.current || hospitals.length === 0) return;

    // Wait for map to be loaded before adding markers
    if (!map.current.loaded()) {
      map.current.once('load', () => {
        updateMarkers();
      });
      return;
    }

    updateMarkers();

    function updateMarkers() {
      if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    hospitals.forEach((hospital) => {
      if (!map.current) return;

      const waitMinutes = hospital.current_wait?.wait_minutes || 0;
      let color = '#22c55e'; // Green
      if (waitMinutes >= 240) color = '#ef4444'; // Red
      else if (waitMinutes >= 120) color = '#eab308'; // Yellow

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'hospital-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        transition: transform 0.2s;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'rotate(-45deg) scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'rotate(-45deg) scale(1)';
      });

      el.addEventListener('click', () => {
        setSelectedHospital(hospital);
        onHospitalSelect(hospital);
        
        if (map.current) {
          // Dramatic zoom-in animation
          map.current.flyTo({
            center: [hospital.lng, hospital.lat],
            zoom: 17,
            pitch: 60,
            bearing: 0,
            duration: 2500,
            essential: true,
            easing: (t) => t * (2 - t), // easeOutQuad for smooth deceleration
          });
        }
      });

      // Create popup
      const waitTime = waitMinutes < 60 
        ? `${waitMinutes}m` 
        : `${Math.floor(waitMinutes / 60)}h ${waitMinutes % 60}m`;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        className: 'hospital-popup',
      }).setHTML(`
        <div style="
          background: #1a1a1a;
          border: 1px solid #333;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: monospace;
        ">
          <div style="font-weight: bold; color: #fff; font-size: 12px; margin-bottom: 4px;">
            ${hospital.name}
          </div>
          <div style="color: ${color}; font-size: 11px;">
            Wait: ${waitTime}
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hospital.lng, hospital.lat])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
    });
    }
  }, [hospitals, onHospitalSelect]);

  // Draw route when hospital is selected
  useEffect(() => {
    if (!map.current || !userLocation || !selectedHospital) return;

    const drawRoute = async () => {
      try {
        // Using free OpenRouteService API (no key needed for basic usage)
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLocation[0]},${userLocation[1]};${selectedHospital.lng},${selectedHospital.lat}?overview=full&geometries=geojson`
        );
        
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const duration = Math.round(route.duration / 60); // Convert to minutes
          
          if (onTravelTimeCalculated) {
            onTravelTimeCalculated(duration);
          }

          // Add route layer
          if (map.current?.getSource('route')) {
            (map.current.getSource('route') as maplibregl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: route.geometry,
            });
          } else {
            map.current?.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: route.geometry,
              },
            });

            map.current?.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#3b82f6',
                'line-width': 4,
                'line-opacity': 0.8,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    drawRoute();
  }, [userLocation, selectedHospital, onTravelTimeCalculated]);

  return (
    <div className="fixed inset-0 z-30">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ background: '#1a1a1a' }} />
    </div>
  );
}
