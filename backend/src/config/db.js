const sql = require('mssql/msnodesqlv8');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const server = process.env.DB_SERVER || '.\\SQLEXPRESS';
const database = process.env.DB_DATABASE || 'AstrologyDB';
const authMode = process.env.DB_AUTH_MODE || 'WINDOWS';

let poolConfig;

if (authMode === 'SQL') {
    poolConfig = {
        server: server,
        database: database,
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || '',
        driver: 'msnodesqlv8',
        options: {
            trustedConnection: false,
            enableArithAbort: true,
            trustServerCertificate: true
        }
    };
} else {
    // Windows Authentication
    poolConfig = {
        connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;`,
        driver: 'msnodesqlv8'
    };
}

let pool = null;

async function getPool() {
    if (!pool) {
        try {
            pool = await new sql.ConnectionPool(poolConfig).connect();
            console.log(`[MSSQL] Successfully connected to database [${database}] on [${server}]`);
        } catch (err) {
            console.error('[MSSQL] Connection error, falling back to connection string:', err.message);
            // Fallback to simpler local trusted connection string if driver differs
            poolConfig = {
                connectionString: `Server=${server};Database=${database};Trusted_Connection=Yes;Driver={SQL Server};`,
                driver: 'msnodesqlv8'
            };
            pool = await new sql.ConnectionPool(poolConfig).connect();
            console.log(`[MSSQL] Connected via fallback driver to [${database}]`);
        }
    }
    return pool;
}

/**
 * Execute a stored procedure with typed parameters
 * @param {string} procedureName e.g. 'dbo.sp_RegisterUser'
 * @param {Object} params Key-value pairs of parameters
 */
async function executeProcedure(procedureName, params = {}) {
    const connection = await getPool();
    const request = connection.request();

    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) {
            request.input(key, null);
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                request.input(key, sql.Int, value);
            } else {
                request.input(key, sql.Decimal(12, 2), value);
            }
        } else if (typeof value === 'boolean') {
            request.input(key, sql.Bit, value ? 1 : 0);
        } else if (value instanceof Date) {
            request.input(key, sql.DateTime2, value);
        } else {
            request.input(key, sql.NVarChar(sql.MAX), String(value));
        }
    }

    const result = await request.execute(procedureName);
    return {
        recordset: result.recordset || [],
        recordsets: result.recordsets || [],
        returnValue: result.returnValue
    };
}

module.exports = {
    sql,
    getPool,
    executeProcedure
};
