import { describe, it, expect } from 'vitest';
import { JobFilter } from './job.filter';
import { Task } from '../models/task.model';

describe('JobFilter', () => {
  const sampleTask: Task = {
    id: 'task-101',
    title: 'Pipe Leak – Alice Walker',
    description: 'Active leak in kitchen sink',
    dueDate: '2026-10-21T18:00:00.000Z',
    status: 'In Progress',
    location: { address: '123 Main St, Springfield' },
    attachments: [],
    syncStatus: 'synced',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    client: { firstName: 'Alice', lastName: 'Walker', phone: '+1 (555) 123-4567' },
    assignedTechnician: 'Mike Johnson'
  };

  it('should match when status and technician are ALL and query is empty', () => {
    expect(JobFilter.matches(sampleTask, '', 'ALL', 'ALL')).toBe(true);
  });

  it('should filter by status correctly', () => {
    expect(JobFilter.matches(sampleTask, '', 'In Progress', 'ALL')).toBe(true);
    expect(JobFilter.matches(sampleTask, '', 'New', 'ALL')).toBe(false);
    expect(JobFilter.matches(sampleTask, '', 'Completed', 'ALL')).toBe(false);
  });

  it('should filter by technician correctly', () => {
    expect(JobFilter.matches(sampleTask, '', 'ALL', 'Mike Johnson')).toBe(true);
    expect(JobFilter.matches(sampleTask, '', 'ALL', 'Alex Rivera')).toBe(false);
  });

  it('should filter by query across title, client name, phone, address, and id', () => {
    expect(JobFilter.matches(sampleTask, 'Alice', 'ALL', 'ALL')).toBe(true);
    expect(JobFilter.matches(sampleTask, 'Walker', 'ALL', 'ALL')).toBe(true);
    expect(JobFilter.matches(sampleTask, '123-4567', 'ALL', 'ALL')).toBe(true);
    expect(JobFilter.matches(sampleTask, 'Main St', 'ALL', 'ALL')).toBe(true);
    expect(JobFilter.matches(sampleTask, 'task-101', 'ALL', 'ALL')).toBe(true);
    expect(JobFilter.matches(sampleTask, 'Nonexistent', 'ALL', 'ALL')).toBe(false);
  });
});
