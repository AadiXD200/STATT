// Toronto Fire CAD data fetching and processing

export interface FireIncident {
  event_num: string;
  event_type: string;
  prime_street: string;
  cross_streets: string;
  dispatch_time: string;
  alarm_lev: number;
  beat: string;
  units_disp: string;
  lat?: number;
  lng?: number;
}

export interface MedicalIncident {
  event_num: string;
  postal_code: string;
  dispatch_time: string;
  beat: string;
  lat?: number;
  lng?: number;
}

// Parse XML to extract incidents
function parseFireCADXML(xmlText: string): FireIncident[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const events = xmlDoc.getElementsByTagName('event');
  const incidents: FireIncident[] = [];
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    const incident: FireIncident = {
      event_num: event.getElementsByTagName('event_num')[0]?.textContent || '',
      event_type: event.getElementsByTagName('event_type')[0]?.textContent || '',
      prime_street: event.getElementsByTagName('prime_street')[0]?.textContent || '',
      cross_streets: event.getElementsByTagName('cross_streets')[0]?.textContent || '',
      dispatch_time: event.getElementsByTagName('dispatch_time')[0]?.textContent || '',
      alarm_lev: parseInt(event.getElementsByTagName('alarm_lev')[0]?.textContent || '0'),
      beat: event.getElementsByTagName('beat')[0]?.textContent || '',
      units_disp: event.getElementsByTagName('units_disp')[0]?.textContent || '',
    };
    
    incidents.push(incident);
  }
  
  return incidents;
}

// Geocode Toronto postal codes to approximate coordinates
// This is a simple approximation - for production, use a proper geocoding service
function geocodePostalCode(postalCode: string): { lat: number; lng: number } | null {
  // Extract first 3 characters (FSA - Forward Sortation Area)
  const fsa = postalCode.trim().substring(0, 3).toUpperCase();
  
  // Approximate coordinates for Toronto FSAs
  const fsaCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'M1B': { lat: 43.8066, lng: -79.1943 },
    'M1C': { lat: 43.7845, lng: -79.1604 },
    'M1E': { lat: 43.7635, lng: -79.1887 },
    'M1G': { lat: 43.7709, lng: -79.2169 },
    'M1H': { lat: 43.7731, lng: -79.2394 },
    'M1J': { lat: 43.7447, lng: -79.2394 },
    'M1K': { lat: 43.7279, lng: -79.2620 },
    'M1L': { lat: 43.7111, lng: -79.2845 },
    'M1M': { lat: 43.7169, lng: -79.2394 },
    'M1N': { lat: 43.6922, lng: -79.2648 },
    'M1P': { lat: 43.7574, lng: -79.2733 },
    'M1R': { lat: 43.7500, lng: -79.2958 },
    'M1S': { lat: 43.7942, lng: -79.2620 },
    'M1T': { lat: 43.7816, lng: -79.3043 },
    'M1V': { lat: 43.8152, lng: -79.2845 },
    'M1W': { lat: 43.7995, lng: -79.3183 },
    'M1X': { lat: 43.8361, lng: -79.2056 },
    'M2H': { lat: 43.8037, lng: -79.3634 },
    'M2J': { lat: 43.7785, lng: -79.3465 },
    'M2K': { lat: 43.7869, lng: -79.3852 },
    'M2L': { lat: 43.7574, lng: -79.3746 },
    'M2M': { lat: 43.7890, lng: -79.4084 },
    'M2N': { lat: 43.7701, lng: -79.4084 },
    'M2P': { lat: 43.7527, lng: -79.4000 },
    'M2R': { lat: 43.7806, lng: -79.4422 },
    'M3A': { lat: 43.7532, lng: -79.3296 },
    'M3B': { lat: 43.7459, lng: -79.3521 },
    'M3C': { lat: 43.7258, lng: -79.3408 },
    'M3H': { lat: 43.7543, lng: -79.4422 },
    'M3J': { lat: 43.7679, lng: -79.4873 },
    'M3K': { lat: 43.7374, lng: -79.4647 },
    'M3L': { lat: 43.7390, lng: -79.5070 },
    'M3M': { lat: 43.7284, lng: -79.4957 },
    'M3N': { lat: 43.7616, lng: -79.5211 },
    'M4A': { lat: 43.7258, lng: -79.3155 },
    'M4B': { lat: 43.7063, lng: -79.3099 },
    'M4C': { lat: 43.6953, lng: -79.3183 },
    'M4E': { lat: 43.6763, lng: -79.2930 },
    'M4G': { lat: 43.7090, lng: -79.3634 },
    'M4H': { lat: 43.7058, lng: -79.3493 },
    'M4J': { lat: 43.6858, lng: -79.3380 },
    'M4K': { lat: 43.6795, lng: -79.3521 },
    'M4L': { lat: 43.6689, lng: -79.3155 },
    'M4M': { lat: 43.6595, lng: -79.3408 },
    'M4N': { lat: 43.7279, lng: -79.3887 },
    'M4P': { lat: 43.7127, lng: -79.3901 },
    'M4R': { lat: 43.7153, lng: -79.4056 },
    'M4S': { lat: 43.7042, lng: -79.3887 },
    'M4T': { lat: 43.6890, lng: -79.3831 },
    'M4V': { lat: 43.6858, lng: -79.4000 },
    'M4W': { lat: 43.6795, lng: -79.3775 },
    'M4X': { lat: 43.6668, lng: -79.3676 },
    'M4Y': { lat: 43.6658, lng: -79.3831 },
    'M5A': { lat: 43.6542, lng: -79.3606 },
    'M5B': { lat: 43.6571, lng: -79.3789 },
    'M5C': { lat: 43.6514, lng: -79.3754 },
    'M5E': { lat: 43.6447, lng: -79.3733 },
    'M5G': { lat: 43.6579, lng: -79.3873 },
    'M5H': { lat: 43.6505, lng: -79.3845 },
    'M5J': { lat: 43.6408, lng: -79.3817 },
    'M5K': { lat: 43.6471, lng: -79.3817 },
    'M5L': { lat: 43.6481, lng: -79.3789 },
    'M5M': { lat: 43.7332, lng: -79.4197 },
    'M5N': { lat: 43.7111, lng: -79.4169 },
    'M5P': { lat: 43.6963, lng: -79.4113 },
    'M5R': { lat: 43.6727, lng: -79.4056 },
    'M5S': { lat: 43.6626, lng: -79.4000 },
    'M5T': { lat: 43.6532, lng: -79.4000 },
    'M5V': { lat: 43.6289, lng: -79.3944 },
    'M5W': { lat: 43.6464, lng: -79.3747 },
    'M5X': { lat: 43.6484, lng: -79.3823 },
    'M6A': { lat: 43.7184, lng: -79.4647 },
    'M6B': { lat: 43.7090, lng: -79.4450 },
    'M6C': { lat: 43.6937, lng: -79.4281 },
    'M6E': { lat: 43.6890, lng: -79.4535 },
    'M6G': { lat: 43.6690, lng: -79.4225 },
    'M6H': { lat: 43.6690, lng: -79.4422 },
    'M6J': { lat: 43.6479, lng: -79.4197 },
    'M6K': { lat: 43.6368, lng: -79.4281 },
    'M6L': { lat: 43.7137, lng: -79.4900 },
    'M6M': { lat: 43.6911, lng: -79.4760 },
    'M6N': { lat: 43.6731, lng: -79.4872 },
    'M6P': { lat: 43.6616, lng: -79.4647 },
    'M6R': { lat: 43.6489, lng: -79.4563 },
    'M6S': { lat: 43.6516, lng: -79.4844 },
    'M7A': { lat: 43.6623, lng: -79.3887 },
    'M8V': { lat: 43.6058, lng: -79.5014 },
    'M8W': { lat: 43.6027, lng: -79.5437 },
    'M8X': { lat: 43.6537, lng: -79.5069 },
    'M8Y': { lat: 43.6363, lng: -79.4985 },
    'M8Z': { lat: 43.6279, lng: -79.5211 },
    'M9A': { lat: 43.6678, lng: -79.5323 },
    'M9B': { lat: 43.6500, lng: -79.5549 },
    'M9C': { lat: 43.6437, lng: -79.5774 },
    'M9L': { lat: 43.7563, lng: -79.5647 },
    'M9M': { lat: 43.7279, lng: -79.5323 },
    'M9N': { lat: 43.7063, lng: -79.5183 },
    'M9P': { lat: 43.6963, lng: -79.5323 },
    'M9R': { lat: 43.6879, lng: -79.5549 },
    'M9V': { lat: 43.7395, lng: -79.5887 },
    'M9W': { lat: 43.7063, lng: -79.5943 },
  };
  
  return fsaCoordinates[fsa] || null;
}

// Fetch and process Toronto Fire CAD data
export async function fetchMedicalIncidents(): Promise<MedicalIncident[]> {
  try {
    // Use CORS proxy to bypass browser CORS restrictions
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const targetUrl = encodeURIComponent('https://www.toronto.ca/data/fire/livecad.xml');
    const response = await fetch(proxyUrl + targetUrl);
    const xmlText = await response.text();
    
    const allIncidents = parseFireCADXML(xmlText);
    
    // Filter for medical incidents only
    const medicalIncidents = allIncidents
      .filter(incident => incident.event_type === 'MEDICAL')
      .map(incident => {
        // Extract postal code from prime_street (format like "M4G" or "M1P")
        const postalCode = incident.prime_street.trim();
        const coords = geocodePostalCode(postalCode);
        
        return {
          event_num: incident.event_num,
          postal_code: postalCode,
          dispatch_time: incident.dispatch_time,
          beat: incident.beat,
          lat: coords?.lat,
          lng: coords?.lng,
        };
      })
      .filter(incident => incident.lat && incident.lng); // Only include incidents with valid coordinates
    
    return medicalIncidents as MedicalIncident[];
  } catch (error) {
    console.error('Error fetching Toronto Fire CAD data:', error);
    return [];
  }
}
