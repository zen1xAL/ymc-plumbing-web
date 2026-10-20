import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryLogComponent } from './history-log.component';
import { HistoryService } from '@core/services/history.service';
import { HistoryLogItem } from '@core/models/history.model';

describe('HistoryLogComponent', () => {
  let component: HistoryLogComponent;
  let historyService: HistoryService;

  const mockHistory: HistoryLogItem[] = [
    {
      id: 'h-1',
      taskId: 'task-1',
      taskTitle: 'Pipe Leak – Alice',
      timestamp: '2026-10-20T10:00:00.000Z',
      actionType: 'CREATE',
      description: 'Создан наряд'
    },
    {
      id: 'h-2',
      taskId: 'task-1',
      taskTitle: 'Pipe Leak – Alice',
      timestamp: '2026-10-20T11:00:00.000Z',
      actionType: 'STATUS_CHANGE',
      description: 'Статус наряда изменен на In Progress'
    },
    {
      id: 'h-3',
      taskId: 'task-2',
      taskTitle: 'Clogged Drain – Bob',
      timestamp: '2026-10-20T12:00:00.000Z',
      actionType: 'EDIT',
      description: 'Обновлены данные наряда'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryLogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryLogComponent);
    component = fixture.componentInstance;
    historyService = TestBed.inject(HistoryService);

    (historyService as unknown as { _history: { set: (v: HistoryLogItem[]) => void } })._history.set(mockHistory);
    fixture.detectChanges();
  });

  it('should create the history log component', () => {
    expect(component).toBeTruthy();
  });

  it('should display all history logs by default', () => {
    expect(component.filteredHistory().length).toBe(3);
  });

  it('should filter logs by action type', () => {
    component.setActionFilter('STATUS_CHANGE');
    expect(component.filteredHistory().length).toBe(1);
    expect(component.filteredHistory()[0].id).toBe('h-2');
  });

  it('should filter logs by search query', () => {
    component.onSearchChange('Clogged Drain');
    expect(component.filteredHistory().length).toBe(1);
    expect(component.filteredHistory()[0].id).toBe('h-3');
  });
});
