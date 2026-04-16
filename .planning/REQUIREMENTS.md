# REQUIREMENTS.md — Sakha Farm Management System

## Overview
Sistem manajemen peternakan ayam plasma yang mengkonsolidasi data dari multiple Excel sheets menjadi satu aplikasi web terpusat.

## Functional Requirements

### FR-1: Multi-Tenancy Management
- **Description**: Sistem mendukung multiple perusahaan peternakan (tenant)
- **Acceptance Criteria**:
  - Setiap tenant memiliki data terisolasi penuh
  - Tenant diidentifikasi via subdomain atau header
  - Super admin bisa manage semua tenant

### FR-2: Unit Management
- **Description**: CRUD Unit peternakan (e.g., Unit Kuningan, Unit Bojonegoro)
- **Acceptance Criteria**:
  - Unit belongs to tenant
  - Unit memiliki nama, lokasi, kode unik
  - Satu tenant punya banyak unit

### FR-3: Plasma Management
- **Description**: CRUD data peternak plasma
- **Acceptance Criteria**:
  - Plasma belongs to Unit
  - Data: nama plasma, alamat, kontak, kapasitas kandang
  - Satu unit punya banyak plasma

### FR-4: Cycle (Siklus) Management
- **Description**: Manajemen siklus pemeliharaan per plasma
- **Acceptance Criteria**:
  - Cycle belongs to Plasma
  - Data: siklus ke-n, jenis DOC (CP/Patriot/Ayam Unggul/MBU), tanggal Chick-In, populasi awal
  - Status siklus: Active, Completed, Failed
  - Satu plasma punya banyak siklus (historis)

### FR-5: Daily Recording (Recording Harian)
- **Description**: Input data harian per siklus
- **Acceptance Criteria**:
  - Recording belongs to Cycle
  - Data: tanggal, ayam mati, ayam afkir, sisa populasi, bobot badan (BW), umur ayam (hari)
  - Auto-calculate: deviasi BW (Actual - Standard), cumulative mortality
  - Satu siklus punya banyak recording (per hari)

### FR-6: Feed Product Master
- **Description**: Master data jenis pakan
- **Acceptance Criteria**:
  - Data: kode pakan (BR10/BR11/BSP/281/GF-series/B-series), nama, satuan default
  - Fleksibel untuk menambah jenis pakan baru
  - Import dari CSV saat user menyediakan file

### FR-7: Feed Stock & Movement
- **Description**: Tracking stok pakan per plasma
- **Acceptance Criteria**:
  - Feed In: Surat Jalan menambah stok plasma
  - Feed Out: Recording pemakaian mengurangi stok
  - Stok dihitung dalam Zak dan Kg (1 Zak = 50 Kg)
  - Auto-calculate sisa stok real-time
  - Transaction: stock update atomik

### FR-8: Standard Comparison
- **Description**: Perbandingan otomatis Actual vs Standard
- **Acceptance Criteria**:
  - Tabel standard BW per umur (hari) per jenis DOC
  - Tabel standard FCR per umur per jenis DOC
  - Auto-calculate deviasi saat recording diinput
  - Alert jika deviasi melebihi threshold

### FR-9: Performance Metrics
- **Description**: Kalkulasi otomatis FCR, IP, SR
- **Acceptance Criteria**:
  - FCR = Total Feed Consumed (kg) / Total Weight Gain (kg)
  - SR = (Final Population / Initial Population) × 100
  - IP = (SR% × Average BW × 10) / (FCR × Days) × 100
  - Metrics ditampilkan di dashboard dan report

### FR-10: Inventory Resume
- **Description**: Rekapitulasi stok per unit/pusat
- **Acceptance Criteria**:
  - Resume stock: total stok per jenis pakan per unit
  - Filter by: unit, tanggal, jenis pakan
  - Export ke Excel/PDF

### FR-11: Audit Trail
- **Description**: Logging semua perubahan data
- **Acceptance Criteria**:
  - Setiap create/update/delete tercatat
  - Data: user_id, action, table_name, record_id, old_value, new_value, timestamp
  - Audit log immutable (tidak bisa dihapus user biasa)

### FR-12: RBAC Manager (Role-Based Access Control)
- **Description**: Superadmin dapat mengelola roles dan permissions secara dinamis melalui UI
- **Acceptance Criteria**:
  - **Role CRUD**: Create, read, update, delete roles (Super Admin, Admin Unit, Admin Plasma, Viewer, + custom roles)
  - **Permission CRUD**: Define permissions per resource (e.g., `flock.create`, `feed.read`, `recording.write`)
  - **Role-Permission Assignment**: Superadmin dapat assign/deny permissions ke role via UI
  - **Permission Categories**: Organized by module (flock, feed, recording, inventory, user, rbac, audit)
  - **Actions per Permission**: allow, deny, read-only
  - **Validation**: Cannot delete role that has active users assigned
  - **Audit Trail**: All RBAC changes logged (who changed what permission/role)
  - **Default Roles**: System ships with 4 default roles that cannot be deleted

### FR-13: User Management Module (Superadmin Only)
- **Description**: Superadmin dapat membuat dan mengelola user accounts
- **Acceptance Criteria**:
  - **User CRUD**: Create, read, update, deactivate/activate users
  - **User Creation Form**: Name, email, password (auto-generated or manual), role assignment, tenant assignment
  - **Password Management**: Force password change on first login, password reset by superadmin
  - **User Status**: Active, Inactive, Locked (after brute-force attempts)
  - **Bulk Operations**: Import users from CSV, bulk role assignment
  - **User Search & Filter**: By name, email, role, tenant, status
  - **Validation**: Email uniqueness, password complexity, role must exist
  - **Audit Trail**: User creation/deletion logged with actor info

### FR-14: Session & Cookie Management
- **Description**: Secure session handling with Redis-backed storage
- **Acceptance Criteria**:
  - Session creation on successful login
  - Session invalidation on logout, password change, role change
  - Auto-expire after 24 hours of inactivity
  - httpOnly + Secure + SameSite=Strict cookies
  - CSRF protection via double-submit cookie pattern
  - Session list view for admin (active sessions per user)
  - Force logout: admin can terminate any user session

## Non-Functional Requirements

### NFR-1: Performance
- API response < 200ms untuk query resume stock
- Support 1000+ concurrent users
- Pagination untuk semua list endpoint

### NFR-2: Data Integrity
- DECIMAL(10,3) untuk semua nilai berat (kg)
- Database transactions untuk operasi yang mengubah multiple tabel
- Foreign key constraints di semua relasi

### NFR-3: Scalability
- Index pada kolom tanggal dan foreign keys
- Redis caching untuk query yang sering diakses
- Horizontal scaling ready (stateless API)

### NFR-4: Security
- JWT authentication
- Tenant isolation di setiap query
- Input validation di semua endpoint
- Rate limiting

## Data Model (High-Level)

```
Tenant (1) ──→ (N) Unit (1) ──→ (N) Plasma (1) ──→ (N) Cycle (1) ──→ (N) DailyRecording
                                                                    (1) ──→ (N) FeedMovement
Tenant (1) ──→ (N) User
FeedProduct (1) ──→ (N) FeedMovement
Standard (1) ──→ (N) Cycle (via DOC type)
AuditLog (N) ──→ references all tables
```

## Out of Scope (Future Phases)
- Mobile app
- IoT integration (sensor kandang)
- Predictive analytics / ML
- Billing & invoicing
- Notification system (WhatsApp/Email)
