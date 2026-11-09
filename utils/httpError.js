// utils/httpError.js
// Throw one of these anywhere in a controller, e.g. throw new HttpError(404, 'Ticket not found').
// The error handler middleware turns it into a JSON response with that status code.
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

module.exports = HttpError;
