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
TWILIO_WHATSAPP_FROM=whatsapp:+91XXXXXXXXXX
PUBLIC_API_URL=https://your-api-domain.com
```

Customer mobile numbers can be entered as `9876543210`, `+919876543210`, `919876543210`, or `whatsapp:+919876543210`; the backend normalizes them to Twilio's `whatsapp:+91...` format. `TWILIO_WHATSAPP_FROM` is normalized the same way, but it must still be an approved Twilio WhatsApp sender on the same account as `TWILIO_ACCOUNT_SID`.

If Twilio returns `Twilio could not find a Channel with the specified From address`, the sender in `TWILIO_WHATSAPP_FROM` is not available on the Twilio account being used. For sandbox testing, keep Twilio's sandbox sender, enable the WhatsApp Sandbox on the same account as `TWILIO_ACCOUNT_SID`, and have the recipient join that sandbox before sending. For production, replace the sandbox number with your approved WhatsApp sender from Twilio.

## Resend OTP Password Reset

Forgot-password emails are sent through Resend. The OTP is six digits, stored as a hash, expires after 10 minutes, and is removed after a successful reset.

Add these backend environment variables:

```env
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM=onboarding@resend.dev
PASSWORD_RESET_OTP_MINUTES=10
PASSWORD_RESET_MAX_ATTEMPTS=5
```

Use a verified Resend domain/sender for production mail. Never place these values in frontend environment variables.

## Production Deployment

Set these variables on the backend host:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=use-a-long-random-production-secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-frontend-domain.com
PUBLIC_API_URL=https://your-backend-domain.com
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_INTERVAL_MINUTES=9
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM=BillMitara <noreply@your-domain.com>
```

Set this variable when building the frontend:

```env
VITE_API_URL=https://your-backend-domain.com
```

Build and start:

```bash
npm run build
npm run start
```

The backend health endpoint is `GET /api/health`. Ensure the deployment platform allows outbound HTTPS requests to Resend and that `CLIENT_ORIGIN` exactly matches the deployed frontend origin.

For Render free instances, enable the keep-alive cron with `KEEP_ALIVE_ENABLED=true`. It pings `PUBLIC_API_URL/api/health` every 9 minutes by default, which keeps the idle gap below 10 minutes. If your health URL is different, set `KEEP_ALIVE_URL=https://your-backend-domain.com/api/health`.

## Verification

- Frontend production build passes: `npm run build --prefix frontend`
- Backend JavaScript syntax checks pass with `node --check`

Current note: Vite reports a chunk-size warning because charts and realtime libraries are bundled into the main app. For a larger deployment, add route-level lazy imports/manual chunks.
