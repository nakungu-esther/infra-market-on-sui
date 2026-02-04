# Sui Infrastructure Platform - Implementation Guide

## 🎯 Project Overview

A comprehensive infrastructure service discovery platform for the Sui blockchain with onchain payments and usage tracking.

## ✅ Completed Features

### Phase 1: Service Discovery Portal (100% Complete)
- ✅ Full service CRUD operations
- ✅ Advanced filtering and search
- ✅ Provider dashboard for service management
- ✅ Admin moderation interface
- ✅ Tag management system
- ✅ JSON/YAML export endpoints
- ✅ Role-based access control (Admin, Provider, Developer)

### Phase 2: Onchain Payments (100% Complete)
- ✅ Sui wallet integration (@mysten/dapp-kit)
- ✅ Multi-token support (SUI, WAL, USDC)
- ✅ Pricing tier management (Free, Basic, Pro, Enterprise)
- ✅ Entitlement system with quota tracking
- ✅ Payment checkout dialog with wallet connection
- ✅ Transaction verification and recording

### Phase 3: Usage Tracking (100% Complete)
- ✅ Real-time usage monitoring dashboard
- ✅ Quota tracking and enforcement APIs
- ✅ Usage statistics and analytics
- ✅ Entitlement verification endpoints
- ✅ API gateway integration documentation
- ✅ Provider and developer usage insights

## 📊 Database Schema

### Core Tables
1. **services** - Service listings with metadata
2. **service_tags** - Tag management
3. **service_categories** - Category organization
4. **pricing_tiers** - Pricing configuration per service
5. **entitlements** - User subscriptions and quotas
6. **usage_logs** - API usage tracking
7. **user** - Authentication (better-auth)
8. **session** - Session management

## 🚀 API Endpoints

### Service Discovery
```
GET    /api/services              # List all services with filters
GET    /api/services/[id]         # Get service details
POST   /api/services              # Create service (provider)
PUT    /api/services/[id]         # Update service (provider)
DELETE /api/services/[id]         # Delete service (provider)
GET    /api/services/export       # Export JSON
GET    /api/services/export/yaml  # Export YAML
```

### Pricing Management
```
GET    /api/pricing?serviceId=X   # List pricing tiers
GET    /api/pricing/[id]          # Get tier details
POST   /api/pricing               # Create tier (provider)
PUT    /api/pricing/[id]          # Update tier (provider)
DELETE /api/pricing/[id]          # Delete tier (provider)
```

### Entitlements & Payments
```
GET    /api/entitlements          # List user entitlements
GET    /api/entitlements/[id]     # Get entitlement details
POST   /api/entitlements          # Create after payment
PUT    /api/entitlements/[id]     # Update (admin only)
POST   /api/entitlements/verify   # Verify access
```

### Usage Tracking
```
GET    /api/usage                 # Get usage logs
POST   /api/usage                 # Record usage
POST   /api/usage/track           # Track with auto-lookup
GET    /api/usage/stats           # Aggregated statistics
```

### Admin Operations
```
GET    /api/admin/services        # List all services
PUT    /api/admin/services/[id]/moderate  # Approve/reject
POST   /api/admin/services/[id]/tags      # Add admin tags
DELETE /api/admin/services/[id]/tags/[tid] # Remove tags
```

## 🔐 Authentication Flow

1. User registers with role selection (developer, provider, admin)
2. Email/password authentication via better-auth
3. Session stored with bearer token in localStorage
4. Protected routes check authentication via middleware
5. Role-based access control for dashboards

## 💳 Payment Flow

### User Journey
1. Browse services and view pricing tiers
2. Select desired tier and click "Subscribe"
3. Connect Sui wallet (Sui Wallet, Suiet, Ethos, etc.)
4. Choose payment token (SUI, WAL, or USDC)
5. Approve transaction in wallet
6. System creates entitlement with quotas
7. User gains immediate access to service

### Technical Implementation
```typescript
// 1. User selects tier
const handlePurchase = (tier) => {
  setSelectedTier(tier);
  setShowCheckout(true);
};

// 2. Payment dialog processes transaction
const result = await signAndExecuteTransaction({ transaction: tx });

// 3. Create entitlement
await fetch('/api/entitlements', {
  method: 'POST',
  body: JSON.stringify({
    serviceId,
    paymentId: `PAY-${Date.now()}`,
    pricingTier: tier.tierName,
    quotaLimit: tier.quotaLimit,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + tier.validityDays * 86400000).toISOString(),
    tokenType: selectedToken,
    amountPaid: tier.price,
    txDigest: result.digest,
  }),
});
```

## 📈 Usage Tracking Flow

### Provider Integration
```typescript
// 1. Before processing API request
const verification = await fetch('/api/entitlements/verify', {
  method: 'POST',
  headers: { Authorization: `Bearer ${userToken}` },
  body: JSON.stringify({ serviceId: 1 }),
});

if (!verification.ok) {
  return res.status(403).json({ error: 'Access denied' });
}

// 2. Process the request
const result = await processApiRequest();

// 3. Track usage
await fetch('/api/usage/track', {
  method: 'POST',
  headers: { Authorization: `Bearer ${userToken}` },
  body: JSON.stringify({
    serviceId: 1,
    endpoint: '/rpc/getLatestBlock',
    requestsCount: 1,
  }),
});
```

### API Gateway Integration

#### HAProxy Example
```haproxy
# haproxy.cfg
frontend api_frontend
    bind *:80
    acl is_api path_beg /api/service
    use_backend verify_backend if is_api

backend verify_backend
    http-request lua.verify_entitlement
    server api_server localhost:3001
```

#### NGINX Example
```nginx
location /api/service {
    auth_request /verify;
    proxy_pass http://backend;
}

location = /verify {
    internal;
    proxy_pass http://platform:3000/api/entitlements/verify;
}
```

## 🎨 Frontend Architecture

### Key Components
- `PaymentCheckoutDialog` - Multi-token payment flow
- `UsageDashboard` - Real-time quota monitoring
- `ServiceDetailPage` - Service info + pricing
- `SuiProvider` - Wallet connection context
- `Navbar` - Auth + role-based navigation

### State Management
- React hooks for local state
- better-auth session management
- Sui wallet via @mysten/dapp-kit

## 🔧 Configuration

### Environment Variables
```env
# Database (Turso)
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Sui Network (optional - defaults to testnet)
NEXT_PUBLIC_SUI_NETWORK=testnet
```

### Sui Wallet Setup
```typescript
// src/providers/sui-provider.tsx
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  devnet: { url: getFullnodeUrl('devnet') },
});
```

## 📱 User Roles & Permissions

### Developer Role
- Browse and search services
- Subscribe to services
- View usage dashboard
- Track API consumption
- Manage personal entitlements

### Provider Role
- All developer permissions
- Create and manage service listings
- Configure pricing tiers
- View service analytics
- Manage service metadata

### Admin Role
- All provider permissions
- Moderate all services
- Manage admin tags
- View global analytics
- Manage user roles

## 🎯 Testing the Platform

### 1. Service Discovery
```bash
# List services
curl http://localhost:3000/api/services

# Export as JSON
curl http://localhost:3000/api/services/export

# Filter by type
curl "http://localhost:3000/api/services?type=rpc-node"
```

### 2. Pricing Tiers
```bash
# Get pricing for a service
curl http://localhost:3000/api/pricing?serviceId=1
```

### 3. Usage Tracking
```bash
# Verify entitlement
curl -X POST http://localhost:3000/api/entitlements/verify \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceId": 1}'

# Track usage
curl -X POST http://localhost:3000/api/usage/track \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceId": 1, "endpoint": "/test", "requestsCount": 1}'

# Get statistics
curl http://localhost:3000/api/usage/stats \
  -H "Authorization: Bearer TOKEN"
```

## 🚀 Deployment Checklist

- [ ] Configure production database (Turso)
- [ ] Set environment variables
- [ ] Deploy to Vercel/Netlify
- [ ] Configure Sui mainnet (if production)
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure CORS for API routes
- [ ] Set up SSL certificates
- [ ] Test payment flow end-to-end
- [ ] Verify API gateway integrations
- [ ] Load test usage tracking endpoints

## 📚 Documentation

### For Users
- **Homepage**: Overview and quick start
- **Services Page**: Browse and filter services
- **Docs Page**: Complete API documentation
- **Usage Dashboard**: Real-time monitoring

### For Developers
- API reference at `/docs`
- OpenAPI/Swagger spec (coming soon)
- Integration examples in docs
- Sample code in GitHub

## 🎁 Demo Data

The platform includes seed data with:
- **10 Services** across different types (RPC, indexers, oracles, storage)
- **40 Pricing Tiers** (4 tiers per service)
- **20 Sample Entitlements** with varied usage patterns
- **124 Usage Logs** simulating real-world consumption

## 🔮 Future Enhancements

### Smart Contracts
- Deploy actual Sui Move contracts for payments
- Implement on-chain entitlement NFTs
- Add subscription auto-renewal
- Multi-sig payment support

### Advanced Features
- Usage-based pricing (beyond quota)
- Service reputation system
- Provider revenue dashboard
- Automated refunds
- Dispute resolution

### Integrations
- API gateway plugins (Kong, Tyk)
- Monitoring integrations (Datadog, New Relic)
- Accounting systems (Stripe, QuickBooks)
- Notification services (Twilio, SendGrid)

## 🤝 Contributing

This platform demonstrates a complete infrastructure marketplace. Key areas for contribution:
- Smart contract implementation
- Gateway plugins
- Additional payment tokens
- Analytics enhancements
- UI/UX improvements

## 📞 Support

For questions about implementation:
- Check `/docs` for API documentation
- Review this implementation guide
- Test endpoints using provided curl examples
- Explore seeded data for examples

---

**Built for Sui Blockchain Infrastructure**
*Service Discovery • Onchain Payments • Usage Tracking*
