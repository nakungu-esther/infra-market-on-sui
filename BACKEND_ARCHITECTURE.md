# Backend Architecture - Sui Infrastructure Service Discovery Platform

## 🏗️ Overview

This project uses a **hybrid architecture** combining:
- **Next.js API Routes** (Backend-as-Frontend) - Serves as the backend API
- **Turso Database** (SQLite) - Persistent data storage
- **Better-Auth** - Authentication system
- **Sui Blockchain** - Smart contracts for payments & entitlements

## 📂 Current Backend Structure

```
src/
├── app/
│   └── api/                      # Backend API Routes (Next.js)
│       ├── auth/
│       │   └── [...all]/
│       │       └── route.ts      # Better-auth endpoints
│       ├── services/
│       │   ├── route.ts          # GET /api/services (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts      # GET, PUT, DELETE /api/services/:id
│       ├── payments/
│       │   ├── checkout/
│       │   │   └── route.ts      # POST /api/payments/checkout
│       │   ├── entitlements/
│       │   │   └── route.ts      # GET /api/payments/entitlements
│       │   └── verify/
│       │       └── route.ts      # POST /api/payments/verify
│       └── admin/                # (To be implemented)
│
├── db/
│   ├── index.ts                  # Turso database client
│   └── schema.ts                 # Drizzle ORM schemas
│
├── lib/
│   ├── auth.ts                   # Better-auth server config
│   ├── auth-client.ts            # Better-auth client hooks
│   ├── api.ts                    # API client utilities
│   └── sui-client.ts             # Sui blockchain client
│
└── types/
    └── index.ts                  # TypeScript type definitions
```

## 🔧 Technology Stack

### Backend Runtime
- **Next.js 15 API Routes** - Serverless API endpoints
- **Node.js/Bun** - JavaScript runtime
- **TypeScript** - Type-safe development

### Database
- **Turso** (libSQL/SQLite) - Edge database
- **Drizzle ORM** - Type-safe database queries
- **Auto-migrations** - Handled by Drizzle

### Authentication
- **Better-Auth** - Modern auth library
- **Email/Password** - Primary auth method
- **Bearer Tokens** - API authentication
- **Session Management** - Server-side sessions

### Blockchain Integration
- **Sui JavaScript SDK** (@mysten/sui.js)
- **Sui dApp Kit** (@mysten/dapp-kit)
- **Wallet Connection** - Browser wallet integration

## 🔄 How It Works

### 1. **Authentication Flow**

```
Client → POST /api/auth/sign-up → Better-Auth → Database
                                       ↓
                              Session Created
                                       ↓
                              Bearer Token Issued
                                       ↓
                        Stored in localStorage
```

**Current Status:** ✅ Fully implemented
- Registration: `/register` page
- Login: `/login` page
- Session management: `useSession()` hook
- Protected routes: Middleware configured

### 2. **API Request Flow**

```
Client Component → fetch('/api/services')
                          ↓
            Next.js API Route Handler
                          ↓
            Database Query (Drizzle)
                          ↓
            JSON Response → Client
```

**Current Status:** ⚠️ Mock data (to be connected to database)

### 3. **Payment Flow (Planned)**

```
Client → Connect Wallet → Purchase Service
              ↓
    Sui Smart Contract (Move)
              ↓
    Emit Payment Event
              ↓
    Backend validates → Create entitlement
              ↓
    Update database → Grant access
```

**Current Status:** 🚧 Not yet implemented

## 📡 API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login user
- `POST /api/auth/sign-out` - Logout user
- `GET /api/auth/session` - Get current session

### Services
- `GET /api/services` - List all services (supports filtering)
- `POST /api/services` - Create new service (provider only)
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service (provider only)
- `DELETE /api/services/:id` - Delete service (provider/admin)

### Payments (Mock)
- `POST /api/payments/checkout` - Initiate payment
- `GET /api/payments/entitlements` - Get user entitlements
- `POST /api/payments/verify` - Verify payment status

## 💾 Database Schema

### User Table
```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Session Table
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);
```

### Services Table (To be implemented)
```sql
-- Will be created via database agent
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  provider_id TEXT REFERENCES user(id),
  category TEXT,
  service_type TEXT,
  pricing_model TEXT,
  price REAL,
  tokens_accepted TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Next Steps for Backend

### Phase 1: Database Integration (Current)
- [ ] Connect API routes to Turso database
- [ ] Create services table schema
- [ ] Implement CRUD operations with Drizzle
- [ ] Add data validation with Zod

### Phase 2: Smart Contracts (Week 5-7)
- [ ] Write Sui Move contracts for payments
- [ ] Deploy contracts to Testnet
- [ ] Integrate payment verification
- [ ] Implement entitlement system

### Phase 3: Usage Tracking (Week 8-10)
- [ ] Build API gateway plugin
- [ ] Implement quota tracking
- [ ] Create usage analytics endpoints
- [ ] Add rate limiting

## 🔐 Environment Variables

```bash
# Database (Turso)
TURSO_CONNECTION_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Authentication (Better-Auth)
BETTER_AUTH_SECRET=...

# Sui Network (Optional)
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## 🧪 Testing Backend APIs

You can test the backend using:

1. **curl** (command line)
```bash
# Register
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Frontend forms** (already implemented)
- Login: http://localhost:3000/login
- Register: http://localhost:3000/register

3. **Postman/Insomnia** (API testing tools)

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ HTTP/HTTPS
       ▼
┌─────────────────────┐
│   Next.js Server    │
│   API Routes        │
│  (Backend Logic)    │
└──────┬──────────────┘
       │
       ├────────► Turso Database
       │          (User data, Services)
       │
       ├────────► Better-Auth
       │          (Sessions, Auth)
       │
       └────────► Sui Blockchain
                  (Payments, Smart Contracts)
```

## 🎯 Key Differences from Separate Backend

### Traditional Separate Backend:
```
Frontend (React/Next.js) ←→ Backend API (Express/FastAPI) ←→ Database
     Port 3000                    Port 8000                PostgreSQL
```

### Current Architecture (Next.js API Routes):
```
Next.js App (Frontend + Backend API Routes) ←→ Turso Database
         Port 3000 (Unified)                   Edge Database
```

### Advantages:
✅ **Unified codebase** - Frontend and backend in one project
✅ **Type sharing** - TypeScript types shared across frontend/backend
✅ **Simplified deployment** - Single build, single deploy
✅ **Edge deployment** - Run close to users globally
✅ **Zero CORS issues** - Same origin for all requests

### When to add Separate Backend:
- Heavy background processing needed
- Microservices architecture required
- Non-JavaScript services needed
- Multiple client applications (mobile, desktop)

## 🎨 Current Status Summary

### ✅ Implemented
- Authentication system (login, register, session)
- Database connection (Turso + Drizzle)
- API route structure
- Frontend UI pages
- Sui wallet integration

### 🚧 In Progress
- Database schema for services
- CRUD operations for services
- Real data persistence

### 📋 Planned
- Smart contracts (Sui Move)
- Payment processing
- Usage tracking & monitoring
- Admin dashboard

---

**Note:** This is a modern, serverless architecture that uses Next.js API Routes as the backend. No separate backend server is needed for Phase 1. Smart contracts will be added in Phase 2 for blockchain functionality.
