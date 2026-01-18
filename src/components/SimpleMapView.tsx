import { useState } from 'react';
import type { HospitalWithWaitTime } from '../lib/types';

interface SimpleMapViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

export function SimpleMapView({ hospitals, onHospitalSelect }: SimpleMapViewProps) {
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithWaitTime | null>(null);

  return (
    <div className="flex-1 p-6">
      <div className="bg-background-secondary border border-border rounded-lg p-4 h-full">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-text-primary mb-2">Hospital Locations</h2>
          <p className="text-text-secondary text-sm">
            Interactive map requires Google Maps API key. Showing hospital list as fallback.
          </p>
        </div>
        
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="bg-background border border-border rounded-lg p-4 cursor-pointer hover:border-accent-blue transition-colors"
              onClick={() => {
                setSelectedHospital(hospital);
                onHospitalSelect(hospital);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-text-primary">{hospital.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-mono ${
                  hospital.type === 'urgent_care' 
                    ? 'bg-accent-blue/20 text-accent-blue' 
                    : 'bg-accent-green/20 text-accent-green'
                }`}>
                  {hospital.type === 'urgent_care' ? 'URGENT CARE' : 'EMERGENCY'}
                </span>
              </div>
              
              <div className="text-sm text-text-secondary mb-2">
                {hospital.address}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-text-tertiary">
                  <span>📍 {hospital.lat.toFixed(4)}, {hospital.lng.toFixed(4)}</span>
                  {hospital.pediatric && <span>🧸 Pediatric</span>}
                  {hospital.parking_available && <span>🅿️ Parking</span>}
                </div>
                
                {hospital.current_wait && (
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-text-primary">
                      {hospital.current_wait.wait_minutes}m
                    </div>
                    <div className="text-xs text-text-tertiary">wait time</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {hospitals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-secondary">No hospitals found</p>
          </div>
        )}
      </div>
    </div>
  );
}
