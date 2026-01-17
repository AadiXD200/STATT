export interface Hospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  trauma_level: number | null;
  type: 'emergency' | 'urgent_care';
  parking_available: boolean;
  pediatric: boolean;
  open_24h: boolean;
  phone: string | null;
  created_at: string;
}

export interface WaitTime {
  id: string;
  hospital_id: string;
  wait_minutes: number;
  drive_minutes: number;
  crowd_level: 'low' | 'medium' | 'high';
  timestamp: string;
  created_at: string;
}

export interface UserReport {
  id: string;
  hospital_id: string;
  report_type: string;
  value: string;
  timestamp: string;
}

export interface HospitalWithWaitTime extends Hospital {
  current_wait?: WaitTime;
  total_minutes?: number;
}
