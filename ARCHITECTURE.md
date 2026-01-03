# System Architecture - Real-Time Violation Monitoring

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ViolationsList.jsx                                       │  │
│  │  ├─ ViolationFilters.jsx                                  │  │
│  │  ├─ ViolationListItem.jsx (multiple)                      │  │
│  │  └─ ViolationDetailsModal.jsx                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▲  ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  useViolations Hook                                       │  │
│  │  ├─ State Management                                      │  │
│  │  ├─ API Calls                                             │  │
│  │  └─ WebSocket Integration                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▲  ▼                                  │
│  ┌─────────────────┐         ┌──────────────────────────────┐  │
│  │  API Service    │         │  WebSocket Service           │  │
│  │  (Axios)        │         │  - Connection Manager        │  │
│  │                 │         │  - Auto Reconnect            │  │
│  └─────────────────┘         └──────────────────────────────┘  │
│           │                              │                       │
└───────────┼──────────────────────────────┼───────────────────────┘
            │ HTTP/REST                    │ WebSocket
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Router (/api/v1)                                     │  │
│  │  ├─ /violations                                           │  │
│  │  │   ├─ GET / (list with filters)                        │  │
│  │  │   ├─ GET /{id} (details)                              │  │
│  │  │   ├─ PATCH /{id} (update)                             │  │
│  │  │   ├─ POST / (create)                                  │  │
│  │  │   ├─ GET /stats/count                                 │  │
│  │  │   └─ WS /ws (WebSocket)                               │  │
│  │  └─ /parking-lots                                         │  │
│  │      └─ GET /{id}/occupancy-history                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▲  ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WebSocket Connection Manager                             │  │
│  │  ├─ Active Connections Pool                               │  │
│  │  ├─ Broadcast to Subscribers                              │  │
│  │  └─ Disconnect Cleanup                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▲  ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SQLAlchemy ORM                                           │  │
│  │  ├─ Models (Violation, ParkingLot)                        │  │
│  │  ├─ Relationships                                         │  │
│  │  └─ Query Optimization (joinedload)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▲  ▼                                  │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  parking_lots                                             │  │
│  │  ├─ id (PK)                                               │  │
│  │  ├─ name, location, lat/lng                               │  │
│  │  ├─ legal_capacity, current_occupancy                     │  │
│  │  └─ is_active, timestamps                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▲                                     │
│                            │ (FK)                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  violations                                               │  │
│  │  ├─ id (PK)                                               │  │
│  │  ├─ parking_lot_id (FK)                                   │  │
│  │  ├─ occupancy_percentage, occupancy_count                 │  │
│  │  ├─ legal_capacity (denormalized)                         │  │
│  │  ├─ status (OPEN, ACKNOWLEDGED, RESOLVED)                 │  │
│  │  ├─ detected_at, acknowledged_at, resolved_at             │  │
│  │  ├─ acknowledged_by, resolved_by                          │  │
│  │  └─ notes, evidence URLs                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Loading Violations (Initial Load)

```
┌──────────┐  1. Component    ┌─────────────┐  2. HTTP GET    ┌─────────┐
│          │     Mounts        │             │    /violations  │         │
│  React   ├──────────────────►│ useViolations├────────────────►│FastAPI  │
│Component │                   │    Hook     │                 │  API    │
│          │                   │             │                 │         │
└──────────┘                   └─────────────┘                 └────┬────┘
     ▲                                                               │
     │                                                               │ 3. Query
     │                                                               ▼
     │                                                          ┌─────────┐
     │                           4. JSON Response               │PostgreSQL│
     │                          {violations: [...]}             │         │
     └──────────────────────────────────────────────────────────┤Database │
                     5. Update State & Render                   └─────────┘
```

### 2. Real-Time Update (New Violation)

```
┌──────────┐  1. POST        ┌─────────┐  2. Create    ┌─────────┐
│ External │  /violations    │FastAPI  │   in DB       │PostgreSQL│
│  System  ├────────────────►│  API    ├──────────────►│         │
│(IoT/User)│                 │         │               │         │
└──────────┘                 └────┬────┘               └─────────┘
                                  │
                                  │ 3. Broadcast via WebSocket
                                  ▼
                       ┌─────────────────────┐
                       │  ConnectionManager  │
                       │  (All Subscribers)  │
                       └──────────┬──────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │Client 1 │   │Client 2 │   │Client N │
              │         │   │         │   │         │
              └────┬────┘   └────┬────┘   └────┬────┘
                   │             │             │
                   │ 4. Receive  │             │
                   │    Update   │             │
                   ▼             ▼             ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │useVio   │   │useVio   │   │useVio   │
              │lations  │   │lations  │   │lations  │
              │Hook     │   │Hook     │   │Hook     │
              └────┬────┘   └────┬────┘   └────┬────┘
                   │             │             │
                   │ 5. Update   │             │
                   │    State    │             │
                   ▼             ▼             ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │UI       │   │UI       │   │UI       │
              │Updates  │   │Updates  │   │Updates  │
              └─────────┘   └─────────┘   └─────────┘
```

### 3. Status Update Flow

```
┌──────────┐  1. Click       ┌─────────────┐  2. PATCH       ┌─────────┐
│  Admin   │  "Acknowledge"  │             │   /violations/1 │         │
│  User    ├────────────────►│ ViolationsList├────────────────►│FastAPI  │
│          │                 │  Component  │   {status:...}  │  API    │
└──────────┘                 └─────────────┘                 └────┬────┘
                                                                   │
                                                                   │ 3. Update
                                                                   ▼
                                                              ┌─────────┐
                                                              │PostgreSQL│
                                    4. Return Updated         │         │
                     ┌──────────────────────────────────────┤         │
                     │              Violation Object         └─────────┘
                     ▼
              ┌─────────────┐
              │ FastAPI     │  5. Broadcast Update
              │ Endpoint    ├──────────────┐
              └─────────────┘              │
                     │                     │
                     │ 6. Response         │ 7. WebSocket
                     │    to Caller        │    Broadcast
                     ▼                     ▼
              ┌─────────────┐       ┌─────────────────┐
              │ Original    │       │ All Other       │
              │ Client      │       │ Clients         │
              │ (Immediate) │       │ (Real-time)     │
              └─────────────┘       └─────────────────┘
```

### 4. Filter/Sort Flow

```
┌──────────┐  1. Change      ┌─────────────┐  2. Update      ┌─────────────┐
│  Admin   │  Filter         │ViolationsList│   Filter State │ useViolations│
│  User    ├────────────────►│ Component   ├────────────────►│    Hook     │
│          │  (e.g., OPEN)   │             │                 │             │
└──────────┘                 └─────────────┘                 └──────┬──────┘
                                                                     │
                                                                     │ 3. Re-fetch
                                                                     │    with new
                                                                     │    params
                                                                     ▼
                                                                ┌─────────┐
                                                                │FastAPI  │
                                                                │  API    │
                                                                └────┬────┘
                                                                     │
                                                                     │ 4. Query
                                                                     │    Filtered
                                                                     ▼
                                                                ┌─────────┐
                     5. Return Filtered Results                │PostgreSQL│
                     ┌──────────────────────────────────────────┤         │
                     │                                          └─────────┘
                     ▼
              ┌─────────────┐  6. Update State
              │useViolations├───────────────┐
              │    Hook     │               │
              └─────────────┘               │
                                            ▼
                                     ┌─────────────┐
                                     │ViolationsList│
                                     │  Component  │
                                     └──────┬──────┘
                                            │
                                            │ 7. Re-render
                                            │    with new
                                            │    violations
                                            ▼
                                     ┌─────────────┐
                                     │   Updated   │
                                     │     UI      │
                                     └─────────────┘
```

## Component Hierarchy

### Frontend Component Tree

```
App.jsx
│
├─ Navbar
│  ├─ Brand
│  └─ Menu
│
└─ ViolationsList.jsx (Main Container)
   │
   ├─ Header
   │  ├─ Title
   │  └─ Refresh Button
   │
   ├─ Statistics Cards
   │  ├─ Open Violations Card
   │  ├─ Critical Violations Card
   │  └─ Total Showing Card
   │
   ├─ ViolationFilters.jsx
   │  ├─ Status Select
   │  ├─ Sort Select
   │  ├─ From Date Input
   │  └─ To Date Input
   │
   ├─ Violations List Container
   │  └─ ViolationListItem.jsx (repeated)
   │     ├─ Header
   │     │  ├─ Title (Lot Name)
   │     │  ├─ Critical Badge (conditional)
   │     │  └─ Status Badge
   │     ├─ Body
   │     │  ├─ Info Items
   │     │  │  ├─ Location
   │     │  │  ├─ Occupancy
   │     │  │  └─ Timestamp
   │     │  └─ Action Buttons
   │     │     ├─ View Details
   │     │     ├─ Acknowledge (conditional)
   │     │     └─ Resolve (conditional)
   │
   └─ ViolationDetailsModal.jsx (conditional)
      ├─ Modal Header
      │  ├─ Title
      │  └─ Close Button
      ├─ Modal Body
      │  ├─ Lot Information Section
      │  ├─ Violation Details Section
      │  ├─ Occupancy History Chart
      │  │  └─ Recharts LineChart
      │  ├─ Evidence Section (conditional)
      │  └─ Notes Section
      │     └─ Textarea
      └─ Modal Footer
         ├─ Acknowledge Button (conditional)
         ├─ Resolve Button (conditional)
         └─ Close Button
```

## Backend Module Structure

```
app/
│
├─ main.py (FastAPI App)
│  ├─ CORS Middleware
│  ├─ API Router
│  └─ Database Init
│
├─ core/
│  ├─ config.py (Settings)
│  └─ websocket.py (ConnectionManager)
│
├─ db/
│  └─ base.py (Database Session)
│
├─ models/
│  ├─ parking_lot.py (ParkingLot Model)
│  └─ violation.py (Violation Model)
│
├─ schemas/
│  └─ violation.py (Pydantic Schemas)
│
└─ api/v1/
   ├─ router.py (API Router)
   └─ endpoints/
      ├─ violations.py (Violation Endpoints)
      └─ parking_lots.py (Parking Lot Endpoints)
```

## Technology Stack

### Frontend
```
┌─────────────────────────────────┐
│ React 18                        │  Component Framework
├─────────────────────────────────┤
│ Vite                            │  Build Tool & Dev Server
├─────────────────────────────────┤
│ Axios                           │  HTTP Client
├─────────────────────────────────┤
│ Recharts                        │  Charts Library
├─────────────────────────────────┤
│ date-fns                        │  Date Formatting
├─────────────────────────────────┤
│ lucide-react                    │  Icon Library
├─────────────────────────────────┤
│ WebSocket API (native)          │  Real-time Communication
├─────────────────────────────────┤
│ CSS3 (Custom)                   │  Styling
└─────────────────────────────────┘
```

### Backend
```
┌─────────────────────────────────┐
│ FastAPI                         │  Web Framework
├─────────────────────────────────┤
│ Uvicorn                         │  ASGI Server
├─────────────────────────────────┤
│ SQLAlchemy 2.0                  │  ORM
├─────────────────────────────────┤
│ Pydantic 2.0                    │  Data Validation
├─────────────────────────────────┤
│ PostgreSQL                      │  Database
├─────────────────────────────────┤
│ psycopg2                        │  PostgreSQL Driver
├─────────────────────────────────┤
│ WebSockets                      │  Real-time Protocol
├─────────────────────────────────┤
│ python-dotenv                   │  Environment Config
└─────────────────────────────────┘
```

## Network Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Client Browser (localhost:3000)                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React App                                          │  │
│  │  - Components                                       │  │
│  │  - State Management                                 │  │
│  │  - WebSocket Connection                             │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────┬─────────────────┬────────────────────────┘
                │                 │
    HTTP/REST   │                 │ WebSocket (WS)
    (Port 8000) │                 │ (Port 8000)
                │                 │
                ▼                 ▼
┌──────────────────────────────────────────────────────────┐
│  Vite Dev Server (Proxy)                                 │
│  - Proxies /api → localhost:8000                         │
│  - Proxies /ws → ws://localhost:8000                     │
└───────────────┬─────────────────┬────────────────────────┘
                │                 │
                ▼                 ▼
┌──────────────────────────────────────────────────────────┐
│  FastAPI Backend (localhost:8000)                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ASGI Application (Uvicorn)                        │  │
│  │  - REST API Endpoints                               │  │
│  │  - WebSocket Endpoints                              │  │
│  │  - CORS Middleware                                  │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────┬──────────────────────────────────────────┘
                │
                │ TCP/IP
                │ (Port 5432)
                ▼
┌──────────────────────────────────────────────────────────┐
│  PostgreSQL Database (localhost:5432)                    │
│  - parking_lots table                                    │
│  - violations table                                      │
│  - Indexes on status, detected_at                        │
└──────────────────────────────────────────────────────────┘
```

## Security Architecture (Current & Future)

```
┌─────────────────────────────────────────────────────────┐
│  CURRENT SECURITY MEASURES                              │
├─────────────────────────────────────────────────────────┤
│  ✓ SQL Injection Prevention (SQLAlchemy ORM)            │
│  ✓ XSS Prevention (React Auto-Escaping)                 │
│  ✓ CORS Configuration (Allowed Origins)                 │
│  ✓ Input Validation (Pydantic Schemas)                  │
│  ✓ Type Safety (Python Type Hints)                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FUTURE SECURITY ENHANCEMENTS                           │
├─────────────────────────────────────────────────────────┤
│  ⏳ JWT Authentication                                   │
│  ⏳ Role-Based Access Control (RBAC)                     │
│  ⏳ Rate Limiting (per user/IP)                          │
│  ⏳ WebSocket Authentication                             │
│  ⏳ Audit Logging (all actions)                          │
│  ⏳ HTTPS/TLS (production)                               │
│  ⏳ API Key Management                                   │
│  ⏳ Data Encryption at Rest                              │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Future)

```
┌────────────────────────────────────────────────────────────────┐
│  Load Balancer (NGINX)                                         │
└───────────────┬────────────────────────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│ Frontend     │  │ Frontend     │  (Static Files - CDN)
│ Container    │  │ Container    │
│ (Nginx)      │  │ (Nginx)      │
└──────────────┘  └──────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│ Backend      │  │ Backend      │  (FastAPI - Kubernetes Pods)
│ Container    │  │ Container    │
│ (Uvicorn)    │  │ (Uvicorn)    │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
        ┌──────────────┐
        │ PostgreSQL   │  (Managed DB Service)
        │ Primary      │
        └──────┬───────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ PostgreSQL   │  (Read Replicas)
│ Replica 1    │  │ Replica 2    │
└──────────────┘  └──────────────┘
```

---

## Performance Optimization Strategies

1. **Database**:
   - Indexed columns: `status`, `detected_at`, `parking_lot_id`
   - Eager loading with `joinedload` (prevents N+1)
   - Connection pooling
   - Query result caching (future)

2. **API**:
   - Pagination (default 100 items)
   - Gzip compression
   - Async endpoints
   - Response caching headers (future)

3. **WebSocket**:
   - Connection pooling
   - Message batching (future)
   - Compression (future)

4. **Frontend**:
   - Code splitting (Vite automatic)
   - Lazy loading modals
   - React.memo for expensive components
   - Virtual scrolling for large lists (future)

---

**This architecture supports the current requirements and is designed to scale for future enhancements!**
