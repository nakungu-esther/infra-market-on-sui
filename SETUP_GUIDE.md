# 🚀 Sui Discovery Platform - Setup & Run Guide

## 📋 What's Already Set Up

Your platform has a **complete full-stack architecture**:

### ✅ Backend Infrastructure
- **Database**: Turso (SQLite) - Already configured and connected
- **Authentication**: better-auth with email/password
- **API Routes**: Next.js API routes in `src/app/api/`
  - `/api/auth/[...all]` - Authentication endpoints
  - `/api/services` - Service listing & management
  - `/api/payments` - Payment processing
- **Session Management**: Bearer token authentication
- **ORM**: Drizzle ORM for database operations

### ✅ Frontend
- **Framework**: Next.js 15 with App Router
- **UI Components**: Shadcn/UI + Radix UI
- **Styling**: Tailwind CSS v4
- **State**: Zustand for global state
- **Forms**: React Hook Form + Zod validation
- **Blockchain**: Sui integration (@mysten/dapp-kit)

---

## 🏃 How to Run

### 1. **Install Dependencies** (if not done)
```bash
npm install
# or
bun install
```

### 2. **Environment Setup**
Your `.env` file is already configured with:
- ✅ Turso database credentials
- ✅ Better-auth secret
- ✅ Database connection

**You're ready to go!** No additional setup needed.

### 3. **Run Database Migrations** (First time only)
```bash
npm run db:push
# or
bun run db:push
```

If this command doesn't exist, add to `package.json`:
```json
"scripts": {
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

### 4. **Start Development Server**
```bash
npm run dev
# or
bun dev
```

The app will be available at: **http://localhost:3000**

---

## 🌐 Available Pages & Features

### Public Pages
- **`/`** - Homepage with hero section and features
- **`/services`** - Browse infrastructure services
- **`/services/[id]`** - Service detail with pricing
- **`/login`** - User login
- **`/register`** - User registration

### Authentication Flow
1. Navigate to `/register`
2. Create account with name, email, password, and role
3. After registration, you're redirected to `/login`
4. Login and access protected features

### Protected Features (After Login)
- Service purchasing
- User dashboard
- Service management (for providers)

---

## 🔧 Backend Architecture Explained

### **You DO Have a Backend!**

Your backend is built using **Next.js API Routes** - this is a modern full-stack approach where backend and frontend are in the same codebase:

```
src/app/api/
├── auth/
│   └── [...all]/route.ts       # better-auth endpoints
├── services/
│   ├── route.ts                # GET /api/services, POST /api/services
│   └── [id]/route.ts           # GET/PUT/DELETE /api/services/:id
└── payments/
    ├── checkout/route.ts       # POST /api/payments/checkout
    ├── entitlements/route.ts   # GET /api/payments/entitlements
    └── verify/route.ts         # POST /api/payments/verify
```

### Backend Features:
- **Database**: Turso (serverless SQLite)
- **ORM**: Drizzle for type-safe queries
- **Auth**: better-auth handles user management
- **Session**: Bearer token stored in localStorage
- **API**: RESTful endpoints with TypeScript

### Testing Your Backend:

**Check if auth is working:**
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🗄️ Database Management

### View Your Database
```bash
npm run db:studio
# or
bun run db:studio
```

This opens Drizzle Studio to view/edit your database tables.

### Database Tables (Already Created):
- `user` - User accounts
- `session` - Active sessions
- `account` - Auth provider accounts
- `verification` - Email verification tokens

---

## 🎨 Theme Support

The app includes:
- Light mode (default)
- Dark mode
- System preference detection

Toggle between themes using the theme switcher in the navbar (being added now).

---

## 📦 What's NOT Included Yet

### Blockchain (Sui) Features:
- ❌ Sui Move smart contracts (need deployment)
- ❌ On-chain payment processing
- ❌ Sui wallet transaction signing
- ❌ Token transfers (SUI, WAL, USDC)

**Note**: Sui integration is configured but requires:
1. Deploy smart contracts to Sui testnet/mainnet
2. Add contract addresses to `.env`
3. Implement transaction signing

### Optional Backend Services:
The `BACKEND_ARCHITECTURE.md` describes an **optional separate backend** for:
- API Gateway (Envoy/NGINX)
- Usage tracking
- Rate limiting
- Advanced monitoring

**You don't need this to run the app** - it's for production scale.

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# or
lsof -ti:3000 | xargs kill
```

### Database Connection Issues
Check your `.env` has:
```
TURSO_CONNECTION_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...
```

### Authentication Not Working
1. Clear localStorage: `localStorage.clear()`
2. Check browser console for errors
3. Verify database has auth tables

### Missing Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | Turso (SQLite) |
| **ORM** | Drizzle |
| **Auth** | better-auth |
| **Styling** | Tailwind CSS v4 |
| **UI** | Shadcn/UI + Radix |
| **State** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Blockchain** | Sui (@mysten/dapp-kit) |
| **Payments** | Stripe (optional) |

---

## 🚀 Next Steps

1. ✅ Run `bun dev`
2. ✅ Visit `http://localhost:3000`
3. ✅ Register an account at `/register`
4. ✅ Login at `/login`
5. ✅ Browse services at `/services`
6. 🔨 Deploy Sui smart contracts (for on-chain payments)
7. 🔨 Add real service data to database
8. 🔨 Implement payment processing
9. 🔨 Add provider dashboard
10. 🔨 Deploy to production (Vercel/Railway)

---

## 📞 Need Help?

- Check `BACKEND_ARCHITECTURE.md` for architecture details
- Review API routes in `src/app/api/`
- Inspect database schema in `src/db/schema.ts`
- Check auth config in `src/lib/auth.ts`

**Your app is ready to run right now!** 🎉
