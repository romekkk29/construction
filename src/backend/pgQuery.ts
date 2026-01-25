import { query } from './db.js';

type Action = 'SELECT' | 'INSERT' | 'INSERT_MANY' | 'UPDATE' | 'DELETE' | 'SELECT_USERS' | 'SELECT_COST_ACCOUNT';

export const pgQuery = async (
  table: string,
  action: Action,
  data?: any
) => {
  switch (action) {
    case 'SELECT': {
      if (data?.id) {
        const rows = await query(
          `SELECT * FROM ${table} WHERE id = $1`,
          [data.id]
        );
        return rows[0] ?? null;
      }
      return query(`SELECT * FROM ${table} WHERE is_enable = TRUE`);
    }

    case 'INSERT': {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');

      const sql = `
        INSERT INTO ${table} (${keys.join(',')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const rows = await query(sql, values);
      return rows[0];
    }

    case 'INSERT_MANY': {
      if (!Array.isArray(data) || data.length === 0) return [];

      const keys = Object.keys(data[0]); // Tomamos las llaves del primer objeto
      const values: any[] = [];
      
      // Construimos los placeholders: ($1, $2, $3), ($4, $5, $6)...
      const placeholders = data.map((obj, rowIndex) => {
        const rowPlaceholders = keys.map((_, colIndex) => {
          values.push(obj[keys[colIndex]]); // Metemos el valor en el orden correcto
          return `$${(rowIndex * keys.length) + (colIndex + 1)}`;
        });
        return `(${rowPlaceholders.join(',')})`;
      }).join(',');

      const sql = `
        INSERT INTO ${table} (${keys.join(',')})
        VALUES ${placeholders}
        RETURNING *
      `;

      return await query(sql, values);
    }

    case 'UPDATE': {
      const { id, ...fields } = data;
      const keys = Object.keys(fields);
      const values = Object.values(fields);

      const setClause = keys
        .map((k, i) => `${k} = $${i + 1}`)
        .join(',');

      const sql = `
        UPDATE ${table}
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        RETURNING *
      `;

      const rows = await query(sql, [...values, id]);
      return rows[0];
    }

    case 'DELETE': {
      await query(`DELETE FROM ${table} WHERE id = $1`, [data.id]);
      return true;
    }

    case 'SELECT_USERS': {
      if (data?.id) {
        const rows = await query(
          `
          SELECT
            u.id,
            u.name,
            u.last_name,
            u.email,
            u.is_enable,
            r.id   AS role_id,
            r.name AS role_name
          FROM users u
          JOIN roles r ON r.id = u.role_id
          WHERE u.id = $1
          `,
          [data.id]
        );

        return rows[0] ?? null;
      }

      return query(`
        SELECT
          u.id,
          u.name,
          u.last_name,
          u.email,
          u.is_enable,
          r.id   AS role_id,
          r.name AS role_name
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.is_enable = TRUE
      `);
    }

    case 'SELECT_COST_ACCOUNT': {
      if (data?.id) {
        const rows = await query(
          `
          SELECT
            c.id,
            c.project_id,
            c.account_number,
            c.name,
            c.detail,
            c.budgeted,
            c.spent,
            c.is_enable
          FROM cost_accounts c
          WHERE c.project_id = $1
          `,
          [data.id]
        );

        return rows ?? null;
      }

      return query(`
        SELECT
          c.id,
          c.project_id,
          c.account_number,
          c.name,
          c.detail,
          c.budgeted,
          c.spent,
          c.is_enable
        FROM cost_accounts c
        WHERE c.is_enable = TRUE
      `);
    }
  }
};
