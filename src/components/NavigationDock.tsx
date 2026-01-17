import { Map, List, Settings } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavigationDockProps {
  activeView: 'map' | 'list' | 'settings';
  onViewChange: (view: 'map' | 'list' | 'settings') => void;
}

export function NavigationDock({ activeView, onViewChange }: NavigationDockProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
      <div className="flex items-center gap-0 bg-surface/80 backdrop-blur-sm border border-border p-1">
        <button
          onClick={() => onViewChange('map')}
          className={`px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
            activeView === 'map'
              ? 'bg-text-primary text-background'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Map size={16} />
            <span>Map</span>
          </div>
        </button>
        <div className="w-px h-8 bg-border"></div>
        <button
          onClick={() => onViewChange('list')}
          className={`px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
            activeView === 'list'
              ? 'bg-text-primary text-background'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <List size={16} />
            <span>List</span>
          </div>
        </button>
        <div className="w-px h-8 bg-border"></div>
        <button
          onClick={() => onViewChange('settings')}
          className={`px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
            activeView === 'settings'
              ? 'bg-text-primary text-background'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} />
            <span>Settings</span>
          </div>
        </button>
      </div>
      <ThemeToggle />
    </div>
  );
}
