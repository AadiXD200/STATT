import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshData } from '../lib/api';

interface HUDProps {
  lastUpdated: Date | null;
}

export function HUD({ lastUpdated }: HUDProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      // Time will be calculated based on lastUpdated state
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (lastUpdate: Date | null) => {
    if (!lastUpdate) return 'Never';
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      // Trigger a data refresh in the parent component by reloading the page
      // or by emitting an event that the parent can listen to
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="font-mono text-red-500 text-sm font-bold tracking-wider">[LIVE]</span>
      </div>
    </div>
  );
}
