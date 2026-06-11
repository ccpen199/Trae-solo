#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs -0)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49098}
BACKEND_PORT=${BACKEND_PORT:-59098}
FRONTEND_URL=${FRONTEND_URL:-http://127.0.0.1:49098}
BACKEND_URL=${BACKEND_URL:-http://127.0.0.1:59098}

ERRORS=0
WARNINGS=0

check_port_listening() {
  local port=$1
  local name=$2
  
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$pid" ]; then
    echo "❌ [$name] Port $port is NOT listening" >&2
    return 1
  else
    echo "✅ [$name] Port $port is listening (PID: $pid)" >&2
    echo $pid
    return 0
  fi
}

check_process_status() {
  local pid=$1
  local name=$2
  
  if [ -z "$pid" ]; then
    echo "❌ [$name] No PID provided"
    return 1
  fi
  
  if ! ps -p "$pid" > /dev/null 2>&1; then
    echo "❌ [$name] Process $pid does not exist"
    return 1
  fi
  
  local stat=$(ps -o stat= -p "$pid" | xargs)
  
  case "$stat" in
    T*|t*)
      echo "❌ [$name] Process $pid is STOPPED (stat: $stat)"
      return 1
      ;;
    Z*|z*)
      echo "❌ [$name] Process $pid is ZOMBIE (stat: $stat)"
      return 1
      ;;
    X*)
      echo "❌ [$name] Process $pid is DEAD (stat: $stat)"
      return 1
      ;;
    *)
      echo "✅ [$name] Process $pid is running (stat: $stat)"
      ps -p "$pid" -o pid=,ppid=,stat=,cwd=,command=
      return 0
      ;;
  esac
}

check_process_owner() {
  local pid=$1
  local name=$2
  local project_dir=$3
  
  local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  
  if [ -z "$cwd" ]; then
    echo "⚠️  [$name] Cannot determine cwd for PID $pid"
    return 1
  fi
  
  case "$cwd" in
    "$project_dir"/*)
      echo "✅ [$name] Process $pid belongs to this project (cwd: $cwd)"
      return 0
      ;;
    *)
      echo "⚠️  [$name] Process $pid MAY NOT belong to this project (cwd: $cwd)"
      echo "   Expected to be under: $project_dir"
      return 1
      ;;
  esac
}

check_frontend_http() {
  local url=$1
  
  echo "→ Checking frontend HTTP: $url"
  local response=$(curl -I --max-time 5 "$url" 2>&1)
  local exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo "❌ [Frontend] HTTP request failed (curl exit code: $exit_code)"
    echo "   Response: $response"
    return 1
  fi
  
  local http_code=$(echo "$response" | head -n1 | grep -oE '[0-9]{3}')
  
  if [ "$http_code" = "200" ]; then
    echo "✅ [Frontend] HTTP $http_code OK"
    return 0
  else
    echo "⚠️  [Frontend] HTTP $http_code (expected 200)"
    echo "   Response headers:"
    echo "$response" | head -n10
    return 0
  fi
}

check_backend_health() {
  local base_url=$1
  local health_url="${base_url}/api/health"
  
  echo "→ Checking backend health: $health_url"
  local response=$(curl -sS --max-time 5 -w "\nHTTP_CODE:%{http_code}" "$health_url" 2>&1)
  local exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo "⚠️  [Backend] Health check request failed (curl exit code: $exit_code)"
    echo "   Will try alternative endpoints..."
    
    for alt_path in "/health" "/api/healthz" "/healthz" "/api/status" "/status"; do
      local alt_url="${base_url}${alt_path}"
      echo "  → Trying: $alt_url"
      local alt_response=$(curl -sS --max-time 5 -w "\nHTTP_CODE:%{http_code}" "$alt_url" 2>&1)
      local alt_exit_code=$?
      if [ $alt_exit_code -eq 0 ]; then
        local alt_http_code=$(echo "$alt_response" | tail -n1 | grep -oE '[0-9]{3}')
        if [ "$alt_http_code" -ge 200 ] && [ "$alt_http_code" -lt 400 ]; then
          echo "✅ [Backend] HTTP $alt_http_code OK at $alt_path"
          echo "   Response: $(echo "$alt_response" | head -n1)"
          return 0
        fi
      fi
    done
    
    echo "❌ [Backend] All health check endpoints failed"
    return 1
  fi
  
  local http_code=$(echo "$response" | tail -n1 | grep -oE '[0-9]{3}')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
    echo "✅ [Backend] HTTP $http_code OK"
    echo "   Response: $(echo "$response" | head -n1)"
    return 0
  elif [ "$http_code" -eq 404 ]; then
    echo "⚠️  [Backend] HTTP $http_code - /api/health endpoint not found"
    echo "   This is expected if backend has no health endpoint yet"
    return 0
  else
    echo "❌ [Backend] HTTP $http_code (expected 2xx/3xx)"
    echo "   Response: $response"
    return 1
  fi
}

TARGET="${1:-all}"

echo "========================================"
echo "  Project Verification Report"
echo "========================================"
echo "Project: $PROJECT_DIR"
echo "Frontend URL: $FRONTEND_URL (port: $FRONTEND_PORT)"
echo "Backend URL: $BACKEND_URL (port: $BACKEND_PORT)"
echo "========================================"
echo ""

if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  echo "--- Frontend Checks ---"
  FE_PID=$(check_port_listening $FRONTEND_PORT "Frontend") || ERRORS=$((ERRORS + 1))
  
  if [ -n "$FE_PID" ] && [ "$FE_PID" != "❌"* ]; then
    check_process_status "$FE_PID" "Frontend" || ERRORS=$((ERRORS + 1))
    check_process_owner "$FE_PID" "Frontend" "$PROJECT_DIR" || WARNINGS=$((WARNINGS + 1))
  fi
  
  echo ""
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
  echo "--- Backend Checks ---"
  BE_PID=$(check_port_listening $BACKEND_PORT "Backend") || ERRORS=$((ERRORS + 1))
  
  if [ -n "$BE_PID" ] && [ "$BE_PID" != "❌"* ]; then
    check_process_status "$BE_PID" "Backend" || ERRORS=$((ERRORS + 1))
    check_process_owner "$BE_PID" "Backend" "$PROJECT_DIR" || WARNINGS=$((WARNINGS + 1))
  fi
  
  echo ""
fi

echo "--- HTTP Checks ---"

if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  check_frontend_http "$FRONTEND_URL" || ERRORS=$((ERRORS + 1))
  echo ""
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
  check_backend_health "$BACKEND_URL" || ERRORS=$((ERRORS + 1))
  echo ""
fi

echo "========================================"
echo "  Summary"
echo "========================================"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED"
  else
    echo "⚠️  CHECKS PASSED WITH WARNINGS"
  fi
  echo ""
  echo "Frontend: $FRONTEND_URL"
  echo "Backend API: $BACKEND_URL/api"
  exit 0
else
  echo "❌ VERIFICATION FAILED"
  echo "Please fix the errors above and retry."
  exit 1
fi
