// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Import the specific "brain" for users
const userController = require('../controllers/userController');

// When a POST request hits this router, trigger the createUser function
router.post('/', userController.createUser);

module.exports = router;