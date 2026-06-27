# DashMate - College P2P Delivery System

A peer-to-peer delivery marketplace for college campuses. Students order from campus restaurants/shops, student couriers deliver and earn, all powered by a credit-based economy.

## 🏗️ Architecture

```
dashmate/
├── frontend/          # Next.js 15 + TypeScript + Tailwind v4 (App Router)
├── backend/           # Express + MongoDB/Mongoose + Socket.io
└── PROJECT_PLAN.md    # Complete specification & progress tracking
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Google Maps API key (Places, Geocoding, Distance Matrix, Maps JS)
- Razorpay account (for wallet top-ups)
- Cloudinary account (for image uploads)

### Backend Setup
```bash
cd backend
cp .env.example .env   # Configure all variables
npm install
npm run dev            # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env   # Configure all variables
npm install
npm run dev            # Starts on http://localhost:3000
```

## 🔐 Environment Variables

### Backend (`.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dashmate

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=1d

# CORS
FRONTEND_URL=http://localhost:3000

# Google Maps (Server-side geocoding)
GOOGLE_MAPS_API_KEY=your-server-api-key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Redis (for rate limiting & Socket.io scaling)
REDIS_URL=redis://localhost:6379
```

### Frontend (`.env.local`)
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000

# Google Maps (Client-side - RESTRICTED to localhost:3000)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-client-api-key

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
```

## 📱 Features

| Role | Capabilities |
|------|--------------|
| **Student** | Browse restaurants, cart, checkout (wallet/UPI/COD), order tracking, wallet & credits, courier application |
| **Courier** | Online/offline, nearby orders, accept/pickup/deliver (4-digit codes), earnings, payout requests |
| **Restaurant Owner** | Product CRUD, order kanban, prep timers, analytics, payout requests |
| **Admin** | Restaurant onboarding, courier verification, order oversight, disputes, coupons, platform settings |

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 (App Router, Turbopack)
- TypeScript (strict mode)
- Tailwind CSS v4
- Zustand (state management)
- Socket.io Client (real-time)
- @react-google-maps/api
- React Hook Form + Zod
- Razorpay JS

**Backend:**
- Express 5
- Mongoose 8
- Socket.io 4 (namespaces, rooms)
- JWT (access tokens)
- bcryptjs, otp-generator
- express-rate-limit + rate-limit-redis
- node-cron (scheduled jobs)
- @googlemaps/google-maps-services-js
- Cloudinary SDK

## 📋 API Contract

All responses follow standardized envelope:

```typescript
// Success
{ success: true, data: T, meta?: { pagination, timestamp } }

// Error
{ success: false, error: { code, message, details?, requestId }, meta: { timestamp } }
```

Error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500)

## 🔄 Real-Time (Socket.io)

Namespaces: `/student`, `/courier`, `/restaurant`, `/admin`

Room pattern: `student:{id}`, `courier:{id}`, `restaurant:{id}`, `order:{id}`, `couriers:nearby:{geohash}`

Events: `order:status`, `order:new`, `courier:location`, `courier:assigned`, `notification:new`, `earnings:update`

## ⏰ Scheduled Jobs

- **Credit Expiry**: Daily 2 AM - expires credits after 6 months inactivity
- **Auto-cancel**: Every 5 min - cancels stuck orders (10min no restaurant response, 15min no courier)
- **Daily Stats**: 1 AM - rollup analytics
- **Payout Reminders**: Monday 9 AM - notify couriers with ≥₹100 balance

## 📦 Deployment

### Docker (Recommended)
```bash
docker-compose up -d
```

### Manual
- Backend: PM2 + Nginx reverse proxy
- Frontend: `npm run build && npm start` (or Vercel)
- MongoDB: Atlas or self-hosted replica set
- Redis: Required for rate limiting & Socket.io adapter

## 📄 Documentation

- [Project Plan & Progress](PROJECT_PLAN.md) - Complete specification, timeline, progress tracking
- [API Contracts](backend/docs/API_CONTRACTS.md) - Detailed endpoint specs (to be created)
- [Database Schema](backend/docs/SCHEMA.md) - Model definitions (to be created)

## 🤝 Contributing

1. Read `PROJECT_PLAN.md` for current phase & context
2. Keep commits small (100-150 lines), focused
3. Format: `type(scope): description` (feat, fix, refactor, docs, chore, test)
4. Run `npm run lint && npm run typecheck` before commit
5. Update progress in `PROJECT_PLAN.md` after each phase

## 📄 License

MIT