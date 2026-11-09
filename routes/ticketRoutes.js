// routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/auth');

// Every ticket route needs a logged-in user
router.use(authenticate);

router.post('/', authorize('customer'), ticketController.createTicket);
router.get('/', ticketController.getAllTickets);
router.put('/:id/resolve', authorize('agent', 'admin'), ticketController.resolveTicket);

module.exports = router;
