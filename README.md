# GERA COOKS

A full-stack order management and catering quote system for a food business, built with Next.js 16, Supabase, and shadcn/ui.

## Features

### Customer-Facing Order Page
- Browse menu items organized by sections
- Add items to cart with optional extras/add-ons
- Customer name and phone number collection
- Real-time cart total calculation
- Order submission with confirmation

### Admin Dashboard (`/admin`)
- **Orders Management**
  - View all orders with status filtering (Pending, Preparing, Ready, Delivered, Cancelled)
  - Edit orders (modify items, quantities, prices)
  - Delete orders with confirmation
  - Order status updates with color-coded badges
  - Weekly/Monthly/Yearly order summary cards
  - Pull-to-refresh on mobile
  
- **Menu Management** (`/admin/menu`)
  - Add/edit/delete menu sections
  - Add/edit/delete menu items with prices and descriptions
  - Manage item extras/add-ons
  - Drag-and-drop reordering
  
- **Customer Management** (`/admin/customers`)
  - Customer database with name, phone, nickname, and notes
  - Auto-suggestions when creating orders
  
- **Catering Quotes** (`/admin/catering`)
  - Two quote types: Items-based or Per-Person pricing
  - Item autocomplete from past quotes
  - Included items (non-priced) for per-person quotes
  - Status workflow: Draft → Sent → Accepted/Rejected
  - One-click "Mark as Approved" with auto-conversion to order
  - WhatsApp sharing integration
  - Tax, delivery fee, and discount support
  
- **Analytics** (`/admin/analytics`)
  - Revenue trends with charts
  - Historical sales data
  - Top-selling items analysis

### Technical Features
- PWA support with installable app
- Push notifications for new orders
- Mobile-responsive design
- Dark/light mode support
- Real-time data with Supabase

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Notifications:** Web Push API
- **Drag & Drop:** dnd-kit

## Database Schema

### Core Tables
- `orders` - Customer orders with status tracking
- `order_items` - Line items for each order
- `customers` - Customer database
- `menu_sections` - Menu category organization
- `menu_items` - Menu items with prices
- `menu_item_extras` - Optional add-ons for menu items

### Catering Tables
- `catering_quotes` - Quote header with totals and status
- `catering_quote_items` - Line items (priced or included)

### Supporting Tables
- `push_subscriptions` - Web push notification subscriptions
- `historical_sales` - Monthly revenue data for analytics

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Postgres (auto-configured with Supabase)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
POSTGRES_HOST=

# Push Notifications (VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Twilio (optional - for SMS/WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
TWILIO_SMS_FROM=
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (copy from Supabase dashboard)

4. Run database migrations in order:
   ```bash
   # Execute each SQL file in the scripts/ folder in numerical order
   scripts/001_create_orders_tables.sql
   scripts/002_update_order_statuses.sql
   # ... continue through 018
   ```

5. Generate VAPID keys for push notifications:
   ```bash
   node scripts/generate-vapid-keys.js
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── page.tsx                    # Customer order page
├── order-page-client.tsx       # Client-side order logic
├── admin/
│   ├── page.tsx               # Admin dashboard
│   ├── orders-list.tsx        # Orders table component
│   ├── orders-summary-cards.tsx # KPI summary cards
│   ├── edit-order-modal.tsx   # Order editing modal
│   ├── login/                 # Admin authentication
│   ├── menu/                  # Menu management
│   ├── customers/             # Customer management
│   ├── catering/              # Catering quotes
│   │   ├── page.tsx          # Quote list
│   │   ├── new/page.tsx      # Create quote
│   │   ├── [id]/page.tsx     # Edit quote
│   │   ├── catering-form.tsx # Quote form component
│   │   └── actions.ts        # Server actions
│   └── analytics/             # Analytics dashboard
├── api/
│   ├── save-order/           # Order submission
│   ├── menu/                 # Menu data
│   ├── customer-suggestions/ # Customer autocomplete
│   ├── catering/             # Catering API routes
│   ├── analytics/            # Analytics data
│   ├── send-push/            # Push notifications
│   └── subscribe-push/       # Push subscription

components/
├── ui/                       # shadcn/ui components
├── admin-nav.tsx             # Admin navigation
├── phone-input.tsx           # Phone number input with country code
├── pwa-installer.tsx         # PWA install prompt
└── pull-to-refresh.tsx       # Mobile pull-to-refresh

lib/
├── auth.ts                   # Authentication utilities
├── supabase/
│   ├── client.ts            # Browser Supabase client
│   └── server.ts            # Server Supabase client
└── utils.ts                 # Utility functions

scripts/
├── 001-018_*.sql            # Database migrations
└── generate-vapid-keys.js   # VAPID key generator
```

## Key Workflows

### Order Flow
1. Customer browses menu → adds items to cart → submits order
2. Admin receives push notification
3. Admin updates order status (Pending → Preparing → Ready → Delivered)
4. Order appears in analytics

### Catering Flow
1. Admin creates quote (Items or Per-Person type)
2. Adds line items with autocomplete suggestions
3. Sets tax, delivery, discount
4. Shares via WhatsApp
5. Updates status to Accepted
6. Auto-converts to order for fulfillment tracking

## License

Private - GERA COOKS
