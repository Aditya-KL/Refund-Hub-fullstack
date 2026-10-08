# Refund Hub

Refund Hub is a full-stack MERN web application that digitizes and automates the student refund and reimbursement workflow inside a college or institute. It covers Mess Rebates, Medical Reimbursements, and Fest Team Reimbursements, replacing a paper-based, multi-signature approval chain with a role-based online portal.

Students submit claims, multiple levels of staff and committee verifiers approve them in sequence, and the accounts team disburses the final refund, with a full audit trail at every step.

## Table of Contents

- [Problem Statement](#problem-statement)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles and Access Levels](#roles-and-access-levels)
- [Claim Lifecycle](#claim-lifecycle)
- [Key Features](#key-features)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Design Highlights](#design-highlights)

## Problem Statement

In most colleges, students who are absent from the mess, incur medical expenses, or spend their own money organizing a fest event have to:

- Fill out physical forms and get them signed by three or four different people (team coordinator, fest coordinator, mess manager or VP, accounts).
- Manually track receipts and transaction proofs.
- Wait weeks without visibility into where their claim is stuck.

Refund Hub gives every stakeholder (student, verifier, secretary, super admin) a dashboard suited to their role, moves each claim automatically through a defined approval pipeline, and logs every action.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, Radix UI / shadcn-style component library, MUI icons, React Router |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose ODM, hosted on MongoDB Atlas |
| Authentication | Custom email/password auth with bcrypt password hashing (session persisted client-side; JWT utilities included) |
| File Storage | Cloudinary (receipt and proof uploads via Multer and `multer-storage-cloudinary`) |
| Email | Nodemailer (Gmail SMTP) for verification emails and OTP-based password reset |
| Deployment | Vercel (Frontend) and Render (Backend)|

## Project Structure

```
Refund-Hub-fullstack-main/
├── frontend/                      # React + Vite client
│   └── src/
│       ├── Authentication_Page/   # Login, registration, forgot password, gateway
│       ├── Student_Page/          # Student dashboard, claim form, history, fest team views
│       ├── Secretary_Page/        # Role-specific secretary dashboards (Mess/Hospital, Fest, Accounts)
│       ├── SuperAdmin_Page/       # Portal settings, profile, super admin dashboard
│       ├── components/ui/         # Reusable design-system components (button, dialog, table, etc.)
│       ├── services/              # db_service.ts (API calls), cloudinary_service.ts (uploads)
│       └── hooks/                 # useAuth, useHistoryView
│
└── backend/                       # Node + Express API
    ├── server.js                  # App entry point: auth, users, fests, admin, settings routes
    ├── rebateform.js              # Claim submission logic (Mess / Fest / Medical)
    ├── verifyrebate.js            # Multi-stage approval and verification routes
    ├── mail.js                    # Email helper
    └── models/
        ├── user.js                # Student / Secretary / Admin schema
        ├── refundRequest.js       # Core claim schema (status pipeline, attachments, history)
        ├── fest.js                # Fest, FestMember, FestRefund schemas
        ├── secretary.js / secretaryModels.js
        ├── messClaim.js
        └── superadmin_setting.js  # Global portal settings and audit log
```

## Roles and Access Levels

Access is role-based and driven by the `role`, `userType`, `isSecretary`, and `isSuperAdmin` fields on the `User` model.

1. **Student**: Registers with roll number and bank details, submits Mess, Medical, and Fest claims, and tracks claim history and statistics.
2. **Fest Team Member (Sub-Coordinator, Coordinator, Fest Coordinator)**: A student can also hold a fest committee role. Higher roles can add or remove members below them and verify fest reimbursements raised by their team.
3. **Secretaries** (dashboards split by department):
   - **Mess/Hospital Secretary**: Verifies mess rebate and medical claims.
   - **Fest Secretary**: Manages fest coordinators and assigns or removes Fest Coordinators (maximum of 2 per fest per year).
   - **Accounts Secretary**: Handles the final disbursement stage. Marks claims as `REFUNDED`, generates the UTR / disbursement reference, and can place claims on hold.
4. **Super Admin (VP / Chief Admin)**: Configures global portal settings (rate limits, rebate rates, maximum claim caps, maintenance mode, registration open/close), views audit logs, and manages secretaries.

## Claim Lifecycle

Each claim (`RefundRequest`) carries a `status` that moves through a pipeline:

```
PENDING_TEAM_COORD -> PENDING_COORD -> PENDING_FEST_COORD ->
VERIFIED_MESS / VERIFIED_FEST / VERIFIED_MEDICAL ->
APPROVED -> PUSHED_TO_ACCOUNTS -> UNDER_PROCESS -> REFUNDED

A claim can be moved to REJECTED at any stage.
```

Every transition is appended to the claim's `history[]` array (who acted, when, and any remarks), providing a full audit trail. Transitions also enforce admin-configured business rules from `ServerSettings`:

- `messRebateRateDaily` multiplied by the capped `effectiveMessDays` gives the auto-calculated rebate amount.
- `maxFestReimbursement` and `maxMedicalReimbursement` set hard caps on claim amounts.
- `maxClaimsPerMonth` prevents spam submissions.
- `autoApproveBelow` allows claims under a threshold to skip manual approval.
- `portalActive`, `maintenanceMode`, and per-department portal toggles can shut down submissions instantly.

## Key Features

- **Multi-step approval engine** with role-gated actions. A Coordinator can only add Sub-Coordinators, only Fest Coordinators and Secretaries can remove Fest Coordinators, and only Accounts can mark a claim as refunded.
- **Email verification on signup** using a token-based, expiring link.
- **OTP-based password reset** with a 6-digit OTP, 2-minute expiry, and strong password enforcement via regex.
- **Brute-force protection**: failed login attempts are tracked, and the account locks for a configurable duration after a set number of failures.
- **File uploads to Cloudinary** with MIME-type whitelisting (JPG, PNG, PDF), per-file size limits, and upload timeout handling.
- **Global rate limiting middleware** using an in-memory sliding window per IP address.
- **Fest team management** with hierarchical roles (Fest Coordinator > Coordinator > Sub-Coordinator) and rank-based permission checks for adding and removing members.
- **Admin-configurable settings panel** for rebate rates, claim caps, maintenance mode, and registration toggle, all read live from a singleton `ServerSettings` document with no redeploy needed.
- **Audit logging** of secretary and admin actions (`AuditLog` model), viewable with search and pagination.
- **Student dashboard** with live statistics (total refunded, pending count, approvals this month) computed from the student's claims.
- **Keep-alive self-ping**: the backend pings its own `/api/health` endpoint every 14 minutes to prevent free-tier hosting (Render) from sleeping.

## API Endpoints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/register` | Student registration (roll number regex validation, bank detail validation) |
| POST | `/api/login` | Login with lockout protection |
| GET | `/api/verify/:token` | Email verification link handler |
| POST | `/api/forgot-password/send-otp` | Send OTP to email |
| POST | `/api/forgot-password/verify-otp` | Verify OTP |
| POST | `/api/forgot-password/reset` | Reset password with strong-password check |
| PUT | `/api/user/update` | Update profile and bank details |
| GET | `/api/dashboard/:studentId` | Student statistics and recent claims |
| POST | `/api/claims/mess`, `/fest`, `/medical` (`rebateform.js`) | Submit a claim with receipt uploads |
| GET/POST | `/api/verify/...` (`verifyrebate.js`) | Multi-stage claim verification |
| GET/POST/DELETE | `/api/fest-members*` | Fest team management (assign or remove Fest Coordinators, Coordinators, Sub-Coordinators) |
| GET | `/api/admin/claims`, `/api/admin/claims/:status` | Secretary and admin claim queues |
| POST | `/api/admin/update-status` | Move a claim to a new status |
| GET/PUT | `/api/settings` | Read and update global portal settings |
| GET | `/api/admin/audit-logs` | Paginated, searchable audit trail |
| POST/GET/DELETE | `/api/admin/secretaries*` | Manage secretary accounts |


## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB Atlas database
- A Cloudinary account
- A Gmail account with an app password for SMTP

Configure `backend/.env` and `frontend/.env` as shown above before starting the app. Registration and claim uploads depend on these credentials.

### Run the backend

```bash
cd backend
npm install
npm start          # starts Express on PORT (default 8000)
```

### Run the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev        # starts the Vite dev server on http://localhost:5173
```

## Design Highlights

- **Single source of truth for business rules**: rebate rates and caps are read from a singleton `ServerSettings` document, so an admin can change policy without a code deploy.
- **State machine modeling**: claim status is an explicit enum-driven state machine with a history log, a common pattern for approval systems such as loans, expense claims, and pull request reviews.
- **Server-side permission checks**: role and rank checks (for example, who can remove whom in fest teams) are enforced on the server, not just hidden in the UI.
- **Defensive validation**: roll numbers, IFSC codes, account numbers, phone numbers, and passwords are validated with regex rather than trusting client input.
