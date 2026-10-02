# CoRide — Enterprise & Campus Carpooling Platform

CoRide is a full-stack, mobile-first carpooling application engineered for universities, colleges, and corporate technology campuses.

---

## Project Structure

```
coride/
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── components/         # Reusable navigation & UI components
│   │   │   └── navigation/     # TopHeader (full-width desktop nav), BottomNav (mobile-only)
│   │   ├── layouts/            # AppLayout (responsive desktop dashboard container)
│   │   ├── pages/              # Core Navigation Pages:
│   │   │   ├── FindPoolPage.jsx  # Desktop search bar, sidebar filters, 2-col cards
│   │   │   ├── OfferPoolPage.jsx # Offer carpool wizard, request management, vehicles
│   │   │   ├── MyRidesPage.jsx   # Passenger & driver active commutes & dynamic QR pass
│   │   │   ├── AlertsPage.jsx    # Notification center with categorized feeds
│   │   │   └── ProfilePage.jsx   # Profile dashboard, verification, stats, vehicle list
│   │   ├── App.jsx             # React Router hierarchy
│   │   ├── index.css           # Global design tokens & Tailwind directives
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js      # CoRide design tokens (White / Deep Green #0F5132)
│   └── vite.config.js          # Vite config with backend API proxy
│
├── server/                     # Backend API (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/             # Environment & MongoDB Mongoose connection
│   │   ├── middleware/         # Error handling & request validation
│   │   ├── routes/             # RESTful API route definitions (Health check)
│   │   ├── app.js              # Express app with Helmet, CORS, Morgan
│   │   └── server.js           # Server bootstrap and graceful shutdown
│   ├── .env                    # Local environment variables
│   ├── .env.example            # Environment configuration template
│   └── package.json
│
└── shared/                     # Shared constants, enums & domain models
    └── constants.js
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v24+ supported)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or a MongoDB Atlas connection string.

---

## Quickstart Guide

### 1. Backend Server Setup

Navigate to the `server` directory, configure environment variables, and start the development server:

```bash
cd server
npm install
npm run dev
```

The backend server will launch on:
- API Root: `http://localhost:5000`
- Health Endpoint: `http://localhost:5000/api/v1/health`

### 2. Frontend Client Setup

In a separate terminal, navigate to the `client` directory and start the Vite dev server:

```bash
cd client
npm install
npm run dev
```

The mobile-first web app will launch on:
- Web App URL: `http://localhost:5173`

---

## Design System & Tokens

- **Canvas Background**: Pure White (`#FFFFFF`)
- **Primary Brand Accent**: Deep Forest Green (`#0F5132` / `#137547`)
- **Active Accent**: Emerald Green (`#10B981`)
- **Typography & High Contrast**: Pitch Charcoal Black (`#0F172A`)
- **Card Aesthetics**: Rounded-2xl (`16px`), subtle borders (`#E2E8F0`), and soft elevation shadows (`0 4px 20px -2px rgba(15, 23, 42, 0.05)`)
- **Touch Targets**: 48px+ for ergonomic single-hand mobile interactions

---

## Core Navigation (Phase 1)

1. **Find Pool (`/find` / `/`)**: Search source, destination, departure date/time, seat count, and preview AI-matched commute partners.
2. **Offer Pool (`/offer`)**: Verified vehicle summary, driving license status, carpool creation wizard, pricing contributions, and recurring commute toggle.
3. **Alerts (`/alerts`)**: Segmented notification feeds for ride requests, confirmations, departure reminders, and AI match alerts.
4. **Profile (`/profile`)**: Campus identity, organization verification badge, environmental CO2 savings metrics, ride history, and personal preferences.
