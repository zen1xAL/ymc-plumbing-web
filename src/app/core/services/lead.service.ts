import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Lead, CreateLeadInput, LeadStatus } from '../models/lead.model';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private readonly api = inject(ApiService);

  private readonly _leads = signal<Lead[]>([]);
  readonly leads = this._leads.asReadonly();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly newLeads = computed(() =>
    this._leads().filter((l) => l.status === 'New')
  );

  readonly convertedLeads = computed(() =>
    this._leads().filter((l) => l.status === 'Converted')
  );

  readonly totalCount = computed(() => this._leads().length);

  loadLeads(): Observable<Lead[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.get<Lead[]>('/leads').pipe(
      tap({
        next: (items) => {
          this._leads.set(items);
          this.loading.set(false);
        },
        error: (err: Error) => {
          this.error.set(err.message || 'Ошибка загрузки лидов');
          this.loading.set(false);
        }
      })
    );
  }

  createLead(input: CreateLeadInput): Observable<Lead> {
    return this.api.post<Lead>('/leads', input).pipe(
      tap((created) => {
        this._leads.update((prev) => [created, ...prev]);
      })
    );
  }

  updateStatus(id: string, status: LeadStatus): Observable<Lead> {
    return this.api.patch<Lead>(`/leads/${id}`, { status }).pipe(
      tap((updated) => {
        this._leads.update((prev) => prev.map((l) => (l.id === id ? updated : l)));
      })
    );
  }

  deleteLead(id: string): Observable<{ success: boolean; id: string }> {
    return this.api.delete<{ success: boolean; id: string }>(`/leads/${id}`).pipe(
      tap(() => {
        this._leads.update((prev) => prev.filter((l) => l.id !== id));
      })
    );
  }
}
