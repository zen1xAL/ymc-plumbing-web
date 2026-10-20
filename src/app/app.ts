import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';
import { JobService } from '@core/services/job.service';
import { LeadService } from '@core/services/lead.service';
import { TechnicianService } from '@core/services/technician.service';
import { HistoryService } from '@core/services/history.service';
import { CrmLeadsComponent } from '@features/crm/crm-leads.component';
import { CreateJobModalComponent } from '@features/job-modal/create-job-modal.component';
import { Lead } from '@core/models/lead.model';
import { Task } from '@core/models/task.model';

export type NavigationTab = 'crm' | 'fms' | 'history';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CrmLeadsComponent, CreateJobModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  protected readonly themeService = inject(ThemeService);
  protected readonly jobService = inject(JobService);
  protected readonly leadService = inject(LeadService);
  protected readonly technicianService = inject(TechnicianService);
  protected readonly historyService = inject(HistoryService);

  readonly candidateCode = 'SA-RN-2026-X1';
  readonly activeTab = signal<NavigationTab>('crm');

  readonly isCreateJobModalOpen = signal<boolean>(false);
  readonly selectedLeadForConversion = signal<Lead | null>(null);
  readonly toastMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.jobService.loadJobs().subscribe();
    this.leadService.loadLeads().subscribe();
    this.technicianService.loadTechnicians().subscribe();
    this.historyService.loadHistory().subscribe();
    this.jobService.startPolling(5000);
  }

  setTab(tab: NavigationTab): void {
    this.activeTab.set(tab);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  openCreateJobModal(lead: Lead | null = null): void {
    this.selectedLeadForConversion.set(lead);
    this.isCreateJobModalOpen.set(true);
  }

  closeCreateJobModal(): void {
    this.isCreateJobModalOpen.set(false);
    this.selectedLeadForConversion.set(null);
  }

  onJobCreated(task: Task): void {
    const techName = task.assignedTechnician || 'Мастер';
    this.showToast(`Наряд «${task.title}» успешно создан и передан выездному специалисту (${techName})!`);
    this.activeTab.set('fms');
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }
}
