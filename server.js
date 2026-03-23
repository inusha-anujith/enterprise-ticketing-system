// 1. Import Core Tools
const express = require('express');
const cron = require('node-cron');
require('dotenv').config(); 

const app = express();
app.use(express.json()); 

// 2. Initialize Database Connection
const db = require('./config/db');

// 3. Import Our Traffic Cops (Routes)
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// 4. Tell Express Where to Send the Traffic
// If a URL starts with '/api/users', send it to the User Router
app.use('/api/users', userRoutes);
// If a URL starts with '/api/tickets', send it to the Ticket Router
app.use('/api/tickets', ticketRoutes);

// --- THE SLA ENGINE (Background Worker) ---
cron.schedule('* * * * *', () => {
    console.log("⚙️ [SLA Engine] Scanning for neglected tickets...");
    const slaQuery = `
        UPDATE Tickets SET priority = 'Urgent' 
        WHERE status = 'Open' AND created_at < NOW() - INTERVAL 2 MINUTE AND priority != 'Urgent'
    `;
    db.query(slaQuery, (err, result) => {
        if (err) return console.error("SLA Engine Error:", err.message);
        if (result.affectedRows > 0) {
            console.log(`🚨 [SLA BREACH DETECTED] ${result.affectedRows} ticket(s) automatically upgraded to URGENT!`);
        }
    });
});

// 5. Start the Server
app.listen(3000, () => {
    console.log("🚀 Server is running on http://localhost:3000");
});