import { AlertTriangle } from 'lucide-react';

interface TriageButtonProps {
  onClick: () => void;
}

export function TriageButton({ onClick }: TriageButtonProps) {
  return (
    <div className="fixed top-6 right-6 z-50">
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-3 border border-accent-red text-accent-red font-mono text-xs uppercase tracking-wider hover:bg-accent-red hover:text-background transition-colors"
      >
        <AlertTriangle size={16} />
        <span>Triage Mode</span>
      </button>
    </div>
  );
}
