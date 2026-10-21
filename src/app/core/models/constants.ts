import { TaskStatus } from './task.model';
import { HistoryActionType } from './history.model';

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

export const SERVICE_AREAS = [
  'Центральный',
  'Северный',
  'Южный',
  'Западный',
  'Восточный'
] as const;

export type ServiceArea = (typeof SERVICE_AREAS)[number];

export const SOURCE_LABELS: Record<string, string> = {
  Website: 'Веб-сайт',
  Phone: 'Телефон',
  'Google Ads': 'Google Ads',
  Referral: 'Рекомендация',
  'Walk-in': 'Визит в офис'
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  'Pipe Leak': 'Устранение протечки',
  'Clogged Drain': 'Прочистка засора',
  'Water Heater': 'Водонагреватель / бойлер',
  'Emergency Repair': 'Аварийный ремонт',
  Inspection: 'Диагностика и осмотр'
};

export const TASK_STATUS_OPTIONS: readonly TaskStatus[] = [
  'New',
  'In Progress',
  'Completed',
  'Cancelled'
] as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  New: 'Новый',
  'In Progress': 'В работе',
  Completed: 'Завершен',
  Cancelled: 'Отменен'
};

export const HISTORY_ACTION_TYPES: readonly HistoryActionType[] = [
  'CREATE',
  'STATUS_CHANGE',
  'EDIT',
  'ATTACHMENT_ADD',
  'ATTACHMENT_REMOVE',
  'DELETE',
  'SYNC'
] as const;

export const HISTORY_ACTION_LABELS: Record<HistoryActionType, string> = {
  CREATE: 'Создание',
  STATUS_CHANGE: 'Смена статуса',
  EDIT: 'Правка',
  ATTACHMENT_ADD: 'Вложение',
  ATTACHMENT_REMOVE: 'Удаление вложения',
  DELETE: 'Удаление',
  SYNC: 'Синхронизация'
};

export const DEFAULT_SCHEDULE_DELAY_HOURS = 1;
export const DEFAULT_JOB_DURATION_HOURS = 2;

export const DEFAULT_CITY = 'Springfield';
export const DEFAULT_STATE = 'OR';
export const DEFAULT_ZIP = '97477';
export const DEFAULT_AREA = 'Центральный';

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
