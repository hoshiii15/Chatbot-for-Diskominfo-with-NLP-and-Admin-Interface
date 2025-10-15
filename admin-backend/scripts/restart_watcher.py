#!/usr/bin/env python3
"""
Simple restart watcher helper.
- Monitors admin-backend/tmp/restart-requests.jsonl for new lines.
- When a new line appears, runs the configured RESTART_COMMAND (env var).
- Marks processed entries by moving them into processed-<timestamp>.jsonl or appending to processed.jsonl

Usage:
  python scripts/restart_watcher.py

Run this as a privileged service (systemd / supervisor) if you want automatic restarts.
"""
import os
import time
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TMP_DIR = ROOT / 'tmp'
REQUESTS = TMP_DIR / 'restart-requests.jsonl'
PROCESSED = TMP_DIR / 'restart-processed.jsonl'

RESTART_COMMAND = os.environ.get('RESTART_COMMAND')
POLL_INTERVAL = float(os.environ.get('RESTART_WATCH_INTERVAL', '2'))


def run_command(cmd):
    try:
        print(f"Running: {cmd}")
        r = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print('Exit', r.returncode)
        print(r.stdout)
        if r.stderr:
            print('ERR:', r.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print('Command failed:', e)
        print(e.stdout)
        print(e.stderr)
        return False


def process_new_lines():
    if not REQUESTS.exists():
        return
    with REQUESTS.open('r', encoding='utf8') as fh:
        lines = fh.read().strip().splitlines()
    if not lines:
        return
    # Process all lines and then truncate file
    for line in lines:
        try:
            entry = json.loads(line)
        except Exception as e:
            print('Invalid json line, skipping', e)
            continue
        print('Processing restart request:', entry)
        if RESTART_COMMAND:
            # Sanitize RESTART_COMMAND: some shells (PowerShell) may pass
            # strings with escaped quotes or backslashes (e.g. \"). Normalize
            # common escape sequences so the command we run is valid.
            rc = RESTART_COMMAND
            # If someone included literal surrounding quotes, strip them
            if rc.startswith('"') and rc.endswith('"'):
                rc = rc[1:-1]
            # Replace escaped quotes \" with " and double backslashes with single
            rc = rc.replace('\\"', '"').replace('\\\\', '\\')
            # Also replace single-escaped backslashes commonly produced by some shells
            rc = rc.replace('\\', '\\')
            cmd = rc
            # Allow the command to include a {target} placeholder which will be
            # substituted with the entry target. Example:
            # RESTART_COMMAND='supervisorctl restart {target}'
            cmd = RESTART_COMMAND
            try:
                # Safely format the command with the target field. Use get()
                # to avoid KeyError for missing fields.
                target = entry.get('target') if isinstance(entry, dict) else None
                if target:
                    try:
                        cmd = rc.format(target=target)
                    except Exception:
                        # fallback to naive replacement
                        cmd = rc.replace('{target}', str(target))
            except Exception as e:
                print('Failed to format RESTART_COMMAND with target, using raw command', e)
                cmd = RESTART_COMMAND

            ok = run_command(cmd)
            # write processed record
            with PROCESSED.open('a', encoding='utf8') as pf:
                pf.write(json.dumps({'entry': entry, 'command': cmd, 'ok': ok, 'ts': time.time()}) + "\n")
        else:
            print('No RESTART_COMMAND set; skipping actual restart step')
            with PROCESSED.open('a', encoding='utf8') as pf:
                pf.write(json.dumps({'entry': entry, 'command': None, 'ok': False, 'ts': time.time()}) + "\n")
    # After processing, rotate requests file
    try:
        if REQUESTS.exists():
            timestamp = int(time.time())
            archived = TMP_DIR / f'restart-requests.{timestamp}.jsonl'
            REQUESTS.rename(archived)
            print('Archived requests to', archived)
    except Exception as e:
        print('Failed to archive requests file', e)


if __name__ == '__main__':
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    print('Watching for restart requests in', REQUESTS)
    try:
        while True:
            process_new_lines()
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print('Exiting')
