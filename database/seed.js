// database/seed.js
// Fills the database with demo users and tickets.  Usage: npm run db:seed
// The tests also call seed() so they always start from the same known data.
// Run `npm run db:setup` first. This deletes existing data.
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { calculateDueDate } = require('../services/slaService');

const DEMO_PASSWORD = 'Password123';

const users = [
    // Customers come first so the first customer gets id 1
    { name: 'Kasun Perera', email: 'customer@apexdesk.dev', role: 'customer' },
    { name: 'Dilini Fernando', email: 'dilini@apexdesk.dev', role: 'customer' },
    { name: 'Amaya Silva', email: 'agent@apexdesk.dev', role: 'agent' },
    { name: 'Ravi Jayasinghe', email: 'ravi@apexdesk.dev', role: 'agent' },
    { name: 'Admin User', email: 'admin@apexdesk.dev', role: 'admin' },
];

const HOUR = 60 * 60 * 1000;
const hoursAgo = (h) => new Date(Date.now() - h * HOUR);

// customer/agent refer to emails above. resolvedAfter = hours between creation and resolution.
const tickets = [
    // Still waiting and inside their SLA window
    { customer: 'customer@apexdesk.dev', subject: 'Cannot reset my password', description: 'The reset link in the email says it has expired as soon as I click it.', priority: 'High', status: 'Open', createdHoursAgo: 0.3 },
    { customer: 'dilini@apexdesk.dev', subject: 'Invoice shows the wrong amount', description: 'My October invoice charges for 12 seats but we only have 10.', priority: 'Normal', status: 'Open', createdHoursAgo: 1.5 },
    { customer: 'customer@apexdesk.dev', subject: 'Feature request: export tickets to CSV', description: 'It would help our monthly reporting if we could download tickets as CSV.', priority: 'Low', status: 'Open', createdHoursAgo: 5 },
    { customer: 'dilini@apexdesk.dev', agent: 'agent@apexdesk.dev', subject: 'Mobile app crashes on login', description: 'Since the latest update the Android app closes right after I enter my password.', priority: 'High', status: 'In Progress', createdHoursAgo: 0.5 },

    // Past their deadline: the SLA engine will escalate these on its first run
    { customer: 'customer@apexdesk.dev', subject: 'VPN connection keeps dropping', description: 'The VPN disconnects every 10 to 15 minutes when working from home.', priority: 'Normal', status: 'Open', createdHoursAgo: 6 },
    { customer: 'dilini@apexdesk.dev', agent: 'ravi@apexdesk.dev', subject: 'Email notifications not arriving', description: 'None of my team received notification emails since yesterday.', priority: 'High', status: 'In Progress', createdHoursAgo: 3 },

    // Resolved over the past two weeks (gives the analytics page some history)
    { customer: 'customer@apexdesk.dev', agent: 'agent@apexdesk.dev', subject: 'Unable to upload attachments', description: 'Uploading a PDF larger than 2 MB fails with an error.', priority: 'Normal', status: 'Resolved', createdHoursAgo: 24 * 13, resolvedAfter: 3 },
    { customer: 'dilini@apexdesk.dev', agent: 'ravi@apexdesk.dev', subject: 'Dashboard loads very slowly', description: 'The dashboard takes more than 20 seconds to load in the morning.', priority: 'High', status: 'Resolved', createdHoursAgo: 24 * 11, resolvedAfter: 0.8 },
    { customer: 'customer@apexdesk.dev', agent: 'agent@apexdesk.dev', subject: 'Change company billing address', description: 'We moved offices. Please update the billing address on our account.', priority: 'Low', status: 'Resolved', createdHoursAgo: 24 * 9, resolvedAfter: 20 },
    { customer: 'dilini@apexdesk.dev', agent: 'agent@apexdesk.dev', subject: 'Two-factor codes not accepted', description: 'The authenticator codes are rejected even though the phone time is correct.', priority: 'Urgent', status: 'Resolved', createdHoursAgo: 24 * 7, resolvedAfter: 0.4 },
    { customer: 'customer@apexdesk.dev', agent: 'ravi@apexdesk.dev', subject: 'Report totals do not match', description: 'The weekly summary report shows different totals from the dashboard.', priority: 'Normal', status: 'Resolved', createdHoursAgo: 24 * 5, resolvedAfter: 7 },
    { customer: 'dilini@apexdesk.dev', agent: 'ravi@apexdesk.dev', subject: 'Add a new team member', description: 'Please add nadeesha@example.com to our workspace.', priority: 'Low', status: 'Resolved', createdHoursAgo: 24 * 3, resolvedAfter: 5 },
    { customer: 'customer@apexdesk.dev', agent: 'agent@apexdesk.dev', subject: 'Search returns no results', description: 'Searching for any ticket number returns an empty list.', priority: 'High', status: 'Resolved', createdHoursAgo: 24 * 2, resolvedAfter: 2.5 },
    { customer: 'dilini@apexdesk.dev', agent: 'agent@apexdesk.dev', subject: 'Cannot download invoice PDF', description: 'Clicking "Download PDF" opens a blank page.', priority: 'Normal', status: 'Resolved', createdHoursAgo: 26, resolvedAfter: 1 },
];

const seed = async () => {
    // Clear existing data (children first because of foreign keys)
    await db.query('DELETE FROM audit_logs');
    await db.query('DELETE FROM comments');
    await db.query('DELETE FROM tickets');
    await db.query('DELETE FROM users');

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const userIds = {};
    for (const user of users) {
        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [user.name, user.email, passwordHash, user.role],
        );
        userIds[user.email] = { id: result.insertId, name: user.name };
    }

    for (const t of tickets) {
        const createdAt = hoursAgo(t.createdHoursAgo);
        const dueAt = calculateDueDate(t.priority, createdAt);
        const resolvedAt = t.resolvedAfter ? new Date(createdAt.getTime() + t.resolvedAfter * HOUR) : null;
        const breached = resolvedAt ? resolvedAt > dueAt : false;
        const customer = userIds[t.customer];
        const agent = t.agent ? userIds[t.agent] : null;

        const [result] = await db.query(
            `INSERT INTO tickets
                (customer_id, assigned_agent_id, subject, description, status, priority,
                 sla_due_at, sla_breached, resolved_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customer.id, agent?.id ?? null, t.subject, t.description, t.status, t.priority,
                dueAt, breached, resolvedAt, createdAt],
        );
        const ticketId = result.insertId;

        // Build a believable history for the audit log
        const logs = [[ticketId, 'Ticket created', customer.id, createdAt]];
        if (agent) {
            const pickedUpAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
            logs.push([ticketId, `Assigned to ${agent.name}`, agent.id, pickedUpAt]);
            logs.push([ticketId, 'Status changed from Open to In Progress', agent.id, pickedUpAt]);
        }
        if (resolvedAt) {
            logs.push([ticketId, 'Status changed from In Progress to Resolved', agent.id, resolvedAt]);
            await db.query(
                'INSERT INTO comments (ticket_id, user_id, body, created_at) VALUES (?, ?, ?, ?)',
                [ticketId, agent.id, 'This has been fixed on our side. Please let us know if it happens again.', resolvedAt],
            );
        }
        await db.query(
            'INSERT INTO audit_logs (ticket_id, action_performed, performed_by_user_id, created_at) VALUES ?',
            [logs],
        );
    }

    return { users: users.length, tickets: tickets.length };
};

// Only run when started from the command line (node database/seed.js), not when imported by tests
if (require.main === module) {
    seed()
        .then((counts) => {
            console.log(`✅ Seeded ${counts.users} users and ${counts.tickets} tickets`);
            console.log(`   Every demo account uses the password: ${DEMO_PASSWORD}`);
        })
        .catch((err) => {
            console.error('❌ Seeding failed:', err.message);
            process.exitCode = 1;
        })
        .finally(() => db.end());
}

module.exports = { seed, DEMO_PASSWORD };
