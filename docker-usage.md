This file documents how to run the project locally with Docker (Windows PowerShell).

Build and run all services (backend, frontend, python-bot, nginx):

# From repository root (PowerShell)

# Build images and start containers in detached mode

docker compose up --build -d

# Show logs for a service

docker compose logs -f admin-backend

# Exec into backend container (shell)

docker compose exec admin-backend sh

# Quick health & FAQ checks (PowerShell)

Invoke-RestMethod http://localhost:3001/ | ConvertTo-Json
Invoke-RestMethod http://localhost:3001/api/health | ConvertFrom-Json
Invoke-RestMethod http://localhost:3001/api/faq | ConvertFrom-Json

# If using nginx proxy, frontend will be available at http://localhost:8080

# Backend (direct) at http://localhost:3001, frontend at http://localhost:3000

Troubleshooting tips:

- If FAQ data is missing, ensure `admin-backend/database.sqlite` exists and `python-bot/data` contains `faq_stunting.json` and `faq_ppid.json`.
- If health reports fileSystem unhealthy, check `FAQ_DATA_PATH` in `docker-compose.yml` and inside container:
  docker compose exec admin-backend sh -c "ls -la /app/python-bot/data"
- To persist DB across runs, ensure `./admin-backend/database.sqlite` is a persistent file on host and mounted into container.
