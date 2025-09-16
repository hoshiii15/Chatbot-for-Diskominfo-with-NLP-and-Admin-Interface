# API Documentation (Admin Backend)

This document describes the main admin backend HTTP API endpoints relevant for monitoring and log management.

Base URL (development): http://localhost:3001

Authentication: many endpoints require a Bearer JWT passed in the Authorization header. Some administration endpoints require an editor/admin role.

## Health endpoints

### GET /api/health

Returns overall system health, uptime, memory, basic database checks and service statuses.

Response (200):

{
"success": true,
"data": { /_ health object _/ },
"timestamp": "..."
}

### GET /api/health/stats

Returns aggregated statistics (counts of users, chat logs, faqs, sessions, analytics, websites, recent activity).

Response (200):

{
"success": true,
"data": { /_ stats object _/ },
"timestamp": "..."
}

### GET /api/health/settings

Returns non-sensitive runtime settings (faqDataPath, pythonBotUrl, backupPath, version, environment).

Response (200): { success: true, data: { ... } }

### GET /api/health/logs?source=bot|backend

Returns a tail of the requested log file as plain text. `source=bot` (default) returns the Python bot log (`python-bot/bot.log`); `source=backend` returns the admin backend combined log (if present). Returns roughly the last ~50KB of the file.

Response (200): text/plain (log tail)

Errors: 404 if the requested log file is not found.

### POST /api/health/logs/deleteOlderThan

Trim the bot log file by removing entries older than a provided number of days. The endpoint creates a timestamped backup before overwriting the log file.

Authorization: recommended to call with an editor/admin token. In current implementation you should protect this route with your admin auth.

Body (JSON):

{
"days": 30 // optional, defaults to 30
}

Response (200):

{
"success": true,
"kept": <number of kept lines>,
"removed": <number of removed lines>,
"backup": "<path to backup file>",
"timestamp": "..."
}

Notes:

- The server looks for timestamp prefixes in each log line matching `YYYY-MM-DD HH:MM:SS,mmm`. Lines without that pattern are kept to avoid data loss.
- The backup is written into the configured backup path. Keep periodic backups or rotate logs using standard tooling in production.

## Chat log endpoints (database-backed)

### GET /api/logs

Query params: environment, startDate, endDate, page, limit, sessionId, search, preview, range, month

Returns paginated chat logs from the database. `range` values: `1day`, `1week`, `1month`, `pickmonth`.

Response (200):
{
"success": true,
"data": { logs: [...], pagination: { page, limit, total, totalPages } },
"timestamp": "..."
}

### POST /api/logs/delete

Delete chat logs by range (same params as GET). Requires editor role.

Body/Query: range, month, startDate, endDate, environment

Response (200): { success: true, deleted: <count>, timestamp: '...' }

Errors: 400 if no range provided (to avoid accidental full delete).

### POST /api/logs/deleteAll

Delete all chat logs (protected — requires editor/admin). Use with caution.

Response (200): { success: true, deleted: <count> }

## Examples

- Fetch latest bot logs (tail):

  curl -i "http://localhost:3001/api/health/logs?source=bot"

- Trim bot logs older than 30 days (PowerShell):

  $body = @{ days = 30 } | ConvertTo-Json
  Invoke-RestMethod -Uri http://localhost:3001/api/health/logs/deleteOlderThan -Method POST -Body $body -ContentType 'application/json' -Headers @{ Authorization = 'Bearer <TOKEN>' }

## Security and production notes

- The log trimming endpoint performs filesystem writes — protect it with authentication and role checks.
- For production, prefer to configure rotating logs (e.g., Python's RotatingFileHandler or external logrotate) and process supervisors to avoid manual trimming.

---

Generated: 2025-09-16T00:00:00.000Z
