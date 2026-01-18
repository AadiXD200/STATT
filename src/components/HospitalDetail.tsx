import { X, Navigation, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { HospitalWithWaitTime, WaitTime, UserReport } from '../lib/types';
import { waitTimes } from '../data/waitTimes';
import { userReports } from '../data/userReports';

interface HospitalDetailProps {
  hospital: HospitalWithWaitTime;
  onClose: () => void;
  isSidePanel?: boolean;
}

export function HospitalDetail({ hospital, onClose, isSidePanel = false }: HospitalDetailProps) {
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

  const getWaitTimeColor = (minutes: number) => {
    if (minutes > 180) return 'text-accent-red';
    if (minutes > 60) return 'text-yellow-500';
    return 'text-accent-green';
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
    <div className={`${isSidePanel 
      ? 'h-full w-full bg-surface border-l border-border flex flex-col animate-in slide-in-from-right duration-300' 
      : 'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200'
    }`}>
      <div className={`${isSidePanel 
        ? 'h-full w-full flex flex-col overflow-hidden' 
        : 'w-full max-w-[95vw] md:max-w-6xl max-h-[95vh] bg-surface border border-border overflow-hidden flex flex-col'
      }`}>
        <div className="border-b border-border p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className={`font-sans font-bold text-text-primary ${isSidePanel ? 'text-lg' : 'text-xl'} mb-1 truncate`}>
              {hospital.name}
            </h2>
            <p className="font-mono text-text-secondary text-xs truncate">
              {hospital.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-border transition-colors flex-shrink-0 ml-2"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className={`${isSidePanel ? 'space-y-0' : 'grid grid-cols-1 md:grid-cols-2 gap-px bg-border'}`}>
            {/* Wait Time Analysis Section */}
            <div className={`${isSidePanel ? 'border-b border-border' : 'bg-surface'} p-6`}>
              <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
                WAIT_TIME_ANALYSIS
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Current Wait:</span>
                  <span className={`font-mono text-xs uppercase font-bold ${getWaitTimeColor(waitMinutes)}`}>
                    {formatTime(waitMinutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Average:</span>
                  <span className="font-mono text-text-primary text-xs uppercase font-bold">
                    {formatTime(avgWaitTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Trend:</span>
                  <span className="flex items-center gap-1">
                    {isTrending ? <TrendingDown size={12} className="text-accent-green" /> : <TrendingUp size={12} className="text-accent-red" />}
                    <span className={`font-mono text-xs uppercase font-bold ${isTrending ? 'text-accent-green' : 'text-accent-red'}`}>
                      {isTrending ? 'IMPROVING' : 'WORSENING'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Drive Time:</span>
                  <span className="font-mono text-text-primary text-xs uppercase font-bold">
                    {formatTime(driveMinutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Total Time:</span>
                  <span className="font-mono text-text-primary text-xs uppercase font-bold">
                    {formatTime(waitMinutes + driveMinutes)}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-background border border-border">
                <p className="font-mono text-text-secondary text-xs">
                  Best time to go is <span className="text-text-primary font-bold">5:00 AM</span>
                </p>
              </div>
            </div>

            {/* Patient Information Section */}
            <div className={`${isSidePanel ? 'border-b border-border' : 'bg-surface'} p-6`}>
              <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
                PATIENT_INFORMATION
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Hospital Type:</span>
                  <span className="font-mono text-text-primary text-xs uppercase font-bold">
                    {hospital.type === 'urgent_care' ? 'URGENT CARE' : 'EMERGENCY'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Trauma Level:</span>
                  <span className="font-mono text-text-primary text-xs uppercase font-bold">
                    {hospital.trauma_level ? `LEVEL ${hospital.trauma_level}` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">24/7 Service:</span>
                  <span className={`font-mono text-xs uppercase font-bold ${hospital.open_24h ? 'text-accent-green' : 'text-text-tertiary'}`}>
                    {hospital.open_24h ? 'AVAILABLE' : 'LIMITED'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Pediatric Care:</span>
                  <span className={`font-mono text-xs uppercase font-bold ${hospital.pediatric ? 'text-accent-green' : 'text-text-tertiary'}`}>
                    {hospital.pediatric ? 'AVAILABLE' : 'NOT AVAILABLE'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Parking:</span>
                  <span className={`font-mono text-xs uppercase font-bold ${hospital.parking_available ? 'text-accent-green' : 'text-text-tertiary'}`}>
                    {hospital.parking_available ? 'AVAILABLE' : 'NOT AVAILABLE'}
                  </span>
                </div>

                {hospital.phone && (
                  <div className="flex items-center justify-between p-3 bg-background border border-border">
                    <span className="font-mono text-text-secondary text-xs">Phone:</span>
                    <span className="font-mono text-text-primary text-xs uppercase font-bold">
                      {hospital.phone}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Last Updated:</span>
                  <span className="font-mono text-text-primary text-xs uppercase font-bold">
                    {hospital.current_wait ? new Date(hospital.current_wait.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hospital Services Section */}
            <div className={`${isSidePanel ? '' : 'bg-surface'} p-6`}>
              <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
                HOSPITAL_SERVICES
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="font-mono text-text-secondary text-xs">Current Crowd:</span>
                  <span className={`font-mono text-xs uppercase font-bold ${
                    hospital.current_wait?.crowd_level === 'low' ? 'text-accent-green' :
                    hospital.current_wait?.crowd_level === 'medium' ? 'text-yellow-500' :
                    'text-accent-red'
                  }`}>
                    {hospital.current_wait?.crowd_level?.toUpperCase() || 'UNKNOWN'}
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

                <div className="mt-4 p-3 bg-background border border-border">
                  <p className="font-mono text-text-secondary text-xs mb-2">
                    <strong>Estimated Patients Waiting:</strong>
                  </p>
                  <div className="font-mono text-text-primary text-sm font-bold">
                    {waitMinutes <= 30 ? 'LOW (1-10 patients)' :
                     waitMinutes <= 60 ? 'MODERATE (11-25 patients)' :
                     waitMinutes <= 120 ? 'HIGH (26-50 patients)' :
                     'VERY HIGH (50+ patients)'}
                  </div>
                </div>

                <div className="p-3 bg-background border border-border">
                  <p className="font-mono text-text-secondary text-xs mb-2">
                    <strong>Service Capacity:</strong>
                  </p>
                  <div className="font-mono text-text-primary text-sm font-bold">
                    {hospital.type === 'urgent_care' ? 'WALK-IN CLINIC' : 'FULL EMERGENCY DEPARTMENT'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
