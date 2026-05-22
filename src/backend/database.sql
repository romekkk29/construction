-- Tabla de Roles (Roles)
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_enable BOOLEAN DEFAULT TRUE
);
-- Tabla de Permisos (Permisions)
CREATE TABLE IF NOT EXISTS permisions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    is_enable BOOLEAN DEFAULT TRUE
);

INSERT INTO roles (name)
VALUES
 ('Administrador'),
 ('Gerente de obra'),
 ('Jefe de obra'),
 ('Gerente de Cómputo y presupuesto'),
 ('Gerente de Compras'),
 ('Área Compras'),
 ('Visualizadores');

-- Tabla de Usuarios (Usuarios)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    last_name TEXT,
    google_id TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    is_enable BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO users (name,last_name,role_id,email)
VALUES
 ('Romeo','',1,'romegomez29@gmail.com'),
 ('Ricardo','Ozcoidi',4,'ricardo@constructuraapolosur.com'),
 ('Germán','Gatica',1,'ggatica@constructoraapolosur.com'),
 ('Mauro','Ponchietti',2,'mauroponchietti@constructoraapolosur.com'),
 ('Martina','Andia',3,'mandia@constructoraapolosur.com'),
 ('Brenda','Escudero',3,'bescudero@constructoraapolosur.com'),
 ('Javier','Dominguez',3,'jdominguez@constructoraspolosur.com'),
 ('Cecilia','Lombardi',5,'clombardi@constructoraapolosur.com'),
 ('Equipo','Compras',6,'compras@constructoraapolosur.com'),
 ('Edgardo','Fariello',2,'efariello@constructoraapolosur.com');

-- Tabla de Proyectos (Actualizada)
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    address TEXT,
    start_date DATE,
    duration_days INTEGER,
    -- Cambiamos TEXT por INTEGER para las llaves foráneas
    project_manager_id INTEGER NOT NULL,
    general_manager_id INTEGER NOT NULL,
    client TEXT,
    inspector TEXT,
    stock_balance NUMERIC(15, 2) DEFAULT 0,
    is_enable BOOLEAN DEFAULT TRUE,

    -- Llaves Foráneas
    CONSTRAINT fk_project_manager FOREIGN KEY (project_manager_id) REFERENCES users(id),
    CONSTRAINT fk_general_manager FOREIGN KEY (general_manager_id) REFERENCES users(id)
);

-- Tabla de Cuentas de Costo (Desglose del presupuesto)
CREATE TABLE IF NOT EXISTS cost_accounts (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    account_number TEXT,
    name TEXT,
    detail TEXT,
    budgeted NUMERIC(15, 2) DEFAULT 0,
    spent NUMERIC(15, 2) DEFAULT 0,
    is_enable BOOLEAN DEFAULT TRUE 
);

CREATE TABLE IF NOT EXISTS infla (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    percentage TEXT,
    project_id INTEGER REFERENCES projects(id)
);
-- Tabla de Insumos / Suministros (Maestro de materiales)
CREATE TABLE IF NOT EXISTS supplies (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    detail TEXT,
    best_price NUMERIC(15, 2),
    best_supplier TEXT,
    unit TEXT,
    is_enable BOOLEAN DEFAULT TRUE 
);
-- Tabla de Choferes
CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    vehicle TEXT,
    phone BIGINT,
    is_enable BOOLEAN DEFAULT TRUE 
);
-- Tabla de NIOs (Necesidad Interna de Obra)
CREATE TABLE IF NOT EXISTS nios (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    to_procurement_at TIMESTAMP WITH TIME ZONE,
    to_logistics_at TIMESTAMP WITH TIME ZONE,
    to_transit_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    need_date TIMESTAMP WITH TIME ZONE,
    status INTEGER NOT NULL DEFAULT 1,
    is_enable BOOLEAN DEFAULT TRUE,
    user_id INTEGER REFERENCES users(id)
);
-- Tabla de NIOs (Necesidad Interna de Obra)
CREATE TABLE IF NOT EXISTS nios_supplies (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nios_id INTEGER REFERENCES nios(id),
    user_id INTEGER REFERENCES users(id),
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    price_individual NUMERIC(12, 2),
    supplies_id INTEGER REFERENCES supplies(id),
    quantity NUMERIC(12, 2),
    detail  TEXT,
    status INTEGER NOT NULL DEFAULT 1,
    is_enable BOOLEAN DEFAULT TRUE,
    account_id INTEGER REFERENCES cost_accounts(id)
);
-- Tabla de NIOs (Necesidad Interna de Obra)
CREATE TABLE IF NOT EXISTS nios_defect (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nios_id INTEGER REFERENCES nios(id),
    user_id INTEGER REFERENCES users(id),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nios_supplies_id INTEGER REFERENCES nios_supplies(id),
    quantity_bad NUMERIC(12, 2),
    quantity_distinct NUMERIC(12, 2),
    quantity_recived NUMERIC(12, 2),
    quantity_less NUMERIC(12, 2),
    detail  TEXT,
    status INTEGER NOT NULL DEFAULT 1,
    is_enable BOOLEAN DEFAULT TRUE
);
-- Tabla de NIOs (Necesidad Interna de Obra)
CREATE TABLE IF NOT EXISTS nios_sells (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nios_supplies_id INTEGER REFERENCES nios_supplies(id),
    user_id INTEGER REFERENCES users(id),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status INTEGER NOT NULL DEFAULT 1,
    oc_number TEXT NOT NULL,
    supplier  TEXT NOT NULL,
    price_individual NUMERIC(15, 2),
    is_enable BOOLEAN DEFAULT TRUE,
    price_total NUMERIC(15, 2) 
);
CREATE TABLE IF NOT EXISTS nios_driver (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nios_sells_id INTEGER REFERENCES nios_sells(id),
    user_id INTEGER REFERENCES users(id),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status INTEGER NOT NULL DEFAULT 1,
    driver_id INTEGER REFERENCES drivers(id),
    reception_user_id INTEGER REFERENCES users(id),
    reception_date TIMESTAMP WITH TIME ZONE,
    is_enable BOOLEAN DEFAULT TRUE,
    quantity_less NUMERIC(12, 2)
);
-- Tabla de Stock por Obra
CREATE TABLE IF NOT EXISTS project_stocks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    supply_id INTEGER REFERENCES supplies(id),
    quantity NUMERIC(12, 2),
    unit TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_enable BOOLEAN DEFAULT TRUE 
);


CREATE TABLE IF NOT EXISTS cost_accounts_defect (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER REFERENCES cost_accounts(id),
    nios_defect_id INTEGER REFERENCES nios_defect(id),
    price NUMERIC(15, 2) DEFAULT 0,
    quantity NUMERIC(15, 2) DEFAULT 0,
    key TEXT,
    credit_order TEXT,
    is_enable BOOLEAN DEFAULT TRUE 
);

-- Tabla de Pagos de Intangibles
CREATE TABLE IF NOT EXISTS intangible_payments (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente',
    price NUMERIC(15, 2) NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    cost_account_id INTEGER REFERENCES cost_accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_enable BOOLEAN DEFAULT TRUE
);

-- Índices para optimización de búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_nios_project ON nios(project_id);
CREATE INDEX IF NOT EXISTS idx_accounts_project ON cost_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_nios_status ON nios(status);
CREATE INDEX IF NOT EXISTS idx_intangible_payments_project ON intangible_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_intangible_payments_status ON intangible_payments(status);