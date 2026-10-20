import { Lead, LeadStatus } from '../models/lead.model';

export class LeadFilter {
  static matches(lead: Lead, query: string, status: 'ALL' | LeadStatus): boolean {
    const matchStatus = status === 'ALL' || lead.status === status;
    if (!matchStatus) return false;

    if (!query) return true;

    const lowerQuery = query.toLowerCase().trim();
    const fullName = `${lead.client.firstName} ${lead.client.lastName}`.toLowerCase();
    const phone = lead.client.phone.toLowerCase();
    const address = lead.address.toLowerCase();
    const jobType = lead.jobType.toLowerCase();

    return (
      fullName.includes(lowerQuery) ||
      phone.includes(lowerQuery) ||
      address.includes(lowerQuery) ||
      jobType.includes(lowerQuery)
    );
  }
}
