import { useEffect, useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary, ColorScheme } from '@vis.gl/react-google-maps';
import type { HospitalWithWaitTime } from '../lib/types';

interface MapViewProps {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}

// Component to handle directions rendering
function DirectionsRendererComponent({
  origin,
  destination,
  onRouteCalculated,
}: {
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  onRouteCalculated?: (minutes: number) => void;
}) {
  const map = useMap();
  // Load the routes library - once loaded, DirectionsService and DirectionsRenderer become available
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map || typeof google === 'undefined' || !google.maps) return;

    // DirectionsService and DirectionsRenderer are available from google.maps once the routes library loads
    setDirectionsService(new google.maps.DirectionsService());
    setDirectionsRenderer(new google.maps.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) {
      // Clear route if no origin/destination
      if (directionsRenderer && map) {
        directionsRenderer.setDirections(null);
      }
      return;
    }

    directionsService
      .route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        
        // Extract travel time from response
        if (response.routes[0]?.legs[0]?.duration?.value) {
          const seconds = response.routes[0].legs[0].duration.value;
          const minutes = Math.round(seconds / 60);
          onRouteCalculated?.(minutes);
        }
      })
      .catch((error) => {
        console.error('Error calculating route:', error);
      });
  }, [directionsService, directionsRenderer, origin, destination, onRouteCalculated, map]);

  return null;
}

// Inner map component that uses hooks
function MapContent({
  hospitals,
  onHospitalSelect,
  onTravelTimeCalculated,
}: {
  hospitals: HospitalWithWaitTime[];
  onHospitalSelect: (hospital: HospitalWithWaitTime) => void;
  onTravelTimeCalculated?: (driveMinutes: number) => void;
}) {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithWaitTime | null>(null);
  const map = useMap();

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Fallback to first hospital location if geolocation fails
          if (hospitals.length > 0) {
            const fallbackLocation = {
              lat: hospitals[0].lat,
              lng: hospitals[0].lng,
            };
            setMapCenter(fallbackLocation);
          }
        }
      );
    } else {
      // Fallback if geolocation not supported
      if (hospitals.length > 0) {
        const fallbackLocation = {
          lat: hospitals[0].lat,
          lng: hospitals[0].lng,
        };
        setMapCenter(fallbackLocation);
      }
    }
  }, [hospitals]);

  // Update map center when user location is set
  useEffect(() => {
    if (map && mapCenter) {
      map.setCenter(mapCenter);
    }
  }, [map, mapCenter]);

  const handleHospitalClick = useCallback(
    (hospital: HospitalWithWaitTime) => {
      setSelectedHospital(hospital);
      onHospitalSelect(hospital);
    },
    [onHospitalSelect]
  );

  const getMarkerColor = (hospital: HospitalWithWaitTime): string => {
    const waitMinutes = hospital.current_wait?.wait_minutes || 0;
    if (waitMinutes < 120) return '#22c55e'; // Green
    if (waitMinutes < 240) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  if (!mapCenter) {
    return (
      <div className="fixed inset-0 z-30 bg-background flex items-center justify-center">
        <div className="text-text-secondary font-mono text-xs">Loading map...</div>
      </div>
    );
  }

  return (
    <>
      {/* User location marker */}
      {userLocation && (
        <AdvancedMarker position={userLocation}>
          <div className="relative">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white opacity-75 animate-ping"></div>
          </div>
        </AdvancedMarker>
      )}

      {/* Hospital markers */}
      {hospitals.map((hospital) => {
        const color = getMarkerColor(hospital);
        const waitMinutes = hospital.current_wait?.wait_minutes || 0;

        return (
          <AdvancedMarker
            key={hospital.id}
            position={{ lat: hospital.lat, lng: hospital.lng }}
            onClick={() => handleHospitalClick(hospital)}
          >
            <div
              className="group relative cursor-pointer transform transition-transform hover:scale-110"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill={color}
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-lg"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-surface border border-border px-3 py-2 rounded shadow-lg">
                  <div className="font-sans font-bold text-text-primary text-xs mb-1">{hospital.name}</div>
                  <div className="font-mono text-accent-green text-xs">
                    {waitMinutes < 60 ? `${waitMinutes}m` : `${Math.floor(waitMinutes / 60)}h ${waitMinutes % 60}m`}
                  </div>
                </div>
              </div>
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Directions renderer */}
      {userLocation && selectedHospital && (
        <DirectionsRendererComponent
          origin={userLocation}
          destination={{ lat: selectedHospital.lat, lng: selectedHospital.lng }}
          onRouteCalculated={onTravelTimeCalculated}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-surface/80 backdrop-blur-sm border border-border px-6 py-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
          <span className="font-mono text-text-secondary text-xs">{'< 2hr'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
          <span className="font-mono text-text-secondary text-xs">2-4hr</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="font-mono text-text-secondary text-xs">{'> 4hr'}</span>
        </div>
      </div>
    </>
  );
}

export function MapView({
  hospitals,
  onHospitalSelect,
  onTravelTimeCalculated,
}: MapViewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="fixed inset-0 z-30 bg-background flex items-center justify-center">
        <div className="text-text-secondary font-mono text-xs text-center p-4 space-y-2">
          <div>Google Maps API key not configured.</div>
          <div className="text-xs text-text-tertiary mt-2">
            1. Set VITE_GOOGLE_MAPS_API_KEY in your .env file<br/>
            2. Restart the dev server after adding the key<br/>
            3. Ensure the key has Maps JavaScript API and Directions API enabled
          </div>
        </div>
      </div>
    );
  }

  // Default center (will be overridden by user location or first hospital)
  const defaultCenter =
    hospitals.length > 0
      ? { lat: hospitals[0].lat, lng: hospitals[0].lng }
      : { lat: 37.7749, lng: -122.4194 }; // San Francisco default

  return (
    <div className="fixed inset-0 z-30 bg-background">
      <APIProvider apiKey={apiKey} version="beta">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          disableDefaultUI={false}
          mapTypeControl={false}
          fullscreenControl={false}
          streetViewControl={false}
          colorScheme={ColorScheme.DARK}
          style={{ width: '100%', height: '100%' }}
        >
          <MapContent
            hospitals={hospitals}
            onHospitalSelect={onHospitalSelect}
            onTravelTimeCalculated={onTravelTimeCalculated}
          />
        </Map>
      </APIProvider>
    </div>
  );
}
