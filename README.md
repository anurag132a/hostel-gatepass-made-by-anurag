# HostelHub GatePass Management — MERN Stack

Converted from the supplied Flask/SQLite project to:
- **MongoDB + Mongoose** — database
- **Express.js + Node.js** — REST API
- **React + Vite** — frontend
- **JWT authentication + bcrypt** — login/password hashing
- Role-based access for Hosteller, Principal, HOD, Warden, Security

## Features
- Role-specific dashboard and gate-pass history
- Hosteller can view only their own profile and gate passes
- Staff roles can view the hosteller directory and student details
- Gate-pass request with reason, destination, exit time and expected return
- Principal, HOD and Warden each approve/reject
- After all three approvals, the API generates OUT and IN codes
- Security validates OUT code to record exit and IN code to record return
- Demo data seeding
- API-side authorization (not only frontend hiding)

## Requirements
- Node.js 20+ recommended
- MongoDB Community Server running locally, or MongoDB Atlas connection string
- VS Code / Windows PowerShell

## Run on Windows
Open the project folder in VS Code. Use two terminals.

### 1. Backend
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run seed
npm run dev
```
Backend: `http://localhost:5000`

### 2. Frontend
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:5173`

If PowerShell says `Copy-Item` cannot find a file, check that terminal is in the `backend` folder.

## MongoDB configuration
The example uses:
`mongodb://127.0.0.1:27017/hostel_gatepass`

For MongoDB Atlas, replace `MONGODB_URI` in `backend/.env` with your Atlas connection string. Do not commit `.env`.

## Demo accounts
| Role | Username | Password |
|---|---|---|
| Hosteller | student | student123 |
| Warden | warden | warden123 |
| HOD | hod | hod123 |
| Principal | principal | principal123 |
| Security | security | security123 |

Seed command resets/creates the demo users and only inserts a demo gate pass if the database has no gate passes. Do not use demo credentials in production.

## Main API routes
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/gatepasses`
- `POST /api/gatepasses`
- `POST /api/gatepasses/:id/decision`
- `POST /api/security/verify`
- `GET /api/hostellers`
- `GET /api/hostellers/:id`
- `GET /api/profile`

All protected routes require `Authorization: Bearer <token>`.

## Security notes before production
- Set a strong `JWT_SECRET`, HTTPS, secure secret storage, and production CORS origin.
- Add rate limiting, audit logging, CSRF considerations if using cookies, MFA for staff, and code expiry.
- For production, consider storing only hashed one-time gate codes and expiring them after use.
- Do not store Aadhaar/PAN/bank data unless there is a justified, compliant need.
