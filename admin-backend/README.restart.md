# Restart helper

This directory includes a safe helper script to enable automated restarts.

1. The API endpoint `POST /api/system/restart` appends a JSONL entry to `admin-backend/tmp/restart-requests.jsonl`.

2. `scripts/restart_watcher.py` is a small, intentionally out-of-process helper that polls this file and executes the command in the `RESTART_COMMAND` environment variable when a new request is found.

Usage (example):

Set the desired command (for example, using supervisorctl):

```powershell
$env:RESTART_COMMAND = 'supervisorctl restart all'
python scripts/restart_watcher.py
```

Run the watcher as a system service (systemd/supervisor) with appropriate privileges. Do NOT run it as the same unprivileged user as the web process if the restart command requires elevated rights.

Security note: only bind the web endpoint to authenticated admin users. The watcher must be run as a trusted/privileged account.

Restarting a specific service
-----------------------------

The watcher supports a `{target}` placeholder in `RESTART_COMMAND`. If you POST to
`/api/system/restart` with a JSON body like `{ "target": "python-bot" }`, the
watcher will substitute `{target}` into the command.

Example (PowerShell):

```powershell
$env:RESTART_COMMAND = 'supervisorctl restart {target}'
python scripts/restart_watcher.py

# From another shell (or your UI), request only the python bot to restart:
# POST /api/system/restart { "target": "python-bot" }
```

This will execute `supervisorctl restart python-bot` for each new request entry.

If `{target}` is not present in the command, the watcher will run the command as-is and ignore the target field.
