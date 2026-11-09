// controllers/ticketController.js
const db = require('../config/db');
const HttpError = require('../utils/httpError');
const { rules, validate, parseId } = require('../utils/validate');
const { isStaff } = require('../middleware/auth');
const { calculateDueDate } = require('../services/slaService');

// Customers pick a priority when they open a ticket. Only the SLA engine sets Urgent.
const CUSTOMER_PRIORITIES = ['Low', 'Normal', 'High'];

// POST /api/tickets  (customers only)
const createTicket = async (req, res) => {
    validate(req.body, {
        subject: rules.requiredString('Subject', { max: 255 }),
        description: rules.requiredString('Description', { max: 5000 }),
        priority: rules.optional(rules.oneOf('Priority', CUSTOMER_PRIORITIES)),
    });

    // The customer is whoever is logged in. It's never taken from the request body,
    // so nobody can create tickets in someone else's name.
    const customerId = req.user.id;
    const { subject, description, priority = 'Normal' } = req.body;
    const dueAt = calculateDueDate(priority);

    const [result] = await db.query(
        `INSERT INTO tickets (customer_id, subject, description, priority, sla_due_at)
         VALUES (?, ?, ?, ?, ?)`,
        [customerId, subject.trim(), description.trim(), priority, dueAt],
    );

    await db.query(
        'INSERT INTO audit_logs (ticket_id, action_performed, performed_by_user_id) VALUES (?, ?, ?)',
        [result.insertId, 'Ticket created', customerId],
    );

    res.status(201).json({ id: result.insertId, status: 'Open', priority, sla_due_at: dueAt });
};

// GET /api/tickets
// Customers only see their own tickets. Agents and admins see all of them.
const getAllTickets = async (req, res) => {
    let sql = `
        SELECT t.*, c.name AS customer_name, a.name AS agent_name
          FROM tickets t
          JOIN users c      ON c.id = t.customer_id
          LEFT JOIN users a ON a.id = t.assigned_agent_id`;
    const params = [];

    if (!isStaff(req.user)) {
        sql += ' WHERE t.customer_id = ?';
        params.push(req.user.id);
    }

    sql += ' ORDER BY t.created_at DESC';

    const [tickets] = await db.query(sql, params);
    res.json(tickets);
};

// PUT /api/tickets/:id/resolve  (agents and admins only)
const resolveTicket = async (req, res) => {
    const ticketId = parseId(req.params.id);

    const [result] = await db.query(
        "UPDATE tickets SET status = 'Resolved', resolved_at = UTC_TIMESTAMP() WHERE id = ? AND status != 'Resolved'",
        [ticketId],
    );

    // affectedRows is 0 when no ticket has this id, or it was already resolved
    if (result.affectedRows === 0) {
        throw new HttpError(404, 'Ticket not found or already resolved');
    }

    await db.query(
        'INSERT INTO audit_logs (ticket_id, action_performed, performed_by_user_id) VALUES (?, ?, ?)',
        [ticketId, 'Status changed to Resolved', req.user.id],
    );

    res.json({ message: 'Ticket resolved' });
};

module.exports = { createTicket, getAllTickets, resolveTicket };
