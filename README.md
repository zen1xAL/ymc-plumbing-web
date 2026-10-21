# YMC Plumbing – CRM & FMS Web Dispatcher

> **Код соискателя (Candidate Code)**: `SA-RN-2026-X1`  
> **Проект**: Тестовое задание №2 – Веб-приложение диспетчера сантехнической службы (CRM & FMS).  
> **Связанный мобильный клиент**: `d:/mobTask` (React Native FMS).

---

## 1. Сводка проекта

**YMC Plumbing Web Dispatcher** – современная автоматизированная рабочая станция диспетчера сервисной компании. Приложение решает полный спектр задач диспетчерской службы:
* **CRM (Leads)**: прием первичных обращений клиентов (веб-сайт, телефон, контекстная реклама), оценка неисправностей и конвертация обращений в выездные наряды.
* **FMS (Field Service Management)**: планирование и распределение выездных нарядов по мастерам, фильтрация по статусам, оперативная смена статусов, просмотр детальной карточки наряда.
* **Аудит (History Log)**: сквозной хронологический журнал действий диспетчера и мобильных сотрудников с фильтрацией по типам событий.
* **Двусторонняя синхронизация (Web ⇄ Mobile)**: единый REST API бэкенд на порту 3000, обеспечивающий 100% обратную совместимость с мобильным приложением выездного специалиста (`d:/mobTask`).
* **Внешние интеграции**: автоматическая отправка структурированных уведомлений в корпоративный Slack и регистрация строк в Google Sheets.

---

## 2. Быстрый запуск

### 2.1. Предварительные требования
* Node.js v18+ или v20+
* npm v9+

### 2.2. Запуск общего REST-сервера (порт 3000)
Бэкенд-сервер обеспечивает общее хранилище `db.json` для веб-панели и мобильного приложения инженера:
```bash
cd server
npm install
npm run server
# Сервер запускается на http://localhost:3000
```

### 2.3. Запуск веб-приложения Angular (порт 4200)
В отдельном окне терминала в корне проекта:
```bash
npm install
npm start
# Клиент доступен по адресу http://localhost:4200
```

### 2.4. Запуск Unit-тестов (Vitest)
```bash
npm test
# Или без watch-режима:
npx ng test --watch=false
```

### 2.5. Production-сборка
```bash
npm run build
```

---

## 3. Технологический стек и архитектурные паттерны

### 3.1. Frontend
* **Angular 21 (Standalone Architecture)**:
  * Полный отказ от устаревших модулей `NgModule`.
  * Современный декларативный Control Flow Angular 17+: `@if`, `@else if`, `@else`, `@for (item of items; track item.id)`, `@empty`, `[class.xyz]`.
  * Исключен legacy `CommonModule`.
* **Angular Signals**:
  * Реактивное состояние через `signal`, `computed` и `effect`.
  * Инкапсуляция состояния в сервисах: приватные мутабельные сигналы (`_jobs`) и публичные readonly-сигналы (`jobs = this._jobs.asReadonly()`).
* **OnPush Change Detection**:
  * Все презентационные компоненты декларируют `changeDetection: ChangeDetectionStrategy.OnPush` для максимальной производительности.
* **Clean Architecture & SOLID**:
  * **Domain Layer** (`src/app/core/models/`): строгие типы, DTO, перечисления, справочники и константы (`constants.ts`).
  * **Application Layer** (`src/app/core/services/`): бизнес-логика, оркестрация запросов, поллинг, управление состоянием.
  * **Adapter Pattern** (`JobMapper`): вынос маппинга и гео-координат из UI-компонентов в специализированный класс.
  * **Presentation Layer** (`src/app/features/`): изолированные UI-компоненты (`crm`, `fms`, `history`, `job-modal`).
* **Дизайн-система (CSS Custom Properties)**:
  * Модульный SCSS без «магических чисел» (`Zero Magic Numbers`).
  * Все отступы, радиусы, шрифты и цвета объявлены через дизайн-токены в `src/styles.scss`.
  * Поддержка переключения тем: Светлая / Тёмная тема с адаптивной палитрой.
* **UI Anti-Slop (Эргономика диспетчера)**:
  * Высокая информационная плотность и контраст.
  * Полный отказ от декоративного блюра (`backdrop-filter: blur`) и неона.
  * 100% замена unicode-эмодзи на чистые inline SVG-иконки.
  * Строгое типографическое среднее тире (`–`, en-dash).

---

## 4. Сквозная синхронизация Web ⇄ Mobile (REST API)

Веб-приложение диспетчера и мобильное приложение инженера (`d:/mobTask`) работают с единым REST-сервером:

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     YMC Web Dispatcher (CRM)    │           │    YMC Mobile App (Engineer)    │
│      (http://localhost:4200)    │           │           (d:/mobTask)          │
└────────────────┬────────────────┘           └────────────────┬────────────────┘
                 │                                             │
                 │ POST /tasks (Создание)                     │ GET /tasks (Синхронизация)
                 │ GET /tasks (Поллинг)                       │ PATCH /tasks/:id (Смена статуса)
                 ▼                                             ▼
       ┌─────────────────────────────────────────────────────────────┐
       │             Shared Express Server (:3000)                   │
       │                   server/server.js                          │
       │                   server/db.json                            │
       └─────────────────────────────┬───────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         [Slack Webhook Channel]          [Google Sheets Webhook]
```

### 4.1. Контракт наряда (Task Contract)
Наряд `Task` на 100% обратно совместим с моделью мобильного приложения:
* `id`: строковый уникальный ID (например, `task-1`).
* `title`: форматированная строка `${jobType} – ${firstName} ${lastName}`.
* `description`: текст неисправности.
* `dueDate`: ISO 8601 дедлайн.
* `status`: `'New' | 'In Progress' | 'Completed' | 'Cancelled'`.
* `location`: `{ address: string, latitude: number, longitude: number }`.
* `attachments`: массив вложений с фотографиями ремонта.
* `syncStatus`: `'synced'`.
* `createdAt` / `updatedAt`: временные метки ISO 8601.
* Расширенные CRM-поля: `client` (`firstName`, `lastName`, `phone`, `email`), `jobType`, `source`, `assignedTechnician`, `scheduledTime`.

### 4.2. Разрешение конфликтов (Last-Write-Wins)
При одновременном обновлении данных на сервере и мобильном клиенте арбитром выступает поле `updatedAt` (UTC ISO 8601). Последняя по времени транзакция имеет приоритет.

### 4.3. Географическая согласованность и разброс меток (Jitter)
Базовый регион обслуживания – Спрингфилд (`Springfield, OR 97477`, `44.0462, -123.0220`). Класс `JobMapper.calculateCoordinates()` вычисляет псевдослучайное смещение на основе хеша строки адреса. Благодаря этому каждый наряд получает уникальные координаты в радиусе 1–2 км от центра города, и маркеры на карте мобильного приложения инженера не слипаются в одну точку.

---

## 5. Интеграции: Slack и Google Sheets

Для предотвращения проблем с CORS в браузере все исходящие вебхуки отправляются централизованно с Node.js бэкенда (`server/server.js`) в асинхронном неблокирующем режиме.

### 5.1. Настройка переменных окружения (`server/.env`)
В каталоге `server/` создайте или отредактируйте файл `.env`:
```env
PORT=3000
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_BOT/YOUR_TOKEN
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
*Если переменные не заданы, сервер работает в автономном режиме с подробным логированием событий в консоль.*

### 5.2. Код Google Apps Script для Google Таблицы
Для приема данных в Google Sheets создайте новую Google Таблицу, перейдите в **Extensions → Apps Script** и вставьте следующий скрипт:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Task ID", "Title", "Client Name", "Phone", 
        "Address", "Technician", "Job Type", "Status", 
        "Due Date", "Updated At"
      ]);
    }
    
    var data = JSON.parse(e.postData.contents);
    var clientName = data.client ? (data.client.firstName + " " + data.client.lastName) : (data.clientName || "");
    var rawPhone = data.client ? data.client.phone : (data.phone || "");
    var phone = (typeof rawPhone === "string" && (rawPhone.startsWith("+") || rawPhone.startsWith("=") || rawPhone.startsWith("-")))
      ? ("'" + rawPhone)
      : rawPhone;
    var address = data.location ? data.location.address : (data.address || "");
    
    sheet.appendRow([
      data.taskId || data.id || "",
      data.taskTitle || data.title || "",
      clientName,
      phone,
      address,
      data.assignedTechnician || data.technician || "",
      data.jobType || "",
      data.status || "",
      data.dueDate || "",
      data.updatedAt || new Date().toISOString()
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```
**Публикация**: Нажмите **Deploy → New deployment → Web app** (Access: Anyone) и скопируйте URL веб-приложения в переменную `GOOGLE_SHEETS_WEBHOOK_URL`.

---

## 6. Карта кодовой базы

```
ymc-plumbing-web/
├── server/                               # Shared REST API сервер
│   ├── db.json                           # Единая БД нарядов, лидов и мастеров
│   ├── server.js                         # Маршруты REST, отправка в Slack и Sheets
│   └── package.json
├── src/
│   ├── app/
│   │   ├── core/                         # Ядро приложения
│   │   │   ├── models/                   # Модели данных и DTO
│   │   │   │   ├── constants.ts          # Справочники типов работ, источников и координат
│   │   │   │   ├── task.model.ts         # Контракт Task / Job
│   │   │   │   ├── lead.model.ts         # Контракт CRM Lead
│   │   │   │   ├── technician.model.ts   # Контракт выездного мастера
│   │   │   │   └── history.model.ts      # Контракт записей аудита
│   │   │   └── services/                 # Бизнес-сервисы
│   │   │       ├── api.service.ts        # Типизированный HTTP-клиент
│   │   │       ├── job.service.ts        # Управление состоянием нарядов и поллинг
│   │   │       ├── job.mapper.ts         # Адаптер формы и геокоординат
│   │   │       ├── lead.service.ts       # Управление CRM-лидами
│   │   │       ├── technician.service.ts # Список специалистов
│   │   │       ├── history.service.ts    # Журнал аудита операций
│   │   │       └── theme.service.ts      # Управление светлой/тёмной темой
│   │   ├── features/                     # Презентационные функциональные модули
│   │   │   ├── crm/                      # CRM: таблица входящих лидов
│   │   │   ├── fms/                      # FMS: доска нарядов, фильтры, карточка деталей
│   │   │   ├── history/                  # Журнал аудита: хронология событий
│   │   │   └── job-modal/                # Модальное окно создания/конвертации наряда
│   │   ├── app.ts                        # Корневой контейнер диспетчера
│   │   ├── app.html                      # Шапка, навигация, переключатель тем
│   │   └── app.scss
│   ├── styles.scss                       # Глобальные дизайн-токены (Zero Magic Numbers)
│   └── main.ts
└── angular.json
```

---

## 7. AI & Tooling Disclosure

В соответствии с регламентом открытости процесса разработки:
* **Среда разработки**: Google Antigravity IDE (агентный режим парного программирования).
* **Модели**: Gemini 3.8 Flash (High).
* **Роль AI**:
  * Проектирование архитектуры Clean Architecture и декомпозиции модулей по принципам SOLID.
  * Реализация реактивного состояния на Angular Signals и современных шаблонов на Control Flow.
  * Разработка комплексного набора unit-тестов Vitest (`job.mapper.spec.ts`, `fms-board.component.spec.ts`, `crm-leads.component.spec.ts`, `history-log.component.spec.ts`).
  * Обеспечение обратной совместимости форматов данных с мобильным клиентом `d:/mobTask`.
  * Валидация отсутствия комментариев в коде (**Zero Comments Policy**) и проверка соответствия дизайн-токенам.
