import { useEffect, useState } from 'react';
import type { HospitalWithWaitTime } from './lib/types';
import { fetchERData, refreshData } from './lib/api';
import { HUD } from './components/HUD';
import { NavigationDock } from './components/NavigationDock';
import { TriageButton } from './components/TriageButton';
import { Mapbox3DView } from './components/Mapbox3DView';
import { HospitalListView } from './components/HospitalListView';
import { LeafletMapView } from './components/LeafletMapView';
import { Simple3DView } from './components/Simple3DView';
import { InteractiveMap } from './components/InteractiveMap';
import { OrganizedHospitalDetail } from './components/OrganizedHospitalDetail';
import { ListView } from './components/ListView';
import { SettingsView } from './components/SettingsView';
import { HospitalDetail } from './components/HospitalDetail';
import { TriagePage } from './components/TriagePage';
import { SearchOverlay } from './components/SearchOverlay';
import { Search } from 'lucide-react';

function App() {
  const [hospitals, setHospitals] = useState<HospitalWithWaitTime[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithWaitTime | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showUrgentCareOnly, setShowUrgentCareOnly] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [bestHospitalId, setBestHospitalId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    pediatric: false,
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadHospitals();
  }, [showUrgentCareOnly]);

  const loadHospitals = async () => {
    try {
      const result = await fetchERData();
      
      // Filter hospitals based on urgent care filter
      let filteredHospitals = result.hospitals;
      if (showUrgentCareOnly) {
        filteredHospitals = result.hospitals.filter((h: any) => h.type === 'urgent_care');
      }

      setHospitals(filteredHospitals);
      setLastUpdated(result.lastUpdated);
    } catch (error) {
      console.error('Failed to load hospitals:', error);
      setHospitals([]);
    }
  };


  return (
    <div className="min-h-screen bg-background text-text-primary">
      <HUD lastUpdated={lastUpdated} />

      <button
        onClick={() => setShowSearch(true)}
        className="fixed top-10 left-1/2 -translate-x-1/2 z-50 px-6 py-2 border border-border hover:border-text-primary transition-colors flex items-center gap-2"
      >
        <Search size={16} className="text-text-tertiary" />
        <span className="font-mono text-text-secondary text-xs">Search</span>
        <span className="font-mono text-text-tertiary text-xs">⌘K</span>
      </button>

      <div className="h-screen">
        <Mapbox3DView
          hospitals={hospitals}
          onHospitalSelect={setSelectedHospital}
          selectedHospital={selectedHospital}
          onBestHospitalChange={setBestHospitalId}
        />
      </div>

      {showSearch && (
        <SearchOverlay
          hospitals={hospitals}
          onClose={() => setShowSearch(false)}
          onSelect={setSelectedHospital}
          filters={filters}
          onFilterChange={setFilters}
          bestHospitalId={bestHospitalId}
        />
      )}
    </div>
  );
}

export default App;
