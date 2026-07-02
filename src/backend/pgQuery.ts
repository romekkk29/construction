import { query } from './db.js';

type Action =  'SELECT_DASHBOARD' | 'SELECT_NIO_DEFECT' | 'SELECT_NIO_DEFECT_COST' | 'SELECT' | 'SELECT_NIOS_FOURTH'| 'SELECT_NIOS_THIRD' | 'SELECT_NIOS' | 'SELECT_NIOS_SECOND' | 'SELECT_NIOS_FIRST' | 'SELECT_NIOS_COMPLETED' | 'INSERT' | 'INSERT_MANY' | 'UPDATE' | 'UPDATE_COUNT' | 'UPDATE_MANY' | 'DELETE' | 'SELECT_USERS' | 'SELECT_COST_ACCOUNT' | 'SELECT_BY_EMAIL' | 'SELECT_INTANGIBLE_PAYMENTS' | 'SELECT_INFLA';

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
    case 'SELECT_DASHBOARD': {
      // 1. Obtenemos datos de proyectos: Presupuesto vs Consumido
      const projectStats = await query(`
        SELECT 
          p.id, 
          p.name,
          COALESCE(SUM(ca.budgeted), 0) AS total_budgeted,
          COALESCE(SUM(ca.spent), 0) AS total_spent
        FROM projects p
        LEFT JOIN cost_accounts ca ON p.id = ca.project_id AND ca.is_enable = TRUE
        WHERE p.is_enable = TRUE
        GROUP BY p.id, p.name
        ORDER BY p.name ASC
      `);

      // 2. Obtenemos el conteo de NIOs agrupados por su estado
      const nioStats = await query(`
          SELECT 
            n.status, 
            COUNT(n.id) AS count 
          FROM nios n
          INNER JOIN projects p ON n.project_id = p.id
          WHERE n.is_enable = TRUE 
            AND p.is_enable = TRUE
          GROUP BY n.status
      `);

      // 3. Calculamos totales rápidos para las tarjetas
      // Filtramos los que no sean status 5 (Completado)
      const pendingNios = nioStats
        .filter((n: any) => n.status !== 5)
        .reduce((acc: number, curr: any) => acc + parseInt(curr.count), 0);

      return {
        projects: projectStats, // Array para el BarChart
        niosByStatus: nioStats,  // Array para el PieChart
        stats: {
          activeProjects: projectStats.length,
          pendingNios: pendingNios,
          consolidatedStock: 0 // Según tu pedido, queda en 0
        }
      };
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
    case 'SELECT_NIOS_FIRST': {
      if (data?.id) {
        const rows = await query(
          `SELECT * FROM ${table} WHERE id = $1`,
          [data.id]
        );
        return rows[0] ?? null;
      }
      return query(`SELECT n.* 
                  FROM nios n
                  INNER JOIN projects p ON n.project_id = p.id
                  WHERE n.is_enable = TRUE 
                    AND p.is_enable = TRUE 
                    AND (
                      n.status <> 5
                      OR EXISTS (
                        SELECT 1 FROM nios_supplies ns
                        WHERE ns.nios_id = n.id
                          AND ns.is_enable = TRUE
                          AND ns.status <> 5
                      )
                    )`);
    }
    case 'SELECT_NIO_DEFECT': {
      return query(`SELECT 
            nd.id AS defect_id,
            nd.created_date,
            nd.quantity_bad,
            nd.quantity_distinct,
            nd.quantity_recived,
            nd.quantity_less,
            nd.detail AS defect_detail,
            nd.status AS defect_status,

            u.id AS user_id,
            u.role_id,
            u.name,
            u.last_name,
            u.email,

            n.*,

            ns.id AS nios_supplies_id,
            ns.supplies_id,
            ns.quantity,
            ns.detail AS supply_detail,
            ns.account_id,

            s.id AS supply_id,
            s.code,
            s.detail AS supply_name,
            s.unit,
            s.best_price,
            s.best_supplier,

            nsell.id AS sell_id,
            nsell.oc_number,
            nsell.supplier,
            nsell.price_individual,
            nsell.price_total,
            nsell.status AS sell_status,
            nsell.creation_date AS sell_date

          FROM nios_defect nd

          LEFT JOIN users u 
            ON nd.user_id = u.id

          LEFT JOIN nios n 
            ON nd.nios_id = n.id

          LEFT JOIN nios_supplies ns 
            ON nd.nios_supplies_id = ns.id

          LEFT JOIN supplies s 
            ON ns.supplies_id = s.id

          LEFT JOIN nios_sells nsell 
            ON ns.id = nsell.nios_supplies_id

          WHERE nd.is_enable = TRUE

          ORDER BY nd.created_date DESC

          LIMIT $1 OFFSET $2;`, [data.limit, data.offset]);
    }
    case 'SELECT_NIO_DEFECT_COST': {
      return query(`SELECT 
          *
          FROM cost_accounts_defect nd
          WHERE nd.is_enable = TRUE
          and nios_defect_id = $1
          ;`, [data.id]);
    }
    case 'SELECT_NIOS_SECOND': {
      if (data?.id) {
        const rows = await query(
          `SELECT * FROM ${table} WHERE id = $1`,
          [data.id]
        );
        return rows[0] ?? null;
      }
      return query(`SELECT n.* 
                  FROM nios_supplies n
                  INNER JOIN nios ni ON ni.id = n.nios_id
                  INNER JOIN projects p ON ni.project_id = p.id
                  WHERE n.is_enable = TRUE 
                    AND p.is_enable = TRUE 
                    AND n.status <> 5`);
    }
    case 'SELECT_NIOS_THIRD': {
      if (data?.id) {
        const rows = await query(
          `SELECT * FROM ${table} WHERE id = $1`,
          [data.id]
        );
        return rows[0] ?? null;
      }
      return query(`SELECT n.* 
                  FROM nios_sells n
                  INNER JOIN nios_supplies ne ON n.nios_supplies_id = ne.id
                  INNER JOIN nios ni ON ni.id = ne.nios_id
                  INNER JOIN projects p ON ni.project_id = p.id
                  WHERE n.is_enable = TRUE 
                    AND p.is_enable = TRUE 
                    AND n.status <> 5`);
    }
    case 'SELECT_NIOS_FOURTH': {
      if (data?.id) {
        const rows = await query(
          `SELECT * FROM ${table} WHERE id = $1`,
          [data.id]
        );
        return rows[0] ?? null;
      }
      return query(`SELECT n.* 
                  FROM  nios_driver n
                  INNER JOIN nios_sells na ON n.nios_sells_id = na.id
                  INNER JOIN nios_supplies ne ON na.nios_supplies_id = ne.id
                  INNER JOIN nios ni ON ni.id = ne.nios_id
                  INNER JOIN projects p ON ni.project_id = p.id
                  WHERE n.is_enable = TRUE 
                    AND p.is_enable = TRUE 
                    AND n.status <> 5`);
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
        INNER JOIN projects p ON n.project_id = p.id 
        WHERE nd.status = 5 
          AND nd.is_enable = TRUE
          AND p.is_enable = TRUE
          AND nd.reception_date >= NOW() - INTERVAL '90 days'
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
    case 'SELECT_INTANGIBLE_PAYMENTS': {
      return query(`
        SELECT
          ip.id,
          ip.description,
          ip.status,
          ip.price,
          ip.project_id,
          ip.cost_account_id,
          ip.created_at,
          p.name  AS project_name,
          ca.name AS cost_account_name,
          ca.detail AS cost_account_detail
        FROM intangible_payments ip
        LEFT JOIN projects      p  ON ip.project_id      = p.id
        LEFT JOIN cost_accounts ca ON ip.cost_account_id = ca.id
        WHERE ip.is_enable = TRUE
        ORDER BY ip.created_at DESC
      `);
    }
    case 'SELECT_INFLA': {
      return query(`
        SELECT
          i.id,
          i.creation_date,
          i.percentage,
          i.project_id,
          u.name,
          u.last_name
        FROM infla i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.project_id = $1
        ORDER BY i.creation_date DESC
      `, [data.project_id]);
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
