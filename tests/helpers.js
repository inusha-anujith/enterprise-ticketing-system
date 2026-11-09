// tests/helpers.js
const request = require('supertest');
const app = require('../app');
const { setupDatabase } = require('../database/setup');
const { seed, DEMO_PASSWORD } = require('../database/seed');

// Fresh tables + the same demo data before every test file
const resetDatabase = async () => {
    await setupDatabase();
    await seed();
};

// Logs in through the real API and returns the JWT
const loginAs = async (email) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: DEMO_PASSWORD });
    if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status}`);
    return res.body.token;
};

// Demo accounts from database/seed.js. Customers are seeded first, so Kasun is id 1.
const USERS = {
    customer: 'customer@apexdesk.dev', // Kasun, id 1
    otherCustomer: 'dilini@apexdesk.dev', // Dilini, id 2
    agent: 'agent@apexdesk.dev', // Amaya, id 3
    otherAgent: 'ravi@apexdesk.dev', // Ravi, id 4
    admin: 'admin@apexdesk.dev', // id 5
};

module.exports = { request, app, resetDatabase, loginAs, USERS };
