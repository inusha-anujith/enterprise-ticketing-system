// tests/sla.test.js
// Tests the SLA engine directly by calling runSlaCheck(), instead of waiting for the cron job.
const db = require('../config/db');
const config = require('../config');
const { calculateDueDate, runSlaCheck } = require('../services/slaService');
const { resetDatabase } = require('./helpers');

beforeAll(resetDatabase);
afterAll(() => db.end());

describe('calculateDueDate', () => {
    it('adds the configured minutes for each priority', () => {
        const start = new Date('2026-01-01T10:00:00Z');
        for (const [priority, minutes] of Object.entries(config.sla.minutes)) {
            const due = calculateDueDate(priority, start);
            expect((due - start) / 60000).toBe(minutes);
        }
    });

    it('gives Urgent tickets the shortest deadline', () => {
        const { Urgent, High, Normal, Low } = config.sla.minutes;
        expect(Urgent).toBeLessThan(High);
        expect(High).toBeLessThan(Normal);
        expect(Normal).toBeLessThan(Low);
    });
});

describe('runSlaCheck', () => {
    it('escalates only waiting tickets that are past their deadline', async () => {
        // The seed data contains exactly two overdue tickets: #5 (Normal) and #6 (High)
        const escalated = await runSlaCheck();
        expect(escalated.sort()).toEqual([5, 6]);

        const [rows] = await db.query('SELECT id, priority, sla_breached FROM tickets WHERE id IN (5, 6)');
        for (const ticket of rows) {
            expect(ticket.priority).toBe('Urgent');
            expect(ticket.sla_breached).toBe(1);
        }
    });

    it('records the escalation as a System action in the audit log', async () => {
        const [logs] = await db.query(
            'SELECT action_performed, performed_by_user_id FROM audit_logs WHERE ticket_id = 5 AND action_performed LIKE ?',
            ['SLA breached%'],
        );
        expect(logs).toHaveLength(1);
        expect(logs[0].action_performed).toBe('SLA breached: priority escalated from Normal to Urgent');
        expect(logs[0].performed_by_user_id).toBeNull();
    });

    it('does not escalate the same ticket twice', async () => {
        expect(await runSlaCheck()).toEqual([]);
    });

    it('ignores resolved tickets, even if they are overdue', async () => {
        const [result] = await db.query(
            `INSERT INTO tickets (customer_id, subject, description, status, priority, sla_due_at, resolved_at)
             VALUES (1, 'Old', 'Already fixed', 'Resolved', 'Low', UTC_TIMESTAMP() - INTERVAL 1 DAY, UTC_TIMESTAMP())`,
        );
        expect(await runSlaCheck()).not.toContain(result.insertId);
    });

    it('does not touch tickets that are still inside their deadline', async () => {
        const [[ticket]] = await db.query('SELECT priority, sla_breached FROM tickets WHERE id = 1');
        expect(ticket.priority).toBe('High');
        expect(ticket.sla_breached).toBe(0);
    });
});
