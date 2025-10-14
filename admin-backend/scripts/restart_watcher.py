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
            ok = run_command(RESTART_COMMAND)
            # write processed record
            with PROCESSED.open('a', encoding='utf8') as pf:
                pf.write(json.dumps({'entry': entry, 'command': RESTART_COMMAND, 'ok': ok, 'ts': time.time()}) + "\n")
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
