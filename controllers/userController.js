// controllers/userController.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const HttpError = require('../utils/httpError');
const { rules, validate } = require('../utils/validate');
const { SALT_ROUNDS } = require('./authController');

// GET /api/users/agents  (agents and admins only)
// Fills the "Assign to" dropdown, and shows how many unresolved tickets each agent has.
const listAgents = async (req, res) => {
    const [agents] = await db.query(
        `SELECT u.id, u.name, u.email, u.role,
                COUNT(t.id) AS open_tickets
           FROM users u
           LEFT JOIN tickets t
             ON t.assigned_agent_id = u.id AND t.status != 'Resolved'
          WHERE u.role IN ('agent', 'admin')
          GROUP BY u.id
          ORDER BY u.name`,
    );
    res.json(agents);
};

// POST /api/users  (admins only)
// Creates staff accounts. Customers sign themselves up through /api/auth/register.
const createStaffUser = async (req, res) => {
    validate(req.body, {
        name: rules.requiredString('Name', { max: 100 }),
        email: rules.email,
        password: rules.requiredString('Password', { min: 8, max: 72 }),
        role: rules.oneOf('Role', ['agent', 'admin']),
    });

    const { name, password, role } = req.body;
    const email = req.body.email.trim().toLowerCase();

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
        throw new HttpError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name.trim(), email, passwordHash, role],
    );

    res.status(201).json({ id: result.insertId, name: name.trim(), email, role });
};

module.exports = { listAgents, createStaffUser };
