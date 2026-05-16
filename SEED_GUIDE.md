# WeCareForYou — Seed & Credentials Guide

A single reference for populating the database and logging in. Running one
command gives you a fully usable app with no manual data entry.

---

## 1. The seed script

**File:** `server/src/seed/seed-all.js`

**Run it:**

```bash
cd ~/Desktop/Mani/server
npm run seed:all
```

> Prerequisites: `cp .env.example .env` and set `MONGO_URI` + `JWT_SECRET`,
> MongoDB running, `npm install` done once. The API server does **not** need
> to be running — the seed connects to MongoDB directly and exits.

### What it populates (one command, no manual entry ever)

- All **16 specializations** + **24 medicines** + **20 medical tests**
- **Admin** account
- **48 doctors** — 3 for every specialization, so every option in the
  patient "find a doctor" dropdown returns results
- **12 patients** with login accounts

### Verified

- ✅ **Idempotent** — re-running shows `0 newly created`, no duplicates
- ✅ Every one of the 16 specializations has **≥3 doctors**
- ✅ API confirmed: selecting any specialization (e.g. Neurology) returns doctors

---

## 2. Login credentials (predictable pattern)

| Role     | Email                                                        | Password    |
|----------|--------------------------------------------------------------|-------------|
| Admin    | `admin@wecareforyou.com`                                     | `Admin@123`   |
| Doctors  | `<specialization>.<1-3>@wecareforyou.com`                    | `Doctor@123`  |
| Patients | `patient@wecareforyou.com`, `patient1`…`patient11@wecareforyou.com` | `Patient@123` |

> Passwords are **case-sensitive** and must have **no leading/trailing
> spaces** (the app trims them automatically, but type them exactly).

**Doctor email rule:** specialization lowercased, spaces → `-`, then
`.1`–`.3`. Examples:

- `cardiology.1@wecareforyou.com`
- `pediatrics.2@wecareforyou.com`
- `general-medicine.3@wecareforyou.com`
- `obstetrics-and-gynecology.1@wecareforyou.com`

### A few guaranteed-valid doctor logins (all password `Doctor@123`)

| Specialty                | Email                                 |
|--------------------------|---------------------------------------|
| Obstetrics & Gynecology  | `doctor@wecareforyou.com`             |
| Cardiology               | `cardiology.1@wecareforyou.com`       |
| General Medicine         | `general-medicine.1@wecareforyou.com` |
| Pediatrics               | `pediatrics.1@wecareforyou.com`       |
| Neurology                | `neurology.1@wecareforyou.com`        |
| Orthopedics              | `orthopedics.1@wecareforyou.com`      |
| Dermatology              | `dermatology.1@wecareforyou.com`      |
| Dentistry                | `dentistry.1@wecareforyou.com`        |

---

## 3. All commands

| Command                 | From      | Purpose                                                         |
|-------------------------|-----------|-----------------------------------------------------------------|
| `npm run seed:all`      | `server/` | All specializations × 3 doctors + 12 patients + admin (**recommended**) |
| `npm run seed`          | `server/` | Smaller demo dataset                                            |
| `npm run dev`           | `server/` | Start API (auto-reload) on `:5000`                              |
| `npm start`             | `server/` | Start API (plain node) on `:5000`                               |
| `node scripts/smoke.js` | `server/` | Full patient → doctor → admin API test (server must be running) |
| `npm start`             | `client/` | Start Angular UI on `:4200`                                     |

---

## 4. Customizing the seed data

The old `npm run seed` still exists (lighter demo set); `npm run seed:all`
is the comprehensive one.

To change the doctor/patient pools, edit the arrays at the top of
`server/src/seed/seed-all.js` (`FIRST_NAMES`, `LAST_NAMES`, `PATIENTS`,
`DOCTORS_PER_SPECIALIZATION`, etc.) and re-run `npm run seed:all`.
Existing records stay intact — only new ones are added.

Reference catalogs (specializations, medicines, tests) live in
`server/src/seed/catalog.data.js`.

---

## 5. Typical first run

```bash
# Terminal 1 — API
cd ~/Desktop/Mani/server
cp .env.example .env        # set MONGO_URI + JWT_SECRET
npm install
npm run seed:all            # populate everything
npm run dev                 # http://localhost:5000

# Terminal 2 — UI
cd ~/Desktop/Mani/client
npm install
npm start                   # http://localhost:4200
```

Then open <http://localhost:4200> and sign in with any account above.
