import type { UserReport } from '../lib/types';

export const userReports: UserReport[] = [
  {
    id: 'ur1',
    hospital_id: '1',
    report_type: 'waiting_area',
    value: 'CROWDED',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'ur2',
    hospital_id: '1',
    report_type: 'parking',
    value: 'FULL',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'ur3',
    hospital_id: '2',
    report_type: 'staff_attitude',
    value: 'FRIENDLY',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ur4',
    hospital_id: '3',
    report_type: 'cleanliness',
    value: 'EXCELLENT',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'ur5',
    hospital_id: '4',
    report_type: 'waiting_area',
    value: 'QUIET',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];
