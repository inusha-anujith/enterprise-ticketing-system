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
    timezone: 'Z', // Node side: read and write dates as UTC
});

// MySQL side: every new connection also works in UTC.
// Without this, a MySQL server set to local time (e.g. UTC+5:30) would return
// times like created_at shifted by the server's offset.
pool.pool.on('connection', (connection) => {
    connection.query("SET time_zone = '+00:00'");
});

module.exports = pool;
