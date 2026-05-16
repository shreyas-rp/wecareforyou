# WeCareForYou — SQL Service Setup (`server-sql`)

Express + Sequelize + **MySQL** backend. Exposes the same REST API as the
Mongo backend (SQL `id` is exposed as `_id`), so the Angular UI works
against it unchanged.

This guide covers setup **with Docker** and **without Docker**, and lists
every script you can run.

---

## 0. Prerequisites

- **Node.js 18+** and npm (only needed for the "without Docker" path)
- **Docker Desktop** (only for the Docker path)
- **Windows:** run npm from **Git Bash**, or use `npm.cmd` (PowerShell
  blocks the `.ps1` shims)
- Run **one backend at a time** — the API uses port **5000**, the UI **4200**

---

## 1. With Docker (recommended — nothing to install but Docker)

All Docker files live in this folder, so run it from here:

```bash
cd server-sql
docker compose up --build
```

This starts 4 things automatically:

| Service      | What it does                                  |
|--------------|-----------------------------------------------|
| `db`         | MySQL 8 (data persisted in `mysql-data` volume) |
| `seed-sql`   | One-shot: creates tables + seeds data, exits 0 |
| `server-sql` | The API → http://localhost:5000               |
| `client`     | The Angular UI → http://localhost:4200        |

Manage it (from `server-sql/`):

```bash
docker compose ps                  # status
docker compose logs -f server-sql  # API logs
docker compose logs seed-sql       # seed output
docker compose down                # stop (keep data)
docker compose down -v             # stop + wipe the DB volume
docker compose up --build -d       # run in background
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build   # real secret
```

Healthy startup logs:

```
info: MySQL connected.
info: Schema synced (sequelize.sync).
info: WeCareForYou API (MySQL) listening on http://localhost:5000 (production)
```

> `seed-sql` exiting with code 0 is **normal** — it's a one-shot job; the
> API only starts after it succeeds.

---

## 2. Without Docker (local Node + a MySQL you provide)

### 2a. Get a MySQL database

Pick any one:

- **Local MySQL install** — MySQL Community Server running on `:3306`,
  then create the DB: `CREATE DATABASE wecareforyou;`
- **MySQL in a container, app on host** (no full Docker stack):
  ```bash
  docker run -d --name wecare-mysql \
    -e MYSQL_ROOT_PASSWORD=wecare \
    -e MYSQL_DATABASE=wecareforyou \
    -p 3306:3306 mysql:8
  docker logs -f wecare-mysql      # wait for "ready for connections"
  ```
- **Managed MySQL** (PlanetScale, RDS, etc.) — use its host/credentials.

### 2b. Configure the service

```bash
cd server-sql
cp .env.example .env
```

Edit `server-sql/.env`:

```
PORT=5000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=wecareforyou
DB_USER=root
DB_PASSWORD=wecare
DB_SYNC=true          # auto-creates/updates tables from the models

JWT_SECRET=any-long-random-string
CLIENT_ORIGIN=http://localhost:4200
```

(Alternatively set a single `DATABASE_URL=mysql://user:pass@host:3306/wecareforyou`.)

### 2c. Install, seed, run

```bash
npm install
npm run seed:all      # creates tables + all doctors/patients (recommended)
npm run dev           # API → http://localhost:5000 (auto-reload via nodemon)
```

---

## 3. Scripts reference (`npm run …` in `server-sql/`)

| Script              | What it does |
|---------------------|--------------|
| `npm run dev`       | Start API with **nodemon** (auto-reload). Dev. |
| `npm start`         | Start API with plain `node`. Prod-style. |
| `npm run seed`      | Lighter seed: catalogs + demo admin/doctor/patient + a few named doctors. |
| `npm run seed:all`  | **Full seed** (idempotent): catalogs + admin + 3 doctors for every specialization + 12 patients. |

> Seeds connect to MySQL directly and exit; run them **before** or while the
> API runs. `seed:all` is safe to re-run — it never duplicates.

---

## 4. Run the Angular UI against this backend

In a separate terminal:

```bash
cd ../client
npm install
npm start                # http://localhost:4200
```

The UI is configured to call `http://localhost:5000/api`
(`client/src/app/core/api.config.ts`). No change needed — the SQL backend
returns the exact same shape as the Mongo one.

---

## 5. Verify it works

```bash
curl http://localhost:5000/api/health
# {"success":true,"message":"WeCareForYou API (MySQL) is running."}
```

Full end-to-end check (server must be running), expect all PASS:

```bash
node ../server/scripts/smoke.js
```

Log in at http://localhost:4200:

| Role    | Email                            | Password    |
|---------|----------------------------------|-------------|
| Admin   | `admin@wecareforyou.com`         | `Admin@123`   |
| Doctor  | `cardiology.1@wecareforyou.com`  | `Doctor@123`  |
| Patient | `patient@wecareforyou.com`       | `Patient@123` |

Doctor email pattern after `seed:all`:
`<specialization>.<1-3>@wecareforyou.com` (specialization lowercased,
spaces → `-`).

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `no configuration file provided: not found` | Run `docker compose` from inside `server-sql/`. |
| `Conflict ... container name "/wecare-..." already in use` | Old containers from a previous run: `docker rm -f wecare-mysql wecare-server-sql wecare-client-sql wecare-seed-sql`, then `docker compose up --build`. |
| `EADDRINUSE :::5000` | Another backend is on port 5000 (the Mongo one). Stop it first. |
| `docker compose logs server-sql` empty but healthy | Rebuild so the (now stdout) logger applies: `docker compose up --build`. |
| API can't reach DB (no-Docker path) | MySQL not ready or wrong `DB_*` in `.env`. Wait for "ready for connections", recheck creds. |
| `Access denied for user` | Wrong `DB_USER`/`DB_PASSWORD`. Match what MySQL was started with. |

---

## TL;DR

```bash
# With Docker
cd server-sql && docker compose up --build

# Without Docker (MySQL already running)
cd server-sql && cp .env.example .env   # set DB_* + JWT_SECRET
npm install && npm run seed:all && npm run dev
```

UI: `cd ../client && npm install && npm start` → http://localhost:4200
