# SecureShare — Secure File Storage & Controlled Sharing System

**Academic Context:** BSc Computer Science — Semester 5 Project  
**Specification Version:** v1.0.0 (Production / Capstone Submission)

---

## 1. Project Overview

**SecureShare** is a full-stack, secure file storage, management, and controlled distribution platform engineered to enforce strict privacy, access isolation, and cryptographic control over shared digital assets.

SecureShare decouples metadata tracking from physical binary storage and enforces server-side authorization before file delivery. File metadata, folder hierarchies, stateful user sessions, and share configurations are persisted in a relational PostgreSQL database via Prisma ORM, while physical file binaries reside within an isolated, server-managed filesystem directory (`storage/uploads/`). Public sharing is governed by cryptographically random 128-bit tokens with optional salted PBKDF2 passphrase protection, time-to-live (TTL) expiration limits, and instantaneous link revocation.


> **Storage security note:** SecureShare currently provides access-controlled server filesystem storage; it does **not** encrypt uploaded file contents at rest. Passwords and share passphrases are hashed, and public share access is protected by secure tokens, optional passphrases, expiry, and revocation.

---

## 2. System Architecture

```
                          ┌───────────────────────────┐
                          │   React 19 + TypeScript   │
                          │   Vite + Tailwind CSS UI  │
                          └─────────────┬─────────────┘
                                        │ HTTP / JSON & Multipart Forms
                                        ▼
                          ┌───────────────────────────┐
                          │    Express + TypeScript   │
                          │      Backend Server       │
                          ├───────────────────────────┤
                          │  • Helmet & CORS Defense  │
                          │  • express-rate-limit     │
                          │  • Zod Schema Validation  │
                          │  • Stateful Auth Sessions │
                          │  • Stream Delivery Engine │
                          └──────┬─────────────┬──────┘
                                 │             │
                Relational Data  │             │  Physical Binary I/O
                & Token Hashes   │             │  (UUID Stored Files)
                                 ▼             ▼
             ┌──────────────────────┐       ┌──────────────────────┐
             │  PostgreSQL Database │       │ Server Filesystem    │
             │     (Prisma ORM)     │       │ `storage/uploads/`   │
             │                      │       │                      │
             │  • Users & Quotas    │       │  • Isolated storage  │
             │  • VerificationHash  │       │  • Path traversal    │
             │  • Sessions & TTL    │       │    protection        │
             │  • Folders & Files   │       │  • Streamed binary   │
             │  • Share Tokens      │       │    reads/writes      │
             └──────────────────────┘       └──────────────────────┘
```

### Component Breakdown
1. **Frontend Client**: React 19 SPA built with TypeScript, Vite, and Tailwind CSS. Provides an intuitive dashboard, folder directory explorer, search filtering, and public link access screens.
2. **Backend Server**: Node.js + Express REST API written in TypeScript. Enforces security headers (Helmet), cross-origin restrictions (CORS), endpoint rate limiting, and request validation (Zod).
3. **Database Layer**: PostgreSQL accessed through Prisma ORM. Guarantees relational referential integrity (foreign keys, cascading actions) and rapid index lookups.
4. **Binary Storage Engine**: Dedicated local filesystem directory (`storage/uploads/`). Files are stored with UUID identifiers, completely removing Base64 database bloat and enabling memory-efficient Node.js streaming.

---

## 3. Key Features

- **User Authentication & Session Management**:
  - Secure registration, login, and profile tracking.
  - Stateful session records stored in the database with configurable TTL.
  - Constant-time verification preventing timing side-channel attacks.

- **Cryptographic Email Verification**:
  - Unverified accounts cannot authenticate or access vault resources.
  - Cryptographically random 256-bit verification tokens (`crypto.randomBytes(32)`).
  - Only SHA-256 token hashes are stored in PostgreSQL (`tokenHash`); raw tokens are transmitted exclusively via email.
  - Account enumeration defense: Registration and resend endpoints return identical generic responses regardless of user existence.

- **Folder & File Organization**:
  - Create color-coded folders to categorize documents.
  - Real-time file search by filename across all folders.
  - Move documents between folders or root directory.
  - Rename files and folders with validation.
  - Deleting a folder safely cascades contained files to root rather than orphaning them.

- **Controlled Public Sharing**:
  - Generate unique 128-bit CSPRNG share tokens (`/share/:token`).
  - **Passphrase Protection**: Salted PBKDF2 passphrase validation required prior to unlocking file downloads.
  - **Time-to-Live Expiration**: Automatic access termination after 1 hour, 24 hours, 7 days, 30 days, or custom expiration period.
  - **Instant Link Revocation**: Immediate, atomic revocation by the file owner without caching delay.
  - Access analytics track public-link views and completed download streams.

- **Storage Quota & Accounting**:
  - User quota enforcement calculated against actual physical file sizes.
  - Real-time disk usage visualization broken down by document categories.

---

## 4. Security & Cryptographic Implementation Details

| Security Vector | Implementation Detail |
|---|---|
| **Password Derivation** | PBKDF2-HMAC-SHA512 with 16-byte cryptographically secure random salt and 100,000 iterations. |
| **Share Link Passphrases** | Salted PBKDF2-HMAC-SHA512 stored alongside share link records. Verified using `crypto.timingSafeEqual`. |
| **Verification Tokens** | 32-byte CSPRNG token generated on signup. Only `crypto.createHash('sha256').update(token).digest('hex')` is stored in the database. Tokens expire in 24 hours. |
| **Session Security** | Database-persisted session tokens (`crypto.randomBytes(32)`), verified on each authenticated API call. |
| **Path Traversal Defense** | Storage paths are verified using `path.resolve` and strict boundary validation against `UPLOAD_DIR`. Attempts to traverse outside the upload directory trigger an immediate 403 Forbidden. |
| **Input Validation** | All request payloads, queries, and parameters are validated using strict Zod schemas. |
| **HTTP Hardening** | Content Security Policy, X-Content-Type-Options, Frameguard via Helmet; IP-based rate limiting on sensitive routes. |

---

## 5. Storage Design: Filesystem vs Base64 Database Storage

In initial prototypes, storing files as Base64 strings directly in database rows resulted in severe memory spikes and ~33% storage size inflation. In SecureShare:
1. **Zero Database Bloat**: PostgreSQL stores only scalar metadata (name, size, MIME type, folder relation, timestamps, ownership).
2. **Streaming I/O**: Downloads and uploads use Node.js streams (`fs.createReadStream`, `fs.createWriteStream`) with chunked pipes, preventing server out-of-memory errors on large files.
3. **Collision Resistance**: Server filenames are generated as UUID v4 strings, decoupling the internal filesystem name from the user's uploaded filename.

---

## 6. Project Setup & Local Execution

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database
- NPM or PNPM package manager

### Environment Configuration
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

Ensure the following environment variables are defined:
```ini
DATABASE_URL="postgresql://username:password@localhost:5432/secureshare?schema=public"
PORT=3000
NODE_ENV=production
SHARE_ACCESS_SECRET="your-cryptographic-share-access-secret"

# SMTP Configuration (Optional in development; falls back to console logger)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="SecureShare <no-reply@secureshare.local>"
```

### Installation & Database Migration
```bash
# 1. Install dependencies
npm install

# 2. Run Prisma schema migration
npx prisma db push

# 3. Generate Prisma client
npx prisma generate
```

### Running the Application
```bash
# Start development server (Full-stack Express + Vite)
npm run dev

# Or build for production
npm run build
npm start
```
The application will be accessible at `http://localhost:3000`.

---

## 7. Submission Checklist

- [x] Full-stack architecture (React, TypeScript, Express, Prisma, PostgreSQL).
- [x] Cryptographic password hashing (PBKDF2-HMAC-SHA512).
- [x] Email verification flow with hashed token storage and enumeration defense.
- [x] True server filesystem storage in `storage/uploads/` with zero Base64 in PostgreSQL.
- [x] Path traversal protections and file size/type validation.
- [x] Password-protected, expiring, and revokable share links.
- [x] Clean, text-focused, professional landing page without placeholder or AI-generated images.
- [x] Real database data across all pages (Dashboard, Files, Folders, Shares, Storage, Settings).
- [x] No mock/demo persistence or demo credentials in the application source.
- [ ] Full integration test execution requires a configured PostgreSQL database and SMTP environment.
