import { useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { HospitalWithWaitTime } from '../lib/types';

interface GoogleMapViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export function GoogleMapView({ hospitals, onHospitalSelect }: GoogleMapViewProps) {
  const [hoveredHospital, setHoveredHospital] = useState<HospitalWithWaitTime | null>(null);

  const getMarkerColor = (hospital: HospitalWithWaitTime) => {
    if (!hospital.current_wait) return '#6b7280'; // gray
    const waitMinutes = hospital.current_wait.wait_minutes;
    if (waitMinutes > 180) return '#ef4444'; // red
    if (waitMinutes > 60) return '#f59e0b'; // yellow
    return '#10b981'; // green
  };

  const handleMarkerClick = useCallback((hospital: HospitalWithWaitTime) => {
    onHospitalSelect(hospital);
  }, [onHospitalSelect]);

  return (
    <div className="h-full w-full relative">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={{ lat: 43.6532, lng: -79.3832 }}
          defaultZoom={7}
          mapId="hospital-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          styles={[
            { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b8b' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e1a' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ]}
        >
          {hospitals.map((hospital) => {
            if (!hospital.lat || !hospital.lng) return null;
            
            const color = getMarkerColor(hospital);
            const isHovered = hoveredHospital?.id === hospital.id;
            
            return (
              <AdvancedMarker
                key={hospital.id}
                position={{ lat: hospital.lat, lng: hospital.lng }}
                onClick={() => handleMarkerClick(hospital)}
                onMouseEnter={() => setHoveredHospital(hospital)}
                onMouseLeave={() => setHoveredHospital(null)}
              >
                <div 
                  className={`relative cursor-pointer transition-transform duration-200 ${isHovered ? 'scale-125' : ''}`}
                >
                  {/* Marker dot */}
                  <div
                    className="w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: color,
                      borderWidth: '3px',
                      boxShadow: isHovered ? `0 0 20px ${color}` : '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    <span className="text-white text-xs font-bold">
                      {hospital.type === 'urgent_care' ? 'U' : 'E'}
                    </span>
                  </div>
                  
                  {/* Pulse effect for hovered */}
                  {isHovered && (
                    <div 
                      className="absolute inset-0 rounded-full animate-ping opacity-50"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Info Window for hovered hospital */}
          {hoveredHospital && hoveredHospital.lat && hoveredHospital.lng && (
            <InfoWindow
              position={{ lat: hoveredHospital.lat, lng: hoveredHospital.lng }}
              pixelOffset={[0, -45]}
              onCloseClick={() => setHoveredHospital(null)}
              headerDisabled
            >
              <div className="bg-slate-900 text-white p-4 rounded-lg min-w-[280px] max-w-[320px] -m-2">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold leading-tight">
                    {hoveredHospital.name}
                  </h3>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${
                    hoveredHospital.type === 'urgent_care' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {hoveredHospital.type === 'urgent_care' ? 'URGENT' : 'ER'}
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span>📍</span>
                    <span className="text-gray-300 flex-1">{hoveredHospital.address}</span>
                  </div>

                  {hoveredHospital.current_wait && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-700">
                      <span className="text-gray-400 font-medium">Wait Time:</span>
                      <span className={`font-bold text-sm ${
                        hoveredHospital.current_wait.wait_minutes > 180 
                          ? 'text-red-400' 
                          : hoveredHospital.current_wait.wait_minutes > 60 
                          ? 'text-yellow-400' 
                          : 'text-emerald-400'
                      }`}>
                        {hoveredHospital.current_wait.wait_minutes} min
                      </span>
                    </div>
                  )}

                  {hoveredHospital.current_wait && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-medium">Crowd Level:</span>
                      <span className="text-white capitalize">
                        {hoveredHospital.current_wait.crowd_level}
                      </span>
                    </div>
                  )}

                  {hoveredHospital.phone && (
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-700">
                      <span>📞</span>
                      <span className="text-white">{hoveredHospital.phone}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-slate-700 text-[10px]">
                    {hoveredHospital.open_24h && (
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">24/7</span>
                    )}
                    {hoveredHospital.pediatric && (
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Pediatric</span>
                    )}
                    {hoveredHospital.parking_available && (
                      <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded">Parking</span>
                    )}
                    {hoveredHospital.trauma_level && (
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        Level {hoveredHospital.trauma_level}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onHospitalSelect(hoveredHospital)}
                    className="w-full mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 rounded-lg p-4 shadow-lg z-10">
        <div className="text-sm font-semibold text-white mb-3">Wait Times</div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-300 text-sm">&lt; 1 hour</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-300 text-sm">1-3 hours</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-300 text-sm">&gt; 3 hours</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-slate-600 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">E</span>
            </div>
            <span className="text-gray-300 text-sm">Emergency Room</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-slate-600 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">U</span>
            </div>
            <span className="text-gray-300 text-sm">Urgent Care</span>
          </div>
        </div>
      </div>

      {/* Hospital Count */}
      <div className="absolute top-4 left-4 bg-slate-900/95 border border-slate-700 rounded-lg px-4 py-2 shadow-lg z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">{hospitals.length}</span>
          <span className="text-gray-400 text-sm">hospitals</span>
        </div>
      </div>
    </div>
  );
}
