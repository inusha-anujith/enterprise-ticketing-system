-- ApexDesk database schema (MySQL 8)
-- WARNING: this drops and recreates every table. Use it for a fresh setup only.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('customer', 'agent', 'admin') NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tickets (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    customer_id       INT          NOT NULL,
    assigned_agent_id INT          NULL,
    subject           VARCHAR(255) NOT NULL,
    description       TEXT         NOT NULL,
    status            ENUM('Open', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Open',
    priority          ENUM('Low', 'Normal', 'High', 'Urgent') NOT NULL DEFAULT 'Normal',
    sla_due_at        DATETIME     NOT NULL,
    sla_breached      BOOLEAN      NOT NULL DEFAULT FALSE,
    resolved_at       DATETIME     NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tickets_customer FOREIGN KEY (customer_id)       REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_agent    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,

    -- The SLA engine searches by status + deadline, customers by their own id
    INDEX idx_tickets_status_due (status, sla_due_at),
    INDEX idx_tickets_customer (customer_id)
);

CREATE TABLE comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id  INT       NOT NULL,
    user_id    INT       NOT NULL,
    body       TEXT      NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
);

-- Every change to a ticket is recorded here.
-- performed_by_user_id is NULL when the system (the SLA engine) made the change.
CREATE TABLE audit_logs (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id            INT          NOT NULL,
    action_performed     VARCHAR(255) NOT NULL,
    performed_by_user_id INT          NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_ticket FOREIGN KEY (ticket_id)            REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_user   FOREIGN KEY (performed_by_user_id) REFERENCES users(id)   ON DELETE SET NULL,
    INDEX idx_audit_ticket (ticket_id)
);
