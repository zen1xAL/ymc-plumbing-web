import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';
import { JobService } from '@core/services/job.service';
import { LeadService } from '@core/services/lead.service';
import { TechnicianService } from '@core/services/technician.service';
import { HistoryService } from '@core/services/history.service';

export type NavigationTab = 'crm' | 'fms' | 'history';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly themeService = inject(ThemeService);
  protected readonly jobService = inject(JobService);
  protected readonly leadService = inject(LeadService);
  protected readonly technicianService = inject(TechnicianService);
  protected readonly historyService = inject(HistoryService);

  readonly candidateCode = 'SA-RN-2026-X1';
  readonly activeTab = signal<NavigationTab>('fms');

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
}
