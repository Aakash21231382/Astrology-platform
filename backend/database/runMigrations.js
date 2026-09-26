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

const masterFile = 'all_in_one_database.sql';

let authArgs = '-E'; // Windows Auth default
if (authMode === 'SQL' && user && password) {
    authArgs = `-U "${user}" -P "${password}"`;
}

try {
    // 1. Ensure database exists
    console.log(`[1/2] Verifying database [${database}] exists...`);
    execSync(`sqlcmd -S "${server}" ${authArgs} -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${database}') CREATE DATABASE [${database}];" -b`, {
        stdio: 'inherit'
    });

    // 2. Run master all-in-one database file
    const filePath = path.join(__dirname, masterFile);
    if (!fs.existsSync(filePath)) {
        console.error(`Missing migration file: ${filePath}`);
        process.exit(1);
    }

    console.log(`[2/2] Executing master database script ${masterFile}...`);
    execSync(`sqlcmd -S "${server}" ${authArgs} -d "${database}" -i "${filePath}" -b`, {
        stdio: 'inherit'
    });
    console.log(`  -> Successfully executed ${masterFile}`);

    console.log(`====================================================`);
    console.log(`All migrations & stored procedures created successfully!`);
    console.log(`====================================================`);
} catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
}
