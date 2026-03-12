import { query } from './db.js';

type Action = 'SELECT' | 'SELECT_NIOS' | 'SELECT_NIOS_COMPLETED' | 'INSERT' | 'INSERT_MANY' | 'UPDATE' | 'UPDATE_COUNT' | 'UPDATE_MANY' | 'DELETE' | 'SELECT_USERS' | 'SELECT_COST_ACCOUNT' | 'SELECT_BY_EMAIL';

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
    case 'SELECT_NIOS': {
      if (data?.id) {
        const rows = await query(
          `SELECT * FROM ${table} WHERE id = $1`,
          [data.id]
        );
        return rows[0] ?? null;
      }
      return query(`SELECT * FROM ${table} WHERE is_enable = TRUE AND status <> 5`);
    }
    case 'SELECT_NIOS_COMPLETED': {
      const sql = `
        SELECT 
          n.id AS "niosId",
          nsup.id AS "id",
          nsup.sent_date AS "sentDate",
          nsup.supplies_id AS "supplyId",
          nsup.quantity AS "quantity",
          nsup.detail AS "detail",
          nsup.account_id AS "accountId",
          ns.id AS "nios_sell_id",
          ns.oc_number AS "oc_number",
          ns.supplier AS "supplier",
          ns.price_individual AS "price_individual",
          nd.id AS "nios_drivers_id",
          nd.creation_date AS "driver_date",
          nd.quantity_less AS "quantity_less",
          nd.driver_id AS "driverId",
          nd.reception_date AS "reception_date",
          n.project_id AS "projectId",
          n.creation_date AS "creationDate",
          n.need_date AS "needDate",
          ns.creation_date AS "creation_date",
          5 AS status,
          n.is_enable AS "isEnable",
          n.user_id AS "userId",
          n.to_procurement_at AS "toProcurementAt",
          n.to_logistics_at AS "toLogisticsAt",
          n.to_transit_at AS "toTransitAt",
          n.completed_at AS "completedAt",
          CASE WHEN n.status <> 5 THEN TRUE ELSE FALSE END AS partial
        FROM nios_driver nd
        INNER JOIN nios_sells ns ON nd.nios_sells_id = ns.id
        INNER JOIN nios_supplies nsup ON ns.nios_supplies_id = nsup.id
        INNER JOIN nios n ON nsup.nios_id = n.id
        WHERE nd.status = 5 
          AND nd.is_enable = TRUE
          AND nd.reception_date >= NOW() - INTERVAL '30 days'
        GROUP BY n.id, n.project_id, n.creation_date, n.need_date, n.status, 
                n.is_enable, n.user_id, n.to_procurement_at, n.to_logistics_at, 
                n.to_transit_at, n.completed_at,nsup.id,ns.id,nd.id
      `;
      return await query(sql);
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
    case 'UPDATE_COUNT': {
      const { id, column, amount } = data; 
      // column: el nombre del campo (ej. 'stock')
      // amount: la cantidad a sumar (ej. 20)

      const sql = `
        UPDATE ${table}
        SET ${column} = ${column} + $1
        WHERE id = $2
        RETURNING *
      `;

      const rows = await query(sql, [amount, id]);
      return rows[0];
    }
    case 'UPDATE_MANY': {
      if (!Array.isArray(data) || data.length === 0) return [];

      const keys = Object.keys(data[0]).filter(k => k !== 'id');
      const allKeys = ['id', ...keys];

      const valuesClause = data.map((obj, rowIndex) => {
        // Calculamos el inicio de los parámetros para esta fila
        const rowOffset = rowIndex * allKeys.length;

        const placeholders = allKeys.map((key, i) => {
          let p = `$${rowOffset + i + 1}`;
          
          // IMPORTANTE: Aplicar cast SIEMPRE en la primera fila para definir la columna
          if (rowIndex === 0) {
            if (key === 'id' || key.endsWith('_id') || key === 'status') {
              p += '::integer';
            } else if (key.endsWith('_date') || key.endsWith('_at')) {
              p += '::timestamptz';
            } else if (typeof obj[key] === 'number') {
              p += '::float'; // O ::numeric según necesites
            }
          }
          return p;
        });

        return `(${placeholders.join(', ')})`;
      }).join(', ');

      const setClause = keys
        .map(k => `${k} = v.${k}`)
        .join(', ');

      const sql = `
        UPDATE ${table} AS t
        SET ${setClause}
        FROM (VALUES ${valuesClause}) AS v(${allKeys.join(', ')})
        WHERE t.id = v.id
        RETURNING t.*;
      `;

      // Asegúrate de que flatValues siga el orden exacto de allKeys
      const flatValues = data.flatMap(obj => allKeys.map(k => obj[k]));
      
      const rows = await query(sql, flatValues);
      return rows;
    }
    case 'DELETE': {
      await query(`DELETE FROM ${table} WHERE id = $1`, [data.id]);
      return true;
    }
    case 'SELECT_BY_EMAIL': {
      const rows = await query(`SELECT * FROM users WHERE email = $1 AND is_enable = TRUE`, [data.email]);
      return rows ?? null;
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
          WHERE c.project_id = $1 and c.is_enable = TRUE
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
