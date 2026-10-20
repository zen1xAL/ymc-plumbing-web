import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService } from '@core/services/history.service';
import { HistoryFilter } from '@core/services/history.filter';
import { HistoryLogItem, HistoryActionType } from '@core/models/history.model';
import { HISTORY_ACTION_TYPES } from '@core/models/constants';

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

  readonly actionTypes = HISTORY_ACTION_TYPES;

  readonly filteredHistory = computed<HistoryLogItem[]>(() => {
    const action = this.selectedAction();
    const query = this.searchQuery();
    const items = this.historyService.history();

    return items.filter((item) => HistoryFilter.matches(item, query, action));
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
