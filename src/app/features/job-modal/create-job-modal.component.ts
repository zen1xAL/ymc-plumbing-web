import { Component, inject, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobService } from '@core/services/job.service';
import { LeadService } from '@core/services/lead.service';
import { TechnicianService } from '@core/services/technician.service';
import { Lead } from '@core/models/lead.model';
import { Task, CreateJobInput } from '@core/models/task.model';

@Component({
  selector: 'app-create-job-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  readonly jobTypes: string[] = [
    'Pipe Leak',
    'Clogged Drain',
    'Water Heater',
    'Emergency Repair',
    'Inspection'
  ];

  readonly leadSources: string[] = [
    'Website',
    'Phone',
    'Google Ads',
    'Referral',
    'Walk-in'
  ];

  readonly jobForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+() -]{7,25}$/)]],
    email: ['', [Validators.email]],
    jobType: ['Pipe Leak', [Validators.required]],
    source: ['Website', [Validators.required]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    city: ['Springfield'],
    zipCode: ['97477'],
    assignedTechnician: ['', [Validators.required]],
    scheduledStart: ['', [Validators.required]],
    scheduledEnd: [''],
    description: ['']
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

  private resetAndPopulateForm(lead: Lead | null): void {
    this.errorMessage.set(null);
    this.isSubmitting.set(false);

    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const formatForInput = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const activeTechs = this.technicianService.activeTechnicians();
    const defaultTech = activeTechs.length > 0 ? activeTechs[0].name : 'Mike Johnson';

    if (lead) {
      this.jobForm.reset({
        firstName: lead.client.firstName,
        lastName: lead.client.lastName,
        phone: lead.client.phone,
        email: lead.client.email || '',
        jobType: lead.jobType || 'Pipe Leak',
        source: lead.source || 'Website',
        address: lead.address,
        city: lead.city || 'Springfield',
        zipCode: lead.zipCode || '97477',
        assignedTechnician: defaultTech,
        scheduledStart: formatForInput(start),
        scheduledEnd: formatForInput(end),
        description: lead.description || ''
      });
    } else {
      this.jobForm.reset({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        jobType: 'Pipe Leak',
        source: 'Phone',
        address: '',
        city: 'Springfield',
        zipCode: '97477',
        assignedTechnician: defaultTech,
        scheduledStart: formatForInput(start),
        scheduledEnd: formatForInput(end),
        description: ''
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

    const v = this.jobForm.value;
    const startDate = new Date(v.scheduledStart);
    const endDate = v.scheduledEnd ? new Date(v.scheduledEnd) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const fullAddress = [v.address, v.city, v.zipCode].filter(Boolean).join(', ');

    const jobInput: CreateJobInput = {
      title: `${v.jobType} – ${v.firstName} ${v.lastName}`,
      description: v.description || `Выполнение работ по заявке: ${v.jobType}`,
      dueDate: startDate.toISOString(),
      location: {
        address: fullAddress,
        latitude: 53.9006,
        longitude: 27.5590
      },
      client: {
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone,
        email: v.email || undefined
      },
      jobType: v.jobType,
      source: v.source,
      assignedTechnician: v.assignedTechnician,
      scheduledTime: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    this.jobService.createJob(jobInput).subscribe({
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
