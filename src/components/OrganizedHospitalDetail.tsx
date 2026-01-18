import { X, Navigation, TrendingDown, TrendingUp, Phone, Clock, Users, MapPin } from 'lucide-react';
import type { HospitalWithWaitTime } from '../lib/types';

interface OrganizedHospitalDetailProps {
  hospital: HospitalWithWaitTime;
  onClose: () => void;
}

export function OrganizedHospitalDetail({ hospital, onClose }: OrganizedHospitalDetailProps) {
  const waitMinutes = hospital.current_wait?.wait_minutes || 0;
  const driveMinutes = hospital.current_wait?.drive_minutes || 0;
  const totalMinutes = waitMinutes + driveMinutes;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const getWaitTimeColor = (minutes: number) => {
    if (minutes > 180) return 'text-red-500';
    if (minutes > 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getWaitTimeBg = (minutes: number) => {
    if (minutes > 180) return 'bg-red-500/10 border-red-500/20';
    if (minutes > 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-green-500/10 border-green-500/20';
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="organized-hospital-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="hospital-info">
          <h2 className="hospital-name">{hospital.name}</h2>
          <p className="hospital-address">{hospital.address}</p>
        </div>
        <button onClick={onClose} className="close-button">
          <X size={20} />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-row">
          <div className="stat-item">
            <div className="stat-icon">
              <Clock size={16} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Current Wait</div>
              <div className={`stat-value ${getWaitTimeColor(waitMinutes)}`}>
                {formatTime(waitMinutes)}
              </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Navigation size={16} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Drive Time</div>
              <div className="stat-value text-blue-400">
                {formatTime(driveMinutes)}
              </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Clock size={16} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Time</div>
              <div className="stat-value text-purple-400">
                {formatTime(totalMinutes)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Details */}
      <div className="detail-section">
        <h3 className="section-title">Hospital Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Type</span>
            <span className="info-value">
              {hospital.type === 'urgent_care' ? 'Urgent Care' : 'Emergency Room'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Trauma Level</span>
            <span className="info-value">
              {hospital.trauma_level ? `Level ${hospital.trauma_level}` : 'N/A'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">24/7 Service</span>
            <span className={`info-value ${hospital.open_24h ? 'text-green-400' : 'text-gray-400'}`}>
              {hospital.open_24h ? 'Available' : 'Limited'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Pediatric Care</span>
            <span className={`info-value ${hospital.pediatric ? 'text-green-400' : 'text-gray-400'}`}>
              {hospital.pediatric ? 'Available' : 'Not Available'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Parking</span>
            <span className={`info-value ${hospital.parking_available ? 'text-green-400' : 'text-gray-400'}`}>
              {hospital.parking_available ? 'Available' : 'Not Available'}
            </span>
          </div>
          {hospital.phone && (
            <div className="info-item">
              <span className="info-label">Phone</span>
              <span className="info-value">{hospital.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Wait Analysis */}
      <div className="detail-section">
        <h3 className="section-title">Wait Time Analysis</h3>
        <div 
          className="wait-status"
          style={{
            background: waitMinutes > 180 ? 'rgba(239, 68, 68, 0.1)' : 
                       waitMinutes > 60 ? 'rgba(245, 158, 11, 0.1)' : 
                       'rgba(16, 185, 129, 0.1)',
            borderColor: waitMinutes > 180 ? 'rgba(239, 68, 68, 0.2)' : 
                          waitMinutes > 60 ? 'rgba(245, 158, 11, 0.2)' : 
                          'rgba(16, 185, 129, 0.2)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <div className="wait-header">
            <div className="wait-time">
              <span className="wait-number">{waitMinutes}</span>
              <span className="wait-unit">minutes</span>
            </div>
            <div className="wait-indicator">
              {waitMinutes <= 30 ? 'LOW' : waitMinutes <= 60 ? 'MODERATE' : waitMinutes <= 120 ? 'HIGH' : 'VERY HIGH'}
            </div>
          </div>
          <div className="wait-description">
            {waitMinutes <= 30 ? 'Short wait time - good availability' :
             waitMinutes <= 60 ? 'Moderate wait time - typical for this time' :
             waitMinutes <= 120 ? 'Long wait time - consider alternatives' :
             'Very long wait time - seek urgent care if possible'}
          </div>
        </div>
        
        <div className="estimated-patients">
          <div className="patients-header">
            <Users size={16} />
            <span>Estimated Patients Waiting</span>
          </div>
          <div className="patients-count">
            {waitMinutes <= 30 ? '1-10 patients' :
             waitMinutes <= 60 ? '11-25 patients' :
             waitMinutes <= 120 ? '26-50 patients' :
             '50+ patients'}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="detail-section">
        <h3 className="section-title">Services & Capacity</h3>
        <div className="services-grid">
          <div className="service-item">
            <div className="service-icon">🏥</div>
            <div className="service-info">
              <div className="service-name">Service Type</div>
              <div className="service-value">
                {hospital.type === 'urgent_care' ? 'Walk-in Clinic' : 'Full Emergency Department'}
              </div>
            </div>
          </div>
          <div className="service-item">
            <div className="service-icon">👥</div>
            <div className="service-info">
              <div className="service-name">Current Crowd</div>
              <div className="service-value capitalize">
                {hospital.current_wait?.crowd_level || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="detail-actions">
        <button onClick={openInMaps} className="action-button primary">
          <Navigation size={16} />
          <span>Get Directions</span>
        </button>
        <button onClick={onClose} className="action-button secondary">
          <X size={16} />
          <span>Close</span>
        </button>
      </div>

      {/* Last Updated */}
      <div className="last-updated">
        <span className="updated-text">
          Last updated: {hospital.current_wait ? 
            new Date(hospital.current_wait.timestamp).toLocaleString() : 
            'No recent data'
          }
        </span>
      </div>
    </div>
  );
}
