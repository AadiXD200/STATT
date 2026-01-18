import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { HospitalWithWaitTime } from '../lib/types';
import './CleanMap.css';

interface CleanMapProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

export function CleanMap({ hospitals, onHospitalSelect }: CleanMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    // Initialize the map
    const map = L.map(mapRef.current).setView([43.6532, -79.3832], 6);

    // Add dark theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for each hospital
    hospitals.forEach(hospital => {
      if (!hospital.lat || !hospital.lng) return;

      // Determine marker color based on wait time
      let markerColor = '#10B981'; // Green (default)
      let waitLevel = 'LOW';
      if (hospital.current_wait) {
        const waitMinutes = hospital.current_wait.wait_minutes;
        if (waitMinutes > 180) {
          markerColor = '#EF4444'; // Red
          waitLevel = 'HIGH';
        } else if (waitMinutes > 60) {
          markerColor = '#F59E0B'; // Yellow
          waitLevel = 'MEDIUM';
        }
      }

      // Create custom icon
      const customIcon = L.divIcon({
        className: 'clean-marker',
        html: `
          <div class="marker-container" data-hospital-id="${hospital.id}" data-wait-level="${waitLevel}">
            <div class="marker-dot" style="background: ${markerColor}"></div>
            <div class="marker-pulse" style="border-color: ${markerColor}"></div>
            <div class="marker-label">${hospital.type === 'urgent_care' ? 'U' : 'E'}</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([hospital.lat, hospital.lng], { icon: customIcon });
      
      if (mapInstanceRef.current) {
        marker.addTo(mapInstanceRef.current);
      }

      // Handle marker click
      marker.on('click', () => {
        setSelectedMarker(hospital.id);
        onHospitalSelect(hospital);
      });

      // Handle marker hover
      marker.on('mouseover', () => {
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.classList.add('marker-hover');
        }
      });

      marker.on('mouseout', () => {
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.classList.remove('marker-hover');
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (hospitals.length > 0) {
      const bounds = L.latLngBounds(
        hospitals
          .filter(h => h.lat && h.lng)
          .map(h => [h.lat, h.lng] as [number, number])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [hospitals, onHospitalSelect]);

  return (
    <div className="clean-map-container">
      <div className="map-header">
        <div className="header-left">
          <h1 className="map-title">Ontario Hospitals</h1>
          <div className="hospital-count">
            <span className="count-number">{hospitals.length}</span>
            <span className="count-text">hospitals</span>
          </div>
        </div>
        <div className="header-right">
          <div className="legend">
            <div className="legend-item">
              <div className="legend-dot low"></div>
              <span>Low wait</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot medium"></div>
              <span>Medium wait</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot high"></div>
              <span>High wait</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="map-wrapper">
        <div ref={mapRef} className="map-canvas"></div>
        
        {/* Quick Stats Overlay */}
        <div className="stats-overlay">
          <div className="stat-card">
            <div className="stat-value">
              {hospitals.filter(h => h.current_wait && h.current_wait.wait_minutes <= 60).length}
            </div>
            <div className="stat-label">Fast</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {hospitals.filter(h => h.current_wait && h.current_wait.wait_minutes > 60 && h.current_wait.wait_minutes <= 180).length}
            </div>
            <div className="stat-label">Moderate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {hospitals.filter(h => h.current_wait && h.current_wait.wait_minutes > 180).length}
            </div>
            <div className="stat-label">Slow</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <div className="instruction-item">
            <span className="instruction-icon">📍</span>
            <span>Click markers for details</span>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">🏥</span>
            <span>E = Emergency, U = Urgent Care</span>
          </div>
        </div>
      </div>
    </div>
  );
}
