import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobService } from '@core/services/job.service';
import { TechnicianService } from '@core/services/technician.service';
import { HistoryService } from '@core/services/history.service';
import { Task, TaskStatus } from '@core/models/task.model';

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

  readonly statusOptions: TaskStatus[] = ['New', 'In Progress', 'Completed', 'Cancelled'];

  readonly filteredJobs = computed(() => {
    const status = this.selectedStatus();
    const tech = this.selectedTechnician();
    const query = this.searchQuery().toLowerCase().trim();
    const jobs = this.jobService.jobs();

    return jobs.filter((job) => {
      const matchStatus = status === 'ALL' || job.status === status;
      if (!matchStatus) return false;

      const matchTech = tech === 'ALL' || job.assignedTechnician === tech;
      if (!matchTech) return false;

      if (!query) return true;

      const title = (job.title || '').toLowerCase();
      const address = (job.location?.address || '').toLowerCase();
      const clientName = job.client ? `${job.client.firstName} ${job.client.lastName}`.toLowerCase() : '';
      const phone = job.client?.phone ? job.client.phone.toLowerCase() : '';
      const id = (job.id || '').toLowerCase();

      return (
        title.includes(query) ||
        address.includes(query) ||
        clientName.includes(query) ||
        phone.includes(query) ||
        id.includes(query)
      );
    });
  });

  readonly selectedJobHistory = computed(() => {
    const job = this.selectedJobForDetails();
    if (!job) return [];
    return this.historyService.history().filter((h) => h.taskId === job.id);
  });

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
      next: (updated) => {
        if (this.selectedJobForDetails()?.id === jobId) {
          this.selectedJobForDetails.set(updated);
        }
      }
    });
  }

  reassignTechnician(jobId: string, technicianName: string): void {
    this.jobService.updateJob(jobId, { assignedTechnician: technicianName }).subscribe({
      next: (updated) => {
        if (this.selectedJobForDetails()?.id === jobId) {
          this.selectedJobForDetails.set(updated);
        }
      }
    });
  }
}
