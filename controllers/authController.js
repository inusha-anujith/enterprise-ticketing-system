// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config');
const HttpError = require('../utils/httpError');
const { rules, validate } = require('../utils/validate');

const SALT_ROUNDS = 10;

const signToken = (user) =>
    jwt.sign({ sub: user.id, role: user.role, name: user.name }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

// POST /api/auth/register
// Public sign-up always creates a *customer*. Agents are created by an admin,
// so nobody can make themselves an agent by sending role: "agent".
const register = async (req, res) => {
    validate(req.body, {
        name: rules.requiredString('Name', { max: 100 }),
        email: rules.email,
        password: rules.requiredString('Password', { min: 8, max: 72 }),
    });

    const { name, password } = req.body;
    const email = req.body.email.trim().toLowerCase();

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
        throw new HttpError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await db.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')",
        [name.trim(), email, passwordHash],
    );

    const user = { id: result.insertId, name: name.trim(), email, role: 'customer' };
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
};

// POST /api/auth/login
const login = async (req, res) => {
    validate(req.body, {
        email: rules.email,
        password: rules.requiredString('Password'),
    });

    const email = req.body.email.trim().toLowerCase();
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    // Same message for "no such user" and "wrong password", so the API
    // doesn't reveal which emails are registered.
    const passwordMatches = user && (await bcrypt.compare(req.body.password, user.password_hash));
    if (!passwordMatches) {
        throw new HttpError(401, 'Incorrect email or password');
    }

    res.json({ token: signToken(user), user: publicUser(user) });
};

// GET /api/auth/me — lets the frontend check that a stored token is still valid
const me = async (req, res) => {
    const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
        throw new HttpError(401, 'Account no longer exists');
    }
    res.json({ user: rows[0] });
};

module.exports = { register, login, me, SALT_ROUNDS };
