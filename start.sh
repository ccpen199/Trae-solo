#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # better-sqlite3 in this workspace is built for Node 22 (ABI 127).
  source "$HOME/.nvm/nvm.sh"
  nvm use 22.22.0 >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || true
fi

if [ -f .env ]; then
  source .env
fi

FRONTEND_PORT=${FRONTEND_PORT:-43451}
BACKEND_PORT=${BACKEND_PORT:-53451}
TAIL4=3451
SLOT_PREFIXES=("40000" "41000" "42000" "43000" "44000" "45000")
BSLOT_PREFIXES=("50000" "51000" "52000" "53000" "54000" "55000")

port_pid() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -n1
}

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | awk '/^n/ { sub(/^n/, ""); print; exit }'
}

pid_in_project() {
  local pid=$1
  local cwd
  cwd=$(pid_cwd "$pid")
  [ "$cwd" = "$PROJECT_DIR" ] || [[ "$cwd" == "$PROJECT_DIR"/* ]]
}

launch_detached() {
  local log_file=$1
  shift
  PERL_BADLANG=0 /usr/bin/perl -MPOSIX=setsid -e '
    my ($cwd, $log, @cmd) = @ARGV;
    chdir $cwd or die "chdir $cwd: $!";
    open STDIN, "<", "/dev/null" or die "stdin: $!";
    open STDOUT, ">", $log or die "stdout: $!";
    open STDERR, ">&STDOUT" or die "stderr: $!";
    setsid() or die "setsid: $!";
    exec @cmd or die "exec @cmd: $!";
  ' "$PROJECT_DIR" "$PROJECT_DIR/$log_file" "$@" &
  LAUNCHED_PID=$!
  disown "$LAUNCHED_PID" 2>/dev/null || true
}

port_free_or_project_owned() {
  local port=$1
  local pid
  pid=$(port_pid "$port")
  [ -z "$pid" ] || pid_in_project "$pid"
}

pair_usable() {
  port_free_or_project_owned "$1" && port_free_or_project_owned "$2"
}

find_port_pair() {
  if pair_usable "$FRONTEND_PORT" "$BACKEND_PORT"; then
    echo "$FRONTEND_PORT $BACKEND_PORT"
    return 0
  fi

  local idx=0
  while [ "$idx" -lt "${#SLOT_PREFIXES[@]}" ]; do
    local fp=$((${SLOT_PREFIXES[$idx]} + TAIL4))
    local bp=$((${BSLOT_PREFIXES[$idx]} + TAIL4))
    if pair_usable "$fp" "$bp"; then
      echo "$fp $bp"
      return 0
    fi
    idx=$((idx + 1))
  done

  echo "ALL_SLOTS_OCCUPIED"
  return 1
}

RESULT=$(find_port_pair)
if [ "$RESULT" = "ALL_SLOTS_OCCUPIED" ]; then
  echo "ERROR: All port slots occupied. Manual intervention required."
  echo "Occupied ports:"
  for idx in "${!SLOT_PREFIXES[@]}"; do
    fp=$((${SLOT_PREFIXES[$idx]} + TAIL4))
    bp=$((${BSLOT_PREFIXES[$idx]} + TAIL4))
    for port in "$fp" "$bp"; do
      pid=$(port_pid "$port")
      if [ -n "$pid" ]; then
        echo "  Port $port: PID=$pid cwd=$(pid_cwd "$pid") cmd=$(ps -p "$pid" -o command= 2>/dev/null)"
      fi
    done
  done
  exit 1
fi

FRONTEND_PORT=$(echo "$RESULT" | awk '{print $1}')
BACKEND_PORT=$(echo "$RESULT" | awk '{print $2}')

CURRENT_FRONTEND_PORT=$(grep '^FRONTEND_PORT=' .env 2>/dev/null | cut -d= -f2 || true)
CURRENT_BACKEND_PORT=$(grep '^BACKEND_PORT=' .env 2>/dev/null | cut -d= -f2 || true)
if [ "$FRONTEND_PORT" != "$CURRENT_FRONTEND_PORT" ] || [ "$BACKEND_PORT" != "$CURRENT_BACKEND_PORT" ]; then
  echo "Ports changed, updating .env: FRONTEND_PORT=$FRONTEND_PORT BACKEND_PORT=$BACKEND_PORT"
  cat > .env << EOF
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
VITE_API_BASE_URL=
EOF
fi

echo "=== Starting Food Safety Traceability System ==="
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "Node:     $(node -v) ($(command -v node))"

mkdir -p data uploads

STARTED=0
export BACKEND_PORT FRONTEND_PORT VITE_API_BASE_URL

backend_pid=$(port_pid "$BACKEND_PORT")
if [ -n "$backend_pid" ] && pid_in_project "$backend_pid"; then
  echo "Backend already running on port $BACKEND_PORT (PID=$backend_pid)"
else
  echo "Starting backend on port $BACKEND_PORT..."
  launch_detached backend.log npx tsx api/server.ts
  BACKEND_PID=$LAUNCHED_PID
  echo "$BACKEND_PID" > backend.pid
  echo "Backend PID: $BACKEND_PID"
  STARTED=1
fi

frontend_pid=$(port_pid "$FRONTEND_PORT")
if [ -n "$frontend_pid" ] && pid_in_project "$frontend_pid"; then
  echo "Frontend already running on port $FRONTEND_PORT (PID=$frontend_pid)"
else
  echo "Starting frontend on port $FRONTEND_PORT..."
  launch_detached frontend.log npx vite --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
  FRONTEND_PID=$LAUNCHED_PID
  echo "$FRONTEND_PID" > frontend.pid
  echo "Frontend PID: $FRONTEND_PID"
  STARTED=1
fi

if [ "$STARTED" = "1" ]; then
  echo "Waiting 6 seconds for services to start..."
  sleep 6
fi

echo ""
echo "=== Verifying services ==="

frontend_pid_check=$(port_pid "$FRONTEND_PORT")
backend_pid_check=$(port_pid "$BACKEND_PORT")

if [ -n "$frontend_pid_check" ]; then
  ps -p "$frontend_pid_check" -o pid=,ppid=,stat=,command= 2>/dev/null
else
  echo "ERROR: Frontend port $FRONTEND_PORT not listening"
  tail -20 frontend.log 2>/dev/null || true
fi

if [ -n "$backend_pid_check" ]; then
  ps -p "$backend_pid_check" -o pid=,ppid=,stat=,command= 2>/dev/null
else
  echo "ERROR: Backend port $BACKEND_PORT not listening"
  tail -20 backend.log 2>/dev/null || true
fi

echo ""
FRONTEND_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>/dev/null || echo "000")
BACKEND_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "000")

echo "Frontend HTTP status: $FRONTEND_HTTP"
echo "Backend HTTP status: $BACKEND_HTTP"

if [ "$FRONTEND_HTTP" = "200" ] && [ "$BACKEND_HTTP" = "200" ]; then
  echo ""
  echo "=== All services running ==="
  echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
  echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
  echo "Health:   http://127.0.0.1:$BACKEND_PORT/api/health"
else
  echo ""
  echo "=== Services may not be fully ready ==="
  echo "Frontend log (last 10 lines):"
  tail -10 frontend.log 2>/dev/null || true
  echo "Backend log (last 10 lines):"
  tail -10 backend.log 2>/dev/null || true
fi
