import { Component, inject, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadService } from '@core/services/lead.service';
import { LeadFilter } from '@core/services/lead.filter';
import { Lead, LeadStatus } from '@core/models/lead.model';
import { SOURCE_LABELS, JOB_TYPE_LABELS } from '@core/models/constants';

@Component({
  selector: 'app-crm-leads',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './crm-leads.component.html',
  styleUrl: './crm-leads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrmLeadsComponent {
  protected readonly leadService = inject(LeadService);

  readonly createJobFromLead = output<Lead>();

  readonly selectedStatus = signal<'ALL' | LeadStatus>('ALL');
  readonly searchQuery = signal<string>('');

  readonly filteredLeads = computed<Lead[]>(() => {
    const status = this.selectedStatus();
    const query = this.searchQuery();
    const leads = this.leadService.leads();

    return leads.filter((lead) => LeadFilter.matches(lead, query, status));
  });

  getSourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
  }

  getJobTypeLabel(type: string): string {
    return JOB_TYPE_LABELS[type] ?? type;
  }

  setStatusFilter(status: 'ALL' | LeadStatus): void {
    this.selectedStatus.set(status);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onCreateJobClick(lead: Lead): void {
    this.createJobFromLead.emit(lead);
  }

  onDismissLead(lead: Lead): void {
    this.leadService.updateStatus(lead.id, 'Dismissed').subscribe();
  }
}
