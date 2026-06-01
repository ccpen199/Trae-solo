#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

set -a
# shellcheck disable=SC1091
source ./.env
set +a

wait_for_url() {
  local url="$1"
  local name="$2"
  local deadline=$((SECONDS + 30))
  until curl -fsS --max-time 2 "$url" >/dev/null; do
    if (( SECONDS >= deadline )); then
      echo "${name} did not become ready at ${url}" >&2
      return 1
    fi
    sleep 1
  done
}

stop_project_port() {
  local port="$1"
  local pid
  local cwd
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
    case "$cwd" in
      "$PWD" | "$PWD"/*)
        kill "$pid" 2>/dev/null || true
        ;;
    esac
  done < <(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
}

if command -v tmux >/dev/null 2>&1; then
  backend_session="${PROJECT_NAME}-backend"
  frontend_session="${PROJECT_NAME}-frontend"
  node_bin="${NODE_BIN:-}"
  if [[ -z "$node_bin" && -x "$HOME/.nvm/versions/node/v22.22.0/bin/node" ]]; then
    node_bin="$HOME/.nvm/versions/node/v22.22.0/bin/node"
  fi
  if [[ -z "$node_bin" ]]; then
    node_bin="$(command -v node || true)"
  fi

  tmux has-session -t "$backend_session" 2>/dev/null && tmux kill-session -t "$backend_session"
  tmux has-session -t "$frontend_session" 2>/dev/null && tmux kill-session -t "$frontend_session"
  stop_project_port "$BACKEND_PORT"
  stop_project_port "$FRONTEND_PORT"

  if [[ -f backend/server.js ]]; then
    tmux new-session -d -s "$backend_session" "cd \"$PWD/backend\" && exec \"$node_bin\" server.js >> ../backend.log 2>&1"
  else
    tmux new-session -d -s "$backend_session" "cd \"$PWD\" && exec python3 -u backend.py >> backend.log 2>&1"
  fi
  tmux display-message -p -t "$backend_session" "#{pane_pid}" > backend.pid

  tmux new-session -d -s "$frontend_session" "cd \"$PWD\" && exec python3 -u frontend.py >> frontend.log 2>&1"
  tmux display-message -p -t "$frontend_session" "#{pane_pid}" > frontend.pid
else
  nohup python3 -u backend.py </dev/null >> backend.log 2>&1 &
  echo "$!" > backend.pid

  nohup python3 -u frontend.py </dev/null >> frontend.log 2>&1 &
  echo "$!" > frontend.pid
fi

wait_for_url "${BACKEND_URL}/api/health" "backend"
wait_for_url "${FRONTEND_URL}/" "frontend"

echo "frontend: ${FRONTEND_URL}"
echo "backend: ${BACKEND_URL}"
