// server.js
// Entry point: checks the database, starts the HTTP server and the SLA engine.
const app = require('./app');
const config = require('./config');
const db = require('./config/db');
const { startSlaEngine } = require('./services/slaService');

const start = async () => {
    try {
        await db.query('SELECT 1');
        console.log('✅ Connected to MySQL');
    } catch (err) {
        // Fail fast: there's no point running an API that can't reach its database
        console.error('❌ Could not connect to MySQL:', err.message);
        process.exit(1);
    }

    app.listen(config.port, () => {
        console.log(`🚀 API running on http://localhost:${config.port}`);
    });

    if (config.sla.enabled) {
        startSlaEngine();
    }
};

start();
