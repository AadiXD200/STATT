import { useEffect, useState } from 'react';
import type { HospitalWithWaitTime } from './lib/types';
import { hospitals as allHospitals } from './data/hospitals';
import { waitTimes } from './data/waitTimes';
import { HUD } from './components/HUD';
import { NavigationDock } from './components/NavigationDock';
import { TriageButton } from './components/TriageButton';
import { MapView } from './components/MapView';
import { ListView } from './components/ListView';
import { SettingsView } from './components/SettingsView';
import { HospitalDetail } from './components/HospitalDetail';
import { TriagePage } from './components/TriagePage';
import { SearchOverlay } from './components/SearchOverlay';
import { Search } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState<'map' | 'list' | 'settings'>('map');
  const [hospitals, setHospitals] = useState<HospitalWithWaitTime[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithWaitTime | null>(null);
  const [showTriage, setShowTriage] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUrgentCareOnly, setShowUrgentCareOnly] = useState(false);
  const [filters, setFilters] = useState({
    open24h: false,
    pediatric: false,
    parkingAvailable: false,
  });

  useEffect(() => {
    loadHospitals();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSelectedHospital(null);
        setShowTriage(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadHospitals();
  }, [showUrgentCareOnly]);

  const loadHospitals = async () => {
    // Filter hospitals based on urgent care filter
    let hospitalsData = allHospitals;
    if (showUrgentCareOnly) {
      hospitalsData = allHospitals.filter(h => h.type === 'urgent_care');
    }

    // Add wait times to hospitals
    const hospitalsWithWaitTimes = hospitalsData.map((hospital) => {
      // Find the most recent wait time for this hospital
      const waitTimeData = waitTimes
        .filter(wt => wt.hospital_id === hospital.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      return {
        ...hospital,
        current_wait: waitTimeData || undefined,
        total_minutes: waitTimeData
          ? waitTimeData.wait_minutes + waitTimeData.drive_minutes
          : 0,
      };
    });

    setHospitals(hospitalsWithWaitTimes);
  };

  const handleShowUrgentCare = () => {
    setShowTriage(false);
    setShowUrgentCareOnly(true);
    setActiveView('list');
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <HUD />
      <TriageButton onClick={() => setShowTriage(true)} />

      <button
        onClick={() => setShowSearch(true)}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-2 border border-border hover:border-text-primary transition-colors flex items-center gap-2"
      >
        <Search size={16} className="text-text-tertiary" />
        <span className="font-mono text-text-secondary text-xs">Search</span>
        <span className="font-mono text-text-tertiary text-xs">⌘K</span>
      </button>

      {activeView === 'map' && (
        <MapView
          hospitals={hospitals}
          onHospitalSelect={setSelectedHospital}
          onTravelTimeCalculated={(minutes) => {
            // Travel time calculated when hospital is selected
            console.log('Travel time:', minutes, 'minutes');
          }}
        />
      )}

      {activeView === 'list' && (
        <ListView hospitals={hospitals} onHospitalSelect={setSelectedHospital} />
      )}

      {activeView === 'settings' && <SettingsView />}

      <NavigationDock activeView={activeView} onViewChange={setActiveView} />

      {selectedHospital && (
        <HospitalDetail
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
        />
      )}

      {showTriage && (
        <TriagePage
          onClose={() => setShowTriage(false)}
          onShowUrgentCare={handleShowUrgentCare}
        />
      )}

      {showSearch && (
        <SearchOverlay
          hospitals={hospitals}
          onClose={() => setShowSearch(false)}
          onSelect={setSelectedHospital}
          filters={filters}
          onFilterChange={setFilters}
        />
      )}
    </div>
  );
}

export default App;
