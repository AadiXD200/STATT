import { X, Search } from 'lucide-react';
import { useState } from 'react';
import type { HospitalWithWaitTime } from '../lib/types';

interface SearchOverlayProps {
  hospitals: HospitalWithWaitTime[];
  onClose: () => void;
  onSelect: (hospital: HospitalWithWaitTime) => void;
  filters: {
    pediatric: boolean;
  };
  onFilterChange: (filters: { pediatric: boolean }) => void;
  bestHospitalId?: string | null;
}

export function SearchOverlay({ hospitals, onClose, onSelect, filters, onFilterChange, bestHospitalId }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hospital.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = (!filters.pediatric || hospital.pediatric);

    return matchesSearch && matchesFilters;
  }).sort((a, b) => {
    // Sort best hospital to the top
    if (bestHospitalId) {
      if (a.id === bestHospitalId) return -1;
      if (b.id === bestHospitalId) return 1;
    }
    // Then sort by total time (wait + drive)
    const aTotal = (a.current_wait?.wait_minutes || 0) + (a.current_wait?.drive_minutes || 0);
    const bTotal = (b.current_wait?.wait_minutes || 0) + (b.current_wait?.drive_minutes || 0);
    return aTotal - bTotal;
  });

  const toggleFilter = (key: keyof typeof filters) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="h-full flex flex-col max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="> Type to search hospitals..."
              className="w-full bg-surface border border-border text-text-primary font-mono text-sm pl-12 pr-4 py-4 focus:outline-none focus:border-text-primary transition-colors"
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            className="p-4 border border-border hover:border-text-primary transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => toggleFilter('pediatric')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
              filters.pediatric
                ? 'bg-text-primary text-background'
                : 'border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {filters.pediatric ? '[x]' : '[ ]'} Pediatric (Kids)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {filteredHospitals.map((hospital) => {
              const totalMinutes = (hospital.current_wait?.wait_minutes || 0) +
                                  (hospital.current_wait?.drive_minutes || 0);
              const formatTime = (minutes: number) => {
                if (minutes < 60) {
                  return `${minutes} min`;
                }
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                if (mins === 0) {
                  return `${hours} hr`;
                }
                return `${hours} hr ${mins} min`;
              };

              const isBest = bestHospitalId && hospital.id === bestHospitalId;

              return (
                <button
                  key={hospital.id}
                  onClick={() => {
                    onSelect(hospital);
                    onClose();
                  }}
                  className={`w-full text-left p-4 hover:bg-surface transition-colors border-l-2 ${
                    isBest ? 'border-yellow-500 bg-yellow-500/5' : 'border-transparent hover:border-accent-green'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isBest && <span className="text-yellow-500">⭐</span>}
                        <div className="font-mono text-text-primary text-sm mb-1">
                          {hospital.name}
                        </div>
                        {isBest && (
                          <span className="text-xs font-mono text-yellow-500 font-bold">BEST</span>
                        )}
                      </div>
                      <div className="font-mono text-text-tertiary text-xs">
                        {hospital.address}
                      </div>
                    </div>
                    <div className="font-mono text-accent-green text-sm whitespace-nowrap">
                      {formatTime(totalMinutes)}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredHospitals.length === 0 && (
              <div className="text-center py-12">
                <div className="font-mono text-text-tertiary text-sm">
                  No hospitals found matching your criteria
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="font-mono text-text-tertiary text-xs text-center">
            Press <span className="text-text-primary">ESC</span> to close
          </div>
        </div>
      </div>
    </div>
  );
}
