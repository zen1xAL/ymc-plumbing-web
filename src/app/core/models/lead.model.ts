import { ClientInfo } from './task.model';

export type LeadStatus = 'New' | 'Converted' | 'Dismissed';

export interface Lead {
  id: string;
  client: ClientInfo;
  jobType: string;
  source: string;
  address: string;
  city: string;
  zipCode: string;
  description: string;
  status: LeadStatus;
  createdAt: string;
}

export interface CreateLeadInput {
  client: ClientInfo;
  jobType: string;
  source: string;
  address: string;
  city: string;
  zipCode: string;
  description: string;
  status?: LeadStatus;
}
