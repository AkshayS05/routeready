# RouteReady 🚛

Food distribution operations platform for GTA/Ontario small businesses.
Replace WhatsApp + Excel with a proper system.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** 
- **PostgreSQL** via [Supabase](https://supabase.com)
- **Prisma** ORM
- **NextAuth.js** (Google + Email login)
- **React Query** (TanStack Query v5)
- **Zustand** (UI state)
- **TailwindCSS + shadcn/ui**
- **n8n** (automation — SMS, email webhooks)
- **Twilio** (SMS)
- **Resend** (transactional email)

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd routeready
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → Copy **Connection string (URI)** with `?pgbouncer=true`
3. Also copy the **Direct URL** (without pgbouncer, for migrations)

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:
- `DATABASE_URL` → Supabase connection string (with pgbouncer)
- `DIRECT_URL` → Supabase direct URL (for migrations)
- `NEXTAUTH_SECRET` → run `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` → [Google Console](https://console.cloud.google.com)

### 4. Push database schema

```bash
npm run db:push
```

### 5. Seed with test data

```bash
npm run db:seed
```

### 6. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # All protected dashboard pages
│   │   ├── layout.tsx         # Sidebar layout
│   │   ├── dashboard/         # Main dashboard + KPIs
│   │   ├── orders/            # Order management
│   │   ├── drivers/           # Driver management
│   │   ├── clients/           # Client management
│   │   ├── routes/            # Route optimization
│   │   └── inventory/         # Inventory tracking
│   └── api/
│       ├── auth/              # NextAuth handlers
│       ├── orders/            # Order CRUD
│       ├── drivers/           # Driver CRUD
│       ├── inventory/         # Inventory CRUD
│       ├── dashboard/stats/   # Dashboard KPIs
│       └── webhooks/          # n8n incoming webhooks
├── components/
│   ├── layout/                # Sidebar, Header
│   ├── orders/                # Order components
│   ├── drivers/               # Driver components
│   └── inventory/             # Inventory components
├── hooks/                     # React Query hooks
├── lib/
│   ├── db.ts                  # Prisma singleton
│   ├── auth.ts                # NextAuth config
│   └── utils.ts               # Helpers + algorithms
└── types/
    └── index.ts               # All TypeScript types
```

---

## Key Architecture Decisions

### Multi-tenancy
Every database query includes `businessId`. This is enforced in:
1. Middleware (`middleware.ts`) — injects businessId into request headers
2. Every API route — `requireAuth()` returns the businessId from session
3. Every Prisma query — `where: { businessId }` is never optional

### Optimistic Updates
Order status changes update the UI instantly using React Query's `onMutate`. If the API fails, it rolls back. This makes the driver experience feel instant.

### Route Optimization
Using Nearest Neighbor algorithm (`optimizeRouteNearestNeighbor` in `utils.ts`). O(n²) complexity is fine for 5-20 delivery stops. No external API needed.

### Inventory Alerts
Min-Heap data structure surfaces critical items in O(log n). Scales to thousands of SKUs without performance issues.

---

## Setting Up Automation (n8n)

1. Deploy n8n to [Railway](https://railway.app) (free tier)
2. Create a webhook workflow triggered by `order.created`
3. Add Twilio SMS node → send to driver phone
4. Add Resend email node → send confirmation to client
5. Set `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` in `.env.local`

---

## Deployment (Vercel)

```bash
vercel --prod
```

Set all environment variables in Vercel dashboard.
Add `NEXTAUTH_URL` = your production URL.

---

## Roadmap

- [ ] Route optimization UI with map
- [ ] Driver mobile PWA
- [ ] PDF invoice generation
- [ ] QuickBooks integration
- [ ] Multi-language (Punjabi, Tagalog)
