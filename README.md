# POSS - Smart Restaurant POS System

POSS is a full-stack Restaurant POS web application for restaurants, cafes, fast-food shops, hotels, takeaway counters, food courts, and cloud kitchens. It includes role-based login, realtime kitchen ordering, table management, parcel orders, GST billing, PDF invoices, WhatsApp bill delivery, customer history, QR menu support, and owner analytics.

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Framer Motion-ready UI patterns, Recharts, Socket.io client
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.io
- Billing: PDFKit invoice generation, ExcelJS report export
- WhatsApp: mock sender by default, Twilio WhatsApp Business API-ready via env

## Project Structure

```text
backend/
  src/config        database, env, socket setup
  src/controllers   route handlers
  src/middleware    auth, role access, errors
  src/models        MongoDB schemas
  src/routes        Express routes
  src/services      analytics, invoice, WhatsApp
  src/utils         helpers
frontend/
  src/api           API client
  src/components    reusable UI and POS components
  src/context       auth state
  src/hooks         realtime socket hook
  src/layouts       SaaS app shell
  src/pages         all required app screens
```

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create backend env:

```bash
copy backend\.env.example backend\.env
```

3. Start MongoDB locally, then seed demo data:

```bash
npm run seed --prefix backend
```

4. Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5000/api`

## Demo Accounts

- Owner: `owner@poss.local` / `Password@123`
- Manager: `manager@poss.local` / `Password@123`
- Chef: `chef@poss.local` / `Password@123`

## WhatsApp Billing

By default `WHATSAPP_PROVIDER=mock`, so bill messages are logged to the backend console for local testing.

To send through Twilio WhatsApp, set:

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
PUBLIC_API_URL=https://your-api-domain.com
```

## Verification

- Frontend production build passes: `npm run build --prefix frontend`
- Backend JavaScript syntax checks pass with `node --check`

Current note: Vite reports a chunk-size warning because charts and realtime libraries are bundled into the main app. For a larger deployment, add route-level lazy imports/manual chunks.
