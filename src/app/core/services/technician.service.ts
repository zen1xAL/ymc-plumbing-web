import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Technician } from '../models/technician.model';

@Injectable({
  providedIn: 'root'
})
export class TechnicianService {
  private readonly api = inject(ApiService);

  private readonly _technicians = signal<Technician[]>([]);
  readonly technicians = this._technicians.asReadonly();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly activeTechnicians = computed(() =>
    this._technicians().filter((t) => t.active)
  );

  loadTechnicians(): Observable<Technician[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.get<Technician[]>('/technicians').pipe(
      tap({
        next: (items) => {
          this._technicians.set(items);
          this.loading.set(false);
        },
        error: (err: Error) => {
          this.error.set(err.message || 'Ошибка загрузки техников');
          this.loading.set(false);
        }
      })
    );
  }
}
