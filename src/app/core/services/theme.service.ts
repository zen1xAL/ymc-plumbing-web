import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<ThemeMode>('light');

  constructor() {
    const hasLocalStorage = typeof localStorage !== 'undefined';
    const saved = hasLocalStorage ? (localStorage.getItem('ymc_theme') as ThemeMode | null) : null;

    if (saved === 'dark' || saved === 'light') {
      this.currentTheme.set(saved);
    } else if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(prefersDark ? 'dark' : 'light');
    }

    effect(() => {
      const theme = this.currentTheme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      if (hasLocalStorage) {
        localStorage.setItem('ymc_theme', theme);
      }
    });
  }

  toggleTheme(): void {
    this.currentTheme.update((current) => (current === 'light' ? 'dark' : 'light'));
  }

  setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
  }
}
