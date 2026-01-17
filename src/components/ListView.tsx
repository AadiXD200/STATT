import { HospitalCard } from './HospitalCard';
import type { HospitalWithWaitTime } from '../lib/types';

interface ListViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
}

export function ListView({ hospitals, onHospitalSelect }: ListViewProps) {
  const sortedHospitals = [...hospitals].sort((a, b) => {
    const totalA = (a.current_wait?.wait_minutes || 0) + (a.current_wait?.drive_minutes || 0);
    const totalB = (b.current_wait?.wait_minutes || 0) + (b.current_wait?.drive_minutes || 0);
    return totalA - totalB;
  });

  return (
    <div className="fixed inset-0 z-40 bg-background overflow-hidden">
      <div className="h-full overflow-y-auto pt-20 pb-32 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="font-mono text-text-secondary text-sm uppercase tracking-wider">
              Sorted by: <span className="text-text-primary font-bold">FASTEST CARE</span>
            </h2>
          </div>

          <div className="space-y-3">
            {sortedHospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                onClick={() => onHospitalSelect(hospital)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
