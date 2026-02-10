import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { pgQuery } from './pgQuery.js';
import { Project, NIO, Supply, User, CostAccount, Driver } from './types.js';
import passport, { use } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cookieSession from 'cookie-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4001;

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
        console.log(email)
        // Buscamos en tu DB usando tu función pgQuery
        const users = await pgQuery('users', 'SELECT_BY_EMAIL', {email});
        console.log(users)
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
  const { id } = req.params;
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
