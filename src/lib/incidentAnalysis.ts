// Calculate expected patient load and wait times based on nearby medical incidents

import type { HospitalWithWaitTime } from './types';
import type { MedicalIncident } from './fireIncidents';

// Haversine formula to calculate distance between two points in kilometers
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface HospitalIncidentAnalysis {
  hospitalId: string;
  nearbyIncidents: MedicalIncident[];
  expectedPatients: number;
  expectedWaitTimeIncrease: number; // in minutes
  totalExpectedWaitTime: number; // current wait + expected increase
}

// Calculate which hospital is closest to each medical incident
// and aggregate expected patient load per hospital
export function analyzeIncidentImpact(
  hospitals: HospitalWithWaitTime[],
  incidents: MedicalIncident[]
): Map<string, HospitalIncidentAnalysis> {
  const analysisMap = new Map<string, HospitalIncidentAnalysis>();

  // Initialize analysis for each hospital
  hospitals.forEach(hospital => {
    analysisMap.set(hospital.id, {
      hospitalId: hospital.id,
      nearbyIncidents: [],
      expectedPatients: 0,
      expectedWaitTimeIncrease: 0,
      totalExpectedWaitTime: hospital.current_wait?.wait_minutes || 0
    });
  });

  // For each incident, find the closest hospital
  incidents.forEach(incident => {
    if (!incident.lat || !incident.lng) return;

    let closestHospital: HospitalWithWaitTime | null = null;
    let minDistance = Infinity;

    // Find the closest hospital to this incident
    hospitals.forEach(hospital => {
      if (!hospital.lat || !hospital.lng) return;

      const distance = calculateDistance(
        incident.lat!,
        incident.lng!,
        hospital.lat,
        hospital.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestHospital = hospital;
      }
    });

    // Assign incident to closest hospital if within reasonable range (15km)
    if (closestHospital && minDistance <= 15) {
      const analysis = analysisMap.get(closestHospital.id);
      if (analysis) {
        analysis.nearbyIncidents.push(incident);
        analysis.expectedPatients += 1;
      }
    }
  });

  // Calculate expected wait time increase based on patient load
  analysisMap.forEach((analysis) => {
    const hospital = hospitals.find(h => h.id === analysis.hospitalId);
    if (!hospital) return;

    // Calculate wait time increase
    // Assumption: Each additional patient adds ~15 minutes to wait time
    // This can be adjusted based on hospital capacity and current load
    const baseWaitTimePerPatient = 15; // minutes
    
    // Factor in current crowd level
    const crowdMultiplier = 
      hospital.current_wait?.crowd_level === 'high' ? 1.5 :
      hospital.current_wait?.crowd_level === 'medium' ? 1.2 : 1.0;

    analysis.expectedWaitTimeIncrease = 
      Math.round(analysis.expectedPatients * baseWaitTimePerPatient * crowdMultiplier);

    analysis.totalExpectedWaitTime = 
      (hospital.current_wait?.wait_minutes || 0) + analysis.expectedWaitTimeIncrease;
  });

  return analysisMap;
}

// Get analysis for a specific hospital
export function getHospitalAnalysis(
  hospitalId: string,
  analysisMap: Map<string, HospitalIncidentAnalysis>
): HospitalIncidentAnalysis | null {
  return analysisMap.get(hospitalId) || null;
}

// Get summary statistics
export interface IncidentSummary {
  totalIncidents: number;
  totalExpectedPatients: number;
  averageExpectedWaitIncrease: number;
  hospitalsAffected: number;
}

export function getIncidentSummary(
  analysisMap: Map<string, HospitalIncidentAnalysis>
): IncidentSummary {
  let totalIncidents = 0;
  let totalExpectedPatients = 0;
  let totalWaitIncrease = 0;
  let hospitalsAffected = 0;

  analysisMap.forEach(analysis => {
    const incidentCount = analysis.nearbyIncidents.length;
    if (incidentCount > 0) {
      hospitalsAffected++;
      totalIncidents += incidentCount;
      totalExpectedPatients += analysis.expectedPatients;
      totalWaitIncrease += analysis.expectedWaitTimeIncrease;
    }
  });

  return {
    totalIncidents,
    totalExpectedPatients,
    averageExpectedWaitIncrease: hospitalsAffected > 0 
      ? Math.round(totalWaitIncrease / hospitalsAffected) 
      : 0,
    hospitalsAffected
  };
}
