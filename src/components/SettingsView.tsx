export function SettingsView() {
  return (
    <div className="fixed inset-0 z-40 bg-background overflow-hidden">
      <div className="h-full overflow-y-auto pt-20 pb-32 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="font-sans font-bold text-text-primary text-2xl mb-2">
              Settings
            </h2>
            <p className="font-mono text-text-secondary text-xs">
              System configuration and preferences
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-surface border border-border p-6">
              <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
                Location Services
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-text-primary text-sm">Auto-detect location</span>
                  <div className="w-12 h-6 bg-accent-green border border-accent-green flex items-center px-1">
                    <div className="w-4 h-4 bg-background ml-auto"></div>
                  </div>
                </div>
                <p className="font-mono text-text-tertiary text-xs">
                  Allow ER_WATCH to use your current location for accurate drive time calculations
                </p>
              </div>
            </div>

            <div className="bg-surface border border-border p-6">
              <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
                Notifications
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-text-primary text-sm">Wait time alerts</span>
                  <div className="w-12 h-6 bg-border border border-border flex items-center px-1">
                    <div className="w-4 h-4 bg-text-primary"></div>
                  </div>
                </div>
                <p className="font-mono text-text-tertiary text-xs">
                  Get notified when wait times drop at nearby hospitals
                </p>
              </div>
            </div>

            <div className="bg-surface border border-border p-6">
              <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
                Display
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-text-primary text-sm block mb-2">
                    Default view
                  </label>
                  <select className="w-full bg-background border border-border text-text-primary font-mono text-sm px-3 py-2 focus:outline-none focus:border-text-primary">
                    <option>Map</option>
                    <option>List</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-text-primary text-sm block mb-2">
                    Distance unit
                  </label>
                  <select className="w-full bg-background border border-border text-text-primary font-mono text-sm px-3 py-2 focus:outline-none focus:border-text-primary">
                    <option>Miles</option>
                    <option>Kilometers</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border p-6">
              <h3 className="font-mono text-text-secondary text-xs uppercase tracking-wider mb-4">
                About
              </h3>
              <div className="space-y-2 font-mono text-text-secondary text-xs">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="text-text-primary">2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Build:</span>
                  <span className="text-text-primary">20240117</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-accent-green">OPERATIONAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
