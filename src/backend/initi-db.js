import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:1234asdas56@localhost:5432/asdasd';

async function setupDatabase() {
  const client = new Client({ connectionString });
  // Verificamos si se pasó el argumento --reset
  const shouldReset = process.argv.includes('--reset');

  try {
    await client.connect();
    console.log('✓ Conectado a PostgreSQL.');

    if (shouldReset) {
      console.log('--- Eliminando tablas existentes (Reset) ---');
      // Agrega aquí todas las tablas que quieras eliminar
      await client.query(`
        DROP TABLE IF EXISTS accounts CASCADE;
        DROP TABLE IF EXISTS projects CASCADE;
        DROP TABLE IF EXISTS cost_accounts CASCADE;
        DROP TABLE IF EXISTS supplies CASCADE;
        DROP TABLE IF EXISTS nios CASCADE;
        DROP TABLE IF EXISTS project_stocks CASCADE;      
        DROP TABLE IF EXISTS roles CASCADE;       
        DROP TABLE IF EXISTS permisions CASCADE;     
        DROP TABLE IF EXISTS users CASCADE;          
      `);
      console.log('✓ Tablas eliminadas.');
    }

    const sqlPath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('--- Ejecutando esquema SQL ---');
    await client.query(sql);
    console.log('✓ Base de datos lista.');

  } catch (err) {
    console.error('✗ Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();