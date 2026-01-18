import type { HospitalWithWaitTime } from '../lib/types';

interface HospitalCardProps {
  hospital: HospitalWithWaitTime;
  onClick: () => void;
}

export function HospitalCard({ hospital, onClick }: HospitalCardProps) {
  const waitMinutes = hospital.current_wait?.wait_minutes || 0;
  const driveMinutes = hospital.current_wait?.drive_minutes || 0;
  const totalMinutes = waitMinutes + driveMinutes;
  const crowdLevel = hospital.current_wait?.crowd_level || 'medium';

  const getTotalTimeColor = (total: number) => {
    if (total < 60) return 'text-accent-green';
    if (total < 180) return 'text-text-primary';
    return 'text-accent-red';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const drivePercentage = (driveMinutes / totalMinutes) * 100;

  return (
    <button
      onClick={onClick}
      className="w-full bg-surface border border-border hover:border-text-primary transition-colors p-4 text-left group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-sans font-bold text-text-primary text-base truncate">
              {hospital.name}
            </h3>
            {hospital.trauma_level && (
              <span className="font-mono text-text-tertiary text-xs whitespace-nowrap">
                Trauma Lvl {hospital.trauma_level}
              </span>
            )}
          </div>
          <p className="font-mono text-text-secondary text-xs mb-3">
            {hospital.type === 'urgent_care' ? 'URGENT CARE' : 'EMERGENCY'}
          </p>

          <div className="space-y-1">
            <div className="h-1 bg-border-light flex overflow-hidden">
              <div
                className="bg-accent-blue"
                style={{ width: `${drivePercentage}%` }}
              ></div>
              <div
                className="bg-accent-red"
                style={{ width: `${100 - drivePercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-accent-blue">Drive: {formatTime(driveMinutes)}</span>
                <span className="text-accent-red">Wait: {formatTime(waitMinutes)}</span>
              </div>
              <span className="text-text-tertiary uppercase">{crowdLevel}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className={`font-mono font-bold text-3xl ${getTotalTimeColor(totalMinutes)}`}>
            {formatTime(totalMinutes)}
          </div>
          <div className="font-mono text-text-tertiary text-xs mt-1">TOTAL</div>
        </div>
      </div>
    </button>
  );
}
