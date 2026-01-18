import type { HospitalWithWaitTime } from '../lib/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ERDataResponse {
  hospitals: any[];
  last_updated: string | null;
  total_hospitals: number;
}

export async function fetchERData(): Promise<{ hospitals: HospitalWithWaitTime[], lastUpdated: Date | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/er-data`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ERDataResponse = await response.json();
    
    // Transform backend data to match frontend types
    const hospitals = data.hospitals.map((hospital: any) => ({
      id: hospital.hospital_id,
      name: hospital.hospital_name || 'Unknown Hospital',
      address: hospital.location?.name || 'Address not available',
      lat: hospital.location?.lat || 0,
      lng: hospital.location?.lng || 0,
      trauma_level: null, // Backend doesn't provide this
      type: (hospital.hospital_name?.toLowerCase().includes('urgent care') ? 'urgent_care' as const : 'emergency' as const),
      parking_available: true, // Default values since backend doesn't provide
      pediatric: hospital.hospital_name?.toLowerCase().includes('children') || false,
      open_24h: true, // Default value
      phone: null, // Backend doesn't provide phone numbers
      created_at: hospital.last_updated || new Date().toISOString(),
      current_wait: hospital.estimated_wait_time !== undefined && hospital.estimated_wait_time !== null ? {
        id: `${hospital.hospital_id}-${Date.now()}`,
        hospital_id: hospital.hospital_id,
        wait_minutes: Math.max(0, hospital.estimated_wait_time || 0),
        drive_minutes: 0, // Will be calculated separately
        crowd_level: (hospital.patients_waiting ? 
          (hospital.patients_waiting > 10 ? 'high' as const : hospital.patients_waiting > 5 ? 'medium' as const : 'low' as const) : 'low' as const),
        patients_waiting: hospital.patients_waiting,
        patients_treated: hospital.patients_treated,
        timestamp: hospital.last_updated || new Date().toISOString(),
        created_at: hospital.last_updated || new Date().toISOString(),
      } : undefined,
      total_minutes: hospital.estimated_wait_time || 0,
    }));

    const lastUpdated = data.last_updated ? new Date(data.last_updated) : null;
    
    return { hospitals, lastUpdated };
  } catch (error) {
    console.error('Error fetching ER data:', error);
    // Return empty array on error to prevent app from crashing
    return { hospitals: [], lastUpdated: null };
  }
}

export async function refreshData(): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error refreshing data:', error);
    throw error;
  }
}
