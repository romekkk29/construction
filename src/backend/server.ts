import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { pgQuery } from './pgQuery.js';
import { Project, Supply, User, CostAccount, Driver } from './types.js';
import { GoogleGenAI, Type } from '@google/genai';
import passport, { use } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cookieSession from 'cookie-session';
import { userInfo } from 'os';
import nodemailer from 'nodemailer';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4001;
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // El host DEBE ser el de Gmail
  port: 587,              // El mismo que usas en Go
  secure: false,          // false para puerto 587 (usa STARTTLS)
  auth: {
    user: process.env.EMAIL_SENT,
    pass: process.env.EMAIL_PASSWORD // Tu App Password
  },
  tls: {
    // Esto asegura que la conexión no sea rechazada por temas de certificados locales
    rejectUnauthorized: false 
  }
});
// Configuración de Cookies
if (!process.env.SESSION_SECRET || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CLIENT_ID || !process.env.FRONTEND_URL) {
  throw new Error('Variables de entorno no definidas');
}

/* ---------- MIDDLEWARES ---------- */
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true // Permitir que viajen las cookies
}));


app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET], 
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  })
);

// SOLUCIÓN AL ERROR REGENERATE:
app.use((req: any, res, next) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb: any) => cb();
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb: any) => cb();
  }
  next();
});
app.use(passport.initialize());
app.use(passport.session());



// Configuración de Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
  async (accessToken, refreshToken, profile, done) => {
      try {
        // Google devuelve un array de emails, tomamos el primero
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(new Error("No se pudo obtener el email de Google"), null);
        }
        // Buscamos en tu DB usando tu función pgQuery
        const users = await pgQuery('users', 'SELECT_BY_EMAIL', {email});
        if (users && users.length > 0) {

          // El usuario existe en la DB, permitimos el acceso
          const user = users[0];

          
          return done(null, user); 
        } else {
          console.log("ENTRA AL ERROR")

          // El email NO está en la base de datos
          // Pasamos 'false' en lugar del usuario para denegar el acceso
          return done(null, false, { message: 'Tu email no está autorizado en el sistema.' });
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));
/* ---------- ASYNC HANDLER ---------- */
const asyncHandler =
  (fn: Function) =>
  (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);


// Iniciar sesión
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback de Google
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL+'/login?error=unauthorized', // Redirige al frontend con error
    session: true 
  }),
  (req, res) => {
    // Si llega aquí, es porque el email sí existía en la DB
    res.redirect(process.env.FRONTEND_URL); 
  }
);
// Cerrar sesión
app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    req.session = null; // Limpia la cookie de sesión
    res.redirect(process.env.FRONTEND_URL!);
  });
});

// Middleware de protección
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) { // Método que agrega passport
    return next();
  }
  res.status(401).json({ error: 'Debes iniciar sesión para acceder a este recurso' });
};

// Aplicarlo a todas las rutas que empiecen con /api
app.use('/api', isAuthenticated);

// En tu archivo del servidor backend
app.get('/api/me', isAuthenticated, (req, res) => {
  res.json(req.user); // Si isAuthenticated pasa, enviamos los datos del usuario
});
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
/* ---------- API PROJECTS (PROTEGIDA) ---------- */

app.post('/api/caja', asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'El nombre es obligatorio' });
  const created = await pgQuery('projects', 'INSERT', { name: name.trim() });
  res.status(201).json(created);
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
app.get('/api/dashboard', asyncHandler(async (_, res) => {
  const data = await pgQuery('projects', 'SELECT_DASHBOARD');
  
  res.json(data);
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
const projectId = parseInt(req.query.projectId, 10);  
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
    spent: row.spent
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
    is_enable: true
  };

  const result = await pgQuery('cost_accounts', 'UPDATE', dbCost);

  if (!result) {
    return res.status(404).json({ message: 'Cuenta costo no encontrado' });
  }

  res.json(result);
}));
app.get('/api/infla/:projectId', asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const rows = await pgQuery('infla', 'SELECT_INFLA', { project_id: projectId });
  res.json(rows);
}));

app.put('/api/costaccounts/inflation-manual/:id', asyncHandler(async (req, res) => {
  const { projectId, percentage, user_id} = req.body;
  const factor = 1 + (Number(percentage) / 100);

  // 1. Buscamos las cuentas actuales
  const currentAccounts = await pgQuery('cost_accounts', 'SELECT_COST_ACCOUNT', { id: projectId });
  const dataArray = Array.isArray(currentAccounts) ? currentAccounts : [currentAccounts];

  // 2. Preparamos el array con los nuevos valores para UPDATE_MANY
  const resultsToUpdate = dataArray.map((row: any) => ({
    id: row.id,
    budgeted: Number(row.budgeted) * factor
    // Solo mandamos ID y budgeted, tu UPDATE_MANY se encarga del resto
  }));

  // 3. Ejecutamos tu función UPDATE_MANY
  const updated = await pgQuery('cost_accounts', 'UPDATE_MANY', resultsToUpdate);

  const IN = await pgQuery('infla', 'INSERT', { project_id: projectId,percentage:percentage,user_id:user_id});

  res.json(updated);
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
/* ---------- API NIOS ---------- */
app.post('/api/nios', asyncHandler(async (req, res) => {
  const { nio, nioSuppliers } = req.body;

  if (!nio || !nioSuppliers || nioSuppliers.length === 0) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  // 1. Mapeamos el objeto nio para que coincida con los nombres de la DB (snake_case)
  const nioToInsert = {
    project_id: nio.projectId,
    need_date: nio.needDate,
    status: nio.status || 1,
    user_id: nio.userId
  };

  // 2. Insertamos la NIO principal
  const createdNio = await pgQuery('nios', 'INSERT', nioToInsert);
  
  // Obtenemos el ID generado por la base de datos
  const newNioId = createdNio.id;

  // 3. Preparamos los proveedores/items inyectando el nios_id recién creado
  // Importante: Asegúrate de mapear los nombres de campos a los de tu tabla nios_supplies
  const suppliersToInsert = nioSuppliers.map(item => ({
    nios_id: newNioId,           // El ID que vincula todo
    user_id: item.userId,
    supplies_id: item.supplyId,  // Ajustado a supplies_id según tu SQL
    quantity: item.quantity,
    status: item.status || 1,
    account_id: item.accountId,
    detail: item.detail || "Sin detalle" // Tu tabla pide detail NOT NULL
  }));

  // 4. Insertamos todos los items en una sola consulta
  const createdSuppliers = await pgQuery('nios_supplies', 'INSERT_MANY', suppliersToInsert);
  const newCreatedNio={
    projectId:createdNio.project_id,
    needDate:createdNio.need_date,
    status:createdNio.status,
    userId:createdNio.user_id,
    id:createdNio.id,
    creationDate:createdNio.creation_date,
    isEnable: createdNio.is_enable
  }
  const newcreatedSuppliers = createdSuppliers.map((row: any) => ({
    id: row.id,
    niosId: row.nios_id,
    supplyId: row.supplies_id,
    status: row.status,
    userId: row.user_id,
    quantity: parseFloat(row.quantity),
    accountId: row.account_id,
    detail: row.detail
  }));
  // 5. Respondemos con el objeto completo creado
  res.status(201).json({
    nio:newCreatedNio,
    items: newcreatedSuppliers
  });
}));
app.put('/api/nios/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nioSuppliers,need_date,idsDelete} = req.body;

  const nioToInsert = {
    id,
    need_date: need_date
  };
  const result = await pgQuery('nios', 'UPDATE', nioToInsert);

  const dataArray = Array.isArray(nioSuppliers) ? nioSuppliers : (nioSuppliers ? [nioSuppliers] : []);
  for (const element of dataArray) {
    if(isNaN((element.id))){
      let el={
          nios_id: id,           // El ID que vincula todo
          user_id: 1,
          supplies_id: element.supply.id,  // Ajustado a supplies_id según tu SQL
          quantity: element.quantity,
          status:  1,
          account_id: parseInt(element.accountId),
          detail: element.detail || "Sin detalle"}
        const created = await pgQuery('nios_supplies', 'INSERT', el);
    }
  };
  for (const element of idsDelete) {
         let nioDel = {
            id:element,
            is_enable: false
          };
        const del = await pgQuery('nios_supplies', 'UPDATE', nioDel);
  };
  if (!result) {
    return res.status(404).json({ message: 'Nio no encontrado' });
  }

  res.json(result);
}));
app.post('/api/nios_sell', asyncHandler(async (req, res) => {
  const { niosSupply, account_id } = req.body;

  // 1. Obtener el registro actual de la tabla supplies
  // Asumiendo que niosSupply.nios_supplies_id es la FK hacia supplies.id
  const currentSupplyId = await pgQuery('nios_supplies', 'SELECT', { id: niosSupply.nios_supplies_id });

  const currentSupply = await pgQuery('supplies', 'SELECT', { id: currentSupplyId.supplies_id });

  if (currentSupply) {
    const currentBestPrice = currentSupply.best_price !== null 
        ? parseFloat(currentSupply.best_price) 
        : Infinity;

    const newPrice = parseFloat(niosSupply.price_individual);

    // Si es la primera vez (null), newPrice < Infinity será TRUE
    if (newPrice < currentBestPrice) {
        const updateBestPriceData = {
            id: currentSupply.id,
            best_price: newPrice,
            best_supplier: niosSupply.supplier
        };
        await pgQuery('supplies', 'UPDATE', updateBestPriceData);
    }
  }

  // --- El resto de tu lógica original ---
  const niosSupplyUpdate = {
    id: niosSupply.nios_supplies_id,
    status: 3,
    ...(niosSupply.quantity != null && { quantity: niosSupply.quantity })
  };

  const updateAccount = {
    id: account_id,
    column: 'spent',
    amount: niosSupply.price_total
  };

  const { quantity: _qty, ...niosSellPayload } = niosSupply;
  const createdNioSell = await pgQuery('nios_sells', 'INSERT', niosSellPayload);
  const updateNioSupply = await pgQuery('nios_supplies', 'UPDATE', niosSupplyUpdate);
  await pgQuery('cost_accounts', 'UPDATE_COUNT', updateAccount);

  res.status(201).json(createdNioSell);
}));
app.post('/api/nios_driver', asyncHandler(async (req, res) => {
  const {niosDriver,user} = req.body;

  const niosDriverSave = {
    nios_sells_id:niosDriver.id,
    user_id: user, 
    driver_id:parseInt(niosDriver.driverId),
    status: 4
  };
  const niosSupplyUpdate = {
    id:niosDriver.nios_supplies_id,
    status: 4
  };
  const createdNioSell = await pgQuery('nios_driver', 'INSERT', niosDriverSave);
  const updateNioSupply = await pgQuery('nios_supplies', 'UPDATE', niosSupplyUpdate);
  res.status(201).json(createdNioSell);
}));
app.post('/api/nios_defect', asyncHandler(async (req, res) => {
  const nios_defect: any = req.body;
  const created = await pgQuery('nios_defect', 'INSERT', nios_defect);
  let data={
    id:nios_defect.nios_supplies_id,
    is_enable: false
  }
  const update = await pgQuery('nios_supplies', 'UPDATE', data);

  res.status(201).json(created);
}));
app.put('/api/nios_defect/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;

  const dbNIO = {
    id,
    status: status
  };

  const created = await pgQuery('nios_defect', 'UPDATE', dbNIO);


  res.status(201).json(created);
}));
app.post('/api/nios_defect_imput', asyncHandler(async (req, res) => {
  try {

    const nios_defect: any = req.body;


    const created = await pgQuery(
      'cost_accounts_defect',
      'INSERT',
      nios_defect
    );


    console.log('Valores para UPDATE:', {
      price: nios_defect.price,
      account_id: nios_defect.account_id,
      price_type: typeof nios_defect.price,
      account_id_type: typeof nios_defect.account_id
    });

    const updateResult = await pool.query(
      `
        UPDATE cost_accounts
        SET spent = spent - $1
        WHERE id = $2
        RETURNING *
      `,
      [
        Number(nios_defect.price),
        nios_defect.account_id
      ]
    );

    console.log('RESULTADO UPDATE:', updateResult.rowCount);
    console.log('FILAS ACTUALIZADAS:', updateResult.rows);

    if (updateResult.rowCount === 0) {
      console.log('NO SE ENCONTRO LA CUENTA');
    }

    res.status(201).json({
      created,
      updatedRows: updateResult.rows
    });

  } catch (error) {
    console.error('ERROR EN /api/nios_defect_imput:', error);

    res.status(500).json({
      error: 'Error interno',
      detail: error
    });
  }
}));
app.get('/api/nios_defect', asyncHandler(async (req, res) => {

  const limit = Number(req.query.limit) || 10;
  const offset = Number(req.query.offset) || 0;

  const results = await pgQuery('nios_defect', 'SELECT_NIO_DEFECT', {
    limit,
    offset
  });

  res.status(200).json(results);
}));
app.get('/api/nios_defect_cost/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  console.log(id)
  const results = await pgQuery('cost_accounts_defect', 'SELECT_NIO_DEFECT_COST', {
    id:id});

  res.status(200).json(results);
}));
app.put('/api/nios_sent_seller/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nioSuppliers,user } = req.body;

  const dbNIO = {
    id,
    status: 8,
    to_procurement_at: new Date().toISOString() // Genera: 2024-05-20T15:30:00.000Z
  };

  const result = await pgQuery('nios', 'UPDATE', dbNIO);

  const dataArray = Array.isArray(nioSuppliers) ? nioSuppliers : (nioSuppliers ? [nioSuppliers] : []);

  const results = dataArray.map((row: any) => ({
    id:row.id,
    user_id: user.id,
    status:8,
    sent_date:new Date().toISOString()
  }));


  const created = await pgQuery('nios_supplies', 'UPDATE_MANY', results);
  
  if (!result) {
    return res.status(404).json({ message: 'Nio no encontrado' });
  }

  res.json(result);
}));
app.put('/api/nios_sent_seller_true/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nioSuppliers,user } = req.body;

  const dbNIO = {
    id,
    status: 2,
    to_procurement_at: new Date().toISOString() // Genera: 2024-05-20T15:30:00.000Z
  };

  const result = await pgQuery('nios', 'UPDATE', dbNIO);

  const dataArray = Array.isArray(nioSuppliers) ? nioSuppliers : (nioSuppliers ? [nioSuppliers] : []);

  const results = dataArray.map((row: any) => ({
    id:row.id,
    user_id: user.id,
    status:2,
    sent_date:new Date().toISOString()
  }));


  const created = await pgQuery('nios_supplies', 'UPDATE_MANY', results);
  
  if (!result) {
    return res.status(404).json({ message: 'Nio no encontrado' });
  }

  res.json(result);
}));
app.put('/api/nios_finish_presupuest/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nioSuppliers,user } = req.body;

  const dbNIO = {
    id,
    status: 9,
    to_procurement_at: new Date().toISOString() // Genera: 2024-05-20T15:30:00.000Z
  };

  const result = await pgQuery('nios', 'UPDATE', dbNIO);

  const dataArray = Array.isArray(nioSuppliers) ? nioSuppliers : (nioSuppliers ? [nioSuppliers] : []);

  const results = dataArray.map((row: any) => ({
    id:row.id,
    user_id: user.id,
    status:9,
    price_individual:row.price_individual,
    quantity:row.quantity,
    sent_date:new Date().toISOString()
  }));


  const created = await pgQuery('nios_supplies', 'UPDATE_MANY', results);
  
  if (!result) {
    return res.status(404).json({ message: 'Nio no encontrado' });
  }

  res.json(result);
}));
app.put('/api/nios_finish_seller/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dbNIO = {
    id,
    status: 3,
    to_logistics_at: new Date().toISOString() // Genera: 2024-05-20T15:30:00.000Z
  };
  const result = await pgQuery('nios', 'UPDATE', dbNIO);
  if (!result) {
    return res.status(404).json({ message: 'Nio no encontrado' });
  }
  res.json(result);
}));
app.put('/api/nios_finish_logic/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dbNIO = {
    id,
    status: 4,
    to_transit_at: new Date().toISOString() // Genera: 2024-05-20T15:30:00.000Z
  };
  const result = await pgQuery('nios', 'UPDATE', dbNIO);
  if (!result) {
    return res.status(404).json({ message: 'Nio no encontrado' });
  }
  res.json(result);
}));
app.put('/api/nios_reception/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { niosReception,user } = req.body;
  let ql=parseFloat(niosReception.quantity_less)
  const dbNIO = {
    id,
    quantity_less: ql,
    reception_user_id:user,
    status:5,
    reception_date: new Date().toISOString()
  };
  const dbNIO2 = {
    id,
    quantity_less: ql,
    reception_user_id:user,
  };
  const niosSupplyUpdate = {
    id:niosReception.nios_supplies_id,
    status: 5
  };
  const niosSellUpdate = {
    id:niosReception.nios_sell_id,
    status: 5
  };
  let result = await pgQuery('nios_driver', 'UPDATE', ql>0?dbNIO2:dbNIO);
  let userR = await pgQuery('users', 'SELECT', { id: user });
  let niosR = await pgQuery('nios', 'SELECT', { id: niosReception.niosId });
  let obr = await pgQuery('projects', 'SELECT', { id: niosR.project_id });
  let chof = await pgQuery('drivers', 'SELECT', { id: niosReception.driverId });
  let suu = await pgQuery('supplies', 'SELECT', { id: niosReception.supplyId });

  if(ql==0){
      const updateNioSupply = await pgQuery('nios_supplies', 'UPDATE', niosSupplyUpdate);
      const updateNioSell = await pgQuery('nios_sells', 'UPDATE', niosSellUpdate);
  }
  if (ql !== 0) {
    const allUsers = await pgQuery('users', 'SELECT');
    const allEmails = (allUsers as any[]).map((u: any) => u.email).filter(Boolean).join(',');
    const mailOptions = {
      from: '"Sistema LogiCost" <informationapp2626@gmail.com>',
      to: allEmails,
      subject: `⚠️ Alerta de Faltante - NIO ID: ${id}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
          <h2 style="color: #e11d48;">Aviso de Faltante Registrado</h2>
          <p>Se ha registrado un faltante en la recepción de mercadería.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p><strong>Obra:</strong> ${obr.name}</p>          
          <p><strong>ID de NIO:</strong> ${id}</p>
          <p><strong>Cantidad Faltante:</strong> <span style="color: #e11d48; font-weight: bold;">${ql}</span></p>
          <p><strong>Usuario que reporta:</strong> ${userR.name}</p>
           <p><strong>Detalle:</strong> ${niosReception.detail}</p>
           <p><strong>Insumo:</strong> ${suu.detail}</p>
           <p><strong>Orden de compra:</strong> ${niosReception.oc_number}</p>
           <p><strong>Proveedor</strong> ${niosReception.supplier}</p>
           <p><strong>Cofer</strong> ${chof.name}</p>
          

          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    };// Enviamos el mail de forma asíncrona pero sin bloquear la respuesta al cliente
    transporter.sendMail(mailOptions).catch(err => console.error("Error enviando email:", err));
  }
  res.json(result);
}));
app.get('/api/nios', asyncHandler(async (_, res) => {
  const rows = await pgQuery('nios', 'SELECT_NIOS_FIRST');
  const nios = rows.map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    needDate: row.need_date,
    creationDate: row.creation_date,
    toProcurementAt: row.to_procurement_at,
    toLogisticsAt: row.to_logistics_at,
    toTransitAt: row.to_transit_at,
    completedAt: row.completed_at,
    status: row.status,
    userId: row.user_id,
    isEnable: row.is_enable
  }));
  res.json(nios);

}));
app.get('/api/nios_supplier', asyncHandler(async (_, res) => {
  const rows = await pgQuery('nios_supplies', 'SELECT_NIOS_SECOND');
  const nios_supplier = rows.map((row: any) => ({
    id: row.id,
    niosId: row.nios_id,
    supplyId: row.supplies_id,
    status: row.status,
    userId: row.user_id,
    quantity: parseFloat(row.quantity),
    price_individual: parseFloat(row.price_individual),
    accountId: row.account_id,
    detail: row.detail
  }));
  res.json(nios_supplier);

}));
app.get('/api/nios_sells', asyncHandler(async (_, res) => {
const rows = await pgQuery('nios_sells', 'SELECT_NIOS_THIRD');
  const nios_sells = rows.map((row: any) => ({
    id: row.id,
    nios_supplies_id: row.nios_supplies_id,
    user_id: row.user_id,
    creation_date: row.creation_date,
    oc_number: row.oc_number,
    price_individual: parseFloat(row.price_individual),
    supplier: row.supplier,
    detail: row.detail,
    price_total: parseFloat(row.price_total)
  }));
  res.json(nios_sells);
}));
app.get('/api/nios_driver', asyncHandler(async (_, res) => {
const rows = await pgQuery('nios_driver', 'SELECT_NIOS_FOURTH');
  const nios_driver = rows.map((row: any) => ({
    nios_drivers_id: row.id,
    nios_sells_id: row.nios_sells_id,
    user_id: row.user_id,
    driver_date: row.creation_date,
    status_transit: row.status,
    quantity_less: parseFloat(row.quantity_less),
    driver_id: row.driver_id,
    reception_date: row.reception_date,
    reception_user_id: row.reception_user_id
  }));
  res.json(nios_driver);
}));
app.get('/api/nios_completed', asyncHandler(async (_, res) => {
  const rows = await pgQuery('nios_driver', 'SELECT_NIOS_COMPLETED');
  res.json(rows);
}));
app.put('/api/nios_finish_nio/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dbNIO = {
    id,
    status: 5,
    completed_at: new Date().toISOString() // Genera: 2024-05-20T15:30:00.000Z
  };
  const result = await pgQuery('nios', 'UPDATE', dbNIO);
  if (!result) {
    return res.status(404).json({ message: 'Nio no encontrado' });
  }
  res.json(result);
}));
app.delete('/api/nios_supplier/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const nioSupply = await pgQuery('nios_supplies', 'SELECT', { id });
  if (!nioSupply) return res.status(404).json({ message: 'Insumo no encontrado' });

  const result = await pgQuery('nios_supplies', 'UPDATE', { id, is_enable: false });

  try {
    const nio      = await pgQuery('nios',     'SELECT', { id: nioSupply.nios_id });
    const project  = await pgQuery('projects', 'SELECT', { id: nio?.project_id });
    const supply   = await pgQuery('supplies', 'SELECT', { id: nioSupply.supplies_id });
    const allUsers = await pgQuery('users',    'SELECT');
    const allEmails = (allUsers as any[]).map((u: any) => u.email).filter(Boolean).join(',');

    const mailOptions = {
      from: '"Sistema LogiCost" <informationapp2626@gmail.com>',
      to: allEmails,
      subject: `🗑️ Insumo Descartado - NIO ID: ${nioSupply.nios_id} | ${project?.name ?? ''}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; max-width: 600px;">
          <h2 style="color: #dc2626;">Insumo Descartado de NIO</h2>
          <p>Se ha descartado un insumo de una Necesidad Interna de Obra. Este insumo <strong>no contará como deducción del presupuesto</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 12px 0;" />
          <p><strong>Obra:</strong> ${project?.name ?? '-'}</p>
          <p><strong>NIO ID:</strong> ${nioSupply.nios_id}</p>
          <p><strong>Insumo descartado:</strong> ${supply?.detail ?? '-'} (${supply?.code ?? '-'})</p>
          <p><strong>Cantidad descartada:</strong> <span style="color: #dc2626; font-weight: bold;">${nioSupply.quantity} ${supply?.unit ?? ''}</span></p>
          <p><strong>Detalle del pedido:</strong> ${nioSupply.detail ?? '-'}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 12px 0;" />
          <p style="color: #b45309; background: #fef3c7; padding: 10px; border-radius: 6px;">
            ⚠️ Por favor contactar a <strong>Compras</strong> para entender la razón del descarte y definir cómo proseguir con el pedido.
          </p>
        </div>
      `
    };
    transporter.sendMail(mailOptions).catch(err => console.error('Error enviando email descarte:', err));
  } catch (emailErr) {
    console.error('Error preparando email de descarte:', emailErr);
  }

  res.json({ message: 'Insumo eliminado correctamente', result });
}));

app.delete('/api/nio/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pgQuery('nios', 'UPDATE', {
    id,
    is_enable: false
  });

  if (!result) {
    return res.status(404).json({ message: 'Nio no encontrado' });
  }

  res.json({ message: 'Nio deshabilitado con éxito', user: result });
}));
/* ---------- API SUPPLIES ---------- */
app.get('/api/supplies', asyncHandler(async (_, res) => {
  const rows = await pgQuery('supplies', 'SELECT');
  const supplies = rows.map((row: any) => ({
    id: row.id,
    code: row.code,
    detail: row.detail,
    unit: row.unit,
    bestPrice: row.best_price,
    bestSupplier: row.best_supplier,
    isEnable: row.is_enable
  }));
  res.json(supplies);

}));

app.post('/api/supplies', asyncHandler(async (req, res) => {
  const supply: Supply[] = req.body;
  const dataArray = Array.isArray(supply) ? supply : (supply ? [supply] : []);

  const results = dataArray.map((row: Supply) => ({
    code: row.code,
    detail: row.detail,
    unit: row.unit
  }));

  const created = await pgQuery('supplies', 'INSERT_MANY', results);
  res.status(201).json(created);
}));

app.put('/api/supplies/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const supply: Supply = req.body;

  const dbSupply = {
    id,
    code: supply.code,
    detail: supply.detail,
    unit: supply.unit,
    is_enable: true
  };

  const result = await pgQuery('supplies', 'UPDATE', dbSupply);

  if (!result) {
    return res.status(404).json({ message: 'Insumo no encontrado' });
  }

  res.json(result);
}));
app.delete('/api/supplies/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pgQuery('supplies', 'UPDATE', {
    id,
    is_enable: false
  });

  if (!result) {
    return res.status(404).json({ message: 'Insumo no encontrado' });
  }

  res.json({ message: 'Insumo deshabilitado con éxito', user: result });
}));

/* ---------- API CHOFERES ---------- */
app.get('/api/drivers', asyncHandler(async (_, res) => {
  const rows = await pgQuery('drivers', 'SELECT');
  const drivers = rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    vehicle: row.vehicle,
    phone: row.phone,
    isEnable: row.is_enable
  }));
  res.json(drivers);

}));



app.post('/api/drivers', asyncHandler(async (req, res) => {
  const driver: Driver = req.body;

  const dbDriver = {
    name: driver.name,
    phone: driver.phone,
    vehicle: driver.vehicle
  };


  const created = await pgQuery('drivers', 'INSERT', dbDriver);
  res.status(201).json(created);
}));

app.put('/api/drivers/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driver: Driver = req.body;

  const dbDriver = {
    id,
    name: driver.name,
    phone: driver.phone,
    vehicle: driver.vehicle,
    is_enable: true
  };

  const result = await pgQuery('drivers', 'UPDATE', dbDriver);

  if (!result) {
    return res.status(404).json({ message: 'Chofer no encontrado' });
  }

  res.json(result);
}));
app.delete('/api/drivers/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pgQuery('drivers', 'UPDATE', {
    id,
    is_enable: false
  });

  if (!result) {
    return res.status(404).json({ message: 'Chofer no encontrado' });
  }

  res.json({ message: 'Chofer deshabilitado con éxito', user: result });
}));

/* ---------- API GEMINI ---------- */
app.post('/api/gemini/extract-budget', asyncHandler(async (req, res) => {
  const { file } = req.body;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Actúa como un experto en presupuestos de construcción y auditoría de costos. 
  Analiza la información proporcionada (ya sea un PDF o datos de una planilla Excel) y extrae TODA la estructura de costos.
  
  REGLAS DE EXTRACCIÓN:
  1. Identifica "accountNumber": Códigos de cuenta o índices (ej: 1.1, 01.A, etc).
  2. Identifica "name": Nombre del rubro o cuenta principal.
  3. Identifica "detail": Especificaciones técnicas o descripción del item.
  4. Identifica "cost": El monto total presupuestado. Limpia símbolos de moneda y separadores de miles.
  5. Identifica "incidence": Porcentaje de incidencia (%) de la cuenta. Si no está, calcúlalo como (costo_item / costo_total) * 100.
  
  RESTRICCIONES:
  - Solo devuelve un JSON array. No incluyas explicaciones.
  - Asegúrate de no duplicar items si hay subtotales y totales. Prioriza los items de menor nivel.
  
  Devuelve exclusivamente un JSON array de objetos con este esquema:
  [{"accountNumber": string, "name": string, "detail": string, "cost": number, "incidence": number}]`;

  const parts: any[] = [{ text: prompt }];
  if (file) parts.push({ inlineData: file });

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            accountNumber: { type: Type.STRING },
            name: { type: Type.STRING },
            detail: { type: Type.STRING },
            cost: { type: Type.NUMBER },
            incidence: { type: Type.NUMBER }
          },
          required: ['name', 'detail', 'cost']
        }
      }
    }
  });

  res.json(JSON.parse(response.text || '[]'));
}));

app.post('/api/gemini/extract-supplies', asyncHandler(async (req, res) => {
  const { file } = req.body;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Extrae la base de datos de insumos y materiales de este documento. 
  Busca:
  1. Código del insumo
  2. Detalle/Descripción del insumo (ej. Bolsa de cemento x 50kg)
  3. Unidad de medida (ej. Bolsa, kg, m3, Global)
  
  Ejemplo de unidades de medida: 
  Detalle: cemento minetti x 50 kg -> Bolsa
  Detalle: cal x 20 kg -> Bolsa
  Detalle: arena x 6 -> m3
  Detalle: ripio x 6 -> m3
  Detalle: estabilizado x 6 -> m3
  Detalle: hierro 8 mm -> barra
  
  Devuelve exclusivamente un JSON array de objetos.`;

  const parts: any[] = [{ text: prompt }];
  if (file) parts.push({ inlineData: file });

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            detail: { type: Type.STRING },
            unit: { type: Type.STRING }
          },
          required: ['code', 'detail', 'unit']
        }
      }
    }
  });

  res.json(JSON.parse(response.text || '[]'));
}));

/* ---------- API PAGOS INTANGIBLES ---------- */
app.get('/api/intangible-payments', asyncHandler(async (_, res) => {
  const rows = await pgQuery('intangible_payments', 'SELECT_INTANGIBLE_PAYMENTS');
  const dataArray = Array.isArray(rows) ? rows : [];

  const result = dataArray.map((row: any) => ({
    id: row.id,
    descripcion: row.description,
    estado: row.status,
    precio: Number(row.price),
    obraImputarId: row.project_id,
    obraImputar: row.project_name ?? '',
    cuentaImputacionId: row.cost_account_id,
    cuentaImputacion: row.cost_account_name
      ? `${row.cost_account_name} - ${row.cost_account_detail ?? ''}`
      : (row.cost_account_detail ?? ''),
    fecha: row.created_at instanceof Date
      ? row.created_at.toISOString().split('T')[0]
      : String(row.created_at ?? '').split('T')[0],
  }));

  res.json(result);
}));

app.post('/api/intangible-payments', asyncHandler(async (req, res) => {
  const { descripcion, precio, obraImputarId, cuentaImputacionId } = req.body;

  const created = await pgQuery('intangible_payments', 'INSERT', {
    description: descripcion,
    status: 'pendiente',
    price: precio,
    project_id: obraImputarId,
    cost_account_id: cuentaImputacionId,
  });

  res.status(201).json({ id: created.id });
}));

app.put('/api/intangible-payments/:id/aprobar', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const payment = await pgQuery('intangible_payments', 'SELECT', { id });
  if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });
  if (payment.status !== 'pendiente') {
    return res.status(400).json({ message: 'Solo se pueden aprobar pagos en estado pendiente' });
  }

  await pgQuery('intangible_payments', 'UPDATE', { id, status: 'aprobado' });

  await pgQuery('cost_accounts', 'UPDATE_COUNT', {
    id: payment.cost_account_id,
    column: 'spent',
    amount: Number(payment.price),
  });

  res.json({ message: 'Pago aprobado y consumo registrado en cuenta de costo' });
}));

app.put('/api/intangible-payments/:id/no-aprobar', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const payment = await pgQuery('intangible_payments', 'SELECT', { id });
  if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });
  if (payment.status !== 'pendiente') {
    return res.status(400).json({ message: 'Solo se pueden rechazar pagos en estado pendiente' });
  }

  await pgQuery('intangible_payments', 'UPDATE', { id, status: 'no_aprobado' });

  res.json({ message: 'Pago marcado como no aprobado' });
}));

app.delete('/api/intangible-payments/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const result = await pgQuery('intangible_payments', 'UPDATE', { id, is_enable: false });
  if (!result) return res.status(404).json({ message: 'Pago no encontrado' });

  res.json({ message: 'Pago eliminado con éxito' });
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
