# STARVISTA – PostgreSQL Database Design & Schema Specification

This document details the normalized relational database schema designed for PostgreSQL via Prisma ORM, replacing the legacy Firestore document model.

---

## 1. Design Principles & Goals

1. **Entity Normalization**: Eliminates nested subcollections while preserving fast querying through foreign keys and indexed lookups.
2. **Scalable Primary Keys**: Uses `UUID v4` (`@default(uuid())`) across all primary entities to avoid sequential enumeration attacks and ease distributed insertions.
3. **Multi-Tenant Scoping**: All operational entities (`Room`, `Resident`, `RentCycle`, `PaymentRecord`) include foreign key references to `property_id`.
4. **Soft Deletion**: Implements `is_active: Boolean` on entities (`Property`, `Room`, `Resident`) to maintain historical auditing and prevent catastrophic cascading data loss.
5. **Auditing & Timestamps**: Every model maintains `created_at` and `updated_at` timestamps.

---

## 2. Entity Relationship Overview

```
             ┌──────────────┐
             │     User     │
             └──┬───────────┘
                │ 1
                │
                │ creates / owns
                │
                ▼ *
             ┌──────────────┐          * ┌─────────────┐
             │   Property   │◄───────────┤ HostelStaff │
             └──┬───────────┘            └─────────────┘
                │ 1
                │ has
                ▼ *
             ┌──────────────┐
             │     Room     │
             └──┬───────────┘
                │ 1
                │ houses
                ▼ *
             ┌──────────────┐
             │   Resident   │
             └──┬───────────┘
                │ 1
                │ tracks
                ▼ *
       ┌─────────────────┐
       │    RentCycle    │
       │ (PaymentRecord) │
       └─────────────────┘
```

---

## 3. Entity Definitions & Specifications

### 1. `users`
Represents application accounts (Property Owners, Admins, Wardens, Staff, Students).
- `id`: UUID (PK)
- `email`: VARCHAR(255) (UNIQUE, NOT NULL, INDEXED)
- `password_hash`: VARCHAR(255) (NOT NULL)
- `first_name`: VARCHAR(100) (NULLABLE)
- `last_name`: VARCHAR(100) (NULLABLE)
- `phone`: VARCHAR(20) (NULLABLE, INDEXED)
- `role`: ENUM (`SUPER_ADMIN`, `HOSTEL_ADMIN`, `WARDEN`, `STAFF`, `STUDENT`) DEFAULT `HOSTEL_ADMIN`
- `is_active`: BOOLEAN DEFAULT true
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 2. `refresh_tokens`
Stores hashed revocable refresh tokens for secure JWT authentication.
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id`, ON DELETE CASCADE)
- `token_hash`: VARCHAR(255) (NOT NULL, UNIQUE)
- `expires_at`: TIMESTAMPTZ (NOT NULL)
- `revoked`: BOOLEAN DEFAULT false
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 3. `properties` (Hostels / PGs)
Represents hostel properties owned by users.
- `id`: UUID (PK)
- `name`: VARCHAR(150) (NOT NULL)
- `address`: TEXT (NOT NULL)
- `image_url`: TEXT (NULLABLE)
- `owner_id`: UUID (FK -> `users.id`, INDEXED)
- `total_rooms`: INTEGER DEFAULT 0
- `is_active`: BOOLEAN DEFAULT true
- `firestore_id`: VARCHAR(100) (NULLABLE, UNIQUE for migration idempotency)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 4. `hostel_staff`
Maps staff or wardens to specific hostels for multi-tenant delegation.
- `id`: UUID (PK)
- `hostel_id`: UUID (FK -> `properties.id`, ON DELETE CASCADE)
- `user_id`: UUID (FK -> `users.id`, ON DELETE CASCADE)
- `role`: VARCHAR(50) DEFAULT 'STAFF'
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE constraint: `(hostel_id, user_id)`

### 5. `rooms`
Rooms within a hostel property.
- `id`: UUID (PK)
- `property_id`: UUID (FK -> `properties.id`, ON DELETE CASCADE, INDEXED)
- `room_no`: VARCHAR(50) (NOT NULL)
- `capacity`: INTEGER (NOT NULL, CHECK > 0)
- `monthly_rent`: DECIMAL(10, 2) (NOT NULL, CHECK >= 0)
- `is_active`: BOOLEAN DEFAULT true
- `firestore_id`: VARCHAR(100) (NULLABLE, UNIQUE)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE constraint: `(property_id, room_no)`

### 6. `residents`
Tenants or students residing in hostel rooms.
- `id`: UUID (PK)
- `property_id`: UUID (FK -> `properties.id`, ON DELETE CASCADE, INDEXED)
- `room_id`: UUID (FK -> `rooms.id`, ON DELETE CASCADE, INDEXED)
- `name`: VARCHAR(150) (NOT NULL)
- `gender`: ENUM (`MALE`, `FEMALE`, `OTHER`) DEFAULT `MALE`
- `email`: VARCHAR(255) (NULLABLE)
- `phone`: VARCHAR(30) (NOT NULL, INDEXED)
- `remarks`: TEXT (NULLABLE)
- `is_active`: BOOLEAN DEFAULT true
- `firestore_id`: VARCHAR(100) (NULLABLE, UNIQUE)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 7. `rent_cycles` (Payment Records)
Tracks rent periods, payment due dates, and status for each resident.
- `id`: UUID (PK)
- `resident_id`: UUID (FK -> `residents.id`, ON DELETE CASCADE, INDEXED)
- `property_id`: UUID (FK -> `properties.id`, ON DELETE CASCADE, INDEXED)
- `room_id`: UUID (FK -> `rooms.id`, ON DELETE CASCADE)
- `start_date`: DATE (NOT NULL)
- `end_date`: DATE (NOT NULL, INDEXED)
- `amount`: DECIMAL(10, 2) (NOT NULL)
- `status`: ENUM (`PAID`, `UPCOMING`, `PENDING`) DEFAULT `PAID`
- `notes`: TEXT (NULLABLE)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 8. `device_tokens`
Device push notification tokens for Firebase Cloud Messaging.
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id`, ON DELETE CASCADE, INDEXED)
- `token`: TEXT (NOT NULL, UNIQUE)
- `platform`: ENUM (`ANDROID`, `IOS`, `WEB`) DEFAULT `ANDROID`
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 9. `audit_logs`
Immutable audit records for compliance and administrative actions.
- `id`: UUID (PK)
- `actor_id`: UUID (NULLABLE, FK -> `users.id`, ON DELETE SET NULL)
- `action`: VARCHAR(100) (NOT NULL)
- `entity`: VARCHAR(100) (NOT NULL)
- `entity_id`: VARCHAR(100) (NOT NULL)
- `metadata`: JSONB (NULLABLE)
- `ip_address`: VARCHAR(45) (NULLABLE)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- INDEX on `(entity, entity_id)` and `created_at`
