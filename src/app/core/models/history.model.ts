export type HistoryActionType =
  | 'CREATE'
  | 'STATUS_CHANGE'
  | 'EDIT'
  | 'ATTACHMENT_ADD'
  | 'ATTACHMENT_REMOVE'
  | 'DELETE'
  | 'SYNC';

export interface HistoryLogItem {
  id: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: string;
  actionType: HistoryActionType;
  description: string;
}
