#!/bin/zsh
PORT=$1
PROJECT_DIR="$(pwd)"
pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
if [ -z "$pid" ]; then
  echo "No process listening on port $PORT"
  exit 0
fi
cwd=$(lsof -p "$pid" | grep cwd | awk '{print $9}')
cmd=$(ps -o command= -p "$pid")
echo "PID: $pid"
echo "CWD: $cwd"
echo "CMD: $cmd"
if [[ "$cwd" == "$PROJECT_DIR" ]] || [[ "$cwd" == "$PROJECT_DIR"/* ]]; then
  echo "Killing PID $pid (belongs to this project)"
  kill -9 "$pid"
else
  echo "Skip kill: cwd=$cwd does not belong to $PROJECT_DIR"
fi
