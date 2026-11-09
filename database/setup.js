// database/setup.js
// Creates the database (if needed) and runs schema.sql.  Usage: npm run db:setup
// The tests also call setupDatabase() to start every test file from a clean database.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

const setupDatabase = async () => {
    const { database, ...connectionOptions } = config.db;

    // Connect WITHOUT choosing a database, because it may not exist yet
    const connection = await mysql.createConnection({ ...connectionOptions, multipleStatements: true });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await connection.query(`USE \`${database}\``);

        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await connection.query(schema);
    } finally {
        await connection.end();
    }
};

// Only run when started from the command line (node database/setup.js), not when imported
if (require.main === module) {
    setupDatabase()
        .then(() => console.log(`✅ Database "${config.db.database}" is ready`))
        .catch((err) => {
            console.error('❌ Database setup failed:', err.message);
            process.exit(1);
        });
}

module.exports = { setupDatabase };
