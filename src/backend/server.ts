import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

import { pgQuery } from './pgQuery.js';
import { Project, NIO, Supply, User, CostAccount } from './types.js';
import { Console } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

/* ---------- MIDDLEWARES ---------- */
app.use(express.json());
app.use(cors());

/* ---------- ASYNC HANDLER ---------- */
const asyncHandler =
  (fn: Function) =>
  (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/* ---------- API PROJECTS ---------- */
app.get('/api/projects', asyncHandler(async (_, res) => {
  const rows = await pgQuery('projects', 'SELECT');
  const projects = rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    startDate: row.start_date instanceof Date
      ? row.start_date.toISOString().split('T')[0]
      : row.start_date,
    durationDays: row.duration_days,
    projectManager: row.project_manager_id,
    generalManager: row.general_manager_id,
    client: row.client,
    inspector: row.inspector,
    stockBalance: row.stock_balance,
    isEnable: row.is_enable
  }));

  res.json(projects);
}));

app.post('/api/projects', asyncHandler(async (req, res) => {
  const project: Project = req.body;

  const dbProject = {
    name: project.name,
    address: project.address,
    start_date: project.startDate,
    duration_days: project.durationDays,
    project_manager_id: project.projectManager,
    general_manager_id: project.generalManager,
    client: project.client,
    inspector: project.inspector,
    stock_balance: project.stockBalance
  };

  const created = await pgQuery('projects', 'INSERT', dbProject);
  res.status(201).json(created);
}));

app.put('/api/projects/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project: Project = req.body;

  const dbProject = {
    id,
    name: project.name,
    address: project.address,
    start_date: project.startDate,
    duration_days: project.durationDays,
    project_manager_id: project.projectManager,
    general_manager_id: project.generalManager,
    client: project.client,
    inspector: project.inspector,
    stock_balance: project.stockBalance,
    is_enable: true
  };

  const result = await pgQuery('projects', 'UPDATE', dbProject);

  if (!result) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  res.json(result);
}));

app.delete('/api/projects/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pgQuery('projects', 'UPDATE', {
    id,
    is_enable: false
  });

  if (!result) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  res.json({ message: 'Proyecto deshabilitado con éxito', project: result });
}));
app.get('/api/roles', asyncHandler(async (_, res) => {
  const rows = await pgQuery('roles', 'SELECT');

  const roles = rows.map((row: any) => ({
    id: row.id,
    name: row.name
  }));

  res.json(roles);
}));
/* ---------- API USERS ---------- */
app.get('/api/users', asyncHandler(async (_, res) => {
  const rows = await pgQuery('users', 'SELECT_USERS');

  const users = rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    lastName: row.last_name,
    email: row.email,
    rol: {id:row.role_id,name:row.role_name},
    isEnable: row.is_enable
  }));

  res.json(users);
}));

app.post('/api/users', asyncHandler(async (req, res) => {
  const user: User = req.body;

  const dbUser = {
    name: user.name,
    last_name: user.lastName,
    email: user.email,
    role_id: user.rol.id
  };

  const created = await pgQuery('users', 'INSERT', dbUser);
  res.status(201).json(created);
}));

app.put('/api/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user: User = req.body;

  const dbUser = {
    id,
    name: user.name,
    last_name: user.lastName,
    email: user.email,
    role_id: user.rol.id,
    is_enable: true
  };

  const result = await pgQuery('users', 'UPDATE', dbUser);

  if (!result) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  res.json(result);
}));

app.delete('/api/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pgQuery('users', 'UPDATE', {
    id,
    is_enable: false
  });

  if (!result) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  res.json({ message: 'Usuario deshabilitado con éxito', user: result });
}));

app.get('/api/costaccounts', asyncHandler(async (req, res) => {
  // Capturamos el projectId de la URL (ej: ?projectId=10)
  const { projectId } = req.query;
  // Pasamos el ID a pgQuery dentro del objeto 'data'
  // Nota: Si projectId no existe, pgQuery ejecutará el SELECT general
  const rows = await pgQuery('cost_accounts', 'SELECT_COST_ACCOUNT', { 
    id: projectId 
  });
  // Si pgQuery devuelve un solo objeto (cuando hay ID), lo normalizamos a array 
  // para que el .map no falle, o manejamos el caso individual.
  const dataArray = Array.isArray(rows) ? rows : (rows ? [rows] : []);

  const results = dataArray.map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    accountNumber: row.account_number,
    name: row.name,
    detail: row.detail,
    budgeted: Number(row.budgeted),
    spent: Number(row.spent),
    isEnable: row.is_enable

  }));
  res.json(results);
}));
app.post('/api/costaccounts', asyncHandler(async (req, res) => {
  const costAccount: CostAccount[] = req.body;
  const dataArray = Array.isArray(costAccount) ? costAccount : (costAccount ? [costAccount] : []);

  const results = dataArray.map((row: CostAccount) => ({
    project_id: row.projectId,
    name: row.name,
    detail: row.detail,
    budgeted: row.budgeted,
    spent: row.spent,
    is_enable: row.isEnable
  }));


  const created = await pgQuery('cost_accounts', 'INSERT_MANY', results);
  res.status(201).json(created);
}));

app.put('/api/costaccounts/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const costAccount: CostAccount = req.body;

  const dbCost = {
    id,
    project_id: costAccount.projectId,
    name: costAccount.name,
    detail: costAccount.detail,
    budgeted: costAccount.budgeted,
    spent: costAccount.spent,
    is_enable: costAccount.isEnable
  };

  const result = await pgQuery('cost_accounts', 'UPDATE', dbCost);

  if (!result) {
    return res.status(404).json({ message: 'Cuenta costo no encontrado' });
  }

  res.json(result);
}));

app.delete('/api/costaccounts/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pgQuery('cost_accounts', 'UPDATE', {
    id,
    is_enable: false
  });

  if (!result) {
    return res.status(404).json({ message: 'Cuenta costo no encontrado' });
  }

  res.json({ message: 'Cuenta costo deshabilitado con éxito', user: result });
}));
/* ---------- API NIOS ---------- */
app.get('/api/nios', asyncHandler(async (_, res) => {
  res.json(await pgQuery('nios', 'SELECT'));
}));

app.post('/api/nios', asyncHandler(async (req, res) => {
  const nio: NIO = req.body;
  const created = await pgQuery('nios', 'INSERT', nio);
  res.status(201).json(created);
}));

/* ---------- API SUPPLIES ---------- */
app.get('/api/supplies', asyncHandler(async (_, res) => {
  res.json(await pgQuery('supplies', 'SELECT'));
}));

app.post('/api/supplies', asyncHandler(async (req, res) => {
  const supply: Supply = req.body;
  const created = await pgQuery('supplies', 'INSERT', supply);
  res.status(201).json(created);
}));

/* ---------- ERROR HANDLER (SIEMPRE AL FINAL) ---------- */
app.use((err: any, req: any, res: any, _next: any) => {
  console.error(err);

  // Foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      message: 'Referencia inválida (relación inexistente)'
    });
  }

  // Unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      message: 'Registro duplicado'
    });
  }

  return res.status(500).json({
    message: 'Error interno del servidor'
  });
});

/* ---------- FRONTEND ---------- */
app.use(express.static(path.join(__dirname, '../../dist')));

app.get(/.*/, (_, res) => {
  res.sendFile(path.join(__dirname, '../../dist', 'index.html'));
});

/* ---------- START ---------- */
app.listen(PORT, () => {
  console.log(`🚀 App corriendo en http://localhost:${PORT}`);
});
