import { useEffect, useState } from 'react';

export function HUD() {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="fixed top-0 left-0 z-50 p-6">
      <div className="flex items-center gap-4">
        <div className="font-mono text-text-primary text-sm tracking-wider">
          ER_WATCH_v2 <span className="text-accent-green">[LIVE]</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent-green rounded-full animate-blink"></div>
          <span className="font-mono text-text-secondary text-xs">
            Data updated {formatTimeAgo(secondsAgo)}
          </span>
        </div>
      </div>
    </div>
  );
}
