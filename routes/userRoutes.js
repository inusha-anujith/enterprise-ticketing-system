// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Every route in this file needs a logged-in user
router.use(authenticate);

router.get('/agents', authorize('agent', 'admin'), userController.listAgents);
router.post('/', authorize('admin'), userController.createStaffUser);

module.exports = router;
