# AI Context & Architecture Blueprint: YMC Plumbing Web (CRM & FMS)

## 1. Executive Summary & Purpose
This repository contains the Office Dispatcher Web Application (CRM & FMS) for **YMC Plumbing**, a plumbing and pipe repair service company.
This project is the Web counterpart to the Field Worker Mobile Application (developed in React Native in `d:/mobTask`).

* **Candidate Code**: `SA-RN-2026-X1`
* **Target Audience**: Office managers and dispatchers handling customer inquiries, assigning work to field technicians, and tracking active jobs in real-time.
* **Technology Stack**:
  * **Frontend**: Angular 21 (Standalone Components, TypeScript Strict Mode, `strictTemplates: true`, Angular Signals, Reactive Forms, SCSS design tokens, Modern Control Flow `@if`/`@for`).
  * **Backend**: Node.js / Express shared REST API server running on port 3000 (`server/`), persisting data to `db.json`.
  * **Testing**: Vitest unit testing suite (`npx ng test --watch=false`).
  * **Integrations**: Slack Incoming Webhooks (team notifications), Google Sheets Webhooks (external audit table), and Mobile App synchronization.

---

## 2. Business Flow: Office to Field & Back

```
  [1. Incoming Lead]
  Customer calls / submits web form (e.g. John Smith: Pipe Leak)
           ↓
  [2. CRM Layer (Leads)]
  Manager reviews leads table → clicks "Create a Job"
           ↓
  [3. FMS Dispatcher Modal]
  Manager enters client details, service address, scheduled time, selects technician (Mike)
  → Form validates required fields & guards against double submission
  → JobMapper generates unified Springfield coordinates with jitter
           ↓
  [4. Shared Backend Server (:3000/tasks)]
  Task is created with backward-compatible format:
  title: "Pipe Leak – John Smith", location, dueDate, status: "New"
     ├── Server fires Slack Webhook: "New Job Created & Assigned to Mike"
     ├── Server appends row to Google Sheets audit record
     └── Server logs activity to /history
           ↓
  [5. Mobile Application (Field Worker)]
  Technician Mike opens mobile app, pulls to refresh / auto-syncs:
  Job appears in Mike's task list!
  Mike taps "Взять в работу" (Status → 'In Progress') and synchronizes.
           ↓
  [6. Shared Backend Server (:3000/tasks/:id)]
  Server receives PATCH from mobile with status: 'In Progress':
     ├── Server updates db.json
     ├── Server logs to history
     ├── Server fires Slack Webhook: "Job In Progress by Mike"
     └── Server updates Google Sheets record
           ↓
  [7. Web FMS Dashboard (Office)]
  Dispatcher's active board auto-refreshes via polling:
  Job status updates to 'In Progress' in real-time and history log syncs!
           ↓
  [8. Job Completion]
  Mike taps "Завершить наряд" (Status → 'Completed') → Web FMS, Slack, and Google Sheets are updated.
```

---

## 3. Core Entities & Data Contracts

### 3.1. Job / Task (`Task`)
The task contract maintains 100% backward compatibility with the mobile application while supporting rich CRM attributes:
* `id` (string): Unique identifier (e.g., `task-1`).
* `title` (string): Formatted as `${jobType} – ${firstName} ${lastName}` (uses en-dash `–`).
* `description` (string): Customer problem details and work instructions.
* `dueDate` (string): ISO 8601 deadline / scheduled end time.
* `status` (`'New' | 'In Progress' | 'Completed' | 'Cancelled'`): The shared lifecycle state.
* `location` (`{ address: string; latitude: number; longitude: number }`): Service address and GPS coordinates for map visualization in Springfield (`44.0462, -123.0220`).
* `attachments` (`TaskAttachment[]`): Photos attached from mobile camera/gallery.
* `syncStatus` (`'synced' | 'pending' | 'failed'`): Synchronization state.
* `createdAt` (string): ISO 8601 creation timestamp.
* `updatedAt` (string): ISO 8601 update timestamp (used for Last-Write-Wins conflict resolution).
* **CRM Metadata (Extended)**:
  * `client`: `{ firstName: string; lastName: string; phone: string; email?: string }`
  * `jobType`: `'Pipe Leak' | 'Clogged Drain' | 'Water Heater' | 'Emergency Repair' | 'Inspection'`
  * `source`: `'Website' | 'Phone' | 'Google Ads' | 'Referral' | 'Walk-in'`
  * `assignedTechnician`: string (e.g., `"Mike Johnson"`)
  * `scheduledTime`: `{ start: string; end: string }`

### 3.2. Lead (`Lead`)
* `id` (string): Lead identifier.
* `client`: `{ firstName: string; lastName: string; phone: string; email?: string }`
* `jobType`: Proposed service type.
* `source`: Lead acquisition channel.
* `address`: Service location street.
* `city`: City (defaults to Springfield).
* `zipCode`: Postal code (defaults to 97477).
* `description`: Customer complaint.
* `status`: `'New' | 'Converted' | 'Dismissed'`
* `createdAt`: Timestamp.

### 3.3. Technician (`Technician`)
* `id` (string): Technician ID.
* `name` (string): Full name (e.g., `Mike Johnson`, `Alex Rivera`, `John Doe`).
* `specialization` (string): Technical profile.
* `phone` (string): Contact number.
* `active` (boolean): Availability flag.

### 3.4. History Log Item (`HistoryLogItem`)
* `id` (string): Event ID.
* `taskId` (string, optional): Associated task ID.
* `taskTitle` (string, optional): Associated task title.
* `timestamp` (string): ISO 8601 event time.
* `actionType` (`'CREATE' | 'STATUS_CHANGE' | 'EDIT' | 'ATTACHMENT_ADD' | 'ATTACHMENT_REMOVE' | 'DELETE' | 'SYNC'`): Action classification.
* `description` (string): Human-readable event description.

---

## 4. Shared Backend Architecture (`server/`)

The shared backend is located in `server/` and runs on **port 3000**:
* **Entry point**: `server/server.js`
* **Database**: `server/db.json`
* **CORS**: Enabled for all origins (`*`) to allow local Angular web dev (`localhost:4200`) and mobile clients.
* **Centralized Integrations (No Browser CORS issues)**:
  * **Slack Integration**: When a job is created or its status changes, the server dispatches a structured webhook message to `process.env.SLACK_WEBHOOK_URL`. If not configured, it logs the payload to the console without interrupting the client.
  * **Google Sheets Integration**: Dispatches an update payload to `process.env.GOOGLE_SHEETS_WEBHOOK_URL`.
  * **History Auditing**: Automatically records every creation and status change into the `/history` collection.

---

## 5. Web Application Structure (`src/app/`)

* **`core/`**:
  * `models/`:
    * `constants.ts`: Domain catalogs (`JOB_TYPES`, `LEAD_SOURCES`), default city/zip, base coordinates and delay constants.
    * `task.model.ts`, `lead.model.ts`, `technician.model.ts`, `history.model.ts`.
  * `services/`:
    * `job.mapper.ts`: Pure adapter mapping form inputs to `CreateJobInput`, calculating jittered coordinates per address.
    * `job.service.ts`: Signal-based job store, polling mechanism, and CRUD operations.
    * `lead.service.ts`: CRM lead state and status updates.
    * `technician.service.ts`: Technician availability store.
    * `history.service.ts`: Audit event stream and cache.
    * `theme.service.ts`: Light/Dark theme signal switcher.
* **`features/`**:
  * `crm/`: `CrmLeadsComponent` with search, status filtering, and modal conversion trigger.
  * `fms/`: `FmsBoardComponent` with active jobs grid, status pills, technician filter, quick status transitions, and job details drawer with event timeline.
  * `history/`: `HistoryLogComponent` with action type filters, search, manual refresh, and clear audit log.
  * `job-modal/`: `CreateJobModalComponent` reactive form with validation and anti-double-submit guards.
* **`app.ts` / `app.html` / `app.scss`**:
  * Root navigation shell, brand header, candidate badge (`SA-RN-2026-X1`), server heartbeat indicator, and theme switcher.

---

## 6. How to Run & Verify

1. **Start the Backend Server**:
   ```bash
   cd server
   npm install
   npm run server
   # Runs at http://localhost:3000
   ```
2. **Start the Angular Web Application**:
   ```bash
   npm install
   npm start
   # Opens at http://localhost:4200
   ```
3. **Run Unit Tests (Vitest)**:
   ```bash
   npm test
   # Or single run:
   npx ng test --watch=false
   ```
4. **Compile Production Bundle**:
   ```bash
   npm run build
   ```

---

## 7. AI & Tooling Disclosure

* **Assistance**: Antigravity IDE pair-programming workflow with Gemini 3.8 Flash (High).
* **Scope**: Clean Architecture decomposition, strict TypeScript typing (`strictTemplates: true`), design token implementation, zero comments validation, and automated Vitest suite generation.
