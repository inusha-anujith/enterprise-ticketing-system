// tests/auth.test.js
const db = require('../config/db');
const { request, app, resetDatabase, loginAs, USERS } = require('./helpers');

beforeAll(resetDatabase);
afterAll(() => db.end());

describe('POST /api/auth/register', () => {
    it('creates a customer account and returns a token', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Nimal Bandara', email: 'Nimal@Example.com', password: 'secret123' });

        expect(res.status).toBe(201);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.user).toMatchObject({ email: 'nimal@example.com', role: 'customer' });
        expect(res.body.user.password_hash).toBeUndefined();
    });

    it('stores a bcrypt hash, never the plain password', async () => {
        const [[row]] = await db.query("SELECT password_hash FROM users WHERE email = 'nimal@example.com'");
        expect(row.password_hash).not.toBe('secret123');
        expect(row.password_hash).toMatch(/^\$2[aby]\$10\$/);
    });

    it('ignores a role sent by the client, so nobody can register as admin', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Sneaky', email: 'sneaky@example.com', password: 'secret123', role: 'admin' });

        expect(res.status).toBe(201);
        expect(res.body.user.role).toBe('customer');
    });

    it('rejects a duplicate email with 409', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Again', email: 'nimal@example.com', password: 'secret123' });
        expect(res.status).toBe(409);
    });

    it('lists every validation problem at once', async () => {
        const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: '123' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Name is required/);
        expect(res.body.error).toMatch(/valid email/);
        expect(res.body.error).toMatch(/at least 8 characters/);
    });
});

describe('POST /api/auth/login', () => {
    it('returns a token for correct credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: USERS.agent, password: 'Password123' });
        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe('agent');
    });

    it('gives the same message for a wrong password and an unknown email', async () => {
        const wrongPassword = await request(app).post('/api/auth/login').send({ email: USERS.agent, password: 'nope1234' });
        const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'nope1234' });

        expect(wrongPassword.status).toBe(401);
        expect(unknownEmail.status).toBe(401);
        expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
    });
});

describe('GET /api/auth/me', () => {
    it('returns the logged-in user', async () => {
        const token = await loginAs(USERS.customer);
        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ id: 1, role: 'customer' });
    });

    it('rejects a missing or fake token with 401', async () => {
        expect((await request(app).get('/api/auth/me')).status).toBe(401);
        const fake = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.token');
        expect(fake.status).toBe(401);
    });
});

describe('POST /api/users (create staff)', () => {
    const newAgent = { name: 'New Agent', email: 'new.agent@example.com', password: 'secret123', role: 'agent' };

    it('is forbidden for agents', async () => {
        const token = await loginAs(USERS.agent);
        const res = await request(app).post('/api/users').set('Authorization', `Bearer ${token}`).send(newAgent);
        expect(res.status).toBe(403);
    });

    it('works for admins', async () => {
        const token = await loginAs(USERS.admin);
        const res = await request(app).post('/api/users').set('Authorization', `Bearer ${token}`).send(newAgent);
        expect(res.status).toBe(201);
        expect(res.body.role).toBe('agent');
    });
});
