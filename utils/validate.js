// utils/validate.js
// Small, dependency-free validation helpers. Each returns an error message or null.
const HttpError = require('./httpError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rules = {
    requiredString: (field, { min = 1, max = 255 } = {}) => (value) => {
        if (typeof value !== 'string' || value.trim().length < min) {
            return min > 1 ? `${field} must be at least ${min} characters` : `${field} is required`;
        }
        if (value.trim().length > max) return `${field} must be at most ${max} characters`;
        return null;
    },
    email: (value) => (typeof value === 'string' && EMAIL_PATTERN.test(value) ? null : 'A valid email is required'),
    oneOf: (field, allowed) => (value) =>
        allowed.includes(value) ? null : `${field} must be one of: ${allowed.join(', ')}`,
    optional: (rule) => (value) => (value === undefined || value === null ? null : rule(value)),
};

// Runs every rule and throws a 400 listing all problems at once.
const validate = (body, schema) => {
    const errors = Object.entries(schema)
        .map(([key, rule]) => rule(body?.[key]))
        .filter(Boolean);

    if (errors.length > 0) {
        throw new HttpError(400, errors.join('. '));
    }
};

// Parses a route id like "/tickets/:id" and rejects anything that isn't a positive integer.
const parseId = (raw) => {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, 'Invalid id');
    }
    return id;
};

module.exports = { rules, validate, parseId };
