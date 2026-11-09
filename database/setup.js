// database/setup.js
// Creates the database (if needed) and runs schema.sql.  Usage: npm run db:setup
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

const setup = async () => {
    const { database, ...connectionOptions } = config.db;

    // Connect WITHOUT choosing a database, because it may not exist yet
    const connection = await mysql.createConnection({ ...connectionOptions, multipleStatements: true });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await connection.query(`USE \`${database}\``);

        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await connection.query(schema);

        console.log(`✅ Database "${database}" is ready`);
    } finally {
        await connection.end();
    }
};

setup().catch((err) => {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
});
