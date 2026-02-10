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
 ('Área Compras');

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
    account_id INTEGER REFERENCES cost_accounts(id),
    supply_id INTEGER REFERENCES supplies(id),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    need_date TIMESTAMP WITH TIME ZONE,
    supply_manual TEXT,
    unit TEXT,
    quantity NUMERIC(12, 4),
    status TEXT NOT NULL,
    is_enable BOOLEAN DEFAULT TRUE,
    
    -- Detalles de Compra
    procurement_date TIMESTAMP WITH TIME ZONE,
    supplier TEXT,
    oc_number TEXT,
    purchase_price NUMERIC(15, 2),

    -- Detalles de Logística
    driver TEXT,
    logistics_date TIMESTAMP WITH TIME ZONE,
    delivered_quantity NUMERIC(12, 4),
    
    -- Timestamps de Trazabilidad
    to_procurement_at TIMESTAMP WITH TIME ZONE,
    to_logistics_at TIMESTAMP WITH TIME ZONE,
    to_transit_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de Stock por Obra
CREATE TABLE IF NOT EXISTS project_stocks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    supply_id INTEGER REFERENCES supplies(id),
    quantity NUMERIC(12, 4),
    unit TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_enable BOOLEAN DEFAULT TRUE 
);

-- Índices para optimización de búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_nios_project ON nios(project_id);
CREATE INDEX IF NOT EXISTS idx_accounts_project ON cost_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_nios_status ON nios(status);