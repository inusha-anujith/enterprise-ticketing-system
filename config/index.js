// config/index.js
// Every setting comes from environment variables (.env locally, the host's dashboard in production).
// This is the only file that reads process.env, so all settings live in one place.
require('dotenv').config({ quiet: true });

const toInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const config = {
    env: process.env.NODE_ENV || 'development',
    port: toInt(process.env.PORT, 3000),

    // Comma-separated list of frontend URLs allowed to call this API
    corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim()),

    db: {
        host: process.env.DB_HOST || 'localhost',
        port: toInt(process.env.DB_PORT, 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'apexdesk',
        // Most cloud MySQL providers require SSL
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    },

    // How many minutes a ticket can wait before it breaches its SLA, by priority
    sla: {
        minutes: {
            Urgent: toInt(process.env.SLA_URGENT_MINUTES, 30),
            High: toInt(process.env.SLA_HIGH_MINUTES, 60),
            Normal: toInt(process.env.SLA_NORMAL_MINUTES, 240),
            Low: toInt(process.env.SLA_LOW_MINUTES, 1440),
        },
        cronSchedule: process.env.SLA_CRON || '* * * * *', // every minute
        enabled: process.env.SLA_ENGINE_ENABLED !== 'false',
    },
};

module.exports = config;
