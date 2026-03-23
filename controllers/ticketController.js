// controllers/ticketController.js

const db = require('../config/db');

// --- FUNCTION 1: Create a Ticket ---
const createTicket = (request, response) => {
    const { customer_id, subject, description } = request.body;

    const insertTicketQuery = "INSERT INTO Tickets (customer_id, subject, description) VALUES (?, ?, ?)";
    const ticketValues = [customer_id, subject, description];

    db.query(insertTicketQuery, ticketValues, (err, ticketResult) => {
        if (err) {
            console.error("Error creating ticket:", err.message);
            return response.status(500).json({ error: "Failed to create ticket" });
        }

        const newTicketId = ticketResult.insertId;

        const insertLogQuery = "INSERT INTO AuditLogs (ticket_id, action_performed, performed_by_user_id) VALUES (?, ?, ?)";
        const logValues = [newTicketId, "Ticket Created", customer_id];

        db.query(insertLogQuery, logValues, (logErr, logResult) => {
            if (logErr) {
                console.error("Ticket created, but failed to save Audit Log:", logErr.message);
            }

            response.status(201).json({
                message: "Ticket submitted successfully!",
                ticketId: newTicketId,
                status: "Open"
            });
        });
    });
};

// --- FUNCTION 2: Get All Tickets ---
const getAllTickets = (request, response) => {
    const sqlQuery = "SELECT * FROM Tickets ORDER BY created_at DESC";

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error("Error fetching tickets:", err.message);
            return response.status(500).json({ error: "Failed to fetch tickets" });
        }
        
        response.status(200).json(results);
    });
};

// --- FUNCTION 3: Resolve a Ticket ---
// We use a PUT request to update existing data
const resolveTicket = (request, response) => {
    // We grab the specific ticket ID from the URL (e.g., /api/tickets/5/resolve)
    const ticketId = request.params.id;

    // The SQL command to update ONLY the status of this specific ticket
    const updateQuery = "UPDATE Tickets SET status = 'Resolved' WHERE id = ?";

    db.query(updateQuery, [ticketId], (err, result) => {
        if (err) {
            console.error("Error resolving ticket:", err.message);
            return response.status(500).json({ error: "Failed to resolve ticket" });
        }
        
        // Let the frontend know we succeeded!
        response.status(200).json({ message: "Ticket successfully resolved!" });
    });
};

// DON'T FORGET TO EXPORT ALL THREE NOW!
module.exports = {
    createTicket,
    getAllTickets,
    resolveTicket // <-- Add this new one here
};