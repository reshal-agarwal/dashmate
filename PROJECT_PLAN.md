# DashMate - College P2P Delivery System

## Project Overview
A peer-to-peer delivery marketplace for college students where:
- **Students** order food/products from campus shops/restaurants
- **Student couriers** deliver orders and earn credits/money
- **Credits** can be used for future orders (non-withdrawable, expire after 6 months inactivity)
- **Admins** manage restaurants, couriers, and platform settings

---

## 📋 Development Instructions (MUST FOLLOW)

### Commit Guidelines
- **Average commit size**: 100-150 lines of code
- **Commit frequency**: Every logical feature/chunk completion
- **Commit message format**: `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`
  - Example: `feat(auth): add JWT token refresh endpoint`
- **Branch strategy**: Direct commits to `main` (small team, fast iteration)

### Documentation Updates
- **PROJECT_PLAN.md**: Update after every phase completion
- **README.md**: Update at end of each phase with new features/setup
- **API_CONTRACTS.md**: Maintain separately, update with every API change

### Code Quality
- TypeScript strict mode (frontend)
- ESLint + Prettier configured
- No console.log in production code (use logger)
- All API responses follow standardized contract
- Rate limiting on all mutating endpoints
- Input validation with Zod schemas

---

## 🎯 4-Week Implementation Timeline

| Week | Phase | Focus | Target |
|------|-------|-------|--------|
| **Week 1** | Phase 0 + 1 | Foundation, Contracts, Student Core | Restaurant feed, cart, checkout, wallet |
| **Week 2** | Phase 2 + 3 | Restaurant Owner + Courier | Product CRUD, order management, courier flow |
| **Week 3** | Phase 4 + 5 | Admin + Real-time | Admin panel, Socket.io, notifications, cron |
| **Week 4** | Phase 6 | Polish & Launch | PWA, testing, security, deployment |

---

## ✅ Progress Tracking

### Completed (Pre-Phase 0)
- [x] Project structure analysis
- [x] Existing code audit (Next.js 15 + Express + MongoDB)
- [x] User model with OTP auth, pointsBalance, college fields
- [x] Auth endpoints: register, verify-otp, login, resend-otp
- [x] Comprehensive specification document
- [x] Critical feedback incorporated (Maps, mobile UI, real-time, client cart, etc.)

### Phase 0: Foundation & Contracts (Week 1, Days 1-3) - COMPLETE
- [x] Standardized API response contracts (`ApiSuccess<T>`, `ApiError`)
- [x] Error code enum + HTTP status mapping
- [x] Rate limiting middleware (global + per-user with Redis)
- [x] Abuse prevention guards (max orders/day, credit limits)
- [x] Socket.io server with namespaces & room patterns
- [x] Google Maps API keys setup (client + server)
- [x] Zod validation schemas for all DTOs (auth, restaurant, order, courier, wallet, admin)
- [x] Cancellation policy logic (pure functions)
- [x] Base middleware: auth, authorize, validation, error handler
- [x] Environment configuration validation
- [x] Core models: User (extended), Restaurant, Product, Order, Coupon, Transaction, Notification, WithdrawalRequest
- [x] Auth controller with register, verify-otp, login, resend-otp, forgot-password, reset-password, profile, courier application
- [x] Route structure: /api/v1/auth, /student, /courier, /restaurant, /admin
- [x] Cron jobs: credit expiry, auto-cancel stuck orders, daily stats, payout reminders, daily counter reset
- [x] TypeScript configuration for backend
- [x] Updated package.json with all dependencies
- [x] Backend compiles successfully (`npm run build` passes)

### Phase 1: Student Core (Week 1, Days 3-7) - COMPLETE
- [x] Frontend project structure setup (mobile-first app router layout groups)
- [x] TypeScript types for all domain models (User, Restaurant, Product, Order, etc.)
- [x] API client with axios interceptors, auth token management, error handling
- [x] Zustand stores: authStore (persisted), cartStore (persisted, single-restaurant enforcement)
- [x] Tailwind config with custom colors, animations, mobile-first utilities
- [x] Restaurant model + CRUD (backend controllers, admin creates, student reads)
- [x] Product model + CRUD (backend controllers, linked to restaurants)
- [x] Restaurant listing with filters (category, open now, rating, search)
- [x] Restaurant detail + menu (categories, dietary tags, spice level)
- [x] Client-side cart (Zustand + persist, single-restaurant enforcement)
- [x] Checkout flow: address form, coupon, credits, wallet/UPI/COD payment
- [x] Wallet top-up (Razorpay integration with signature verification)
- [x] Order placement with pricing, coupon discount, credits, notifications
- [x] Order history + detail view + ratings
- [x] Credits earn/spend logic + conversion to wallet + history

### Phase 2: Restaurant Owner (Week 2, Days 1-3) - COMPLETE
- [x] Restaurant dashboard (today's orders, stats, earnings)
- [x] Product management (CRUD, bulk toggle)
- [x] Order kanban: placed → confirmed → preparing → ready
- [x] Prep timer + ready notification to couriers
- [x] Payout requests (manual UPI first)
- [x] Basic analytics (sales, popular items, peak hours)
- [x] Cloudinary image upload for products
- [x] Bulk toggle products by category
- [x] Download analytics report

### Phase 3: Courier (Week 2, Days 4-7) - COMPLETE
- [x] Courier application + KYC (Aadhar, license, selfie upload)
- [x] Admin verification workflow
- [x] Online/offline toggle + location broadcasting (Socket.io)
- [x] Nearby orders feed (geohash query)
- [x] Accept → pickup (4-digit code) → deliver (4-digit code)
- [x] Earnings dashboard (today/week/month, pending payout)
- [x] Withdrawal requests (manual UPI)

### Phase 4: Admin Panel (Week 3, Days 1-3) - COMPLETE
- [x] Admin auth guard (`authorize('admin')`) on all admin routes
- [x] Admin layout with bottom navigation (Dashboard, Restaurants, Couriers, Orders, Analytics)
- [x] Admin dashboard with stats grid + quick actions
- [x] Restaurant onboarding + verification (list with filter, detail with verify action)
- [x] Courier KYC verification (list with status filter, detail with approve/reject)
- [x] Order oversight + dispute resolution (list with status filter, detail with refund, disputes page)
- [x] Withdrawal approval (approve/reject with rejection reason)
- [x] Coupon management (create, edit, delete with form)
- [x] Platform settings (commission, delivery fee, credit rates, limits)
- [x] Analytics dashboard (key metrics, distribution, derived KPIs)
- [x] Settings model (persistent platform config in DB)

### Phase 5: Real-time & Polish (Week 3, Days 4-7)
- [ ] Socket.io events for all order status changes
- [ ] Student order tracking (courier location polyline)
- [ ] Push notifications (Web Push API + service worker)
- [ ] Credit expiry cron job (nightly, 6 months inactivity)
- [ ] PWA manifest + service worker (offline cart, install prompt)
- [ ] Mobile-first UI: bottom nav, safe areas, touch targets
- [ ] Load testing + security audit

### Phase 6: Launch Prep (Week 4)
- [ ] End-to-end testing (student → restaurant → courier → delivered)
- [ ] Edge case handling (cancellations, disputes, refunds)
- [ ] Documentation (API, deployment, user guides)
- [ ] Monitoring (Sentry, logs, uptime)
- [ ] Production deployment

---

## 🗄️ Database Models (Finalized)

| Model | Key Fields | Notes |
|-------|------------|-------|
| **User** | role, courier{verified,kyc,bank}, walletBalance, creditsBalance, creditsLastActivityAt | Extended from existing |
| **Restaurant** | owner, location{coordinates}, operatingHours, payoutUpiId, isVerified | Geocoded on create |
| **Product** | restaurant, price, stock(-1=unlimited), tags, images | Cloudinary URLs |
| **Order** | student, restaurant, courier, items[], pricing{}, payment{}, status (9 states), timestamps{}, earnings{} | State machine enforced |
| **Coupon** | code, discountType/value, limits, dates, applicableRestaurants[] | |
| **Transaction** | user, type(12 types), amount, balanceAfter, creditsAfter, reference{}, status | Unified ledger |
| **Notification** | user, type(13 types), title, message, data{}, isRead, priority | |

**No `currentLocation` on Courier** — real-time via Socket.io rooms only.

---

## 🔌 API Contract Standards

### Success Response
```typescript
interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { pagination?: PaginationMeta; timestamp: string };
}
```

### Error Response
```typescript
interface ApiError {
  success: false;
  error: {
    code: string;           // Machine-readable: "VALIDATION_ERROR", "RATE_LIMITED"
    message: string;        // Human-readable
    details?: Record<string, string[]>;
    requestId: string;
  };
  meta: { timestamp: string };
}
```

### Error Codes & HTTP Status
| Code | Status | Use Case |
|------|--------|----------|
| `VALIDATION_ERROR` | 400 | Zod schema failure |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Role mismatch |
| `NOT_FOUND` | 404 | Resource missing |
| `CONFLICT` | 409 | Duplicate, state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected |
| `SERVICE_UNAVAILABLE` | 503 | External dependency down |

---

## 🛡️ Rate Limiting & Abuse Prevention

```javascript
// Global: 300 req/15min/IP
// Authenticated per-user:
MAX_ORDERS_PER_DAY = 20
MAX_CREDITS_EARNED_PER_DAY = 500
MAX_CANCELLATIONS_PER_WEEK = 3
MIN_ORDER_INTERVAL_MS = 120000  // 2 minutes
MAX_CART_ITEMS = 50 items
```

---

## ⚖️ Cancellation Policy (State Machine)

| From Status | Cancelled By | Penalty |
|-------------|--------------|---------|
| `placed` | student | None |
| `placed` | restaurant | None (auto-refund) |
| `placed` | system (10min no response) | None |
| `confirmed` | restaurant | ₹20 to courier pool |
| `preparing` | restaurant | ₹30 + food cost |
| `ready` | student | Delivery fee + 50% food |
| `ready` | restaurant | ₹20 |
| `ready` | system (15min no courier) | Auto-assign or ₹20 restaurant |
| `courier_assigned` | courier | Rating hit + ₹10 |
| `courier_assigned` | restaurant | ₹30 + platform fee |
| `picked_up` | courier | ₹50 + blacklist risk |
| `picked_up` | student | Dispute → admin |

---

## 📱 Mobile-First UI Requirements

- **Bottom navigation** (4 tabs max): Home, Orders, Cart, Profile
- **Safe area insets** for notches/home indicators
- **Touch targets** ≥ 44×44px
- **No hover-only interactions**
- **PWA**: installable, offline cart, background sync
- **Transitions**: slide, fade (Framer Motion or CSS)
- **Skeleton loaders** for all async data

---

## 🔄 Real-Time Events (Socket.io)

| Namespace | Rooms | Key Events |
|-----------|-------|------------|
| `/student` | `student:{id}`, `order:{id}` | `order:status`, `courier:location`, `notification:new` |
| `/courier` | `courier:{id}`, `couriers:nearby:{geohash}` | `order:new`, `order:assigned`, `earnings:update` |
| `/restaurant` | `restaurant:{id}` | `order:new`, `order:cancelled`, `courier:assigned` |
| `/admin` | `admin:all` | `system:alert`, `withdrawal:pending` |

---

## 🏁 Current Status: Phase 4 Complete

**Phase 0 completed:** All foundation contracts, middleware, models, validators, routes structure, cron jobs, Socket.io setup

**Phase 1 completed:** Full student core - restaurant listing/menu, client cart, checkout, order placement/cancellation/rating, wallet topup (Razorpay), credits earn/convert/history, profile/addresses/notifications

**Phase 2 completed:** Full restaurant owner (backend + frontend) — dashboard, product CRUD, order kanban, analytics, payouts, Cloudinary image upload, bulk toggle by category, downloadable CSV reports

**Phase 3 completed:** Courier - application/KYC, admin verification, online/offline toggle, nearby orders feed, accept/pickup (4-digit)/deliver (4-digit), earnings dashboard, payout requests (UPI), profile management. All Socket.io events integrated.

**Phase 4 completed:** Admin panel - auth-guarded routes, dashboard with stats, restaurant onboarding/verification, courier KYC verification (approve/reject), order oversight with refund, dispute resolution, withdrawal approval workflow, coupon CRUD, platform settings (commission, fees, credit rates), analytics dashboard with KPIs. Persistent Settings model added.

**Next**: Phase 5 - Real-time & Polish (Socket.io events for order status changes, student order tracking with courier location, push notifications, credit expiry cron, PWA, mobile-first UI polish, load testing + security audit)

---

## 📝 Notes for Future Sessions

- Always read `PROJECT_PLAN.md` first to understand context
- Update progress checkboxes after each commit
- Keep commits small (100-150 lines) and focused
- Run lint/typecheck before committing
- Update README.md at phase boundaries