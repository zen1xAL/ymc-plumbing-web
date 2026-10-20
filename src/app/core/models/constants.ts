export const JOB_TYPES = [
  'Pipe Leak',
  'Clogged Drain',
  'Water Heater',
  'Emergency Repair',
  'Inspection'
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const LEAD_SOURCES = [
  'Website',
  'Phone',
  'Google Ads',
  'Referral',
  'Walk-in'
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const DEFAULT_SCHEDULE_DELAY_HOURS = 1;
export const DEFAULT_JOB_DURATION_HOURS = 2;

export const DEFAULT_CITY = 'Springfield';
export const DEFAULT_ZIP = '97477';

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  springfield: { lat: 44.0462, lng: -123.0220 },
  'miami beach': { lat: 25.7907, lng: -80.1300 },
  miami: { lat: 25.7617, lng: -80.1918 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  boston: { lat: 42.3601, lng: -71.0589 }
};

export const DEFAULT_COORDINATES = {
  lat: 44.0462,
  lng: -123.0220
};
