// middleware/errorHandler.js
// In Express 5, an error thrown inside an async route handler is passed here automatically,
// so controllers don't need a try/catch around every query.

// Runs when no route matched the request
const notFound = (req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Express recognises an error handler by its 4 parameters, so `next` must stay even though it's unused
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Request body is not valid JSON' });
    }

    const status = err.status || 500;
    if (status >= 500) {
        console.error(err);
    }

    // For server errors, hide the details (SQL errors, stack traces) from the client
    res.status(status).json({
        error: status >= 500 ? 'Something went wrong on the server' : err.message,
    });
};

module.exports = { notFound, errorHandler };
