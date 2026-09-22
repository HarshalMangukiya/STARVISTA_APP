# STARVISTA – Production Backend Architecture

This document defines the architectural specification for the new production backend supporting the **STARVISTA – Hostel Management System** mobile application.

---

## 1. System Overview & Evolution

### Current Architecture (Legacy)
```
[ React Native Mobile Client (Android / iOS) ]
      │             │                │
      ▼             ▼                ▼
[Firebase Auth] [Firestore] [Cloudinary (Unsigned Preset)]
```

### New Production Architecture
```
┌────────────────────────────────────────────────────────┐
│     STARVISTA React Native Mobile App (Android / iOS)  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (v1) + JWT Bearer
                            ▼
┌────────────────────────────────────────────────────────┐
│          API Gateway / Reverse Proxy (Nginx)           │
│   • SSL Termination  • Compression  • Rate Limiting    │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             Node.js + Express.js + TypeScript          │
│   ┌────────────────────────────────────────────────┐   │
│   │ Middleware Layer:                              │   │
│   │ • Helmet (Security Headers)                    │   │
│   │ • CORS                                         │   │
│   │ • express-rate-limit (Redis Store)             │   │
│   │ • Auth & Token Rotation Middleware             │   │
│   │ • Role-Based Access Control (RBAC)             │   │
│   │ • Multi-Hostel Tenant Scoping Middleware       │   │
│   │ • Zod Schema Validation                        │   │
│   │ • Centralized AppError Handler                 │   │
│   └───────────────────────┬────────────────────────┘   │
│                           ▼                            │
│   ┌────────────────────────────────────────────────┐   │
│   │ Controller Layer (HTTP Request/Response)       │   │
│   └───────────────────────┬────────────────────────┘   │
│                           ▼                            │
│   ┌────────────────────────────────────────────────┐   │
│   │ Service Layer (Business Logic & Transactions)  │   │
│   └───────────────┬─────────────────┬──────────────┘   │
│                   │                 │                  │
│                   ▼                 ▼                  │
│   ┌──────────────────────┐   ┌──────────────────────┐  │
│   │ Repository Layer     │   │ External Integrations│  │
│   │ (Data Access via     │   │ • Cloudinary SDK     │  │
│   │  Prisma ORM)         │   │ • Firebase Admin     │  │
│   │                      │   │   (FCM Push Alerts)  │  │
│   └───────────┬──────────┘   └──────────────────────┘  │
└───────────────┼────────────────────────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │
│  (Database)  │ │ (Token &     │
│  • Normalized│ │  Rate Cache) │
│  • Multi-host│ └──────────────┘
│  • Indexed   │
└──────────────┘
```

---

## 2. Layer Responsibilities

1. **Routes (`src/routes/v1/`)**:
   - Maps URL endpoints and HTTP verbs.
   - Attaches validation and authorization middleware.
   - Does NOT contain any business logic or DB calls.
2. **Controllers (`src/controllers/`)**:
   - Parses HTTP request parameters, body, query, and authenticated user context.
   - Delegates execution to the corresponding Service method.
   - Formats uniform JSON responses using standard status codes.
3. **Services (`src/services/`)**:
   - Houses all core business logic (e.g., verifying bed availability before room allocation, enforcing capacity limits, calculating rent cycle status).
   - Manages interactive multi-record database transactions (`prisma.$transaction`).
   - Dispatches notifications via FCM and handles audit logging.
4. **Repositories (`src/repositories/`)**:
   - Encapsulates database queries using Prisma Client.
   - Provides clean abstraction over relational reads, writes, joins, and filtering.
5. **Prisma ORM & PostgreSQL**:
   - Manages connection pooling, schema migrations, foreign keys, and indexes.

---

## 3. Multi-Tenant Hostel Scoping

The system supports multiple hostels/properties seamlessly:

```
Platform Super Admin (Full Platform Access)
       │
       ▼
Hostel Owner / Property Admin (Owns one or more Hostels)
       │
       ▼
Hostel Staff / Warden (Assigned to specific Hostel)
       │
       ▼
Students / Residents (Assigned to a specific Room in a Hostel)
```

### Access Control Rules:
- Every hostel resource (`Room`, `Resident`, `RentCycle`, `PaymentRecord`) is linked to `property_id`.
- The `requireHostelAccess` middleware validates whether the requesting user is:
  1. `SUPER_ADMIN`, OR
  2. The `owner_id` of the property, OR
  3. An active `HostelStaff` member assigned to that `property_id`.
- Attempts to query or mutate a resource belonging to another hostel return `403 Forbidden`.

---

## 4. Authentication & Token Lifecycle

1. **Password Security**:
   - User passwords hashed using `bcrypt` (12 salt rounds) or `argon2id`.
   - Hashes are never returned in API responses.
2. **JWT Access Tokens**:
   - Short expiration: `15 minutes`.
   - Payload: `{ sub: userId, email, role, hostels: [...] }`.
   - Signed using `JWT_ACCESS_SECRET`.
3. **Refresh Tokens**:
   - Longer expiration: `7 days`.
   - Stored hashed in the PostgreSQL `RefreshToken` table (with revocation timestamp) and optional Redis tracking.
   - Rotated upon each refresh request (`POST /api/v1/auth/refresh`) to prevent replay attacks.
4. **Logout**:
   - Revokes refresh token in database/Redis.

---

## 5. Security Architecture

- **HTTP Protection**: `helmet` headers (HSTS, X-Content-Type-Options, Frameguard).
- **CORS**: Strict origin whitelist matching mobile app bundles and web admin dashboard.
- **Rate Limiting**: `express-rate-limit` backed by Redis:
  - Auth endpoints: 10 requests per 15 minutes.
  - General API endpoints: 100 requests per minute per IP/user.
- **Input Validation**: Strict `zod` schemas for every POST/PUT/PATCH endpoint with automatic rejection of unrecognized or malicious input.
- **SQL Injection Prevention**: Prepared statements guaranteed through Prisma ORM.

---

## 6. Caching Strategy (Redis)

- **Rate Limiter Store**: Atomic counter increments in Redis.
- **Revoked Token Blacklist**: Rapid O(1) checks during token verification.
- **Property Meta Cache**: High-read property summaries cached with 5-minute TTL, invalidated immediately on property update/delete.

---

## 7. Push Notifications (FCM)

- Mobile client registers device FCM token via `POST /api/v1/notifications/device-token`.
- Token is associated with `user_id` and platform (`android`/`ios`).
- Backend dispatches notifications for:
  - Rent due reminders (Upcoming / Overdue).
  - Room allocation notices.
  - Property updates.
