import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CrmLeadsComponent } from './crm-leads.component';
import { LeadService } from '@core/services/lead.service';
import { Lead } from '@core/models/lead.model';

describe('CrmLeadsComponent', () => {
  let component: CrmLeadsComponent;
  let leadService: LeadService;

  const mockLeads: Lead[] = [
    {
      id: 'L-201',
      client: { firstName: 'John', lastName: 'Smith', phone: '+15551234567' },
      jobType: 'Pipe Leak',
      source: 'Website',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      zipCode: '97477',
      description: 'Leak under sink',
      status: 'New',
      createdAt: '2026-10-20T10:00:00.000Z'
    },
    {
      id: 'L-202',
      client: { firstName: 'Sarah', lastName: 'Connor', phone: '+15559876543' },
      jobType: 'Clogged Drain',
      source: 'Phone',
      address: '1000 Ocean Drive',
      city: 'Miami Beach',
      zipCode: '33139',
      description: 'Clogged bathroom pipe',
      status: 'Converted',
      createdAt: '2026-10-20T11:00:00.000Z'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrmLeadsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CrmLeadsComponent);
    component = fixture.componentInstance;
    leadService = TestBed.inject(LeadService);

    (leadService as unknown as { _leads: { set: (v: Lead[]) => void } })._leads.set(mockLeads);
    fixture.detectChanges();
  });

  it('should create the CRM leads component', () => {
    expect(component).toBeTruthy();
  });

  it('should filter leads by status', () => {
    component.setStatusFilter('New');
    expect(component.filteredLeads().length).toBe(1);
    expect(component.filteredLeads()[0].id).toBe('L-201');

    component.setStatusFilter('Converted');
    expect(component.filteredLeads().length).toBe(1);
    expect(component.filteredLeads()[0].id).toBe('L-202');
  });

  it('should filter leads by search query', () => {
    component.onSearchChange('Evergreen');
    expect(component.filteredLeads().length).toBe(1);
    expect(component.filteredLeads()[0].id).toBe('L-201');
  });

  it('should emit createJobFromLead when requested', () => {
    let emittedLead: Lead | null = null;
    component.createJobFromLead.subscribe((lead) => {
      emittedLead = lead;
    });

    component.onCreateJobClick(mockLeads[0]);
    expect(emittedLead).toEqual(mockLeads[0]);
  });
});
