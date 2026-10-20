import { Component, inject, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobService } from '@core/services/job.service';
import { LeadService } from '@core/services/lead.service';
import { TechnicianService } from '@core/services/technician.service';
import { Lead } from '@core/models/lead.model';
import { Task } from '@core/models/task.model';
import {
  JOB_TYPES,
  LEAD_SOURCES,
  SERVICE_AREAS,
  SOURCE_LABELS,
  JOB_TYPE_LABELS,
  DEFAULT_CITY,
  DEFAULT_STATE,
  DEFAULT_ZIP,
  DEFAULT_AREA,
  DEFAULT_SCHEDULE_DELAY_HOURS,
  DEFAULT_JOB_DURATION_HOURS
} from '@core/models/constants';

@Component({
  selector: 'app-create-job-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-job-modal.component.html',
  styleUrl: './create-job-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateJobModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly jobService = inject(JobService);
  private readonly leadService = inject(LeadService);
  protected readonly technicianService = inject(TechnicianService);

  readonly isOpen = input<boolean>(false);
  readonly leadToConvert = input<Lead | null>(null);

  readonly close = output<void>();
  readonly jobSaved = output<Task>();

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly jobTypes = JOB_TYPES;
  readonly leadSources = LEAD_SOURCES;
  readonly serviceAreas = SERVICE_AREAS;

  readonly jobForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+() -]{7,25}$/)]],
    email: ['', [Validators.email]],
    jobType: [JOB_TYPES[0], [Validators.required]],
    source: [LEAD_SOURCES[0], [Validators.required]],
    description: [''],
    address: ['', [Validators.required, Validators.minLength(5)]],
    city: [DEFAULT_CITY],
    state: [DEFAULT_STATE],
    zipCode: [DEFAULT_ZIP],
    area: [DEFAULT_AREA],
    scheduledDate: ['', [Validators.required]],
    scheduledStartTime: ['', [Validators.required]],
    scheduledEndTime: [''],
    assignedTechnician: ['', [Validators.required]]
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const lead = this.leadToConvert();
      if (open) {
        this.resetAndPopulateForm(lead);
      }
    });
  }

  getJobTypeLabel(type: string): string {
    return JOB_TYPE_LABELS[type] ?? type;
  }

  getSourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
  }

  private resetAndPopulateForm(lead: Lead | null): void {
    this.errorMessage.set(null);
    this.isSubmitting.set(false);

    const now = new Date();
    const start = new Date(now.getTime() + DEFAULT_SCHEDULE_DELAY_HOURS * 60 * 60 * 1000);
    const end = new Date(start.getTime() + DEFAULT_JOB_DURATION_HOURS * 60 * 60 * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const startTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endTimeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

    const activeTechs = this.technicianService.activeTechnicians();
    const defaultTech = activeTechs.length > 0 ? activeTechs[0].name : '';

    if (lead) {
      this.jobForm.reset({
        firstName: lead.client.firstName,
        lastName: lead.client.lastName,
        phone: lead.client.phone,
        email: lead.client.email || '',
        jobType: lead.jobType || JOB_TYPES[0],
        source: lead.source || LEAD_SOURCES[0],
        description: lead.description || '',
        address: lead.address,
        city: lead.city || DEFAULT_CITY,
        state: DEFAULT_STATE,
        zipCode: lead.zipCode || DEFAULT_ZIP,
        area: DEFAULT_AREA,
        scheduledDate: dateStr,
        scheduledStartTime: startTimeStr,
        scheduledEndTime: endTimeStr,
        assignedTechnician: defaultTech
      });
    } else {
      this.jobForm.reset({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        jobType: JOB_TYPES[0],
        source: LEAD_SOURCES[1],
        description: '',
        address: '',
        city: DEFAULT_CITY,
        state: DEFAULT_STATE,
        zipCode: DEFAULT_ZIP,
        area: DEFAULT_AREA,
        scheduledDate: dateStr,
        scheduledStartTime: startTimeStr,
        scheduledEndTime: endTimeStr,
        assignedTechnician: defaultTech
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.jobForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const rawValue = this.jobForm.getRawValue();

    this.jobService.createJobFromForm(rawValue).subscribe({
      next: (createdTask) => {
        const lead = this.leadToConvert();
        if (lead) {
          this.leadService.updateStatus(lead.id, 'Converted').subscribe({
            next: () => {},
            error: () => {}
          });
        }
        this.isSubmitting.set(false);
        this.jobSaved.emit(createdTask);
        this.close.emit();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.message || 'Ошибка создания наряда на сервере');
      }
    });
  }

  onCancel(): void {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  }
}
