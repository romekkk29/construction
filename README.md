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