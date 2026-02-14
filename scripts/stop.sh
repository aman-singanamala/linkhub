#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

stop_pid() {
  local pid_file="$1"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if ps -p "$pid" > /dev/null 2>&1; then
      echo "Stopping pid $pid from $pid_file"
      kill "$pid" || true
    fi
  fi
}

for pid_file in logs/*.pid; do
  [ -e "$pid_file" ] || continue
  stop_pid "$pid_file"
done

echo "Stopping infra (docker compose down)..."
docker compose down
