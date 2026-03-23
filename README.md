# ⚡️ APEXDESK: Enterprise SLA Ticketing System

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

A full-stack internal support dashboard engineered to track, manage, and automatically escalate customer support tickets. Built with a modern React (Vite) frontend and a Node.js REST API, featuring an automated background SLA (Service Level Agreement) engine.

## ✨ Key Features

* **Automated SLA Engine:** Utilizes `node-cron` to scan the database every minute, automatically escalating neglected "Open" tickets to "Urgent" priority to ensure compliance.
* **Modern SPA Architecture:** Lightning-fast frontend navigation using `react-router-dom` without page reloads.
* **Full-Stack Monorepo:** Cleanly organized MVC (Model-View-Controller) backend architecture sitting alongside a component-based React frontend.
* **Interactive Dashboard:** Real-time metric calculations, status color-coding, and asynchronous data fetching using the `fetch` API.

## 🛠️ Tech Stack

**Frontend:**
* React.js (via Vite for optimized build speeds)
* Tailwind CSS (Utility-first UI styling)
* React Router (Client-side routing)

**Backend:**
* Node.js & Express.js (RESTful API)
* MySQL (Relational Database)
* `node-cron` (Background task automation)
* `cors` & `dotenv` (Security and cross-origin resource sharing)

---

## 🚀 Local Development Setup

Follow these steps to run the APEXDESK application on your local machine.

### 1. Database Configuration (MySQL)
Run the following SQL commands in your MySQL workbench/terminal to set up the database schema:
```sql
CREATE DATABASE TicketingApp;
USE TicketingApp;

CREATE TABLE Tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Open',
    priority VARCHAR(50) DEFAULT 'Normal',
    customer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);