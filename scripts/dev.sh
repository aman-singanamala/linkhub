#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ENV_FILE"
  set +a

  if [[ "${SPRING_PROFILES_ACTIVE:-}" == *supabase* ]] \
    && [ -z "${SUPABASE_JDBC_URL:-}" ] \
    && [ "$ENV_FILE" != ".env.supabase" ] \
    && [ -f ".env.supabase" ]; then
    echo "Supabase profile active but SUPABASE_JDBC_URL missing; falling back to .env.supabase"
    ENV_FILE=".env.supabase"
    set -a
    # shellcheck disable=SC1091
    source "$ENV_FILE"
    set +a
  fi

  echo "Using env file: $ENV_FILE"

  normalize_jdbc_url() {
    local url="${1:-}"
    if [ -z "$url" ]; then
      return 0
    fi
    case "$url" in
      jdbc:*) echo "$url" ;;
      postgresql://*|postgres://*) echo "jdbc:$url" ;;
      *) echo "$url" ;;
    esac
  }

  # Ensure SUPABASE_JDBC_URL is set and properly formatted
  if [ -n "${SUPABASE_JDBC_URL:-}" ]; then
    export SUPABASE_JDBC_URL
    SUPABASE_JDBC_URL="$(normalize_jdbc_url "$SUPABASE_JDBC_URL")"
  elif [ -n "${SUPABASE_DB_URL:-}" ]; then
    SUPABASE_JDBC_URL="$(normalize_jdbc_url "$SUPABASE_DB_URL")"
    export SUPABASE_JDBC_URL
  elif [ -n "${DATABASE_URL:-}" ]; then
    SUPABASE_JDBC_URL="$(normalize_jdbc_url "$DATABASE_URL")"
    export SUPABASE_JDBC_URL
  elif [ -n "${SPRING_DATASOURCE_URL:-}" ]; then
    SUPABASE_JDBC_URL="$(normalize_jdbc_url "$SPRING_DATASOURCE_URL")"
    export SUPABASE_JDBC_URL
  fi

  if [ -n "${SUPABASE_JDBC_URL:-}" ]; then
    if [[ "$SUPABASE_JDBC_URL" == jdbc:* ]]; then
      echo "SUPABASE_JDBC_URL: set (jdbc prefix OK)"
    else
      echo "SUPABASE_JDBC_URL: set (jdbc prefix MISSING)"
    fi
  else
    echo "SUPABASE_JDBC_URL: MISSING"
  fi

  # Avoid shell-level overrides that break JDBC URLs (common with Supabase pooler)
  unset DATABASE_URL
  unset SPRING_DATASOURCE_URL
  unset SPRING_DATASOURCE_USERNAME
  unset SPRING_DATASOURCE_PASSWORD
else
  echo "Missing $ENV_FILE in $ROOT_DIR. Copy .env.example and set secrets first."
fi

mkdir -p logs

echo "Starting infra..."
docker compose up -d

start_service() {
  local name="$1"
  local dir="$2"
  local pid_file="logs/${name}.pid"
  local log_file="logs/${name}.log"

  if [ -f "$pid_file" ]; then
    local existing_pid
    existing_pid="$(cat "$pid_file")"
    if ps -p "$existing_pid" > /dev/null 2>&1; then
      echo "$name already running (pid $existing_pid)"
      return 0
    fi
  fi

  echo "Starting $name..."
  (
    cd "$dir"
    nohup mvn -q -DskipTests spring-boot:run > "$ROOT_DIR/$log_file" 2>&1 &
    echo $! > "$ROOT_DIR/$pid_file"
  )
}

start_frontend() {
  local pid_file="logs/frontend.pid"
  local log_file="logs/frontend.log"

  if [ ! -d "frontend" ]; then
    echo "frontend/ not found; skipping"
    return 0
  fi

  if [ -f "$pid_file" ]; then
    local existing_pid
    existing_pid="$(cat "$pid_file")"
    if ps -p "$existing_pid" > /dev/null 2>&1; then
      echo "frontend already running (pid $existing_pid)"
      return 0
    fi
  fi

  if [ ! -d "frontend/node_modules" ]; then
    echo "frontend/node_modules missing. Run (cd frontend && npm install) first."
    return 0
  fi

  echo "Starting frontend..."
  (
    cd "frontend"
    nohup npm run dev -- --host 0.0.0.0 > "$ROOT_DIR/$log_file" 2>&1 &
    echo $! > "$ROOT_DIR/$pid_file"
  )
}

start_service "api-gateway" "services/api-gateway"
start_service "auth-service" "services/auth-service"
start_service "user-service" "services/user-service"
start_service "bookmark-service" "services/bookmark-service"
start_service "notification-service" "services/notification-service"
start_frontend

echo "\nDone. Useful commands:"
echo "- View logs: ./scripts/logs.sh"
echo "- Stop services: ./scripts/stop.sh"
echo "- Frontend: http://localhost:5173"
