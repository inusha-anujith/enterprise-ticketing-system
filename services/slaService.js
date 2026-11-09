// services/slaService.js
// The SLA (Service Level Agreement) engine.
//
// Every ticket gets a deadline (sla_due_at) when it is created, based on its priority.
// A background job runs every minute and finds tickets that are still waiting
// (Open or In Progress) after their deadline. For each one it:
//   1. marks the ticket as sla_breached
//   2. escalates its priority to Urgent
//   3. writes an audit log entry performed by "System"
const cron = require('node-cron');
const db = require('../config/db');
const config = require('../config');

// Deadline for a ticket of this priority, counting from `from`
const calculateDueDate = (priority, from = new Date()) => {
    const minutes = config.sla.minutes[priority] ?? config.sla.minutes.Normal;
    return new Date(from.getTime() + minutes * 60 * 1000);
};

// One pass of the engine. Exported on its own so tests can call it directly.
const runSlaCheck = async () => {
    const connection = await db.getConnection();
    try {
        // Transaction: either all three steps happen, or none do.
        // FOR UPDATE locks the selected rows, so if two copies of the server run,
        // they can't escalate the same ticket twice.
        await connection.beginTransaction();

        const [overdue] = await connection.query(
            `SELECT id, priority FROM tickets
              WHERE status IN ('Open', 'In Progress')
                AND sla_breached = FALSE
                AND sla_due_at < UTC_TIMESTAMP()
              FOR UPDATE`,
        );

        if (overdue.length === 0) {
            await connection.commit();
            return [];
        }

        const ids = overdue.map((t) => t.id);
        await connection.query(
            "UPDATE tickets SET sla_breached = TRUE, priority = 'Urgent' WHERE id IN (?)",
            [ids],
        );

        const logRows = overdue.map((t) => [
            t.id,
            t.priority === 'Urgent' ? 'SLA breached' : `SLA breached: priority escalated from ${t.priority} to Urgent`,
            null, // null = done by the system, not a person
        ]);
        await connection.query(
            'INSERT INTO audit_logs (ticket_id, action_performed, performed_by_user_id) VALUES ?',
            [logRows],
        );

        await connection.commit();
        return ids;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

let isRunning = false;

const startSlaEngine = () => {
    console.log(`⚙️  SLA engine scheduled (${config.sla.cronSchedule})`);

    return cron.schedule(config.sla.cronSchedule, async () => {
        // If the previous run is still going (slow database), skip this tick
        if (isRunning) return;
        isRunning = true;
        try {
            const escalated = await runSlaCheck();
            if (escalated.length > 0) {
                console.log(`🚨 SLA breach: ticket(s) ${escalated.join(', ')} escalated to Urgent`);
            }
        } catch (err) {
            console.error('SLA engine error:', err.message);
        } finally {
            isRunning = false;
        }
    });
};

module.exports = { calculateDueDate, runSlaCheck, startSlaEngine };
