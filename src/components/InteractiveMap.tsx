import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { HospitalWithWaitTime } from '../lib/types';
import './InteractiveMap.css';

interface InteractiveMapProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

export function InteractiveMap({ hospitals, onHospitalSelect }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [hoveredHospital, setHoveredHospital] = useState<HospitalWithWaitTime | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const setHoveredHospitalWithDelay = (hospital: HospitalWithWaitTime | null) => {
    clearHoverTimeout();
    setHoveredHospital(hospital);
  };

  const hidePreviewWithDelay = () => {
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredHospital(null);
    }, 100);
  };

  // Calculate popup position based on marker location
  const calculatePopupPosition = (hospital: HospitalWithWaitTime) => {
    if (!mapInstanceRef.current || !hospital.lat || !hospital.lng) return { x: 0, y: 0 };
    
    const map = mapInstanceRef.current;
    const markerLatLng = L.latLng(hospital.lat, hospital.lng);
    const containerPoint = map.latLngToContainerPoint(markerLatLng);
    
    // Adjust position to be near the marker
    const popupWidth = 320; // Smaller popup width
    const popupHeight = 400; // Smaller popup height
    
    let x = containerPoint.x;
    let y = containerPoint.y;
    
    // Position popup to the right of the marker
    x += 30; // Offset from marker
    
    // Adjust if popup would go off screen
    const mapContainer = map.getContainer();
    if (mapContainer) {
      const rect = mapContainer.getBoundingClientRect();
      const maxX = rect.width - popupWidth - 20;
      const maxY = rect.height - popupHeight - 20;
      
      if (x > maxX) x = maxX;
      if (y > maxY) y = maxY;
      if (x < 20) x = 20;
      if (y < 20) y = 20;
    }
    
    return { x, y };
  };

  // Update popup position when hovered hospital changes
  useEffect(() => {
    if (hoveredHospital) {
      const position = calculatePopupPosition(hoveredHospital);
      setPopupPosition(position);
    }
  }, [hoveredHospital]);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    // Initialize the map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([43.6532, -79.3832], 6);

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
        className: 'interactive-marker',
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

      // Handle marker hover
      marker.on('mouseover', (e) => {
        const markerElement = e.target.getElement();
        if (markerElement) {
          markerElement.classList.add('marker-hover');
          setHoveredHospitalWithDelay(hospital);
        }
      });

      marker.on('mouseout', (e) => {
        const markerElement = e.target.getElement();
        if (markerElement) {
          markerElement.classList.remove('marker-hover');
        }
        // Only hide if not hovering over the preview
        if (previewRef.current && !previewRef.current.matches(':hover')) {
          hidePreviewWithDelay();
        }
      });

      // Handle marker click
      marker.on('click', () => {
        onHospitalSelect(hospital);
        setHoveredHospital(null);
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
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [hospitals, onHospitalSelect]);

  useEffect(() => {
    return () => {
      clearHoverTimeout();
    };
  }, []);

  const getPatientsCount = (minutes: number) => {
    if (minutes <= 30) return '1-10';
    if (minutes <= 60) return '11-25';
    if (minutes <= 120) return '26-50';
    return '50+';
  };

  const getStatusInfo = (minutes: number) => {
    if (minutes <= 30) return { level: 'low', icon: '⚡ Fast', text: 'Short wait - Good availability' };
    if (minutes <= 60) return { level: 'medium', icon: '⏱️ Moderate', text: 'Moderate wait - Typical' };
    if (minutes <= 120) return { level: 'high', icon: '🐌 High', text: 'Long wait - Consider alternatives' };
    return { level: 'critical', icon: '🚨 Critical', text: 'Very long wait - Seek urgent care if possible' };
  };

  return (
    <div className="interactive-map-container">
      {/* Map Canvas */}
      <div ref={mapRef} className="map-canvas"></div>
      
      {/* Top Overlay Bar */}
      <div className="top-overlay">
        <div className="overlay-left">
          <h1 className="map-title">Ontario Hospitals</h1>
          <div className="hospital-count">
            <span className="count-number">{hospitals.length}</span>
            <span className="count-text">hospitals</span>
          </div>
        </div>
        <div className="overlay-right">
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

      {/* Stats Overlay */}
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
          <span>Hover for preview • Click for details</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-icon">🏥</span>
          <span>E = Emergency, U = Urgent Care</span>
        </div>
      </div>

      {/* Hospital Preview Tooltip - Google Maps Style */}
      {hoveredHospital && (
        <div 
          ref={previewRef}
          className="hospital-preview show"
          style={{
            position: 'absolute',
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
          }}
          onMouseEnter={() => setHoveredHospitalWithDelay(hoveredHospital)}
          onMouseLeave={() => hidePreviewWithDelay()}
        >
          {/* Hospital Image Header */}
          <div className="preview-image">
            <div className="image-placeholder">
              <div className="hospital-icon-large">
                {hoveredHospital.type === 'urgent_care' ? '🏥' : '🏥'}
              </div>
              <div className="image-overlay">
                <span className={`type-badge-image ${hoveredHospital.type}`}>
                  {hoveredHospital.type === 'urgent_care' ? 'URGENT CARE' : 'EMERGENCY'}
                </span>
              </div>
            </div>
          </div>

          {/* Hospital Info */}
          <div className="preview-body">
            <div className="preview-title-section">
              <h3 className="preview-name">{hoveredHospital.name}</h3>
              <p className="preview-address">{hoveredHospital.address}</p>
            </div>

            {/* Quick Stats Row */}
            <div className="preview-quick-stats">
              <div className="quick-stat-item">
                <span className="quick-stat-icon">⏱️</span>
                <div className="quick-stat-content">
                  <span className="quick-stat-value">{hoveredHospital.current_wait?.wait_minutes || 'N/A'}</span>
                  <span className="quick-stat-unit">min wait</span>
                </div>
              </div>
              <div className="quick-stat-divider"></div>
              <div className="quick-stat-item">
                <span className="quick-stat-icon">🚗</span>
                <div className="quick-stat-content">
                  <span className="quick-stat-value">{hoveredHospital.current_wait?.drive_minutes || 'N/A'}</span>
                  <span className="quick-stat-unit">min drive</span>
                </div>
              </div>
              <div className="quick-stat-divider"></div>
              <div className="quick-stat-item">
                <span className="quick-stat-icon">👥</span>
                <div className="quick-stat-content">
                  <span className="quick-stat-value">
                    {hoveredHospital.current_wait ? 
                      getPatientsCount(hoveredHospital.current_wait.wait_minutes) : '—'}
                  </span>
                  <span className="quick-stat-unit">waiting</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="preview-info-grid">
              <div className="info-row">
                <span className="info-label">Crowd Level</span>
                <span className={`info-value ${hoveredHospital.current_wait?.crowd_level || 'unknown'}`}>
                  {hoveredHospital.current_wait?.crowd_level || 'Unknown'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">24/7 Service</span>
                <span className={`info-value ${hoveredHospital.open_24h ? 'available' : 'limited'}`}>
                  {hoveredHospital.open_24h ? 'Available' : 'Limited'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Parking</span>
                <span className={`info-value ${hoveredHospital.parking_available ? 'available' : 'unavailable'}`}>
                  {hoveredHospital.parking_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`preview-status-banner ${hoveredHospital.current_wait ? getStatusInfo(hoveredHospital.current_wait.wait_minutes).level : 'unknown'}`}>
              <span className="status-banner-icon">
                {hoveredHospital.current_wait ? getStatusInfo(hoveredHospital.current_wait.wait_minutes).icon : '📊'}
              </span>
              <span className="status-banner-text">
                {hoveredHospital.current_wait ? 
                  getStatusInfo(hoveredHospital.current_wait.wait_minutes).text : 
                  'Wait time data not available'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
