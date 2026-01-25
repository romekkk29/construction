import { Pool } from 'pg';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no definida');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  const start = Date.now();
  const res = await pool.query(sql, params);
  const duration = Date.now() - start;

  console.log(
    `%c[PG] %c${sql} %c(${duration}ms)`,
    'color:#336791;font-weight:bold',
    'color:#94a3b8',
    'color:#22c55e'
  );

  return res.rows;
};
