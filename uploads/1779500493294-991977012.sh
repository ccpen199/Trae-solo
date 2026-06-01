#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chen/Desktop/Cursor_project/Baby-rayan/Rayan-ChineseGame/external_resources"
GITHUB_DIR="$ROOT/github"
MOBILE_WEB_DIR="$ROOT/mobile_web_versions"
RUNTIME_DIR="$ROOT/.runtime"
LOG_DIR="$ROOT/logs"
PID_FILE="$RUNTIME_DIR/pids.tsv"
PORT_FILE="$RUNTIME_DIR/ports.tsv"

mkdir -p "$RUNTIME_DIR" "$LOG_DIR"
: > "$PID_FILE"
: > "$PORT_FILE"

is_port_free() {
  local port="$1"
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    return 1
  fi
  return 0
}

is_port_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

pick_port() {
  local preferred="$1"
  local port="$preferred"
  while ! is_port_free "$port"; do
    port=$((port + 1))
  done
  echo "$port"
}

start_service() {
  local name="$1"
  local workdir="$2"
  local preferred_port="$3"
  local cmd_template="$4"

  local port
  port="$(pick_port "$preferred_port")"
  local cmd
  cmd="${cmd_template//\{PORT\}/$port}"

  echo "[start] $name on :$port"
  (
    cd "$workdir"
    # Detach from current session so external controllers won't reap child processes.
    nohup perl -MPOSIX -e 'setsid(); exec @ARGV' bash -lc "$cmd" > "$LOG_DIR/${name}.log" 2>&1 < /dev/null &
    echo $! > "$RUNTIME_DIR/${name}.pid"
  )

  local pid
  pid="$(cat "$RUNTIME_DIR/${name}.pid")"
  sleep 1
  if ! kill -0 "$pid" >/dev/null 2>&1; then
    echo "[fail] $name failed to start. Check: $LOG_DIR/${name}.log"
    tail -n 20 "$LOG_DIR/${name}.log" || true
    rm -f "$RUNTIME_DIR/${name}.pid"
    return 1
  fi

  local try=0
  while [ $try -lt 20 ]; do
    if is_port_listening "$port"; then
      break
    fi
    sleep 0.5
    try=$((try + 1))
  done
  if ! is_port_listening "$port"; then
    echo "[warn] $name process is running but port $port not detected yet. Check log if needed."
  fi

  printf '%s\t%s\n' "$name" "$pid" >> "$PID_FILE"
  printf '%s\t%s\n' "$name" "$port" >> "$PORT_FILE"
}

# Static/data/unity projects served as local file preview
start_service "HSK-3.0-Study-Game" "$GITHUB_DIR/HSK-3.0-Study-Game" 46140 "python3 -m http.server {PORT} --bind 127.0.0.1"

# Newly added mobile-focused projects
start_service "Android-HSKFlashcardsWidget" "$MOBILE_WEB_DIR/Android-HSKFlashcardsWidget" 46260 "python3 -m http.server {PORT} --bind 127.0.0.1"
start_service "pinyin_hero" "$MOBILE_WEB_DIR/pinyin_hero" 46270 "python3 -m http.server {PORT} --bind 127.0.0.1"
start_service "nihao" "$MOBILE_WEB_DIR/nihao" 46280 "python3 -m http.server {PORT} --bind 127.0.0.1"
start_service "Mandarin_Learning_App" "$MOBILE_WEB_DIR/Mandarin_Learning_App" 46290 "python3 -m http.server {PORT} --bind 127.0.0.1"
start_service "OpenHSK" "$MOBILE_WEB_DIR/OpenHSK" 46300 "python3 -m http.server {PORT} --bind 127.0.0.1"
start_service "HanBaoBao" "$MOBILE_WEB_DIR/HanBaoBao" 46310 "python3 -m http.server {PORT} --bind 127.0.0.1"

sleep 2

echo
echo "Started services:"
while IFS=$'\t' read -r name port; do
  if [ -n "$name" ]; then
    echo "- $name: http://127.0.0.1:$port"
  fi
done < "$PORT_FILE"

echo
echo "Logs: $LOG_DIR"
