import { X, Navigation, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { HospitalWithWaitTime, WaitTime, UserReport } from '../lib/types';
import { waitTimes } from '../data/waitTimes';
import { userReports } from '../data/userReports';

interface HospitalDetailProps {
  hospital: HospitalWithWaitTime;
  onClose: () => void;
}

export function HospitalDetail({ hospital, onClose }: HospitalDetailProps) {
  const [historicalData, setHistoricalData] = useState<WaitTime[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);

  useEffect(() => {
    loadHistoricalData();
    loadReports();
  }, [hospital.id]);

  const loadHistoricalData = async () => {
    // Get wait times for this hospital, sorted by timestamp (most recent first)
    const historical = waitTimes
      .filter(wt => wt.hospital_id === hospital.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 24)
      .reverse(); // Reverse to show oldest first for the chart
    
    setHistoricalData(historical);
  };

  const loadReports = async () => {
    // Get user reports for this hospital, sorted by timestamp (most recent first)
    const reportsData = userReports
      .filter(report => report.hospital_id === hospital.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    
    setReports(reportsData);
  };

  const waitMinutes = hospital.current_wait?.wait_minutes || 0;
  const driveMinutes = hospital.current_wait?.drive_minutes || 0;
  const totalMinutes = waitMinutes + driveMinutes;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const avgWaitTime = historicalData.length > 0
    ? historicalData.reduce((sum, d) => sum + d.wait_minutes, 0) / historicalData.length
    : waitMinutes;

  const isTrending = waitMinutes < avgWaitTime;

  const maxWait = Math.max(...historicalData.map(d => d.wait_minutes), 1);

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-[95vw] md:max-w-6xl max-h-[95vh] bg-surface border border-border overflow-hidden flex flex-col">
        <div className="border-b border-border p-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-sans font-bold text-text-primary text-xl mb-1">
              {hospital.name}
            </h2>
            <p className="font-mono text-text-secondary text-xs">
              {hospital.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-border transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          <div className="bg-surface p-6">
            <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
              TIMELINE_SEQUENCE
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-text-primary"></div>
                <div>
                  <div className="font-mono text-text-primary text-sm">NOW</div>
                  <div className="font-mono text-text-tertiary text-xs">Current Location</div>
                </div>
              </div>

              <div className="ml-1.5 w-px h-8 bg-accent-blue"></div>

              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-accent-blue"></div>
                <div>
                  <div className="font-mono text-accent-blue text-sm">DRIVE: {formatTime(driveMinutes)}</div>
                  <div className="font-mono text-text-tertiary text-xs">En Route</div>
                </div>
              </div>

              <div className="ml-1.5 w-px h-8 bg-border"></div>

              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full border border-border"></div>
                <div>
                  <div className="font-mono text-text-primary text-sm">CHECK-IN</div>
                  <div className="font-mono text-text-tertiary text-xs">Registration Desk</div>
                </div>
              </div>

              <div className="ml-1.5 w-px h-12 bg-accent-red animate-pulse-slow"></div>

              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full border-2 border-accent-red animate-pulse-slow"></div>
                <div>
                  <div className="font-mono text-accent-red text-sm">WAIT: {formatTime(waitMinutes)}</div>
                  <div className="font-mono text-text-tertiary text-xs">Waiting Room</div>
                </div>
              </div>

              <div className="ml-1.5 w-px h-8 bg-border"></div>

              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-accent-green"></div>
                <div>
                  <div className="font-mono text-accent-green text-sm">DOCTOR</div>
                  <div className="font-mono text-text-tertiary text-xs">Total: {formatTime(totalMinutes)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider">
                WAIT_TREND_24H
              </h3>
              <div className="flex items-center gap-2">
                {isTrending ? (
                  <>
                    <TrendingDown size={16} className="text-accent-green" />
                    <span className="font-mono text-accent-green text-xs">DOWN</span>
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} className="text-accent-red" />
                    <span className="font-mono text-accent-red text-xs">UP</span>
                  </>
                )}
              </div>
            </div>

            <div className="h-48 flex items-end gap-1">
              {historicalData.map((data, i) => {
                // Calculate relative height with minimum to ensure visibility
                const relativeHeight = maxWait > 0 ? (data.wait_minutes / maxWait) * 90 : 10;
                const height = Math.max(8, relativeHeight); // Minimum 8% height for visibility
                return (
                  <div
                    key={i}
                    className="flex-1 bg-accent-green/70 relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-surface border border-border px-2 py-1 whitespace-nowrap">
                        <div className="font-mono text-text-primary text-xs">
                          {formatTime(data.wait_minutes)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-background border border-border">
              <p className="font-mono text-text-secondary text-xs">
                Best time to go is <span className="text-text-primary font-bold">5:00 AM</span>
              </p>
            </div>
          </div>

          <div className="bg-surface p-6">
            <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
              ROUTE_MAP
            </h3>
            <div className="aspect-video bg-background border border-border mb-4 flex items-center justify-center">
              <div className="text-text-tertiary font-mono text-xs">MAP PREVIEW</div>
            </div>
            <button
              onClick={openInMaps}
              className="w-full bg-text-primary text-background font-mono text-xs uppercase tracking-wider py-3 hover:bg-text-secondary transition-colors flex items-center justify-center gap-2"
            >
              <Navigation size={16} />
              <span>Navigate (Google Maps)</span>
            </button>
          </div>

          <div className="bg-surface p-6">
            <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
              VIBE_CHECK
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background border border-border">
                <span className="font-mono text-text-secondary text-xs">Crowd Level:</span>
                <span className="font-mono text-text-primary text-xs uppercase font-bold">
                  {hospital.current_wait?.crowd_level || 'MEDIUM'}
                </span>
              </div>

              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs capitalize">
                    {report.report_type.replace('_', ' ')}:
                  </span>
                  <span className="font-mono text-text-primary text-xs uppercase font-bold">
                    {report.value}
                  </span>
                </div>
              ))}

              {hospital.parking_available && (
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Parking:</span>
                  <span className="font-mono text-accent-green text-xs uppercase font-bold">
                    AVAILABLE
                  </span>
                </div>
              )}

              {hospital.pediatric && (
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Pediatric:</span>
                  <span className="font-mono text-accent-green text-xs uppercase font-bold">
                    YES
                  </span>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
