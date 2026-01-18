import { Clock, MapPin } from 'lucide-react';
import type { HospitalWithWaitTime } from '../lib/types';

interface HospitalListViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  selectedHospital: HospitalWithWaitTime | null;
}

export function HospitalListView({ hospitals, onHospitalSelect, selectedHospital }: HospitalListViewProps) {
  const getWaitTimeColor = (waitMinutes: number) => {
    if (waitMinutes < 120) return 'text-green-500';
    if (waitMinutes < 240) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              {hospitals.length} Hospital{hospitals.length !== 1 ? 's' : ''} Found
            </h2>
          </div>
        </div>
      </div>

      {/* Hospital List */}
      <div className="divide-y divide-border">
        {hospitals.map((hospital) => {
          const waitMinutes = hospital.current_wait?.wait_minutes || 0;
          const isSelected = selectedHospital?.id === hospital.id;

          return (
            <button
              key={hospital.id}
              onClick={() => onHospitalSelect(hospital)}
              className={`w-full text-left px-6 py-4 hover:bg-surface/50 transition-colors ${
                isSelected ? 'bg-surface' : ''
              }`}
            >
              {/* Hospital Name */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-text-primary text-sm pr-2">
                  {hospital.name}
                </h3>
                {hospital.type === 'urgent_care' && (
                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                    LIVE
                  </span>
                )}
              </div>

              {/* Wait Time */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className={getWaitTimeColor(waitMinutes)} />
                  <span className={`font-semibold text-sm ${getWaitTimeColor(waitMinutes)}`}>
                    {formatWaitTime(waitMinutes)}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-text-tertiary">
                <MapPin size={12} />
                <span className="text-xs truncate">
                  {hospital.address}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
