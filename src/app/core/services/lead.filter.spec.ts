import { describe, it, expect } from 'vitest';
import { LeadFilter } from './lead.filter';
import { Lead } from '../models/lead.model';

describe('LeadFilter', () => {
  const sampleLead: Lead = {
    id: 'lead-1',
    client: { firstName: 'John', lastName: 'Smith', phone: '+1 (555) 234-5678' },
    jobType: 'Pipe Leak',
    source: 'Website',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    zipCode: '97477',
    description: 'Active leak under kitchen sink',
    status: 'New',
    createdAt: '2026-10-20T10:00:00.000Z'
  };

  it('should match when status is ALL and query is empty', () => {
    expect(LeadFilter.matches(sampleLead, '', 'ALL')).toBe(true);
  });

  it('should filter by status correctly', () => {
    expect(LeadFilter.matches(sampleLead, '', 'New')).toBe(true);
    expect(LeadFilter.matches(sampleLead, '', 'Converted')).toBe(false);
    expect(LeadFilter.matches(sampleLead, '', 'Dismissed')).toBe(false);
  });

  it('should filter by query across name, phone, address, and job type', () => {
    expect(LeadFilter.matches(sampleLead, 'Smith', 'ALL')).toBe(true);
    expect(LeadFilter.matches(sampleLead, '234-5678', 'ALL')).toBe(true);
    expect(LeadFilter.matches(sampleLead, 'Evergreen', 'ALL')).toBe(true);
    expect(LeadFilter.matches(sampleLead, 'Pipe Leak', 'ALL')).toBe(true);
    expect(LeadFilter.matches(sampleLead, 'Miami', 'ALL')).toBe(false);
  });
});
