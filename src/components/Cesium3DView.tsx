import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import type { HospitalWithWaitTime } from '../lib/types';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Set your Cesium ion access token (optional, free tier works without it)
Cesium.Ion.defaultAccessToken = '';

interface Cesium3DViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

export function Cesium3DView({ hospitals, onHospitalSelect }: Cesium3DViewProps) {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [hoveredHospital, setHoveredHospital] = useState<HospitalWithWaitTime | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!cesiumContainerRef.current) return;

    // Initialize Cesium viewer
    const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      scene3DOnly: false,
      shouldAnimate: true
    });

    // Set initial view to Ontario, Canada
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-79.3832, 43.6532, 500000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      }
    });

    // Add hospital markers
    const entities = viewer.entities;
    
    hospitals.forEach(hospital => {
      if (hospital.lat && hospital.lng) {
        // Determine color based on wait time
        let color = Cesium.Color.GRAY;
        if (hospital.current_wait) {
          const waitMinutes = hospital.current_wait.wait_minutes;
          if (waitMinutes > 180) color = Cesium.Color.RED;
          else if (waitMinutes > 60) color = Cesium.Color.YELLOW;
          else color = Cesium.Color.GREEN;
        }

        // Add hospital marker
        entities.add({
          position: Cesium.Cartesian3.fromDegrees(hospital.lng, hospital.lat),
          billboard: {
            image: `data:image/svg+xml;base64,${btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${color.toCssColorString()}" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${hospital.type === 'urgent_care' ? 'U' : 'E'}</text>
              </svg>
            `)}`,
            width: 24,
            height: 24,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scale: 1.0,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: hospital.name,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -30),
            showBackground: true,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0)
          },
          description: `
            <div style="
              background: #2a2a2a;
              color: white;
              padding: 12px;
              border-radius: 8px;
              font-family: system-ui;
              min-width: 200px;
            ">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${hospital.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af;">${hospital.address}</p>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 12px; color: #9ca3af;">
                  <strong>Type:</strong> ${hospital.type === 'urgent_care' ? 'Urgent Care' : 'Emergency'}
                </span>
                ${hospital.current_wait ? `
                  <span style="font-size: 12px; color: ${hospital.current_wait.wait_minutes > 180 ? '#ef4444' : hospital.current_wait.wait_minutes > 60 ? '#f59e0b' : '#10b981'}; font-weight: bold;">
                    ${hospital.current_wait.wait_minutes}m wait
                  </span>
                ` : '<span style="font-size: 12px; color: #6b7280;">No wait data</span>'}
              </div>
              <button 
                onclick="window.selectHospital('${hospital.id}')"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  background: #3b82f6;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-size: 12px;
                  cursor: pointer;
                  font-weight: 500;
                "
              >
                View Details
              </button>
            </div>
          `
        });
      }
    });

    // Handle click events
    viewer.selectedEntityChanged.addEventListener(() => {
      const selectedEntity = viewer.selectedEntity;
      if (selectedEntity && selectedEntity.description) {
        const hospitalId = selectedEntity.description.getValue().match(/selectHospital\('([^']+)'\)/)?.[1];
        if (hospitalId) {
          const hospital = hospitals.find(h => h.id === hospitalId);
          if (hospital) {
            onHospitalSelect(hospital);
          }
        }
      }
    });

    // Handle hover events using native DOM events for reliable positioning
    const canvas = viewer.scene.canvas;
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      
      const pickedObject = viewer.scene.pick(new Cesium.Cartesian2(canvasX, canvasY));
      
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.description) {
        const hospitalId = pickedObject.id.description.getValue().match(/selectHospital\('([^']+)'\)/)?.[1];
        if (hospitalId) {
          const hospital = hospitals.find(h => h.id === hospitalId);
          if (hospital) {
            setHoveredHospital(hospital);
            // Use clientX/clientY for fixed positioning
            setTooltipPosition({ x: event.clientX, y: event.clientY });
          }
        }
      } else {
        setHoveredHospital(null);
      }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);

    viewerRef.current = viewer;

    // Make selectHospital available globally
    (window as any).selectHospital = (hospitalId: string) => {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (hospital) {
        onHospitalSelect(hospital);
      }
    };

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [hospitals, onHospitalSelect]);

  // Toggle 3D/2D view
  const toggle3D = () => {
    if (viewerRef.current) {
      setIs3D(!is3D);
      const scene = viewerRef.current.scene;
      if (!is3D) {
        scene.mode = Cesium.SceneMode.SCENE3D;
        viewerRef.current.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-79.3832, 43.6532, 500000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0.0
          },
          duration: 1.0
        });
      } else {
        scene.mode = Cesium.SceneMode.SCENE2D;
        viewerRef.current.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-79.3832, 43.6532, 5000000),
          duration: 1.0
        });
      }
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
                  onClick={toggle3D}
                  className="px-3 py-1 bg-accent-blue text-white rounded text-xs hover:bg-accent-blue/80 transition-colors"
                >
                  {is3D ? '2D View' : '3D View'}
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
            <div ref={cesiumContainerRef} className="w-full" style={{ height: '450px' }} />

            {/* 3D Badge */}
            <div className="absolute top-4 right-4 bg-accent-blue text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-10">
              {is3D ? '3D GLOBE' : '2D MAP'}
            </div>

            {/* Hover Tooltip */}
            {hoveredHospital && (
              <div
                className="pointer-events-none z-50"
                style={{
                  position: 'fixed',
                  left: `${tooltipPosition.x + 20}px`,
                  top: `${tooltipPosition.y}px`,
                }}
              >
                <div className="bg-background border-2 border-border rounded-lg shadow-2xl p-4 min-w-[280px] max-w-[320px]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-bold text-text-primary leading-tight">
                      {hoveredHospital.name}
                    </h3>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                      hoveredHospital.type === 'urgent_care' 
                        ? 'bg-accent-blue text-white' 
                        : 'bg-accent-green text-white'
                    }`}>
                      {hoveredHospital.type === 'urgent_care' ? 'URGENT' : 'ER'}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-text-secondary">📍</span>
                      <span className="text-text-secondary flex-1">{hoveredHospital.address}</span>
                    </div>

                    {hoveredHospital.current_wait && (
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                        <span className="text-text-secondary font-medium">Wait Time:</span>
                        <span className={`font-bold text-sm ${
                          hoveredHospital.current_wait.wait_minutes > 180 
                            ? 'text-red-500' 
                            : hoveredHospital.current_wait.wait_minutes > 60 
                            ? 'text-yellow-500' 
                            : 'text-accent-green'
                        }`}>
                          {hoveredHospital.current_wait.wait_minutes} min
                        </span>
                      </div>
                    )}

                    {hoveredHospital.current_wait && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Crowd Level:</span>
                        <span className="text-text-primary capitalize">
                          {hoveredHospital.current_wait.crowd_level}
                        </span>
                      </div>
                    )}

                    {hoveredHospital.phone && (
                      <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border">
                        <span className="text-text-secondary">📞</span>
                        <span className="text-text-primary">{hoveredHospital.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2 mt-2 border-t border-border text-[10px]">
                      {hoveredHospital.open_24h && (
                        <span className="bg-accent-green/20 text-accent-green px-2 py-1 rounded">24/7</span>
                      )}
                      {hoveredHospital.pediatric && (
                        <span className="bg-accent-blue/20 text-accent-blue px-2 py-1 rounded">Pediatric</span>
                      )}
                      {hoveredHospital.parking_available && (
                        <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded">Parking</span>
                      )}
                      {hoveredHospital.trauma_level && (
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          Level {hoveredHospital.trauma_level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
