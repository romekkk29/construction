<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1AgxVTsYvAfZwlnl8OLPoWmoG8c9uQmtE

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

server {
    listen 80;
    # Reemplaza con tu nuevo subdominio de DuckDNS
    server_name logicost.duckdns.org; 

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Instala el servidor si no lo tienes
npm install -g serve

# Ve a la carpeta de tu proyecto
cd /ruta/de/tu/proyecto

# Construye el proyecto (esto genera la carpeta dist)
npm run build

# Lánzalo con PM2 apuntando a la carpeta dist
pm2 start serve --name "logicost-app" -- -s dist -l 4000


# Crea el enlace simbólico (si es un archivo nuevo)
sudo ln -s /etc/nginx/sites-available/logicost /etc/nginx/sites-enabled/

# Verifica que no haya errores de sintaxis
sudo nginx -t

# Reinicia Nginx
sudo systemctl restart nginx


npx ts-node src/backend/server.ts
npm install -D ts-node typescript @types/node

rm -rf build
npx tsc -p tsconfig.server.json
node build/backend/server.js


sudo apt update
sudo apt install postgresql postgresql-contrib -y

sudo -i -u postgres psql

3. Crear Base de Datos y Usuario
Dentro de la consola de Postgres (psql), ejecuta los siguientes comandos. Importante: Usa los mismos datos que tienes en tu archivo .env para que no tengas que cambiar la lógica de tu app.

SQL
-- Crear la base de datos
CREATE DATABASE "ApoloSur";

-- Crear el usuario con la contraseña que usas en Windows
CREATE USER apolo WITH PASSWORD '123456';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE "ApoloSur" TO apolo;

-- Salir de la consola
\q
4. Configurar el acceso remoto (Opcional pero común)
Si tu servidor de Node.js está en la misma máquina que el Postgres de Ubuntu, puedes saltar al paso 5. Si te vas a conectar desde afuera, debes habilitar la escucha:

Editar postgresql.conf:

Bash
sudo nano /etc/postgresql/14/main/postgresql.conf
(Nota: La versión 14 puede variar. Si no la encuentras, usa ls /etc/postgresql/ para ver la tuya). Busca la línea #listen_addresses = 'localhost' y cámbiala por: listen_addresses = '*'

Editar pg_hba.conf:

Bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
Al final del archivo, agrega esta línea para permitir conexiones desde cualquier IP (o especifica la IP de tu servidor Node): host all all 0.0.0.0/0 md5

Reiniciar el servicio:

Bash
sudo systemctl restart postgresql
5. Ajustar el Firewall (UFW)
Ubuntu suele tener el firewall activo. Debes abrir el puerto 5432:

Bash
sudo ufw allow 5432/tcp
Resumen de tu nueva configuración
Ahora, en tu servidor Ubuntu, tu cadena de conexión en el archivo .env de Node.js debería verse así:

Si Node corre en el mismo servidor: DATABASE_URL=postgresql://apolo:123456@localhost:5432/ApoloSur

Si conectas desde otra PC: DATABASE_URL=postgresql://postgres:123456@IP_DE_TU_SERVER:5432/ApoloSur

Tip de experto: Si ya tienes datos en tu base de datos de Windows, puedes exportarlos usando el comando pg_dump en Windows e importarlos en Ubuntu con psql -U postgres -d ApoloSur < backup.sql.