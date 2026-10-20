import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateJobModalComponent } from './create-job-modal.component';
import { Lead } from '@core/models/lead.model';
import { DEFAULT_CITY, DEFAULT_STATE, DEFAULT_ZIP, DEFAULT_AREA } from '@core/models/constants';

describe('CreateJobModalComponent', () => {
  let component: CreateJobModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateJobModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CreateJobModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with 2x2 grid controls and defaults', () => {
    const form = component.jobForm;
    expect(form.get('firstName')).toBeTruthy();
    expect(form.get('lastName')).toBeTruthy();
    expect(form.get('phone')).toBeTruthy();
    expect(form.get('email')).toBeTruthy();
    expect(form.get('jobType')).toBeTruthy();
    expect(form.get('source')).toBeTruthy();
    expect(form.get('description')).toBeTruthy();
    expect(form.get('address')).toBeTruthy();
    expect(form.get('city')?.value).toBe(DEFAULT_CITY);
    expect(form.get('state')?.value).toBe(DEFAULT_STATE);
    expect(form.get('zipCode')?.value).toBe(DEFAULT_ZIP);
    expect(form.get('area')?.value).toBe(DEFAULT_AREA);
    expect(form.get('scheduledDate')).toBeTruthy();
    expect(form.get('scheduledStartTime')).toBeTruthy();
    expect(form.get('scheduledEndTime')).toBeTruthy();
    expect(form.get('assignedTechnician')).toBeTruthy();
  });

  it('should mark form invalid when required fields are empty', () => {
    component.jobForm.patchValue({
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      scheduledDate: '',
      scheduledStartTime: '',
      assignedTechnician: ''
    });
    expect(component.jobForm.invalid).toBe(true);
  });

  it('should emit close output on cancel', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });
    component.onCancel();
    expect(closed).toBe(true);
  });
});
