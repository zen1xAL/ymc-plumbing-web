import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { FmsBoardComponent } from './fms-board.component';
import { JobService } from '@core/services/job.service';
import { Task } from '@core/models/task.model';

describe('FmsBoardComponent', () => {
  let component: FmsBoardComponent;
  let jobService: JobService;

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Pipe Leak – Alice',
      description: 'Leak in basement',
      dueDate: '2026-10-21T18:00:00.000Z',
      status: 'New',
      location: { address: '123 Elm St, Springfield' },
      attachments: [],
      syncStatus: 'synced',
      createdAt: '2026-10-20T10:00:00.000Z',
      updatedAt: '2026-10-20T10:00:00.000Z',
      client: { firstName: 'Alice', lastName: 'Walker', phone: '+15551112233' },
      assignedTechnician: 'Mike Johnson'
    },
    {
      id: 'task-2',
      title: 'Clogged Drain – Bob',
      description: 'Drain blocked',
      dueDate: '2026-10-21T14:00:00.000Z',
      status: 'In Progress',
      location: { address: '456 Oak Ave, Springfield' },
      attachments: [],
      syncStatus: 'synced',
      createdAt: '2026-10-20T11:00:00.000Z',
      updatedAt: '2026-10-20T11:30:00.000Z',
      client: { firstName: 'Bob', lastName: 'Taylor', phone: '+15552223344' },
      assignedTechnician: 'Alex Rivera'
    },
    {
      id: 'task-3',
      title: 'Water Heater – Charlie',
      description: 'Heater inspection',
      dueDate: '2026-10-20T12:00:00.000Z',
      status: 'Completed',
      location: { address: '789 Pine Rd, Springfield' },
      attachments: [],
      syncStatus: 'synced',
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-20T12:00:00.000Z',
      client: { firstName: 'Charlie', lastName: 'Brown', phone: '+15553334455' },
      assignedTechnician: 'Mike Johnson'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FmsBoardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(FmsBoardComponent);
    component = fixture.componentInstance;
    jobService = TestBed.inject(JobService);

    (jobService as unknown as { _jobs: { set: (v: Task[]) => void } })._jobs.set(mockTasks);
    fixture.detectChanges();
  });

  it('should create the FMS board component', () => {
    expect(component).toBeTruthy();
  });

  it('should return all jobs by default', () => {
    expect(component.filteredJobs().length).toBe(3);
  });

  it('should filter jobs by status', () => {
    component.setStatusFilter('In Progress');
    expect(component.filteredJobs().length).toBe(1);
    expect(component.filteredJobs()[0].id).toBe('task-2');

    component.setStatusFilter('Completed');
    expect(component.filteredJobs().length).toBe(1);
    expect(component.filteredJobs()[0].id).toBe('task-3');
  });

  it('should filter jobs by assigned technician', () => {
    component.setTechnicianFilter('Mike Johnson');
    expect(component.filteredJobs().length).toBe(2);

    component.setTechnicianFilter('Alex Rivera');
    expect(component.filteredJobs().length).toBe(1);
    expect(component.filteredJobs()[0].id).toBe('task-2');
  });

  it('should filter jobs by search query in client name, title or address', () => {
    component.onSearchChange('Alice');
    expect(component.filteredJobs().length).toBe(1);
    expect(component.filteredJobs()[0].id).toBe('task-1');

    component.onSearchChange('Pine Rd');
    expect(component.filteredJobs().length).toBe(1);
    expect(component.filteredJobs()[0].id).toBe('task-3');
  });

  it('should open and close job details drawer', () => {
    component.openJobDetails(mockTasks[0]);
    expect(component.selectedJobForDetails()?.id).toBe('task-1');

    component.closeJobDetails();
    expect(component.selectedJobForDetails()).toBeNull();
  });
});
