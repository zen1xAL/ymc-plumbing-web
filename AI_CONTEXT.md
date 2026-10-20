# AI Context & Architecture Blueprint: YMC Plumbing Web (CRM & FMS)

## 1. Executive Summary & Purpose
This repository contains the Office Dispatcher Web Application (CRM & FMS) for **YMC Plumbing**, a plumbing and pipe repair service company.
This project is the Web counterpart to the Field Worker Mobile Application (developed in React Native).

* **Candidate Code**: `SA-RN-2026-X1`
* **Target Audience**: Office managers and dispatchers handling customer inquiries, assigning work to field technicians, and tracking active jobs in real-time.
* **Technology Stack**:
  * **Frontend**: Angular 18/19 (Standalone Components, TypeScript Strict Mode, `strictTemplates: true`, Angular Signals, Reactive Forms, SCSS design tokens).
  * **Backend**: Node.js / Express shared REST API server running on port 3000 (`server/`), persisting data to `db.json`.
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
           ↓
  [4. Shared Backend Server (:3000/tasks)]
  Task is created with backward-compatible format:
  title: "Pipe Leak – John Smith", location, dueDate, status: "New"
     ├── Server fires Slack Webhook: "New Job Created & Assigned to Mike"
     └── Server appends row to Google Sheets audit record
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
  Dispatcher's active board auto-refreshes:
  Job status updates to 'In Progress' in real-time!
           ↓
  [8. Job Completion]
  Mike taps "Завершить наряд" (Status → 'Completed') → Web FMS, Slack, and Google Sheets are updated.
```

---

## 3. Core Entities & Data Contracts

### 3.1. Job / Task (`Task`)
The task contract maintains 100% backward compatibility with the mobile application while supporting rich CRM attributes:
* `id` (string): Unique identifier (e.g., `job-1729000000000-a1b2c`).
* `title` (string): Formatted as `${jobType} – ${firstName} ${lastName}` (read by mobile UI).
* `description` (string): Customer problem details and work instructions.
* `dueDate` (string): ISO 8601 deadline / scheduled end time.
* `status` (`'New' | 'In Progress' | 'Completed' | 'Cancelled'`): The shared lifecycle state.
* `location` (`{ address: string; latitude?: number; longitude?: number }`): Service address and GPS coordinates for map visualization.
* `attachments` (`TaskAttachment[]`): Photos attached from mobile camera/gallery.
* `syncStatus` (`'synced' | 'pending' | 'failed'`): Synchronization state.
* `createdAt` (string): ISO 8601 creation timestamp.
* `updatedAt` (string): ISO 8601 update timestamp (used for Last-Write-Wins conflict resolution).
* **CRM Metadata (Extended)**:
  * `client`: `{ firstName: string; lastName: string; phone: string; email?: string }`
  * `jobType`: `'Pipe Leak' | 'Clogged Drain' | 'Water Heater' | 'Emergency Repair' | 'Inspection'`
  * `source`: `'Phone' | 'Website' | 'Google Ads' | 'Referral' | 'Walk-in'`
  * `assignedTechnician`: string (e.g., `"Mike Johnson"`)
  * `scheduledTime`: `{ start: string; end: string }`

### 3.2. Lead (`Lead`)
* `id` (string): Lead identifier.
* `client`: `{ firstName: string; lastName: string; phone: string; email?: string }`
* `jobType`: Proposed service type.
* `address`: Service location.
* `source`: Lead channel.
* `description`: Customer complaint.
* `status`: `'New' | 'Converted' | 'Dismissed'`
* `createdAt`: Timestamp.

### 3.3. Technician (`Technician`)
* `id` (string): Technician ID.
* `name` (string): Full name (e.g., `Mike Johnson`, `Alex Rivera`, `John Doe`).
* `specialization` (string): Technical profile.
* `phone` (string): Contact number.
* `active` (boolean): Availability flag.

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
  * `models/`: TypeScript interfaces (`Job`, `Lead`, `Technician`, `HistoryItem`).
  * `services/`: Singleton services (`JobService`, `LeadService`, `TechnicianService`, `HistoryService`).
* **`features/`**:
  * `crm/`: Leads table, filters, lead preview.
  * `fms/`: Active jobs Kanban / table view, status filters, technician assignment.
  * `job-modal/`: Reactive Form for job creation / editing with validation and anti-double-submit guards.
  * `history/`: Activity feed showing chronological system events.
* **`shared/`**:
  * Reusable UI primitives (Buttons, Cards, Status Badges, Header).
  * Design tokens in `src/styles/` using CSS Custom Properties.

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
3. **Verify Compatibility with Mobile**:
   Point the mobile app (`d:/mobTask`) to `http://<YOUR_LOCAL_IP>:3000` and perform sync.
