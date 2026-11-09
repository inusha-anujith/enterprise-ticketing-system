// config/db.js
// A connection POOL keeps a few MySQL connections open and lends one out per query.
// Compared with a single connection:
//   - several requests can run queries at the same time
//   - a dropped connection is replaced automatically instead of crashing the app
const mysql = require('mysql2/promise');
const config = require('./index');

const pool = mysql.createPool({
    ...config.db,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z', // treat DATETIME values as UTC
});

module.exports = pool;
