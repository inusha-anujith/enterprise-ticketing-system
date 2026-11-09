// tests/tickets.test.js
const db = require('../config/db');
const { request, app, resetDatabase, loginAs, USERS } = require('./helpers');

let customer;
let otherCustomer;
let agent;

beforeAll(async () => {
    await resetDatabase();
    [customer, otherCustomer, agent] = await Promise.all([
        loginAs(USERS.customer),
        loginAs(USERS.otherCustomer),
        loginAs(USERS.agent),
    ]);
});
afterAll(() => db.end());

// Small helpers so each test reads like a sentence
const get = (url, token) => request(app).get(url).set('Authorization', `Bearer ${token}`);
const post = (url, token, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body);
const patch = (url, token, body) => request(app).patch(url).set('Authorization', `Bearer ${token}`).send(body);

describe('listing tickets', () => {
    it('requires a login', async () => {
        expect((await request(app).get('/api/tickets')).status).toBe(401);
    });

    it('shows customers only their own tickets', async () => {
        const res = await get('/api/tickets', customer);
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body.every((t) => t.customer_id === 1)).toBe(true);
    });

    it('shows agents every ticket', async () => {
        const res = await get('/api/tickets', agent);
        const customerIds = new Set(res.body.map((t) => t.customer_id));
        expect(customerIds).toEqual(new Set([1, 2]));
    });

    it('filters by status and searches subjects', async () => {
        const open = await get('/api/tickets?status=Open', agent);
        expect(open.body.every((t) => t.status === 'Open')).toBe(true);

        const search = await get('/api/tickets?search=vpn', agent);
        expect(search.body.map((t) => t.subject)).toEqual(['VPN connection keeps dropping']);
    });

    it('treats SQL in the search box as plain text', async () => {
        const res = await get(`/api/tickets?search=${encodeURIComponent("' OR 1=1 --")}`, agent);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('creating a ticket', () => {
    it('uses the logged-in customer, not a customer_id from the body', async () => {
        const res = await post('/api/tickets', customer, {
            subject: 'Printer offline', description: 'It will not connect', priority: 'High', customer_id: 2,
        });
        expect(res.status).toBe(201);

        const [[ticket]] = await db.query('SELECT customer_id, priority, sla_due_at FROM tickets WHERE id = ?', [res.body.id]);
        expect(ticket.customer_id).toBe(1);
        expect(ticket.priority).toBe('High');
    });

    it('sets the SLA deadline from the priority (High = 60 minutes)', async () => {
        const before = Date.now();
        const res = await post('/api/tickets', customer, { subject: 'SLA check', description: 'x', priority: 'High' });
        const minutesUntilDue = (new Date(res.body.sla_due_at).getTime() - before) / 60000;
        expect(minutesUntilDue).toBeGreaterThan(59);
        expect(minutesUntilDue).toBeLessThan(61);
    });

    it('does not let customers pick Urgent', async () => {
        const res = await post('/api/tickets', customer, { subject: 'x', description: 'y', priority: 'Urgent' });
        expect(res.status).toBe(400);
    });

    it('is only for customers', async () => {
        const res = await post('/api/tickets', agent, { subject: 'x', description: 'y' });
        expect(res.status).toBe(403);
    });
});

describe('viewing a ticket', () => {
    it('includes comments and the audit history', async () => {
        const res = await get('/api/tickets/7', customer);
        expect(res.status).toBe(200);
        expect(res.body.comments.length).toBe(1);
        expect(res.body.history.map((h) => h.action_performed)).toContain('Ticket created');
    });

    it("returns 404 (not 403) for another customer's ticket", async () => {
        const res = await get('/api/tickets/7', otherCustomer); // ticket 7 belongs to Kasun
        expect(res.status).toBe(404);
    });

    it('rejects ids that are not numbers', async () => {
        expect((await get('/api/tickets/abc', agent)).status).toBe(400);
    });
});

describe('status workflow', () => {
    it('lets an agent move a ticket Open → In Progress → Resolved', async () => {
        expect((await patch('/api/tickets/1/status', agent, { status: 'In Progress' })).status).toBe(200);
        expect((await patch('/api/tickets/1/status', agent, { status: 'Resolved' })).status).toBe(200);

        const [[ticket]] = await db.query('SELECT status, resolved_at FROM tickets WHERE id = 1');
        expect(ticket.status).toBe('Resolved');
        expect(ticket.resolved_at).not.toBeNull();
    });

    it('blocks a move that is not allowed', async () => {
        const res = await patch('/api/tickets/1/status', agent, { status: 'In Progress' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Cannot change status from Resolved to In Progress');
    });

    it('clears resolved_at when a ticket is reopened', async () => {
        await patch('/api/tickets/1/status', agent, { status: 'Open' });
        const [[ticket]] = await db.query('SELECT resolved_at FROM tickets WHERE id = 1');
        expect(ticket.resolved_at).toBeNull();
    });

    it('records every change in the audit log', async () => {
        const res = await get('/api/tickets/1', agent);
        const actions = res.body.history.map((h) => h.action_performed);
        expect(actions).toEqual(expect.arrayContaining([
            'Status changed from Open to In Progress',
            'Status changed from In Progress to Resolved',
            'Status changed from Resolved to Open',
        ]));
    });

    it('is not allowed for customers', async () => {
        expect((await patch('/api/tickets/1/status', customer, { status: 'Resolved' })).status).toBe(403);
    });
});

describe('assigning and commenting', () => {
    it('assigns a ticket to an agent', async () => {
        const res = await patch('/api/tickets/1/assign', agent, { agentId: 4 });
        expect(res.status).toBe(200);
        expect(res.body.agent_name).toBe('Ravi Jayasinghe');
    });

    it('refuses to assign a ticket to a customer', async () => {
        expect((await patch('/api/tickets/1/assign', agent, { agentId: 2 })).status).toBe(400);
    });

    it('lets the ticket owner comment, but not another customer', async () => {
        expect((await post('/api/tickets/1/comments', customer, { body: 'Any update?' })).status).toBe(201);
        expect((await post('/api/tickets/1/comments', otherCustomer, { body: 'Hi' })).status).toBe(404);
    });
});

describe('GET /api/tickets/stats', () => {
    it('is only for staff', async () => {
        expect((await get('/api/tickets/stats', customer)).status).toBe(403);
    });

    it('returns totals that add up', async () => {
        const res = await get('/api/tickets/stats', agent);
        expect(res.status).toBe(200);
        const { open, inProgress, resolved } = res.body.byStatus;
        expect(open + inProgress + resolved).toBe(res.body.total);
        expect(res.body.daily).toHaveLength(14);
        expect(res.body.slaComplianceRate).toBeGreaterThanOrEqual(0);
        expect(res.body.slaComplianceRate).toBeLessThanOrEqual(100);
    });
});
