// routes/ticketRoutes.js
const express = require('express');
const router = express.Router();

// Import the specific "brain" for tickets
const ticketController = require('../controllers/ticketController');

// Map the HTTP methods to the correct controller functions
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getAllTickets);

// Map the HTTP methods to the correct controller functions
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getAllTickets);

// NEW: When a PUT request hits /api/tickets/ID/resolve, run the resolve function
router.put('/:id/resolve', ticketController.resolveTicket);

module.exports = router;