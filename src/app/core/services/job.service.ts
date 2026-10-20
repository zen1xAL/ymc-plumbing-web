import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { HistoryService } from './history.service';
import { JobMapper, CreateJobFormData } from './job.mapper';
import { Task, CreateJobInput, UpdateJobInput, TaskStatus } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private readonly api = inject(ApiService);
  private readonly historyService = inject(HistoryService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _jobs = signal<Task[]>([]);
  readonly jobs = this._jobs.asReadonly();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly activeJobs = computed(() =>
    this._jobs().filter((job) => job.status !== 'Completed' && job.status !== 'Cancelled')
  );

  readonly completedJobs = computed(() =>
    this._jobs().filter((job) => job.status === 'Completed')
  );

  readonly inProgressJobs = computed(() =>
    this._jobs().filter((job) => job.status === 'In Progress')
  );

  readonly newJobs = computed(() =>
    this._jobs().filter((job) => job.status === 'New')
  );

  readonly cancelledJobs = computed(() =>
    this._jobs().filter((job) => job.status === 'Cancelled')
  );

  readonly totalCount = computed(() => this._jobs().length);

  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopPolling());
  }

  loadJobs(): Observable<Task[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.get<Task[]>('/tasks').pipe(
      tap({
        next: (items) => {
          this._jobs.set(items);
          this.loading.set(false);
        },
        error: (err: Error) => {
          this.error.set(err.message || 'Ошибка загрузки нарядов');
          this.loading.set(false);
        }
      })
    );
  }

  createJobFromForm(formData: CreateJobFormData): Observable<Task> {
    const input = JobMapper.mapFormDataToInput(formData);
    return this.createJob(input);
  }

  createJob(input: CreateJobInput): Observable<Task> {
    const title = input.title || `${input.jobType} – ${input.client.firstName} ${input.client.lastName}`;
    const now = new Date().toISOString();
    const payload = {
      title,
      description: input.description,
      dueDate: input.dueDate || input.scheduledTime.end || now,
      status: 'New' as TaskStatus,
      location: input.location,
      attachments: [],
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
      client: input.client,
      jobType: input.jobType,
      source: input.source,
      assignedTechnician: input.assignedTechnician,
      scheduledTime: input.scheduledTime
    };

    return this.api.post<Task>('/tasks', payload).pipe(
      tap((created) => {
        this._jobs.update((prev) => [created, ...prev.filter((j) => j.id !== created.id)]);
        this.historyService.loadHistory().subscribe({ error: () => {} });
      })
    );
  }

  updateJob(id: string, input: UpdateJobInput): Observable<Task> {
    return this.api.patch<Task>(`/tasks/${encodeURIComponent(id)}`, input).pipe(
      tap((updated) => {
        this._jobs.update((prev) => prev.map((j) => (j.id === id ? updated : j)));
        this.historyService.loadHistory().subscribe({ error: () => {} });
      })
    );
  }

  updateStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.api.patch<Task>(`/tasks/${encodeURIComponent(id)}`, { status }).pipe(
      tap((updated) => {
        this._jobs.update((prev) => prev.map((j) => (j.id === id ? updated : j)));
        this.historyService.loadHistory().subscribe({ error: () => {} });
      })
    );
  }

  deleteJob(id: string): Observable<{ success: boolean; id: string }> {
    return this.api.delete<{ success: boolean; id: string }>(`/tasks/${encodeURIComponent(id)}`).pipe(
      tap(() => {
        this._jobs.update((prev) => prev.filter((j) => j.id !== id));
        this.historyService.loadHistory().subscribe({ error: () => {} });
      })
    );
  }

  startPolling(intervalMs = 4000): void {
    if (this.pollIntervalId) return;
    this.pollIntervalId = setInterval(() => {
      this.api.get<Task[]>('/tasks').subscribe({
        next: (items) => this._jobs.set(items),
        error: () => {}
      });
      this.historyService.loadHistory().subscribe({ error: () => {} });
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }
}
