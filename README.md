# FAQ Chatbot — Development README

This repository contains a small FAQ chatbot project with three main parts:

- `admin-backend` — Express.js / TypeScript admin API and health endpoints.
- `admin-frontend` — Next.js (app router) admin dashboard UI.
- `python-bot` — Python Flask-based chatbot server and NLP processor.

This README explains how to run the full development stack locally on Windows (PowerShell) and how to manage logs (including a new endpoint to trim bot logs older than 1 month).

## Prerequisites

- Node.js >= 18
- npm (comes with Node.js)
- Python 3.10+ (3.12 used in development here)
- pip
- Optional: `virtualenv` or `venv` for Python virtual environments

## Quick start (three terminals)

1. Start the admin backend

```powershell
cd "D:\Kuliah\Kuliah\Magang\FAQ Chatbotv2\admin-backend"
npm install
npm run dev
```

This runs the backend in development mode using `nodemon` and the TypeScript source in `src/`.

2. Start the admin frontend

```powershell
cd "D:\Kuliah\Kuliah\Magang\FAQ Chatbotv2\admin-frontend"
npm install
npm run dev
```

The Next.js app will start (usually on http://localhost:3000). Open the dashboard and authenticate as needed.

3. Start the Python bot (in a Python virtualenv)

```powershell
cd "D:\Kuliah\Kuliah\Magang\FAQ Chatbotv2\python-bot"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The bot listens by default on port 5000. It writes logs to `python-bot/bot.log` (development) and also attempts to forward chat events to the admin backend.

## Log management

- Backend combined logs are in `admin-backend/logs/combined.log` (if configured).
- The Python bot writes `python-bot/bot.log` locally.

There is an admin API endpoint to view recent bot logs (tail):

- GET /api/health/logs?source=bot — returns the tail (last ~50KB) of the bot log as plain text.

New: Trim bot logs older than N days (safe, creates backup)

- POST /api/health/logs/deleteOlderThan
  - Body (JSON): { "days": 30 } — defaults to 30 if omitted.
  - Behavior: creates a timestamped backup in the configured backup path, then rewrites `bot.log` keeping only lines whose timestamp is within the last N days. Lines that don't match a timestamp pattern are conservatively kept.

Example (use curl or open the dashboard and click the "Delete >1 month" button in System Health → View Bot Log):

```powershell
# example with PowerShell's Invoke-RestMethod (adjust URL/port if needed)
$body = @{ days = 30 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/health/logs/deleteOlderThan -Method POST -Body $body -ContentType 'application/json' -Headers @{ Authorization = 'Bearer <TOKEN>' }
```

The server will respond with JSON `{ success: true, kept: <num>, removed: <num>, backup: <path> }` on success.

## Notes and tips

- The frontend includes sanitization for log text to strip ANSI escape sequences and control characters so logs render cleanly in the dashboard.
- The Bot Logs modal auto-scrolls to the latest entries when opened.
- The backend `POST /api/logs/delete` and `POST /api/logs/deleteAll` endpoints let you delete database chat logs by range — use with care.
- For production, consider using a process manager (systemd, supervisor, or PM2) and a rotating log handler (Python's RotatingFileHandler) instead of manual trimming.

## Troubleshooting

- If the python bot isn't visible in the dashboard, check that it's running and reachable on the configured URL (default http://localhost:5000). The bot will log errors to `python-bot/bot.log` if it can't reach the admin backend.
- If TypeScript checks fail for the frontend, run:

```powershell
cd "D:\Kuliah\Kuliah\Magang\FAQ Chatbotv2\admin-frontend"
npx tsc --noEmit -p tsconfig.json
```

If you need me to further expand these instructions or add Docker / supervisor examples, tell me which format you prefer.

---

Generated: 2025-09-16T00:00:00.000Z
