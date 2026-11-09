// controllers/ticketController.js
const db = require('../config/db');
const HttpError = require('../utils/httpError');
const { rules, validate, parseId } = require('../utils/validate');
const { isStaff } = require('../middleware/auth');
const { calculateDueDate } = require('../services/slaService');

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
// Customers can't open a ticket as Urgent. Only the SLA engine escalates to Urgent.
const CUSTOMER_PRIORITIES = ['Low', 'Normal', 'High'];

// Which status changes are allowed. Anything else is rejected with 400.
const ALLOWED_TRANSITIONS = {
    'Open': ['In Progress', 'Resolved'],
    'In Progress': ['Open', 'Resolved'],
    'Resolved': ['Open'], // reopen
};

// ---------- helpers ----------

const addAuditLog = (ticketId, action, userId) =>
    db.query(
        'INSERT INTO audit_logs (ticket_id, action_performed, performed_by_user_id) VALUES (?, ?, ?)',
        [ticketId, action, userId],
    );

// Loads a ticket and checks the user may see it.
// A customer asking for someone else's ticket gets 404 (not 403),
// so they can't even find out that the ticket exists.
const findAccessibleTicket = async (ticketId, user) => {
    const [rows] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    const ticket = rows[0];

    if (!ticket || (!isStaff(user) && ticket.customer_id !== user.id)) {
        throw new HttpError(404, 'Ticket not found');
    }
    return ticket;
};

const TICKET_SELECT = `
    SELECT t.*, c.name AS customer_name, a.name AS agent_name
      FROM tickets t
      JOIN users c      ON c.id = t.customer_id
      LEFT JOIN users a ON a.id = t.assigned_agent_id`;

// ---------- handlers ----------

// POST /api/tickets  (customers only)
const createTicket = async (req, res) => {
    validate(req.body, {
        subject: rules.requiredString('Subject', { max: 255 }),
        description: rules.requiredString('Description', { max: 5000 }),
        priority: rules.optional(rules.oneOf('Priority', CUSTOMER_PRIORITIES)),
    });

    // The customer is whoever is logged in, never a value from the request body
    const customerId = req.user.id;
    const { subject, description, priority = 'Normal' } = req.body;
    const dueAt = calculateDueDate(priority);

    const [result] = await db.query(
        `INSERT INTO tickets (customer_id, subject, description, priority, sla_due_at)
         VALUES (?, ?, ?, ?, ?)`,
        [customerId, subject.trim(), description.trim(), priority, dueAt],
    );
    await addAuditLog(result.insertId, 'Ticket created', customerId);

    res.status(201).json({ id: result.insertId, status: 'Open', priority, sla_due_at: dueAt });
};

// GET /api/tickets?status=Open&priority=High&search=vpn&mine=true
// Customers only see their own tickets. Staff see all of them.
const getAllTickets = async (req, res) => {
    const { status, priority, search, mine } = req.query;
    const conditions = [];
    const params = [];

    if (!isStaff(req.user)) {
        conditions.push('t.customer_id = ?');
        params.push(req.user.id);
    } else if (mine === 'true') {
        // Agent view: "tickets assigned to me"
        conditions.push('t.assigned_agent_id = ?');
        params.push(req.user.id);
    }

    if (status) {
        if (!STATUSES.includes(status)) throw new HttpError(400, 'Invalid status filter');
        conditions.push('t.status = ?');
        params.push(status);
    }
    if (priority) {
        if (!PRIORITIES.includes(priority)) throw new HttpError(400, 'Invalid priority filter');
        conditions.push('t.priority = ?');
        params.push(priority);
    }
    if (search) {
        // Values always go through ? placeholders, never string concatenation (SQL injection)
        conditions.push('(t.subject LIKE ? OR t.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [tickets] = await db.query(`${TICKET_SELECT} ${where} ORDER BY t.created_at DESC`, params);
    res.json(tickets);
};

// GET /api/tickets/:id  — the ticket plus its comments and full audit history
const getTicketById = async (req, res) => {
    const ticketId = parseId(req.params.id);
    await findAccessibleTicket(ticketId, req.user);

    const [[ticket]] = await db.query(`${TICKET_SELECT} WHERE t.id = ?`, [ticketId]);

    const [comments] = await db.query(
        `SELECT cm.id, cm.body, cm.created_at, u.id AS user_id, u.name AS user_name, u.role AS user_role
           FROM comments cm
           JOIN users u ON u.id = cm.user_id
          WHERE cm.ticket_id = ?
          ORDER BY cm.created_at ASC`,
        [ticketId],
    );

    const [history] = await db.query(
        `SELECT al.id, al.action_performed, al.created_at,
                COALESCE(u.name, 'System') AS performed_by
           FROM audit_logs al
           LEFT JOIN users u ON u.id = al.performed_by_user_id
          WHERE al.ticket_id = ?
          ORDER BY al.created_at ASC, al.id ASC`,
        [ticketId],
    );

    res.json({ ...ticket, comments, history });
};

// PATCH /api/tickets/:id/status  { "status": "In Progress" }  (staff only)
const updateStatus = async (req, res) => {
    const ticketId = parseId(req.params.id);
    validate(req.body, { status: rules.oneOf('Status', STATUSES) });

    const ticket = await findAccessibleTicket(ticketId, req.user);
    const newStatus = req.body.status;

    if (!ALLOWED_TRANSITIONS[ticket.status].includes(newStatus)) {
        throw new HttpError(400, `Cannot change status from ${ticket.status} to ${newStatus}`);
    }

    // resolved_at is set when resolving and cleared when a ticket is reopened
    await db.query(
        `UPDATE tickets
            SET status = ?,
                resolved_at = IF(? = 'Resolved', UTC_TIMESTAMP(), NULL)
          WHERE id = ?`,
        [newStatus, newStatus, ticketId],
    );
    await addAuditLog(ticketId, `Status changed from ${ticket.status} to ${newStatus}`, req.user.id);

    res.json({ id: ticketId, status: newStatus });
};

// PATCH /api/tickets/:id/assign  { "agentId": 3 }  or  { "agentId": null } to unassign  (staff only)
const assignTicket = async (req, res) => {
    const ticketId = parseId(req.params.id);
    const ticket = await findAccessibleTicket(ticketId, req.user);
    const { agentId } = req.body ?? {};

    if (agentId === null || agentId === undefined) {
        await db.query('UPDATE tickets SET assigned_agent_id = NULL WHERE id = ?', [ticketId]);
        await addAuditLog(ticketId, 'Unassigned', req.user.id);
        return res.json({ id: ticketId, assigned_agent_id: null });
    }

    const [agents] = await db.query(
        "SELECT id, name FROM users WHERE id = ? AND role IN ('agent', 'admin')",
        [parseId(agentId)],
    );
    if (agents.length === 0) {
        throw new HttpError(400, 'agentId must belong to an agent or admin');
    }
    if (ticket.assigned_agent_id === agents[0].id) {
        return res.json({ id: ticketId, assigned_agent_id: agents[0].id });
    }

    await db.query('UPDATE tickets SET assigned_agent_id = ? WHERE id = ?', [agents[0].id, ticketId]);
    await addAuditLog(ticketId, `Assigned to ${agents[0].name}`, req.user.id);

    res.json({ id: ticketId, assigned_agent_id: agents[0].id, agent_name: agents[0].name });
};

// POST /api/tickets/:id/comments  { "body": "..." }  (the ticket's customer, or staff)
const addComment = async (req, res) => {
    const ticketId = parseId(req.params.id);
    validate(req.body, { body: rules.requiredString('Comment', { max: 5000 }) });
    await findAccessibleTicket(ticketId, req.user);

    const [result] = await db.query(
        'INSERT INTO comments (ticket_id, user_id, body) VALUES (?, ?, ?)',
        [ticketId, req.user.id, req.body.body.trim()],
    );

    res.status(201).json({
        id: result.insertId,
        body: req.body.body.trim(),
        user_id: req.user.id,
        user_name: req.user.name,
        user_role: req.user.role,
        created_at: new Date(),
    });
};

// GET /api/tickets/stats  (staff only) — numbers for the dashboard and analytics page.
// All the counting happens in SQL, so the server never loads every ticket into memory.
const getStats = async (req, res) => {
    const [[totals]] = await db.query(`
        SELECT COUNT(*)                                                         AS total,
               SUM(status = 'Open')                                             AS open,
               SUM(status = 'In Progress')                                      AS in_progress,
               SUM(status = 'Resolved')                                         AS resolved,
               SUM(status != 'Resolved' AND priority = 'Urgent')                AS urgent_open,
               SUM(status != 'Resolved' AND sla_breached)                       AS breached_open,
               SUM(sla_breached)                                                AS breached_total,
               SUM(status != 'Resolved' AND assigned_agent_id IS NULL)          AS unassigned,
               AVG(CASE WHEN status = 'Resolved'
                        THEN TIMESTAMPDIFF(MINUTE, created_at, resolved_at) END) AS avg_resolution_minutes
          FROM tickets`);

    const [byPriority] = await db.query(`
        SELECT priority, COUNT(*) AS count
          FROM tickets
         WHERE status != 'Resolved'
         GROUP BY priority`);

    // Tickets created and resolved on each of the last 14 days
    const [created] = await db.query(`
        SELECT DATE(created_at) AS day, COUNT(*) AS count
          FROM tickets
         WHERE created_at >= UTC_DATE() - INTERVAL 13 DAY
         GROUP BY day`);
    const [resolvedDaily] = await db.query(`
        SELECT DATE(resolved_at) AS day, COUNT(*) AS count
          FROM tickets
         WHERE resolved_at >= UTC_DATE() - INTERVAL 13 DAY
         GROUP BY day`);

    const [agentWorkload] = await db.query(`
        SELECT u.id, u.name,
               SUM(t.status != 'Resolved') AS open_tickets,
               SUM(t.status = 'Resolved')  AS resolved_tickets
          FROM users u
          LEFT JOIN tickets t ON t.assigned_agent_id = u.id
         WHERE u.role IN ('agent', 'admin')
         GROUP BY u.id
         ORDER BY u.name`);

    // Fill in every day (including days with zero tickets) so the chart has no gaps
    const toKey = (d) => new Date(d).toISOString().slice(0, 10);
    const countsByDay = (rows) => Object.fromEntries(rows.map((r) => [toKey(r.day), Number(r.count)]));
    const createdMap = countsByDay(created);
    const resolvedMap = countsByDay(resolvedDaily);
    const daily = [];
    for (let i = 13; i >= 0; i--) {
        const day = toKey(Date.now() - i * 24 * 60 * 60 * 1000);
        daily.push({ day, created: createdMap[day] || 0, resolved: resolvedMap[day] || 0 });
    }

    const n = (v) => Number(v || 0);
    const total = n(totals.total);

    res.json({
        total,
        byStatus: { open: n(totals.open), inProgress: n(totals.in_progress), resolved: n(totals.resolved) },
        urgentOpen: n(totals.urgent_open),
        breachedOpen: n(totals.breached_open),
        unassigned: n(totals.unassigned),
        slaComplianceRate: total ? Math.round(((total - n(totals.breached_total)) / total) * 100) : 100,
        avgResolutionHours: totals.avg_resolution_minutes === null
            ? null
            : Math.round((Number(totals.avg_resolution_minutes) / 60) * 10) / 10,
        byPriority: Object.fromEntries(PRIORITIES.map((p) => [p, n(byPriority.find((r) => r.priority === p)?.count)])),
        daily,
        agentWorkload: agentWorkload.map((a) => ({
            id: a.id,
            name: a.name,
            openTickets: n(a.open_tickets),
            resolvedTickets: n(a.resolved_tickets),
        })),
    });
};

module.exports = {
    createTicket,
    getAllTickets,
    getTicketById,
    updateStatus,
    assignTicket,
    addComment,
    getStats,
};
