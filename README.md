# WeCareForYou — Healthcare Application (MEAN)

A role-based healthcare platform that streamlines patient management:
online appointment booking, electronic medical records, doctor consultations
with prescriptions, and administrative management.

- **Frontend:** Angular 19 (standalone) + Bootstrap 5
- **Backend:** Node.js + Express + Mongoose
- **Database:** MongoDB (local **or** Atlas — your choice)
- **Auth:** JWT, role-based (Admin / Doctor / Patient)

```
.
├── server/   # Express REST API
├── client/   # Angular SPA
└── README.md
```

---

## Quick start

### Option A — Docker (easiest, nothing to install but Docker)

Runs MongoDB + API + UI together. The database is auto-seeded.

```bash
git clone <your-repo-url> wecareforyou
cd wecareforyou
docker compose up --build
```

- UI  → <http://localhost:4200>
- API → <http://localhost:5000/api/health>

Stop with `Ctrl+C`; `docker compose down` to remove containers (data
persists in the `mongo-data` volume — add `-v` to wipe it). Set a real
secret with `JWT_SECRET=$(openssl rand -hex 32) docker compose up --build`.

### Option B — Run locally with Node

```bash
git clone <your-repo-url> wecareforyou
cd wecareforyou

# 1) Backend
cd server
cp .env.example .env          # then edit .env (see below)
npm install
npm run seed:all              # seeds catalogs + doctors for every specialization + patients
npm run dev                   # API → http://localhost:5000

# 2) Frontend (in a second terminal)
cd ../client
npm install
npm start                     # UI → http://localhost:4200
```

Open <http://localhost:4200> and sign in with a demo account (table below).

---

## 1. Prerequisites

- **Node.js 18+** (tested on v22) and npm
- **MongoDB**, either:
  - **Local** — a MongoDB server running on `mongodb://127.0.0.1:27017`
    (install MongoDB Community Server, or run
    `docker run -d -p 27017:27017 --name mongo mongo:7`), **or**
  - **Atlas** — a free cloud cluster; copy its SRV connection string and
    allowlist your IP under *Network Access*.

> **Windows tip:** if PowerShell blocks npm (`running scripts is disabled`),
> run the commands from **Git Bash**, or use `npm.cmd` / `npx.cmd`.

---

## 2. Configure the backend (`server/.env`)

`cp .env.example .env`, then set:

| Variable      | What to put |
|---------------|-------------|
| `MONGO_URI`   | Local: `mongodb://127.0.0.1:27017/wecareforyou` · Atlas: your `mongodb+srv://…` string |
| `JWT_SECRET`  | Any long random string (e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `PORT`        | `5000` (default) |
| `CLIENT_ORIGIN` | `http://localhost:4200` (Angular dev origin) |

The `SEED_*` variables control the demo account credentials and can be left
as-is. `.env` is git-ignored — only `.env.example` is committed.

### Seeding data

| Command | What it creates |
|---------|-----------------|
| `npm run seed`     | Catalogs + 3 demo accounts + a few named doctors |
| `npm run seed:all` | Catalogs + admin + **3 doctors for every specialization** + 12 patients (recommended; idempotent — safe to re-run) |

Health check: `GET http://localhost:5000/api/health`

### Demo accounts

| Role    | Email                                        | Password    |
|---------|----------------------------------------------|-------------|
| Admin   | `admin@wecareforyou.com`                     | `Admin@123`   |
| Doctor  | `doctor@wecareforyou.com`                    | `Doctor@123`  |
| Doctor  | `<specialization>.<1-3>@wecareforyou.com`    | `Doctor@123`  |
| Patient | `patient@wecareforyou.com`                   | `Patient@123` |
| Patient | `patient1` … `patient11@wecareforyou.com`    | `Patient@123` |

Doctor email pattern (after `seed:all`): specialization lowercased with
spaces → `-`, then `.1`–`.3`. Examples: `cardiology.1@wecareforyou.com`,
`general-medicine.2@wecareforyou.com`,
`obstetrics-and-gynecology.1@wecareforyou.com`.

---

## 3. Frontend (`/client`)

```bash
cd client
npm install
npm start                     # ng serve → http://localhost:4200
```

The API base URL lives in `client/src/app/core/api.config.ts` (defaults to
`http://localhost:5000/api`). Change it if you host the API elsewhere.

Production build: `npm run build` → output in `client/dist/`.

---

## 4. Features

**Patient** — self-registration (real-time validation + password-strength
meter), search doctors by specialization/name, book appointments, dashboard
with upcoming (reschedulable) & completed consultations + full prescription
view, edit profile & medical history.

**Doctor** — dashboard with upcoming (highlighted green) & completed
appointment tables (patient, contact, symptoms), confirm/reject/cancel,
consultation form (symptoms, exam, treatment plan, recommended tests,
prescription rows `medicine + 0-0-1 + AF/BF`, diagnosis) → marks completed,
edit professional profile.

**Admin** — overview counts, manage doctors (add/update/delete, creates the
doctor login), manage patients, view & reschedule any appointment.

**Cross-cutting** — JWT + role-guarded routes (Angular) and role middleware
(Express), central error handling with user-readable messages, winston/morgan
logging, responsive Bootstrap UI, simple in-app forgot-password.

---

## 5. End-to-end test (happy path)

1. `npm run seed:all`, then start server + client.
2. Register a new patient → redirected to login → sign in.
3. Patient → Book Appointment → pick a doctor → submit request.
4. Sign in as that **doctor** → upcoming row is green → **Confirm** →
   **Consult** → fill symptoms/exam/treatment/tests/prescription
   (`medicine + 0-0-1 + AF`) + diagnosis → Save.
5. Sign back in as the **patient** → Completed Consultations → **View**
   shows the prescription & diagnosis.
6. Sign in as **admin** → add a doctor (they can immediately log in);
   reschedule an appointment; update/delete a patient.

> A scripted version is included: with the server running,
> `node server/scripts/smoke.js` exercises the whole flow and prints PASS/FAIL.

---

## 6. API summary

| Area    | Endpoints |
|---------|-----------|
| Auth    | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/forgot-password` · `GET /api/auth/me` |
| Catalog | `GET /api/catalog/specializations` · `/medicines` · `/tests` |
| Doctors | `GET /api/doctors` · `GET /api/doctors/:id` |
| Patient | `GET/PUT /api/patient/me` · `POST /api/appointments` · `GET /api/appointments/mine` · `PUT /api/appointments/:id/reschedule` |
| Doctor  | `GET/PUT /api/doctor/me` · `GET /api/doctor/appointments` · `PUT /api/doctor/appointments/:id/status` · `PUT /api/doctor/appointments/:id/consultation` |
| Admin   | CRUD `/api/admin/doctors` · CRUD `/api/admin/patients` · `GET /api/admin/appointments` · `GET /api/admin/appointments/:id` · `PUT /api/admin/appointments/:id/reschedule` |

> Reference catalogs (specializations, medicines, medical tests) are seeded
> from `server/src/seed/catalog.data.js`. Edit that file and re-run a seed
> command to customise them.

---

## License

MIT — see [LICENSE](LICENSE).
