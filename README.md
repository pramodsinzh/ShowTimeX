# ShowTimeX

A full‑stack movie ticket booking app with an **admin panel** for managing shows. Built with **React (Vite) + Tailwind** on the frontend and **Express + MongoDB** on the backend, with **Clerk** authentication and **Stripe** payments.

## Features

- **Browse movies & showtimes** and view details
- **Seat selection** with occupied-seat locking
- **Bookings** and booking history
- **Favorites**
- **Admin dashboard** to add/list shows and view bookings
- **Payments** via Stripe Checkout + webhook confirmation
- **Email confirmations** (SMTP via Brevo relay) triggered by background jobs (Inngest)

## Tech stack

- **Frontend**: React, Vite, React Router, TailwindCSS, Clerk
- **Backend**: Node.js, Express, MongoDB (Mongoose), Clerk, Stripe, Inngest, Nodemailer
- **External APIs**: TMDB (movies), Stripe (payments)

## Project structure

```text
/
  frontend/   # React + Vite client
  backend/    # Express API server
```

## Prerequisites

- **Node.js**: recent LTS recommended
- **MongoDB**: local or hosted (Atlas)
- Accounts/keys for:
  - **Clerk**
  - **TMDB**
  - **Stripe**
  - (Optional) **Brevo SMTP** for email

## Environment variables

Create these files locally (don’t commit real secrets).

### `backend/.env`

```bash
# Database
MONGODB_URI="mongodb://127.0.0.1:27017"

# Auth (Clerk)
# Required by @clerk/express middleware (name may vary by Clerk setup)
CLERK_SECRET_KEY="your_clerk_secret_key"

# TMDB (used as Bearer token)
TMDB_API_KEY="your_tmdb_read_access_token"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Brevo SMTP relay)
SMTP_USER="your_smtp_user"
SMTP_PASS="your_smtp_pass"
SENDER_EMAIL="no-reply@yourdomain.com"
```

Notes:
- The app connects to MongoDB as `${MONGODB_URI}/showTimeX`.
- Stripe webhook endpoint is mounted at `POST /api/stripe` (see “Stripe webhook” below).

### `frontend/.env`

```bash
VITE_BASE_URL="http://localhost:3000"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_TMDB_IMAGE_BASE_URL="https://image.tmdb.org/t/p/original"
VITE_CURRENCY="USD"
```

## Install

From the repo root:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

## Run (development)

Start **frontend + backend** together:

```bash
npm run project
```

Or run them separately:

```bash
# frontend (Vite)
npm run dev --prefix frontend

# backend (nodemon)
npm run server --prefix backend
```

- **Frontend**: `http://localhost:5173` (Vite default)
- **Backend**: `http://localhost:3000`

## API routes (backend)

- **Shows**: `GET /api/show/all`, `GET /api/show/:movieId`
- **Admin**: `GET /api/admin/dashboard`, `GET /api/admin/all-shows`, `GET /api/admin/all-bookings`
- **Bookings**: `POST /api/booking/create`, `GET /api/booking/seats/:showId`
- **Users**: `GET /api/user/bookings`, `GET /api/user/favorites`, `POST /api/user/update-favorite`

Some routes require **Clerk auth** and/or **admin** access (see `backend/middleware/auth.js`).

## Stripe webhook

The server expects Stripe webhooks at:

- `POST http://localhost:3000/api/stripe`

When developing locally, use the Stripe CLI to forward events and set `STRIPE_WEBHOOK_SECRET`.

## Build

```bash
npm run build --prefix frontend
```

Backend production start:

```bash
npm run start --prefix backend
```

## Troubleshooting

- **Clerk key missing**: if you see “Add your Clerk Publishable Key…”, ensure `frontend/.env` contains `VITE_CLERK_PUBLISHABLE_KEY`.
- **CORS / wrong API URL**: verify `VITE_BASE_URL` points to your backend (default `http://localhost:3000`).
- **Mongo connection issues**: confirm MongoDB is running and `MONGODB_URI` is correct.

## Contributing

PRs are welcome. If you add new environment variables, please update this README with the new keys and a short explanation.

## License

ISC (see `package.json`).