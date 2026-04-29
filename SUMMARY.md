# Project Summary: SecureVault

**SecureVault** is an advanced, enterprise-grade Document Management System (DMS) built to provide maximum security, multi-tenant data isolation, and detailed administrative oversight. It is designed for organizations that handle sensitive documentation and require a tamper-proof audit trail and client-side encryption.

---

##  Key Features & Capabilities

### 1. **Multi-Tenant Workspace Management**
- **Dynamic Workspaces**: Users can create, join, and manage multiple "Workspaces" (Teams) using unique invite codes.
- **Data Isolation**: Files and members are strictly isolated by workspace. A user only sees documents and activity related to the specific teams they belong to.
- **Manager Empowerment**: Users with the `MANAGER` role can create their own teams and manage the roster of members within their specific workspaces.

### 2. **Advanced Document Security**
- **Client-Side AES-256 Encryption**: Every document is encrypted on the user's browser using a secure key before it is ever sent to the server. The server never sees the raw content of your files.
- **Granular Access Control**:
  - **Full Team**: Accessible by everyone in the workspace.
  - **Departmental**: Shared with the user's entire department.
  - **Restricted/Specific**: Access limited to explicitly named users with individual permissions (Read, Write, Delete).

### 3. **Version Control System**
- **Automatic Versioning**: Every time a document is edited, the system automatically creates a new version instead of overwriting the old one.
- **Version History**: Users can view the full history of changes, including who made the edit and a "Commit Message" explaining the update.
- **Rollback Capability**: Administrators and document owners can preview previous versions and restore them if necessary.

### 4. **Administrative & Managerial Oversight**
- **Admin Dashboard**: A comprehensive interface for System Administrators to monitor all registered users, escalate roles (e.g., promoting a User to Manager), and view global system metrics.
- **Team Management (Manager View)**: A dedicated portal for Managers to oversee their team members, monitor joined dates, and ensure workspace integrity.
- **Real-Time System Stats**: Dynamic visualization of system health, including total encrypted documents, active members, and document category distributions.

### 5. **Comprehensive Audit Logs**
- **Immutable Activity Stream**: Every critical action—logins, document views, file uploads, and role changes—is logged with a timestamp, user ID, and IP address.
- **Global & Local Audits**: View system-wide activity logs as an Admin, or drill down into specific document-level logs to see who has accessed or modified a particular file.

---

## 🛠️ Technical Prowess (DBMS & Security)

### **Database Management System (DBMS)**
SecureVault leverages **PostgreSQL** with a sophisticated schema design:
- **Relational Integrity**: Uses complex foreign key relationships to link Users, Teams, Roles, and Documents.
- **Performance Indexing**: Implements **B-Tree** and **Trigram** indexes to allow for near-instant search across thousands of users and documents.
- **Normalization**: A 3rd Normal Form (3NF) compliant structure ensures data redundancy is minimized and integrity is maximized.

### **Security Layer**
- **Identity Provider**: Integrated with **Clerk** for multi-factor authentication (MFA) and secure session management.
- **API Security**: All endpoints are protected by custom **Express Middlewares** that verify JWT tokens and enforce RBAC.
- **CORS & Headers**: Strict Cross-Origin Resource Sharing (CORS) policies and secure headers protect the application from common web vulnerabilities like XSS and CSRF.

---

##  User Experience (UX)
- **Premium Interface**: A modern, dark-themed "Glassmorphism" UI with smooth transitions and interactive stat cards.
- **Responsive Design**: Fully optimized for both desktop and mobile viewing.
- **Action-Oriented Workflows**: Unified navigation (Dashboard, Audit, Users) ensures that complex administrative tasks are simple and intuitive.

---

*SecureVault represents the intersection of robust database engineering and state-of-the-art cybersecurity practices.*
