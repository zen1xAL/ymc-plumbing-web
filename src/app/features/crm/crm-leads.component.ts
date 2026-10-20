import { Component, inject, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadService } from '@core/services/lead.service';
import { Lead, LeadStatus } from '@core/models/lead.model';

@Component({
  selector: 'app-crm-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crm-leads.component.html',
  styleUrl: './crm-leads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrmLeadsComponent {
  protected readonly leadService = inject(LeadService);

  readonly createJobFromLead = output<Lead>();

  readonly selectedStatus = signal<'ALL' | LeadStatus>('ALL');
  readonly searchQuery = signal<string>('');

  readonly filteredLeads = computed(() => {
    const status = this.selectedStatus();
    const query = this.searchQuery().toLowerCase().trim();
    const leads = this.leadService.leads();

    return leads.filter((lead) => {
      const matchStatus = status === 'ALL' || lead.status === status;
      if (!matchStatus) return false;

      if (!query) return true;
      const fullName = `${lead.client.firstName} ${lead.client.lastName}`.toLowerCase();
      const phone = lead.client.phone.toLowerCase();
      const address = lead.address.toLowerCase();
      const jobType = lead.jobType.toLowerCase();

      return (
        fullName.includes(query) ||
        phone.includes(query) ||
        address.includes(query) ||
        jobType.includes(query)
      );
    });
  });

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
