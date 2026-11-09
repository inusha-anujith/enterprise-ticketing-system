// app.js
// Builds the Express app (middleware + routes) but does NOT start listening.
// Keeping this separate from server.js lets tests import the app without opening a port.
const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Only the frontend URLs listed in CORS_ORIGIN may call this API from a browser
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// Quick check that the API and database are up (useful for hosting platforms too)
app.get('/api/health', async (req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
});

app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);

// These must come AFTER the routes
app.use(notFound);
app.use(errorHandler);

module.exports = app;
