import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { HospitalWithWaitTime } from '../lib/types';
import 'leaflet/dist/leaflet.css';

interface FreeMapViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

export function FreeMapView({ hospitals, onHospitalSelect }: FreeMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current, {
      zoomControl: true,
    }).setView([43.6532, -79.3832], 7);

    // Add dark theme tiles from CartoDB (free, no API key needed)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
      if (hospital.current_wait) {
        const waitMinutes = hospital.current_wait.wait_minutes;
        if (waitMinutes > 180) {
          markerColor = '#EF4444'; // Red
        } else if (waitMinutes > 60) {
          markerColor = '#F59E0B'; // Yellow
        }
      } else {
        markerColor = '#6B7280'; // Gray for no data
      }

      // Create custom icon
      const customIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${markerColor};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          ">
            <span style="color: white; font-size: 12px; font-weight: bold;">
              ${hospital.type === 'urgent_care' ? 'U' : 'E'}
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([hospital.lat, hospital.lng], { icon: customIcon });
      
      // Create popup content
      const popupContent = `
        <div style="
          background: #1e293b;
          color: white;
          padding: 16px;
          border-radius: 12px;
          min-width: 280px;
          max-width: 320px;
          font-family: system-ui, -apple-system, sans-serif;
          margin: -14px -20px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 600; line-height: 1.3;">
              ${hospital.name}
            </h3>
            <span style="
              background: ${hospital.type === 'urgent_care' ? '#3b82f6' : '#10b981'};
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 700;
              white-space: nowrap;
            ">
              ${hospital.type === 'urgent_care' ? 'URGENT' : 'ER'}
            </span>
          </div>
          
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px; display: flex; gap: 8px;">
            <span>📍</span>
            <span>${hospital.address}</span>
          </div>

          ${hospital.current_wait ? `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-top: 1px solid #334155;">
              <span style="color: #94a3b8; font-size: 12px;">Wait Time:</span>
              <span style="
                color: ${hospital.current_wait.wait_minutes > 180 ? '#ef4444' : hospital.current_wait.wait_minutes > 60 ? '#f59e0b' : '#10b981'};
                font-weight: 700;
                font-size: 14px;
              ">
                ${hospital.current_wait.wait_minutes} min
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
              <span style="color: #94a3b8; font-size: 12px;">Crowd Level:</span>
              <span style="color: white; font-size: 12px; text-transform: capitalize;">
                ${hospital.current_wait.crowd_level}
              </span>
            </div>
          ` : `
            <div style="padding: 8px 0; border-top: 1px solid #334155; color: #6b7280; font-size: 12px;">
              No wait time data available
            </div>
          `}

          ${hospital.phone ? `
            <div style="display: flex; gap: 8px; padding: 8px 0; border-top: 1px solid #334155; font-size: 12px;">
              <span>📞</span>
              <span style="color: white;">${hospital.phone}</span>
            </div>
          ` : ''}

          <div style="display: flex; flex-wrap: wrap; gap: 6px; padding-top: 8px; border-top: 1px solid #334155;">
            ${hospital.open_24h ? '<span style="background: rgba(16,185,129,0.2); color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 10px;">24/7</span>' : ''}
            ${hospital.pediatric ? '<span style="background: rgba(59,130,246,0.2); color: #3b82f6; padding: 4px 8px; border-radius: 4px; font-size: 10px;">Pediatric</span>' : ''}
            ${hospital.parking_available ? '<span style="background: rgba(107,114,128,0.2); color: #9ca3af; padding: 4px 8px; border-radius: 4px; font-size: 10px;">Parking</span>' : ''}
            ${hospital.trauma_level ? `<span style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 10px;">Level ${hospital.trauma_level}</span>` : ''}
          </div>

          <button 
            onclick="window.selectHospitalFromMap('${hospital.id}')"
            style="
              width: 100%;
              margin-top: 12px;
              padding: 10px 16px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            "
            onmouseover="this.style.background='#2563eb'"
            onmouseout="this.style.background='#3b82f6'"
          >
            View Details
          </button>
        </div>
      `;

      // Bind popup
      marker.bindPopup(popupContent, {
        className: 'custom-popup',
        closeButton: true,
        maxWidth: 350,
      });

      // Handle marker click
      marker.on('click', () => {
        onHospitalSelect(hospital);
      });

      // Handle hover
      marker.on('mouseover', () => {
        marker.openPopup();
      });

      if (mapInstanceRef.current) {
        marker.addTo(mapInstanceRef.current);
      }

      markersRef.current.push(marker);
    });

    // Make selectHospital available globally for popup button
    (window as any).selectHospitalFromMap = (hospitalId: string) => {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (hospital) {
        onHospitalSelect(hospital);
      }
    };

    // Fit map to show all markers if there are any
    if (hospitals.length > 0 && hospitals.some(h => h.lat && h.lng)) {
      const bounds = L.latLngBounds(
        hospitals
          .filter(h => h.lat && h.lng)
          .map(h => [h.lat, h.lng] as [number, number])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      delete (window as any).selectHospitalFromMap;
    };
  }, [hospitals, onHospitalSelect]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 rounded-lg p-4 shadow-lg z-[1000]">
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
      <div className="absolute top-4 left-4 bg-slate-900/95 border border-slate-700 rounded-lg px-4 py-2 shadow-lg z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">{hospitals.length}</span>
          <span className="text-gray-400 text-sm">hospitals</span>
        </div>
      </div>

      <style>{`
        .custom-hospital-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-hospital-marker > div:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          background: #1e293b;
        }
        .custom-popup .leaflet-popup-close-button {
          color: white !important;
          top: 8px !important;
          right: 8px !important;
          font-size: 18px !important;
        }
        .leaflet-control-zoom a {
          background: #1e293b !important;
          color: #f1f5f9 !important;
          border: 1px solid #475569 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #334155 !important;
        }
      `}</style>
    </div>
  );
}
