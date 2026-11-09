// controllers/ticketController.js
const db = require('../config/db');
const HttpError = require('../utils/httpError');
const { calculateDueDate } = require('../services/slaService');

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

// POST /api/tickets
const createTicket = async (req, res) => {
    // customer_id still comes from the request body for now.
    // Phase 3 (login) will take it from the logged-in user instead.
    const { customer_id, subject, description, priority = 'Normal' } = req.body;

    if (!customer_id || !subject?.trim() || !description?.trim()) {
        throw new HttpError(400, 'customer_id, subject and description are required');
    }
    if (!PRIORITIES.includes(priority)) {
        throw new HttpError(400, `priority must be one of: ${PRIORITIES.join(', ')}`);
    }

    const dueAt = calculateDueDate(priority);
    const [result] = await db.query(
        `INSERT INTO tickets (customer_id, subject, description, priority, sla_due_at)
         VALUES (?, ?, ?, ?, ?)`,
        [customer_id, subject.trim(), description.trim(), priority, dueAt],
    );

    await db.query(
        'INSERT INTO audit_logs (ticket_id, action_performed, performed_by_user_id) VALUES (?, ?, ?)',
        [result.insertId, 'Ticket created', customer_id],
    );

    res.status(201).json({ id: result.insertId, status: 'Open', priority, sla_due_at: dueAt });
};

// GET /api/tickets
const getAllTickets = async (req, res) => {
    const [tickets] = await db.query('SELECT * FROM tickets ORDER BY created_at DESC');
    res.json(tickets);
};

// PUT /api/tickets/:id/resolve
const resolveTicket = async (req, res) => {
    const ticketId = Number(req.params.id);

    const [result] = await db.query(
        "UPDATE tickets SET status = 'Resolved', resolved_at = UTC_TIMESTAMP() WHERE id = ? AND status != 'Resolved'",
        [ticketId],
    );

    // affectedRows is 0 when no ticket has this id (or it was already resolved)
    if (result.affectedRows === 0) {
        throw new HttpError(404, 'Ticket not found or already resolved');
    }

    await db.query(
        'INSERT INTO audit_logs (ticket_id, action_performed, performed_by_user_id) VALUES (?, ?, ?)',
        [ticketId, 'Status changed to Resolved', null],
    );

    res.json({ message: 'Ticket resolved' });
};

module.exports = { createTicket, getAllTickets, resolveTicket };
