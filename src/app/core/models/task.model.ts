export type TaskStatus = 'New' | 'In Progress' | 'Completed' | 'Cancelled';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface TaskLocation {
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface TaskAttachment {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'file';
  size?: number;
  createdAt: string;
}

export interface ClientInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface ScheduledTime {
  start: string;
  end: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  location: TaskLocation;
  attachments: TaskAttachment[];
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  client?: ClientInfo;
  jobType?: string;
  source?: string;
  assignedTechnician?: string;
  scheduledTime?: ScheduledTime;
}

export type Job = Task;

export interface CreateJobInput {
  title?: string;
  client: ClientInfo;
  jobType: string;
  source: string;
  description: string;
  location: TaskLocation;
  assignedTechnician: string;
  scheduledTime: ScheduledTime;
  dueDate?: string;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  location?: TaskLocation;
  client?: ClientInfo;
  jobType?: string;
  source?: string;
  assignedTechnician?: string;
  scheduledTime?: ScheduledTime;
}
