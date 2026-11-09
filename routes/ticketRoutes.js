// routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/auth');

const staffOnly = authorize('agent', 'admin');

// Every ticket route needs a logged-in user
router.use(authenticate);

// /stats must be registered BEFORE /:id, otherwise Express would treat "stats" as an id
router.get('/stats', staffOnly, ticketController.getStats);

router.get('/', ticketController.getAllTickets);
router.post('/', authorize('customer'), ticketController.createTicket);
router.get('/:id', ticketController.getTicketById);
router.patch('/:id/status', staffOnly, ticketController.updateStatus);
router.patch('/:id/assign', staffOnly, ticketController.assignTicket);
router.post('/:id/comments', ticketController.addComment);

module.exports = router;
