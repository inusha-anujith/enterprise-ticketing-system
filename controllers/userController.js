// controllers/userController.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const HttpError = require('../utils/httpError');

// POST /api/users
// The client now sends a plain `password`, and the SERVER hashes it.
// (Before, the client sent `password_hash`, which meant passwords were stored as typed.)
const createUser = async (req, res) => {
    const { name, email, password, role = 'customer' } = req.body;

    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
        throw new HttpError(400, 'name, email and a password of at least 8 characters are required');
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
        throw new HttpError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name.trim(), email.trim().toLowerCase(), passwordHash, role],
    );

    res.status(201).json({ id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), role });
};

module.exports = { createUser };
