import { describe, it, expect } from 'vitest';
import { HistoryFilter } from './history.filter';
import { HistoryLogItem } from '../models/history.model';

describe('HistoryFilter', () => {
  const sampleItem: HistoryLogItem = {
    id: 'h-1',
    taskId: 'task-55',
    taskTitle: 'Water Heater – Robert Davis',
    timestamp: '2026-10-20T12:00:00.000Z',
    actionType: 'STATUS_CHANGE',
    description: 'Статус наряда изменен на Completed'
  };

  it('should match when action is ALL and query is empty', () => {
    expect(HistoryFilter.matches(sampleItem, '', 'ALL')).toBe(true);
  });

  it('should filter by actionType correctly', () => {
    expect(HistoryFilter.matches(sampleItem, '', 'STATUS_CHANGE')).toBe(true);
    expect(HistoryFilter.matches(sampleItem, '', 'CREATE')).toBe(false);
  });

  it('should filter by query across description, task title, and task id', () => {
    expect(HistoryFilter.matches(sampleItem, 'Completed', 'ALL')).toBe(true);
    expect(HistoryFilter.matches(sampleItem, 'Robert', 'ALL')).toBe(true);
    expect(HistoryFilter.matches(sampleItem, 'task-55', 'ALL')).toBe(true);
    expect(HistoryFilter.matches(sampleItem, 'Unknown', 'ALL')).toBe(false);
  });
});
