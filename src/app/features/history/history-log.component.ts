import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService } from '@core/services/history.service';
import { HistoryActionType } from '@core/models/history.model';

@Component({
  selector: 'app-history-log',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './history-log.component.html',
  styleUrl: './history-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryLogComponent implements OnInit {
  protected readonly historyService = inject(HistoryService);

  readonly selectedAction = signal<'ALL' | HistoryActionType>('ALL');
  readonly searchQuery = signal<string>('');
  readonly isClearing = signal<boolean>(false);

  readonly actionTypes: HistoryActionType[] = [
    'CREATE',
    'STATUS_CHANGE',
    'EDIT',
    'ATTACHMENT_ADD',
    'ATTACHMENT_REMOVE',
    'DELETE'
  ];

  readonly filteredHistory = computed(() => {
    const action = this.selectedAction();
    const query = this.searchQuery().toLowerCase().trim();
    const items = this.historyService.history();

    return items.filter((item) => {
      const matchAction = action === 'ALL' || item.actionType === action;
      if (!matchAction) return false;

      if (!query) return true;

      const desc = (item.description || '').toLowerCase();
      const taskTitle = (item.taskTitle || '').toLowerCase();
      const taskId = (item.taskId || '').toLowerCase();

      return desc.includes(query) || taskTitle.includes(query) || taskId.includes(query);
    });
  });

  ngOnInit(): void {
    this.refresh();
  }

  setActionFilter(action: 'ALL' | HistoryActionType): void {
    this.selectedAction.set(action);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  refresh(): void {
    this.historyService.loadHistory().subscribe();
  }

  clearHistory(): void {
    if (confirm('Вы действительно хотите очистить журнал аудита?')) {
      this.isClearing.set(true);
      this.historyService.clearHistory().subscribe({
        next: () => this.isClearing.set(false),
        error: () => this.isClearing.set(false)
      });
    }
  }
}
