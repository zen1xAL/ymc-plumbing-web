import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { HistoryLogItem } from '../models/history.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly api = inject(ApiService);

  private readonly _history = signal<HistoryLogItem[]>([]);
  readonly history = this._history.asReadonly();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly count = computed(() => this._history().length);

  loadHistory(): Observable<HistoryLogItem[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.get<HistoryLogItem[]>('/history').pipe(
      tap({
        next: (items) => {
          this._history.set(items);
          this.loading.set(false);
        },
        error: (err: Error) => {
          this.error.set(err.message || 'Ошибка загрузки истории');
          this.loading.set(false);
        }
      })
    );
  }

  clearHistory(): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>('/history').pipe(
      tap(() => {
        this._history.set([]);
      })
    );
  }
}
