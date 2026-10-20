import { Task, TaskStatus } from '../models/task.model';

export class JobFilter {
  static matches(job: Task, query: string, status: 'ALL' | TaskStatus, technician: string): boolean {
    const matchStatus = status === 'ALL' || job.status === status;
    if (!matchStatus) return false;

    const matchTech = technician === 'ALL' || job.assignedTechnician === technician;
    if (!matchTech) return false;

    if (!query) return true;

    const lowerQuery = query.toLowerCase().trim();
    const title = (job.title || '').toLowerCase();
    const address = (job.location?.address || '').toLowerCase();
    const clientName = job.client ? `${job.client.firstName} ${job.client.lastName}`.toLowerCase() : '';
    const phone = job.client?.phone ? job.client.phone.toLowerCase() : '';
    const id = (job.id || '').toLowerCase();

    return (
      title.includes(lowerQuery) ||
      address.includes(lowerQuery) ||
      clientName.includes(lowerQuery) ||
      phone.includes(lowerQuery) ||
      id.includes(lowerQuery)
    );
  }
}
