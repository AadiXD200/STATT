import { useEffect, useRef, useState } from 'react';
import type { HospitalWithWaitTime } from '../lib/types';

interface Simple3DViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

export function Simple3DView({ hospitals, onHospitalSelect }: Simple3DViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [is3D, setIs3D] = useState(true);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let rotation = 0;
    let markers: Array<{
      x: number;
      y: number;
      z: number;
      hospital: HospitalWithWaitTime;
      screenX?: number;
      screenY?: number;
    }> = [];

    // Convert lat/lng to 3D coordinates
    const latLngTo3D = (lat: number, lng: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
      };
    };

    // Project 3D to 2D
    const project3DTo2D = (point: { x: number; y: number; z: number }, rotation: number) => {
      // Rotate around Y axis
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);
      const x = point.x * cosR - point.z * sinR;
      const z = point.x * sinR + point.z * cosR;
      
      // Simple perspective projection
      const scale = 200 / (200 + z);
      const screenX = canvas.width / 2 + x * scale;
      const screenY = canvas.height / 2 - point.y * scale;
      
      return { x: screenX, y: screenY, scale };
    };

    // Initialize hospital markers
    markers = hospitals.map(hospital => {
      if (hospital.lat && hospital.lng) {
        const pos3D = latLngTo3D(hospital.lat, hospital.lng, 150);
        return {
          ...pos3D,
          hospital
        };
      }
      return null;
    }).filter(Boolean) as any[];

    // Animation loop
    const animate = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      for (let i = 0; i < 100; i++) {
        const x = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1 * canvas.width;
        const y = (Math.cos(i * 4.9898 + 128.233) * 43758.5453) % 1 * canvas.height;
        const size = Math.random() * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(x, y, size, size);
      }

      // Draw globe wireframe
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;

      // Draw latitude lines
      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath();
        for (let lng = -180; lng <= 180; lng += 10) {
          const point = latLngTo3D(lat, lng, 150);
          const projected = project3DTo2D(point, rotation);
          
          if (lng === -180) {
            ctx.moveTo(projected.x, projected.y);
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
        ctx.stroke();
      }

      // Draw longitude lines
      for (let lng = -180; lng <= 180; lng += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 10) {
          const point = latLngTo3D(lat, lng, 150);
          const projected = project3DTo2D(point, rotation);
          
          if (lat === -90) {
            ctx.moveTo(projected.x, projected.y);
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
        ctx.stroke();
      }

      // Sort markers by depth for proper rendering
      const sortedMarkers = [...markers].sort((a, b) => {
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);
        const depthA = a.x * sinR + a.z * cosR;
        const depthB = b.x * sinR + b.z * cosR;
        return depthA - depthB;
      });

      // Draw hospital markers
      sortedMarkers.forEach(marker => {
        const projected = project3DTo2D(marker, rotation);
        
        // Only draw if visible (in front)
        if (projected.scale > 0) {
          // Determine color based on wait time
          let color = '#6b7280'; // Gray
          if (marker.hospital.current_wait) {
            const waitMinutes = marker.hospital.current_wait.wait_minutes;
            if (waitMinutes > 180) color = '#ef4444'; // Red
            else if (waitMinutes > 60) color = '#f59e0b'; // Yellow
            else color = '#10b981'; // Green
          }

          // Draw marker
          const size = 8 * projected.scale;
          ctx.fillStyle = color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Draw hospital type
          ctx.fillStyle = '#ffffff';
          ctx.font = `${10 * projected.scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            marker.hospital.type === 'urgent_care' ? 'U' : 'E',
            projected.x,
            projected.y
          );

          // Draw label if close enough
          if (projected.scale > 0.5) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `${12 * projected.scale}px Arial`;
            ctx.fillText(marker.hospital.name, projected.x, projected.y + size + 10 * projected.scale);
          }
        }
      });

      // Auto-rotate if in 3D mode
      if (is3D) {
        rotation += 0.005;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hospitals, is3D]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Simple hit detection (check if click is near any marker)
    // This is a simplified version - in production you'd want proper 3D picking
    const clickedHospital = hospitals.find(hospital => {
      // For now, just cycle through hospitals on click
      return true;
    });

    if (clickedHospital) {
      onHospitalSelect(clickedHospital);
    }
  };

  return (
    <div className="flex-1 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-lg">
          {/* Map Header */}
          <div className="bg-background-secondary border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-text-primary">3D Globe Map</h2>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                  <span>{hospitals.length} hospitals</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIs3D(!is3D)}
                  className="px-3 py-1 bg-accent-blue text-white rounded text-xs hover:bg-accent-blue/80 transition-colors"
                >
                  {is3D ? 'Stop Rotation' : 'Start Rotation'}
                </button>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent-green rounded-full border-2 border-white shadow-sm"></div>
                    <span className="text-text-secondary">&lt;1h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
                    <span className="text-text-secondary">1-3h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                    <span className="text-text-secondary">&gt;3h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative bg-gray-900">
            <canvas 
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full cursor-pointer"
              style={{ height: '450px' }}
            />

            {/* 3D Badge */}
            <div className="absolute top-4 right-4 bg-accent-blue text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-10">
              {is3D ? 'ROTATING' : 'STATIC'}
            </div>

            {/* Instructions */}
            <div className="absolute top-4 left-4 bg-background border border-border rounded-lg p-3 shadow-lg z-10">
              <div className="text-sm font-semibold text-text-primary mb-2">3D Globe</div>
              <div className="text-xs text-text-secondary space-y-1">
                <div>• Auto-rotating globe</div>
                <div>• Click markers for details</div>
                <div>• {hospitals.length} hospitals shown</div>
              </div>
            </div>

            {/* No Data Overlay */}
            {hospitals.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🌍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">No Hospitals Available</h3>
                  <p className="text-text-secondary mb-4">Hospital data is loading or unavailable</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-accent-blue text-white rounded-lg text-sm hover:bg-accent-blue/80 transition-colors shadow-md"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            )}

            {/* Map Legend */}
            {hospitals.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-background border border-border rounded-lg p-4 shadow-lg z-10">
                <div className="text-sm font-semibold text-text-primary mb-3">Legend</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-accent-green rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">E</span>
                    </div>
                    <span className="text-text-secondary text-sm">Emergency Room</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-accent-blue rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">U</span>
                    </div>
                    <span className="text-text-secondary text-sm">Urgent Care</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
