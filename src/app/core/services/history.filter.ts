import { HistoryLogItem, HistoryActionType } from '../models/history.model';

export class HistoryFilter {
  static matches(item: HistoryLogItem, query: string, actionType: 'ALL' | HistoryActionType): boolean {
    const matchAction = actionType === 'ALL' || item.actionType === actionType;
    if (!matchAction) return false;

    if (!query) return true;

    const lowerQuery = query.toLowerCase().trim();
    const desc = (item.description || '').toLowerCase();
    const taskTitle = (item.taskTitle || '').toLowerCase();
    const taskId = (item.taskId || '').toLowerCase();

    return desc.includes(lowerQuery) || taskTitle.includes(lowerQuery) || taskId.includes(lowerQuery);
  }
}
