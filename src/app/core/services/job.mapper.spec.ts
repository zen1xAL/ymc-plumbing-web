import { describe, it, expect } from 'vitest';
import { JobMapper, CreateJobFormData } from './job.mapper';
import { DEFAULT_CITY, DEFAULT_ZIP } from '../models/constants';

describe('JobMapper', () => {
  const sampleFormData: CreateJobFormData = {
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1 (555) 234-5678',
    email: 'john.smith@example.com',
    jobType: 'Pipe Leak',
    source: 'Website',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    zipCode: '97477',
    assignedTechnician: 'Mike Johnson',
    scheduledStart: '2026-10-21T10:00:00.000Z',
    scheduledEnd: '2026-10-21T12:00:00.000Z',
    description: 'Active leak under kitchen sink'
  };

  it('should map form data to CreateJobInput with en-dash in title', () => {
    const input = JobMapper.mapFormDataToInput(sampleFormData);

    expect(input.title).toBe('Pipe Leak – John Smith');
    expect(input.client.firstName).toBe('John');
    expect(input.client.lastName).toBe('Smith');
    expect(input.client.phone).toBe('+1 (555) 234-5678');
    expect(input.client.email).toBe('john.smith@example.com');
    expect(input.jobType).toBe('Pipe Leak');
    expect(input.source).toBe('Website');
    expect(input.assignedTechnician).toBe('Mike Johnson');
    expect(input.location.address).toBe('742 Evergreen Terrace, Springfield, 97477');
    expect(input.scheduledTime.start).toBe('2026-10-21T10:00:00.000Z');
    expect(input.scheduledTime.end).toBe('2026-10-21T12:00:00.000Z');
  });

  it('should calculate Springfield coordinates for Springfield address', () => {
    const coords = JobMapper.calculateCoordinates('742 Evergreen Terrace', 'Springfield');

    expect(coords.latitude).toBeGreaterThan(44.02);
    expect(coords.latitude).toBeLessThan(44.07);
    expect(coords.longitude).toBeGreaterThan(-123.04);
    expect(coords.longitude).toBeLessThan(-123.00);
  });

  it('should generate distinct coordinates for different addresses to prevent pin overlap', () => {
    const coordsA = JobMapper.calculateCoordinates('123 Elm Street', 'Springfield');
    const coordsB = JobMapper.calculateCoordinates('456 Oak Avenue', 'Springfield');

    const isDifferent = coordsA.latitude !== coordsB.latitude || coordsA.longitude !== coordsB.longitude;
    expect(isDifferent).toBe(true);
  });

  it('should fallback to default city when city is omitted', () => {
    const coords = JobMapper.calculateCoordinates('100 Main St', null);

    expect(coords.latitude).toBeGreaterThan(44.0);
    expect(coords.latitude).toBeLessThan(44.1);
    expect(coords.longitude).toBeGreaterThan(-123.1);
    expect(coords.longitude).toBeLessThan(-122.9);
  });

  it('should automatically set 2-hour window when scheduledEnd is empty', () => {
    const dataWithoutEnd: CreateJobFormData = {
      ...sampleFormData,
      scheduledEnd: null
    };

    const input = JobMapper.mapFormDataToInput(dataWithoutEnd);
    const startMs = new Date(input.scheduledTime.start).getTime();
    const endMs = new Date(input.scheduledTime.end).getTime();

    expect(endMs - startMs).toBe(2 * 60 * 60 * 1000);
  });
});
