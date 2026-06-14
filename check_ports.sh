#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89083"
PORT=59083
FPORT=49083

echo "=== Checking Ports ==="
for p in $FPORT $PORT; do
  pid=$(lsof -nP -iTCP:$p -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "UNKNOWN")
    cmd=$(ps -o command= -p "$pid" 2>/dev/null | xargs || echo "UNKNOWN")
    echo "Port $p: PID=$pid CWD=$cwd"
    case "$cwd" in
      "$PROJECT_DIR"*)
        echo "  -> Killing (belongs to this project)"
        kill "$pid" 2>/dev/null || true
        sleep 1
        ;;
      *)
        echo "  -> SKIPPING (different project, cwd=$cwd)"
        echo "  -> Will use backup slot for port $p"
        ;;
    esac
  else
    echo "Port $p: FREE"
  fi
done

echo ""
echo "=== Available slots for this project ==="
TAIL4=9083
for i in 0 1000 2000 3000 4000 5000; do
  fp=$((40000 + $i + $TAIL4))
  bp=$((50000 + $i + $TAIL4))
  fpid=$(lsof -nP -iTCP:$fp -sTCP:LISTEN -t 2>/dev/null | head -n1)
  bpid=$(lsof -nP -iTCP:$bp -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$fpid" ] && [ -z "$bpid" ]; then
    echo "  Slot $i: FRONTEND=$fp BACKEND=$bp - AVAILABLE"
  else
    echo "  Slot $i: FRONTEND=$fp BACKEND=$bp - OCCUPIED"
  fi
done
