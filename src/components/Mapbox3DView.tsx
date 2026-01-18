import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { HospitalWithWaitTime } from '../lib/types';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2Jhdm84IiwiYSI6ImNta2ozYzM5ZjEyM3MzZHB2dW85MGNqN3QifQ.dk7lsjCnNBxnAH6R2ysY9Q';

interface Mapbox3DViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  selectedHospital?: HospitalWithWaitTime | null;
  onBestHospitalChange?: (hospitalId: string | null) => void;
}

export function Mapbox3DView({ hospitals, onHospitalSelect, selectedHospital, onBestHospitalChange }: Mapbox3DViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [is3D, setIs3D] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{lng: number, lat: number} | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeLayerRef = useRef<boolean>(false);
  const [bestHospital, setBestHospital] = useState<{hospital: HospitalWithWaitTime, travelTime: number, totalTime: number} | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-79.3832, 43.6532],
      zoom: 7,
      pitch: 45,
      bearing: -10,
      antialias: true,
      attributionControl: false
    });

    map.on('load', () => {
      // Add 3D terrain
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Add sky/atmosphere
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      // Add 3D buildings
      map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 12,
        paint: {
          'fill-extrusion-color': '#1e293b',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.8
        }
      });

      // Add fog for depth
      map.setFog({
        color: 'rgb(15, 23, 42)',
        'high-color': 'rgb(30, 41, 59)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(15, 23, 42)',
        'star-intensity': 0.5
      });

      setMapLoaded(true);
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lng: position.coords.longitude,
            lat: position.coords.latitude
          };
          setUserLocation(userLoc);

          // Add user location marker
          const userMarkerEl = document.createElement('div');
          userMarkerEl.style.cssText = `
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          `;

          const userMarker = new mapboxgl.Marker(userMarkerEl)
            .setLngLat([userLoc.lng, userLoc.lat])
            .addTo(map);

          userMarkerRef.current = userMarker;
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Calculate best hospital when user location is available
  useEffect(() => {
    if (!userLocation || hospitals.length === 0) return;

    const calculateBestHospital = async () => {
      const hospitalsWithTravelTime = await Promise.all(
        hospitals.map(async (hospital) => {
          if (!hospital.current_wait) return null;

          try {
            // Fetch travel time from Mapbox Directions API
            const response = await fetch(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${hospital.lng},${hospital.lat}?access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
              const travelTimeMinutes = Math.round(data.routes[0].duration / 60);
              const waitTimeMinutes = hospital.current_wait.wait_minutes;
              const totalTime = travelTimeMinutes + waitTimeMinutes;

              return {
                hospital,
                travelTime: travelTimeMinutes,
                totalTime
              };
            }
          } catch (error) {
            console.error('Error calculating travel time:', error);
          }
          return null;
        })
      );

      const validHospitals = hospitalsWithTravelTime.filter(h => h !== null) as {hospital: HospitalWithWaitTime, travelTime: number, totalTime: number}[];
      
      if (validHospitals.length > 0) {
        const best = validHospitals.reduce((prev, current) => 
          current.totalTime < prev.totalTime ? current : prev
        );
        setBestHospital(best);
        onBestHospitalChange?.(best.hospital.id);
      } else {
        setBestHospital(null);
        onBestHospitalChange?.(null);
      }
    };

    calculateBestHospital();
  }, [userLocation, hospitals, onBestHospitalChange]);

  // Add/update markers when hospitals change or map loads
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    hospitals.forEach(hospital => {
      if (!hospital.lat || !hospital.lng) return;

      const color = hospital.current_wait
        ? hospital.current_wait.wait_minutes > 180
          ? '#ef4444'
          : hospital.current_wait.wait_minutes > 60
          ? '#f59e0b'
          : '#10b981'
        : '#6b7280';

      // Create marker element with persistent label
      const el = document.createElement('div');
      el.className = 'hospital-marker-3d';
      el.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer;';
      
      // Create label that shows hospital name on hover
      const labelBubble = document.createElement('div');
      labelBubble.style.cssText = `
        color: white;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        margin-bottom: 8px;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        pointer-events: none;
      `;
      
      // Hospital name (hidden by default, shown on hover)
      labelBubble.innerHTML = hospital.name;
      
      // Check if this is the best hospital
      const isBestHospital = bestHospital?.hospital.id === hospital.id;

      // Create marker dot
      const markerDot = document.createElement('div');
      markerDot.style.cssText = `
        width: 36px;
        height: 36px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        position: relative;
      `;
      markerDot.innerHTML = hospital.type === 'urgent_care' ? 'U' : 'E';

      // Add star badge if this is the best hospital
      if (isBestHospital) {
        const starBadge = document.createElement('div');
        starBadge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          background: #fbbf24;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.5);
        `;
        starBadge.innerHTML = '⭐';
        markerDot.appendChild(starBadge);
      }
      
      el.appendChild(labelBubble);
      el.appendChild(markerDot);

      // Hover effects - show hospital name on hover
      el.addEventListener('mouseenter', () => {
        markerDot.style.transform = 'scale(1.2)';
        markerDot.style.boxShadow = `0 6px 20px ${color}80`;
        labelBubble.style.opacity = '1';
      });
      el.addEventListener('mouseleave', () => {
        markerDot.style.transform = 'scale(1)';
        markerDot.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        labelBubble.style.opacity = '0';
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        anchor: 'bottom',
        offset: [0, -20],
        className: 'hospital-popup-custom',
        maxWidth: '340px'
      }).setHTML(`
        <div style="
          background: white;
          color: #1e293b;
          padding: 24px;
          border-radius: 12px;
          font-family: system-ui, -apple-system, sans-serif;
          min-width: 320px;
          max-width: 380px;
          box-shadow: none;
        ">
          <!-- Header -->
          <div style="margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h3 style="
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                line-height: 1.3;
                color: #1e293b;
                flex: 1;
              ">
                ${hospital.name}
              </h3>
              ${isBestHospital ? `
                <span style="
                  background: #fbbf24;
                  color: #78350f;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: 0.5px;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">
                  ⭐ BEST CHOICE
                </span>
              ` : ''}
              <span style="
                background: #10b981;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.5px;
              ">
                LIVE
              </span>
            </div>
            <div style="color: #64748b; font-size: 13px;">Hospital Information</div>
          </div>

          ${isBestHospital && bestHospital ? `
            <!-- Best Hospital Explanation -->
            <div style="
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 2px solid #fbbf24;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 16px;
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 20px;">🏆</span>
                <span style="color: #78350f; font-weight: 700; font-size: 14px;">Why This is the Best Choice</span>
              </div>
              <div style="color: #92400e; font-size: 13px; line-height: 1.5;">
                <div style="margin-bottom: 6px;">
                  <strong>Total Time:</strong> ${bestHospital.totalTime} minutes
                </div>
                <div style="margin-bottom: 6px;">
                  • Travel Time: ${bestHospital.travelTime} min
                </div>
                <div style="margin-bottom: 6px;">
                  • Wait Time: ${hospital.current_wait?.wait_minutes || 0} min
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #fbbf24; font-size: 12px;">
                  This hospital has the shortest combined travel + wait time from your location.
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Wait Time -->
          ${hospital.current_wait ? `
            <div style="display: flex; align-items: center; gap: 8px; margin: 16px 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style="
                color: #ef4444;
                font-size: 20px;
                font-weight: 600;
              ">
                ${Math.floor(hospital.current_wait.wait_minutes / 60)}h ${hospital.current_wait.wait_minutes % 60}m
              </span>
            </div>
          ` : ''}

          <!-- Address -->
          <div style="display: flex; align-items: flex-start; gap: 8px; margin: 12px 0; color: #64748b; font-size: 14px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top: 2px; flex-shrink: 0;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>${hospital.address}</span>
          </div>

          ${hospital.current_wait ? `
            <!-- Stats Grid -->
            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin: 16px 0;
              padding: 16px;
              background: #f8fafc;
              border-radius: 8px;
            ">
              <div>
                <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Crowd Level</div>
                <div style="color: #1e293b; font-size: 14px; font-weight: 600; text-transform: capitalize;">
                  ${hospital.current_wait.crowd_level}
                </div>
              </div>
              ${hospital.current_wait.patients_waiting !== undefined ? `
                <div>
                  <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Patients Waiting</div>
                  <div style="color: #f59e0b; font-size: 14px; font-weight: 600;">
                    ${hospital.current_wait.patients_waiting}
                  </div>
                </div>
              ` : ''}
              ${hospital.current_wait.patients_treated !== undefined ? `
                <div>
                  <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Patients Treated</div>
                  <div style="color: #10b981; font-size: 14px; font-weight: 600;">
                    ${hospital.current_wait.patients_treated}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Tags -->
          ${hospital.pediatric || hospital.trauma_level ? `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0;">
              ${hospital.pediatric ? '<span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Pediatric</span>' : ''}
              ${hospital.trauma_level ? `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Level ${hospital.trauma_level}</span>` : ''}
            </div>
          ` : ''}
          
          <!-- ETA Display (populated after getting directions) -->
          <div id="eta-${hospital.id}"></div>
          
          <!-- Directions Button -->
          <button 
            onclick="window.getDirections('${hospital.id}', ${hospital.lng}, ${hospital.lat})"
            style="
              width: 100%;
              padding: 12px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin: 12px 0;
            "
            onmouseover="this.style.background='#2563eb'"
            onmouseout="this.style.background='#3b82f6'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Get Directions
          </button>
          
          <!-- Last Updated -->
          ${hospital.current_wait?.timestamp ? `
            <div style="
              text-align: center;
              padding-top: 16px;
              margin-top: 16px;
              border-top: 1px solid #e2e8f0;
              color: #94a3af;
              font-size: 12px;
            ">
              Last updated: ${new Date(hospital.current_wait.timestamp).toLocaleString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </div>
          ` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([hospital.lng, hospital.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      // Listen for popup close event
      popup.on('close', () => {
        // Remove route layer
        if (mapRef.current && routeLayerRef.current) {
          if (mapRef.current.getLayer('route')) {
            mapRef.current.removeLayer('route');
          }
          if (mapRef.current.getSource('route')) {
            mapRef.current.removeSource('route');
          }
          routeLayerRef.current = false;
        }

        // Clear ETA display
        const etaElement = document.getElementById(`eta-${hospital.id}`);
        if (etaElement) {
          etaElement.innerHTML = '';
        }

        // Ensure 3D mode is maintained
        if (mapRef.current) {
          if (!is3D) {
            setIs3D(true);
          }
          // Always ensure 3D terrain and pitch are set
          mapRef.current.easeTo({
            pitch: 60,
            bearing: -10,
            duration: 1000
          });
          if (!mapRef.current.getTerrain()) {
            mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
          }
        }
      });

      // Click to select and fly to
      el.addEventListener('click', () => {
        onHospitalSelect(hospital);
      });

      markersRef.current.push(marker);
    });

    // Make getDirections available globally
    (window as any).getDirections = async (hospitalId: string, hospitalLng: number, hospitalLat: number) => {
      if (!mapRef.current || !userLocation) {
        alert('Unable to get your location. Please enable location services.');
        return;
      }

      try {
        // Fetch route from Mapbox Directions API
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${hospitalLng},${hospitalLat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0].geometry;
          const duration = data.routes[0].duration; // in seconds
          const distance = data.routes[0].distance; // in meters

          // Calculate ETA
          const etaMinutes = Math.round(duration / 60);
          const distanceKm = (distance / 1000).toFixed(1);

          // Remove existing route layer if present
          if (routeLayerRef.current) {
            if (mapRef.current.getLayer('route')) {
              mapRef.current.removeLayer('route');
            }
            if (mapRef.current.getSource('route')) {
              mapRef.current.removeSource('route');
            }
          }

          // Add route to map
          mapRef.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route
            }
          });

          mapRef.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          routeLayerRef.current = true;

          // Update popup with ETA info
          const etaElement = document.getElementById(`eta-${hospitalId}`);
          if (etaElement) {
            etaElement.innerHTML = `
              <div style="
                background: #dbeafe;
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 12px;
                margin: 12px 0;
              ">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <span style="color: #1e40af; font-weight: 600; font-size: 13px;">Route Information</span>
                </div>
                <div style="color: #1e40af; font-size: 14px;">
                  <strong>ETA:</strong> ${etaMinutes} min (${distanceKm} km)
                </div>
              </div>
            `;
          }

          // Fit map to show the route
          const coordinates = route.coordinates;
          const bounds = coordinates.reduce((bounds: any, coord: any) => {
            return bounds.extend(coord);
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

          mapRef.current.fitBounds(bounds, {
            padding: 80,
            duration: 1000
          });
        }
      } catch (error) {
        console.error('Error fetching directions:', error);
        alert('Unable to get directions. Please try again.');
      }
    };

    return () => {
      delete (window as any).getDirections;
      
      // Remove route layer if it exists
      if (mapRef.current && routeLayerRef.current) {
        if (mapRef.current.getLayer('route')) {
          mapRef.current.removeLayer('route');
        }
        if (mapRef.current.getSource('route')) {
          mapRef.current.removeSource('route');
        }
        routeLayerRef.current = false;
      }
    };
  }, [hospitals, mapLoaded, onHospitalSelect, userLocation, bestHospital]);

  // Fly to selected hospital
  useEffect(() => {
    if (!mapRef.current || !selectedHospital) return;
    
    mapRef.current.flyTo({
      center: [selectedHospital.lng, selectedHospital.lat],
      zoom: 15,
      pitch: 60,
      bearing: Math.random() * 60 - 30,
      duration: 2500,
      essential: true
    });
  }, [selectedHospital]);

  // Toggle 3D/2D view
  const toggle3D = () => {
    if (!mapRef.current) return;
    const newIs3D = !is3D;
    setIs3D(newIs3D);
    
    mapRef.current.easeTo({
      pitch: newIs3D ? 60 : 0,
      bearing: newIs3D ? -10 : 0,
      duration: 1500
    });

    if (newIs3D) {
      mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    } else {
      mapRef.current.setTerrain(null);
    }
  };

  // Rotate camera slowly for cinematic effect
  const spinGlobe = () => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      bearing: mapRef.current.getBearing() + 90,
      duration: 5000,
      easing: (t) => t
    });
  };

  return (
    <div className="w-full h-full relative">
      {/* Map Container - Full Screen */}
      <div ref={mapContainerRef} className="w-full h-full" />


      {/* Hospital Count Badge */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2 shadow-lg z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">{hospitals.length}</span>
          <span className="text-gray-400 text-sm">hospitals</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-24 left-4 bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-lg z-[1000]">
        <div className="text-sm font-semibold text-white mb-3">Wait Times</div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-300 text-sm">&lt; 1 hour</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-300 text-sm">1-3 hours</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-300 text-sm">&gt; 3 hours</span>
          </div>
        </div>
      </div>

      {/* Custom Popup Styles */}
      <style>{`
        .hospital-popup-custom .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .hospital-popup-custom .mapboxgl-popup-tip {
          border-top-color: white !important;
        }
        .hospital-popup-custom .mapboxgl-popup-close-button {
          color: #000000 !important;
          font-size: 24px !important;
          padding: 8px 12px !important;
          right: 8px !important;
          top: 8px !important;
          font-weight: 300 !important;
          opacity: 0.6 !important;
        }
        .hospital-popup-custom .mapboxgl-popup-close-button:hover {
          opacity: 1 !important;
          background: transparent !important;
        }
      `}</style>

      {/* No Data Overlay */}
      {hospitals.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗺️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Hospitals Available</h3>
            <p className="text-gray-400 mb-4">Hospital data is loading or unavailable</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors shadow-md"
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
