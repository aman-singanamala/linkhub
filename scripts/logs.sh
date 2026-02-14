#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if compgen -G "logs/*.log" > /dev/null; then
  echo "Tailing logs from $ROOT_DIR/logs/*.log"
  tail -n 200 -f logs/*.log
else
  echo "No logs found in $ROOT_DIR/logs"
fi
