require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return { leads: [], technicians: [], tasks: [], history: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to write db.json:', error.message);
  }
}

async function sendSlackNotification(payload) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.log('[Slack Mock Notification]:', JSON.stringify(payload, null, 2));
    return;
  }

  try {
    const clientName = payload.client ? `${payload.client.firstName} ${payload.client.lastName}` : 'Не указан';
    const technician = payload.assignedTechnician || 'Не назначен';
    const statusEmoji = payload.status === 'Completed' ? '✅' : payload.status === 'In Progress' ? '🔧' : payload.status === 'Cancelled' ? '❌' : '📋';

    const slackMessage = {
      text: `${statusEmoji} YMC Plumbing FMS Event: ${payload.eventTitle}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${statusEmoji} ${payload.eventTitle}`,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Наряд:*\n${payload.taskTitle || '–'}` },
            { type: 'mrkdwn', text: `*Статус:*\n${payload.status || '–'}` },
            { type: 'mrkdwn', text: `*Клиент:*\n${clientName}` },
            { type: 'mrkdwn', text: `*Мастер:*\n${technician}` },
            { type: 'mrkdwn', text: `*Тип работ:*\n${payload.jobType || '–'}` },
            { type: 'mrkdwn', text: `*Срок:*\n${payload.dueDate || '–'}` }
          ]
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    if (!response.ok) {
      console.warn('Slack Webhook response status:', response.status);
    }
  } catch (error) {
    console.error('Slack Webhook dispatch error:', error.message);
  }
}

async function sendGoogleSheetsSync(payload) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.log('[Google Sheets Mock Sync]:', JSON.stringify(payload, null, 2));
    return;
  }

  try {
    const rowData = {
      taskId: payload.taskId,
      title: payload.taskTitle,
      clientName: payload.client ? `${payload.client.firstName} ${payload.client.lastName}` : '',
      phone: payload.client ? payload.client.phone : '',
      address: payload.location ? payload.location.address : '',
      technician: payload.assignedTechnician || '',
      jobType: payload.jobType || '',
      status: payload.status,
      dueDate: payload.dueDate,
      updatedAt: payload.updatedAt || new Date().toISOString()
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowData)
    });
  } catch (error) {
    console.error('Google Sheets Sync dispatch error:', error.message);
  }
}

function logActivity(db, actionType, description, taskId, taskTitle) {
  const logItem = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actionType,
    description,
    timestamp: new Date().toISOString(),
    taskId,
    taskTitle
  };
  if (!db.history) {
    db.history = [];
  }
  db.history.unshift(logItem);
  return logItem;
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ymc-plumbing-server',
    candidate: 'SA-RN-2026-X1',
    timestamp: new Date().toISOString()
  });
});

app.get('/tasks', (req, res) => {
  const db = readDb();
  res.json(db.tasks || []);
});

app.get('/tasks/:id', (req, res) => {
  const db = readDb();
  const task = (db.tasks || []).find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

app.post('/tasks', async (req, res) => {
  const db = readDb();
  if (!db.tasks) db.tasks = [];

  const now = new Date().toISOString();
  const newTask = {
    id: req.body.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: req.body.title || 'Новый наряд',
    description: req.body.description || '',
    dueDate: req.body.dueDate || now,
    status: req.body.status || 'New',
    location: req.body.location || { address: '' },
    attachments: req.body.attachments || [],
    syncStatus: 'synced',
    createdAt: req.body.createdAt || now,
    updatedAt: now,
    client: req.body.client,
    jobType: req.body.jobType,
    source: req.body.source,
    assignedTechnician: req.body.assignedTechnician,
    scheduledTime: req.body.scheduledTime
  };

  const existingIndex = db.tasks.findIndex((t) => t.id === newTask.id);
  if (existingIndex >= 0) {
    db.tasks[existingIndex] = newTask;
  } else {
    db.tasks.unshift(newTask);
  }

  const desc = `Создан наряд «${newTask.title}» (Мастер: ${newTask.assignedTechnician || 'Не назначен'})`;
  logActivity(db, 'CREATE', desc, newTask.id, newTask.title);
  writeDb(db);

  sendSlackNotification({
    eventTitle: 'Создан новый наряд на выезд',
    taskId: newTask.id,
    taskTitle: newTask.title,
    status: newTask.status,
    client: newTask.client,
    assignedTechnician: newTask.assignedTechnician,
    jobType: newTask.jobType,
    dueDate: newTask.dueDate
  });

  sendGoogleSheetsSync(newTask);

  res.status(201).json(newTask);
});

app.put('/tasks/:id', async (req, res) => {
  const db = readDb();
  if (!db.tasks) db.tasks = [];
  const index = db.tasks.findIndex((t) => t.id === req.params.id);

  const existing = index >= 0 ? db.tasks[index] : {};
  const now = new Date().toISOString();
  const updatedTask = {
    ...existing,
    ...req.body,
    location: {
      ...(existing.location || {}),
      ...(req.body.location || {})
    },
    id: req.params.id,
    updatedAt: now,
    syncStatus: 'synced'
  };

  if (index >= 0) {
    db.tasks[index] = updatedTask;
  } else {
    db.tasks.unshift(updatedTask);
  }

  const desc = `Обновлены данные наряда «${updatedTask.title}»`;
  logActivity(db, 'EDIT', desc, updatedTask.id, updatedTask.title);
  writeDb(db);

  sendSlackNotification({
    eventTitle: `Обновление наряда: ${updatedTask.title}`,
    taskId: updatedTask.id,
    taskTitle: updatedTask.title,
    status: updatedTask.status,
    client: updatedTask.client,
    assignedTechnician: updatedTask.assignedTechnician,
    jobType: updatedTask.jobType,
    dueDate: updatedTask.dueDate
  });

  sendGoogleSheetsSync(updatedTask);

  res.json(updatedTask);
});

app.patch('/tasks/:id', async (req, res) => {
  const db = readDb();
  if (!db.tasks) db.tasks = [];
  const index = db.tasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const existing = db.tasks[index];
  const oldStatus = existing.status;
  const newStatus = req.body.status || oldStatus;
  const now = new Date().toISOString();

  const patchedTask = {
    ...existing,
    ...req.body,
    location: req.body.location
      ? { ...(existing.location || {}), ...req.body.location }
      : existing.location,
    id: req.params.id,
    updatedAt: now,
    syncStatus: 'synced'
  };

  db.tasks[index] = patchedTask;

  const isStatusChanged = oldStatus !== newStatus;
  const actionType = isStatusChanged ? 'STATUS_CHANGE' : 'EDIT';
  const desc = isStatusChanged
    ? `Статус наряда «${patchedTask.title}» изменен на «${newStatus}» (Мастер: ${patchedTask.assignedTechnician || '–'})`
    : `Обновлены данные наряда «${patchedTask.title}»`;

  logActivity(db, actionType, desc, patchedTask.id, patchedTask.title);
  writeDb(db);

  if (isStatusChanged) {
    sendSlackNotification({
      eventTitle: `Статус наряда изменен: ${newStatus}`,
      taskId: patchedTask.id,
      taskTitle: patchedTask.title,
      status: patchedTask.status,
      client: patchedTask.client,
      assignedTechnician: patchedTask.assignedTechnician,
      jobType: patchedTask.jobType,
      dueDate: patchedTask.dueDate
    });

    sendGoogleSheetsSync(patchedTask);
  }

  res.json(patchedTask);
});

app.delete('/tasks/:id', (req, res) => {
  const db = readDb();
  if (!db.tasks) db.tasks = [];
  const index = db.tasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const deleted = db.tasks[index];
  db.tasks.splice(index, 1);

  const desc = `Удален наряд «${deleted.title}»`;
  logActivity(db, 'DELETE', desc, deleted.id, deleted.title);
  writeDb(db);

  res.json({ success: true, id: req.params.id });
});

app.get('/leads', (req, res) => {
  const db = readDb();
  res.json(db.leads || []);
});

app.get('/leads/:id', (req, res) => {
  const db = readDb();
  const lead = (db.leads || []).find((l) => l.id === req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
});

app.post('/leads', (req, res) => {
  const db = readDb();
  if (!db.leads) db.leads = [];

  const newLead = {
    id: req.body.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    client: req.body.client || { firstName: '', lastName: '', phone: '' },
    jobType: req.body.jobType || 'General Inspection',
    source: req.body.source || 'Website',
    address: req.body.address || '',
    city: req.body.city || '',
    zipCode: req.body.zipCode || '',
    description: req.body.description || '',
    status: req.body.status || 'New',
    createdAt: new Date().toISOString()
  };

  db.leads.unshift(newLead);
  writeDb(db);
  res.status(201).json(newLead);
});

app.patch('/leads/:id', (req, res) => {
  const db = readDb();
  if (!db.leads) db.leads = [];
  const index = db.leads.findIndex((l) => l.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  db.leads[index] = { ...db.leads[index], ...req.body };
  writeDb(db);
  res.json(db.leads[index]);
});

app.delete('/leads/:id', (req, res) => {
  const db = readDb();
  if (!db.leads) db.leads = [];
  const index = db.leads.findIndex((l) => l.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  db.leads.splice(index, 1);
  writeDb(db);
  res.json({ success: true, id: req.params.id });
});

app.get('/technicians', (req, res) => {
  const db = readDb();
  res.json(db.technicians || []);
});

app.get('/history', (req, res) => {
  const db = readDb();
  res.json(db.history || []);
});

app.delete('/history', (req, res) => {
  const db = readDb();
  db.history = [];
  writeDb(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`[YMC Plumbing Server] Running on http://localhost:${PORT}`);
  console.log(`[Health Check] http://localhost:${PORT}/health`);
  console.log(`[Tasks API]    http://localhost:${PORT}/tasks`);
  console.log(`[Leads API]    http://localhost:${PORT}/leads`);
});
