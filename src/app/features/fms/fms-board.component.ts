import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobService } from '@core/services/job.service';
import { TechnicianService } from '@core/services/technician.service';
import { HistoryService } from '@core/services/history.service';
import { JobFilter } from '@core/services/job.filter';
import { Task, TaskStatus } from '@core/models/task.model';
import {
  TASK_STATUS_OPTIONS,
  TASK_STATUS_LABELS,
  JOB_TYPE_LABELS,
  HISTORY_ACTION_LABELS
} from '@core/models/constants';
import { HistoryLogItem } from '@core/models/history.model';

@Component({
  selector: 'app-fms-board',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './fms-board.component.html',
  styleUrl: './fms-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FmsBoardComponent {
  protected readonly jobService = inject(JobService);
  protected readonly technicianService = inject(TechnicianService);
  protected readonly historyService = inject(HistoryService);

  readonly selectedStatus = signal<'ALL' | TaskStatus>('ALL');
  readonly selectedTechnician = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly selectedJobForDetails = signal<Task | null>(null);

  readonly statusOptions = TASK_STATUS_OPTIONS;

  readonly filteredJobs = computed<Task[]>(() => {
    const status = this.selectedStatus();
    const tech = this.selectedTechnician();
    const query = this.searchQuery();
    const jobs = this.jobService.jobs();

    return jobs.filter((job) => JobFilter.matches(job, query, status, tech));
  });

  readonly selectedJobHistory = computed<HistoryLogItem[]>(() => {
    const job = this.selectedJobForDetails();
    if (!job) return [];
    return this.historyService.history().filter((h) => h.taskId === job.id);
  });

  getStatusLabel(status: TaskStatus): string {
    return TASK_STATUS_LABELS[status] ?? status;
  }

  getJobTypeLabel(type?: string): string {
    if (!type) return '';
    return JOB_TYPE_LABELS[type] ?? type;
  }

  getActionLabel(action: string): string {
    return HISTORY_ACTION_LABELS[action as keyof typeof HISTORY_ACTION_LABELS] ?? action;
  }

  setStatusFilter(status: 'ALL' | TaskStatus): void {
    this.selectedStatus.set(status);
  }

  setTechnicianFilter(techName: string): void {
    this.selectedTechnician.set(techName);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  openJobDetails(job: Task): void {
    this.selectedJobForDetails.set(job);
  }

  closeJobDetails(): void {
    this.selectedJobForDetails.set(null);
  }

  updateJobStatus(jobId: string, newStatus: TaskStatus): void {
    this.jobService.updateStatus(jobId, newStatus).subscribe({
      next: (updated: Task) => {
        if (this.selectedJobForDetails()?.id === jobId) {
          this.selectedJobForDetails.set(updated);
        }
      }
    });
  }

  reassignTechnician(jobId: string, technicianName: string): void {
    this.jobService.updateJob(jobId, { assignedTechnician: technicianName }).subscribe({
      next: (updated: Task) => {
        if (this.selectedJobForDetails()?.id === jobId) {
          this.selectedJobForDetails.set(updated);
        }
      }
    });
  }
}
