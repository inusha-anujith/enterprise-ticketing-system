// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const HttpError = require('../utils/httpError');

// Checks the "Authorization: Bearer <token>" header and puts the user on req.user.
const authenticate = (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        throw new HttpError(401, 'You need to log in first');
    }

    try {
        const payload = jwt.verify(token, config.jwt.secret);
        req.user = { id: payload.sub, role: payload.role, name: payload.name };
        next();
    } catch {
        throw new HttpError(401, 'Your session has expired. Please log in again');
    }
};

// Usage: router.get('/stats', authenticate, authorize('agent', 'admin'), handler)
const authorize = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
        throw new HttpError(403, 'You do not have permission to do this');
    }
    next();
};

const isStaff = (user) => user.role === 'agent' || user.role === 'admin';

module.exports = { authenticate, authorize, isStaff };
