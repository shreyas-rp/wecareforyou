# How to Start the SQL Backend (`server-sql`)

The MySQL + Sequelize backend. Same REST API and UI as the Mongo backend —
run **one backend at a time** on port 5000.

> **Windows:** run npm from **Git Bash** (or use `npm.cmd`) — PowerShell
> blocks the `.ps1` shims.

---

## Option A — Everything in Docker (recommended, no MySQL install)

Brings up MySQL + auto-seed + API + UI together.

```bash
cd ~/Desktop/Mani                       # IMPORTANT: the repo ROOT, not server-sql/
docker compose -f docker-compose.sql.yml up --build
```

- UI  → http://localhost:4200
- API → http://localhost:5000/api/health

Common gotcha: the compose file lives at the project **root**. Running it
from inside `server-sql/` fails with
`open ...\server-sql\docker-compose.sql.yml: The system cannot find the file`.
Always `cd ~/Desktop/Mani` first.

Manage it (from the root, in another terminal):

```bash
docker compose -f docker-compose.sql.yml ps          # status of all services
docker compose -f docker-compose.sql.yml logs -f server-sql   # API logs
docker compose -f docker-compose.sql.yml logs seed-sql        # seed output
docker compose -f docker-compose.sql.yml down        # stop (keep data)
docker compose -f docker-compose.sql.yml down -v     # stop + wipe DB volume
JWT_SECRET=$(openssl rand -hex 32) docker compose -f docker-compose.sql.yml up --build
```

Expected once healthy (`server-sql` logs):

```
info: MySQL connected.
info: Schema synced (sequelize.sync).
info: WeCareForYou API (MySQL) listening on http://localhost:5000 (production)
```

`seed-sql` is a one-shot job — it runs `seed:all` and **exits 0** (that is
normal, not a crash; the API only starts after it succeeds).

---

## Option B — MySQL in Docker, API with Node (dev / auto-reload)

**1. Start just MySQL:**

```bash
docker run -d --name wecare-mysql \
  -e MYSQL_ROOT_PASSWORD=wecare \
  -e MYSQL_DATABASE=wecareforyou \
  -p 3306:3306 mysql:8
# wait ~20-30s on first run:
docker logs -f wecare-mysql        # until "ready for connections"
```

**2. Configure the API:**

```bash
cd ~/Desktop/Mani/server-sql
cp .env.example .env
```

Set in `server-sql/.env`:

```
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=wecareforyou
DB_USER=root
DB_PASSWORD=wecare
DB_SYNC=true
JWT_SECRET=any-long-random-string
```

**3. Install, seed, run:**

```bash
npm install
npm run seed:all      # creates tables + every specialization's doctors + patients
npm run dev           # API → http://localhost:5000  (auto-reload)
# or: npm start       # plain node, no auto-reload
```

---

## Option C — A MySQL you already have installed

Same as Option B steps 2–3, but put your real host/user/password/db in
`server-sql/.env`. Create the database first if needed:
`CREATE DATABASE wecareforyou;` (with `DB_SYNC=true` the tables are
auto-created).

---

## Verify it works

```bash
curl http://localhost:5000/api/health
# {"success":true,"message":"WeCareForYou API (MySQL) is running."}

# Full end-to-end check (server must be running):
node server/scripts/smoke.js          # expect all PASS
```

Then start the UI and log in:

```bash
cd ~/Desktop/Mani/client && npm start     # http://localhost:4200
```

| Role    | Email                                | Password    |
|---------|--------------------------------------|-------------|
| Admin   | `admin@wecareforyou.com`             | `Admin@123`   |
| Doctor  | `cardiology.1@wecareforyou.com`      | `Doctor@123`  |
| Patient | `patient@wecareforyou.com`           | `Patient@123` |

(Doctor email pattern after `seed:all`: `<specialization>.<1-3>@wecareforyou.com`,
specialization lowercased with spaces → `-`.)

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `... server-sql\docker-compose.sql.yml: cannot find the file` | You ran it from `server-sql/`. `cd ~/Desktop/Mani` (repo root) and use `-f docker-compose.sql.yml`. |
| `docker compose logs server-sql` is empty but status is `healthy` | Old image with the silent-in-production logger. App is fine; rebuild to get stdout logs: `docker compose -f docker-compose.sql.yml up --build`. |
| `EADDRINUSE: :::5000` | Another backend (the Mongo `server`) is using port 5000. Stop it first. |
| Port 5000/4200 already mapped | Don't run the Mongo stack and the SQL stack at the same time. |
| `seed-sql` shows "exited (0)" | Expected — it's a one-shot seed job, not a crash. |
| API can't reach DB locally | MySQL not ready yet, or wrong `DB_*` in `server-sql/.env`. Wait for "ready for connections", recheck creds. |

---

## Which command should I usually run?

```bash
cd ~/Desktop/Mani
docker compose -f docker-compose.sql.yml up --build
```

That's the whole SQL stack (DB + seed + API + UI) in one command.
