const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const server = process.env.DB_SERVER || '.\\SQLEXPRESS';
const database = process.env.DB_DATABASE || 'AstrologyDB';
const authMode = process.env.DB_AUTH_MODE || 'WINDOWS'; // 'WINDOWS' or 'SQL'
const user = process.env.DB_USER || 'sa';
const password = process.env.DB_PASSWORD || '';

console.log(`====================================================`);
console.log(`Running AstrologyDB Migrations on MSSQL (${server})`);
console.log(`====================================================`);

const files = [
    '01_schema.sql',
    '02_stored_procedures.sql',
    '03_seed_data.sql',
    '04_expert_signup_fields.sql',
    '05_admin_expert_enhancements.sql',
    '06_optional_banner_text.sql',
    '07_expert_dashboard_delete_and_auth.sql'
];

let authArgs = '-E'; // Windows Auth default
if (authMode === 'SQL' && user && password) {
    authArgs = `-U "${user}" -P "${password}"`;
}

try {
    // 1. Ensure database exists
    console.log(`[1/4] Verifying database [${database}] exists...`);
    execSync(`sqlcmd -S "${server}" ${authArgs} -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${database}') CREATE DATABASE [${database}];" -b`, {
        stdio: 'inherit'
    });

    // 2. Run files sequentially
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            console.error(`Missing migration file: ${filePath}`);
            process.exit(1);
        }

        console.log(`[${i + 2}/4] Executing ${file}...`);
        execSync(`sqlcmd -S "${server}" ${authArgs} -d "${database}" -i "${filePath}" -b`, {
            stdio: 'inherit'
        });
        console.log(`  -> Successfully executed ${file}`);
    }

    console.log(`====================================================`);
    console.log(`All migrations & stored procedures created successfully!`);
    console.log(`====================================================`);
} catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
}
