// controllers/userController.js

// 1. We need the database connection to talk to MySQL
const db = require('../config/db');

// 2. We take the exact logic from server.js and wrap it in a function called 'createUser'
const createUser = (request, response) => {
    const { name, email, password_hash, role } = request.body;

    const sqlQuery = "INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)";
    const values = [name, email, password_hash, role];

    db.query(sqlQuery, values, (err, result) => {
        if (err) {
            console.error("Database error:", err.message);
            return response.status(500).json({ error: "Failed to create user" });
        }
        
        response.status(201).json({ 
            message: "User created successfully!", 
            userId: result.insertId 
        });
    });
};

// 3. We export this function so the rest of the app can use it
module.exports = {
    createUser
};