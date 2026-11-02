# Proficient Transforms – Production-Ready Integrated Business ERP

A comprehensive, production-grade enterprise resource planning (ERP) software built for a single company operating across three core business verticals: **Construction**, **Interior Design & Execution**, and **Land Development & Real Estate**.

## Architecture & Technology Stack
- **Framework:** Next.js 15 (App Router) + TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (Enterprise Navy/Charcoal & Neutral Slate palette)
- **Database Engine:** SQLite 3 with native SQL queries and `better-sqlite3` bindings (WAL mode, Foreign Keys enforced)
- **Validation:** Zod schemas for all inputs and API routes
- **Authentication & Security:** Argon2id password hashing, database-backed HTTP-only sessions, CSRF protection, and multi-dimensional RBAC

---

## Windows Installation & Setup Instructions

### Prerequisites
1. **Node.js:** Install Node.js LTS (v18.x or v20.x or v22.x) from [nodejs.org](https://nodejs.org/).
2. **Git:** Ensure Git for Windows is installed.

### Step 1: Clone or Extract Repository
Extract the `integrated-business-erp.zip` archive into your working directory.

### Step 2: Install Dependencies
Open Command Prompt (`cmd`) or PowerShell in the project root folder and run:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

### Step 4: Run Database Migrations & Seed Data
Initialize the SQLite database with DDL schemas, indexes, triggers, and default seed records:
```bash
npm run db:migrate
npm run db:seed
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.
