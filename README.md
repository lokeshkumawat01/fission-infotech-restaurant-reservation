> Assignment submission for Fission Infotech — Junior Full-Stack Developer role

# 🍽️ Restaurant Reservation Management System

A full-stack web application for managing restaurant table reservations — customers can book tables online, and administrators get full visibility and control over all bookings, tables, and daily occupancy.

**Live Demo:** [Add your deployed frontend URL here]
**API Base URL:** [Add your deployed backend URL here]

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Design Decisions & Assumptions](#design-decisions--assumptions)
- [Reservation & Availability Logic](#reservation--availability-logic)
- [Role-Based Access Control](#role-based-access-control)
- [API Reference](#api-reference)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Restaurants need an efficient way to manage table reservations while preventing double bookings and capacity conflicts. This project solves that with:

- A **customer-facing app** to browse availability and book a table in a few clicks
- An **admin dashboard** with full oversight — view, filter, search, and manage every reservation, plus a live table-availability calendar and daily stats
- Reliable, tested **conflict-prevention logic** that automatically assigns the best-fit table for each booking

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| Frontend       | React (Vite), React Router, Axios                |
| Backend        | Node.js, Express                                  |
| Database       | MongoDB (Mongoose ODM)                            |
| Authentication | JWT (JSON Web Tokens), bcrypt password hashing    |
| Styling        | Plain CSS with CSS custom properties (theming)    |

---

## Features

### 👤 Customer
- Register / login (JWT-based auth)
- Book a table by selecting a date, time slot, and party size — the system **auto-assigns** the smallest available table that fits
- View all personal reservations (past and upcoming)
- Cancel a reservation

### 🛠️ Administrator
- View **all** reservations across all customers
- **Search** reservations by customer name or email
- **Filter** by date and status, with **pagination**
- Update or cancel any reservation
- **Availability calendar** — a table × time-slot grid showing "Free" / "Booked" at a glance for any chosen date
- **Dashboard stats** — total, active, and cancelled reservation counts, today's bookings, and today's occupancy %
- Full **table management** — add, edit, or remove restaurant tables

### 🌓 General
- Role-based access control (Customer vs Admin)
- Dark mode toggle (preference saved locally)
- Clear, meaningful error messages throughout

---

## Project Structure

```
restaurant-reservation-system/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── models/          # User, Table, Reservation (Mongoose schemas)
│   ├── middleware/      # JWT auth, role authorization, centralized error handler
│   ├── controllers/     # Business logic (auth, reservations, admin, tables)
│   ├── routes/          # Express route definitions
│   ├── utils/           # Constants, async wrapper, seed script
│   └── server.js        # App entry point
│
└── frontend/
    └── src/
        ├── api/          # Axios instance (auto-attaches JWT)
        ├── context/      # AuthContext, ThemeContext
        ├── components/   # Navbar, ProtectedRoute
        └── pages/        # Login, Register, CustomerDashboard, AdminDashboard
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A MongoDB database — either running locally or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/restaurant-reservation-system.git
cd restaurant-reservation-system
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in your values — see Environment Variables below
npm run seed            # seeds 8 initial tables into the database
npm run dev              # starts the API on http://localhost:5000
```

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev
```

The app will be available at **http://localhost:5173**.

### 4. Try it out

1. Go to `/register` and create a **Customer** account.
2. Book a table by choosing a date, time slot, and number of guests.
3. Register a second account, this time as **Administrator**.
4. Explore the admin dashboard — reservations, availability calendar, and table management.

---

## Environment Variables

**`backend/.env`**

| Variable         | Description                                              | Example                                  |
|------------------|------------------------------------------------------------|-------------------------------------------|
| `PORT`           | Port the API server runs on                                | `5000`                                    |
| `MONGO_URI`      | MongoDB connection string                                  | `mongodb+srv://user:pass@cluster.../db`   |
| `JWT_SECRET`     | Secret key used to sign JWTs (use a long random string)    | `a3f9c1e8b2d4f6a0c7e9b1d3f5a7c9e1...`      |
| `JWT_EXPIRES_IN` | Token expiry duration                                       | `7d`                                       |
| `CLIENT_URL`     | Deployed frontend URL (for CORS)                            | `https://your-app.vercel.app`             |

**`frontend/.env`**

| Variable         | Description                        | Example                                  |
|------------------|-------------------------------------|--------------------------------------------|
| `VITE_API_URL`   | Base URL of the deployed backend API | `https://your-api.onrender.com/api`       |

> Generate a secure `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Design Decisions & Assumptions

- **Single restaurant, fixed tables** — tables are seeded via `npm run seed` (8 tables, capacities 2–8) and can be managed further from the Admin Dashboard.
- **Fixed time slots** — instead of freeform time entry, the restaurant offers 8 predefined one-hour slots (see `backend/utils/constants.js`). This keeps overlap-prevention logic simple and reliable.
- **Automatic table assignment** — customers choose date + time slot + party size; the backend assigns the smallest available table that fits, rather than letting customers pick a table number directly (avoids picking an already-booked table).
- **Role selection at registration** — for demo/review convenience, the registration form lets a user pick "Customer" or "Administrator". In production, admin accounts would be created via invite or manual promotion instead.
- **Soft cancellation** — cancelling sets `status: "cancelled"` rather than deleting the record, preserving history for admins.

---

## Reservation & Availability Logic

Implemented in `backend/controllers/reservationController.js` → `findAvailableTable()`:

1. Find all active tables with `capacity >= guests`, sorted smallest-first, so a 2-person booking doesn't take an 8-seat table.
2. Query existing **active** reservations for those tables on the same `date` + `timeSlot`.
3. Return the first candidate table with no conflict.
4. If none qualify, respond with `409 Conflict` and a clear message.
5. A second existence-check runs immediately before insert to shrink the race-condition window between two simultaneous bookings for the same slot.

This guarantees:
- ✅ No overlapping reservations for the same table
- ✅ Table capacity always meets or exceeds the guest count
- ✅ Invalid bookings (past dates, bad time slots, missing fields) are rejected with clear `400` errors

---

## Role-Based Access Control

- A JWT is issued on login/register and stored client-side; every API request attaches it via `Authorization: Bearer <token>`.
- `middleware/auth.js` provides:
  - `protect` — verifies the JWT and attaches the user to `req.user`
  - `authorize(...roles)` — restricts a route to specific roles
- **Customer routes** (`/api/reservations/*`) — customers can only create, view, or cancel their **own** reservations.
- **Admin routes** (`/api/admin/*`) — full visibility and control over all reservations.
- **Table routes** (`/api/tables`) — reading is open to any logged-in user (needed for the booking form); creating/editing/deleting is admin-only.
- On the frontend, `ProtectedRoute` blocks access to `/dashboard` and `/admin` based on role.

---

## API Reference

### Auth

| Method | Endpoint             | Access | Description               |
|--------|-----------------------|--------|-----------------------------|
| POST   | `/api/auth/register`  | Public | Register (customer/admin)  |
| POST   | `/api/auth/login`     | Public | Login, returns JWT         |
| GET    | `/api/auth/me`        | Private| Get current user           |

### Tables

| Method | Endpoint            | Access   | Description        |
|--------|-----------------------|----------|----------------------|
| GET    | `/api/tables`         | Private  | List active tables  |
| POST   | `/api/tables`         | Admin    | Create a table      |
| PUT    | `/api/tables/:id`     | Admin    | Update a table      |
| DELETE | `/api/tables/:id`     | Admin    | Delete a table      |

### Reservations (Customer)

| Method | Endpoint                  | Access   | Description                          |
|--------|------------------------------|----------|-----------------------------------------|
| POST   | `/api/reservations`         | Customer | Create a reservation (auto table assign)|
| GET    | `/api/reservations/my`      | Customer | View own reservations                  |
| DELETE | `/api/reservations/:id`     | Customer | Cancel own reservation                 |

### Admin

| Method | Endpoint                       | Access | Description                                                     |
|--------|-----------------------------------|--------|-----------------------------------------------------------------------|
| GET    | `/api/admin/reservations`       | Admin  | View all — supports `?date=`, `?status=`, `?search=`, `?page=`, `?limit=` |
| PUT    | `/api/admin/reservations/:id`   | Admin  | Update any reservation                                            |
| DELETE | `/api/admin/reservations/:id`   | Admin  | Cancel any reservation                                            |
| GET    | `/api/admin/stats`              | Admin  | Dashboard counts + today's occupancy %                            |
| GET    | `/api/admin/availability`       | Admin  | Table × time-slot grid for a given date                          |

---

## Known Limitations

- No email/SMS notifications on booking or cancellation (out of scope for this assignment).
- No payment integration (out of scope).
- The race condition on simultaneous bookings for the exact same table/slot is reduced but not fully eliminated without DB-level transactions.
- Registration allows self-selecting the "Administrator" role for demo convenience — not production-safe.
- No automated test suite yet.

---

## Future Improvements

- Wrap the availability-check + insert in a MongoDB transaction (`session.withTransaction`) to fully close the booking race condition
- Add automated tests (Jest + Supertest for backend, React Testing Library for frontend)
- Proper admin-invite flow instead of self-service admin signup
- Email/SMS reservation confirmations and reminders
- Table-layout visualization with a per-table booking calendar
- Refresh tokens with silent re-authentication

---

## Deployment

| Service   | Recommended Platform                             |
|-----------|-----------------------------------------------------|
| Database  | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier) |
| Backend   | [Render](https://render.com) — root dir `backend`, build `npm install`, start `npm start` |
| Frontend  | [Vercel](https://vercel.com) — root dir `frontend`, build `npm run build`, output `dist` |

After deploying, set the backend's `CLIENT_URL` to the deployed frontend URL (for CORS), and the frontend's `VITE_API_URL` to the deployed backend URL + `/api`.

---

## License

This project was built as a student/assignment submission and is provided as-is for educational purposes.