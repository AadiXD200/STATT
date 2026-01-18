import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { HospitalWithWaitTime } from '../lib/types';
import './LeafletMapView.css';

interface LeafletMapViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

export function LeafletMapView({ hospitals, onHospitalSelect }: LeafletMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    // Initialize the map
    const map = L.map(mapRef.current).setView([43.6532, -79.3832], 6); // Center on Ontario

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ' OpenStreetMap contributors'
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
      if (hospital.current_wait) {
        const waitMinutes = hospital.current_wait.wait_minutes;
        if (waitMinutes > 180) markerColor = '#EF4444'; // Red
        else if (waitMinutes > 60) markerColor = '#F59E0B'; // Yellow
      }

      // Create custom icon with enhanced hover effects
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="hospital-marker" data-hospital-id="${hospital.id}" style="
            background-color: ${markerColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            color: white;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
          ">
            ${hospital.type === 'urgent_care' ? 'U' : 'E'}
            <div class="marker-pulse" style="
              position: absolute;
              top: -6px;
              left: -6px;
              right: -6px;
              bottom: -6px;
              border-radius: 50%;
              border: 2px solid ${markerColor};
              opacity: 0;
              animation: pulse 2s infinite;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([hospital.lat, hospital.lng], { icon: customIcon });
      
      if (mapInstanceRef.current) {
        marker.addTo(mapInstanceRef.current);
      }

      // Don't bind popup - we don't want it to appear
      
      // Handle marker hover effects
      marker.on('mouseover', function(e) {
        const markerElement = e.target.getElement();
        if (markerElement) {
          const hospitalMarker = markerElement.querySelector('.hospital-marker');
          const pulseElement = markerElement.querySelector('.marker-pulse');
          if (hospitalMarker) {
            hospitalMarker.style.transform = 'scale(1.2)';
            hospitalMarker.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';
            hospitalMarker.style.zIndex = '1000';
          }
          if (pulseElement) {
            pulseElement.style.opacity = '0.6';
          }
        }
      });

      marker.on('mouseout', function(e) {
        const markerElement = e.target.getElement();
        if (markerElement) {
          const hospitalMarker = markerElement.querySelector('.hospital-marker');
          const pulseElement = markerElement.querySelector('.marker-pulse');
          if (hospitalMarker) {
            hospitalMarker.style.transform = 'scale(1)';
            hospitalMarker.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
            hospitalMarker.style.zIndex = '';
          }
          if (pulseElement) {
            pulseElement.style.opacity = '0';
          }
        }
      });

      // Handle marker click
      marker.on('click', () => {
        onHospitalSelect(hospital);
      });

      markersRef.current.push(marker);
    });

    // Make selectHospital available globally for popup buttons
    (window as any).selectHospital = (hospitalId: string) => {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (hospital) {
        onHospitalSelect(hospital);
      }
    };

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
    <div className="flex-1 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-lg">
          {/* Map Header */}
          <div className="bg-background-secondary border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-text-primary">Hospital Map</h2>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                  <span>{hospitals.length} hospitals</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent-green rounded-full border-2 border-white shadow-sm"></div>
                  <span className="text-text-secondary">&lt;1h</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
                  <span className="text-text-secondary">1-3h</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                  <span className="text-text-secondary">&gt;3h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative bg-gray-900">
            <div 
              ref={mapRef} 
              className="w-full"
              style={{ 
                height: '450px',
                minHeight: '450px'
              }}
            />

            {/* No Data Overlay */}
            {hospitals.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🗺️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">No Hospitals Available</h3>
                  <p className="text-text-secondary mb-4">Hospital data is loading or unavailable</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-accent-blue text-white rounded-lg text-sm hover:bg-accent-blue/80 transition-colors shadow-md"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            )}

            {/* Map Legend */}
            {hospitals.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-background border border-border rounded-lg p-4 shadow-lg z-10">
                <div className="text-sm font-semibold text-text-primary mb-3">Legend</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-accent-green rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">E</span>
                    </div>
                    <span className="text-text-secondary text-sm">Emergency Room</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-accent-blue rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">U</span>
                    </div>
                    <span className="text-text-secondary text-sm">Urgent Care</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
