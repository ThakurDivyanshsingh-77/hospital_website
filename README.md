# CareConnect Suite (React + Express + MySQL)

This project uses:

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + MySQL + JWT auth
- Database: MySQL
- File uploads: local disk storage via Multer (`backend/uploads`)

## Project Structure

- `src/` frontend app
- `backend/` Express API server

## Backend Setup

1. Go to backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create env file:

```bash
cp .env.example .env
```

4. Update `backend/.env` with MySQL settings:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- optional: `MYSQL_URL` (full MySQL connection URL, can be used instead of `MYSQL_*`)
- `JWT_SECRET` (any secure secret)
- `CLIENT_URL` (frontend URL, default `http://localhost:5173`)
- optional seeded admin credentials:
  - `SEED_ADMIN_EMAIL`
  - `SEED_ADMIN_PASSWORD`
  - `SEED_ADMIN_NAME`

5. Run backend:

```bash
npm run dev
```

## Frontend Setup

1. From project root, install dependencies:

```bash
npm install
```

2. Ensure root `.env` includes:

```env
VITE_API_URL="http://localhost:5000/api"
```

3. Run frontend:

```bash
npm run dev
```

## Local Run Links

- Frontend app: <http://localhost:5173>
- Backend API base: <http://localhost:5000/api>
- Backend health check: <http://localhost:5000/api/health>

## Useful Commands

From root:

- `npm run dev` -> frontend
- `npm run dev:backend` -> backend
- `npm run build` -> frontend production build

From `backend/`:

- `npm run dev` -> backend with nodemon
- `npm run seed` -> seed default departments and optional admin

## Auth + Roles

- Signup from UI creates a `patient` account.
- Admin can create doctor accounts from Admin -> Doctors.
- Protected pages are role-based (`admin`, `doctor`, `patient`).
