# SecureVault: Enterprise-Grade Document Management System

SecureVault is a high-security, multi-tenant document management system designed with a strong focus on **Database Management (DBMS)** and **Cybersecurity**. It provides a robust architecture for encrypted file storage, role-based access control (RBAC), and comprehensive audit trails.

**Repository Link:** [https://github.com/Sxashank/SECURE-VAULT](https://github.com/Sxashank/SECURE-VAULT)

---

##  Security Architecture

The application implements several layers of security to ensure data integrity and confidentiality:

1.  **AES-256 Encryption**: All document content is encrypted on the client-side before transmission and storage.
2.  **Role-Based Access Control (RBAC)**: A hierarchical permission system (Admin, Manager, User) manages access to system features and document operations.
3.  **Multi-Tenant Isolation**: Data is segmented by "Workspaces" (Teams). Users only see documents belonging to teams they are members of, or documents explicitly shared with them.
4.  **Audit Logging**: Every action (Login, Upload, View, Edit, Delete) is recorded with a timestamp, IP address, and user identity for forensic analysis.
5.  **Authentication**: Integrated with **Clerk** for modern, secure identity management and session handling.

---

##  Database Design (DBMS)

SecureVault uses **PostgreSQL** with a highly normalized schema to ensure data consistency and high performance.

### Core Entities:
-   **Users**: Stores user profiles linked to Clerk IDs.
-   **Roles**: Defines permissions (`ADMIN`, `MANAGER`, `USER`).
-   **Teams/Workspaces**: Facilitates multi-tenancy.
-   **Documents**: Core metadata for files.
-   **Document Versions**: Implements a version control system for documents, allowing users to view and revert to previous states.
-   **Permissions**: Fine-grained access control mapping users to specific document rights.
-   **Audit Logs**: Specialized table for high-frequency security logging.

### Performance Optimization:
-   **Trigram Indexes**: Implemented on user names and emails for fast fuzzy searching.
-   **Foreign Key Constraints**: Strict `ON DELETE CASCADE` and `SET NULL` rules to maintain referential integrity.
-   **B-Tree Indexes**: Applied to frequently queried columns like `team_id`, `email`, and `timestamp`.

---

##  Project Structure

### Backend (`/backend`)
-   `src/index.ts`: The entry point, configuring Express, CORS, and mounting API routes.
-   `src/db/`: Database connection logic and schema initialization (`schema.sql`).
-   `src/controllers/`: Contains business logic for Auth, Documents, Users, and Stats.
-   `src/routes/`: Express route definitions mapping URLs to controllers.
-   `src/middlewares/`: Includes `authMiddleware` for Clerk verification and role enforcement.
-   `src/utils/`: Utility functions for JWT handling and audit logging.

### Frontend (`/frontend`)
-   `src/pages/Dashboard.tsx`: The primary application interface, featuring a complex state management system for navigation, filtering, and real-time document interaction.
-   `src/pages/Auth.tsx`: Secure login and registration flows.
-   `src/components/`: Reusable UI components (Modals, Badges, Stats Cards).
-   `src/styles/index.css`: A premium design system using custom CSS variables for a modern "Dark Mode" aesthetic.

---

##  Getting Started

### Prerequisites:
-   Node.js & npm
-   PostgreSQL instance

### Installation:
1.  Clone the repository.
2.  Install dependencies in both `/frontend` and `/backend` using `npm install`.
3.  Configure `.env` files in both directories (see `.env.example`).
4.  Initialize the database using the provided `schema.sql`.

### Running Locally:
-   **Backend**: `npm run dev` (Runs on port 5001)
-   **Frontend**: `npm run dev` (Runs on port 5200)

---

##  Tech Stack
-   **Frontend**: React, Vite, Axios, CryptoJS.
-   **Backend**: Node.js, Express, PostgreSQL (pg).
-   **Auth**: Clerk.
-   **Styling**: Vanilla CSS with modern glassmorphism UI.

---

*This project was developed for professional evaluation, demonstrating expertise in full-stack development, secure API design, and advanced database management.*
