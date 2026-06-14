#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=59092

echo "Stopping backend..."
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$backend_pid" ]; then
  pid_cwd=$(lsof -a -p $backend_pid -d cwd -Fn 2>/dev/null | grep "^n" | sed "s/^n//")
  if [[ "$pid_cwd" == "$PROJECT_DIR"* ]]; then
    kill "$backend_pid"
    echo "Killed backend PID $backend_pid"
    sleep 2
  fi
fi

echo "Deleting old database..."
rm -f "$PROJECT_DIR/data/app.sqlite"
rm -f "$PROJECT_DIR/data/app.sqlite-wal"
rm -f "$PROJECT_DIR/data/app.sqlite-shm"

echo "Restarting backend..."
cd "$PROJECT_DIR/backend"
nohup npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started PID: $BACKEND_PID"

echo "Waiting for backend to initialize..."
sleep 10

echo "Backend log:"
tail -20 "$PROJECT_DIR/backend.log"

echo ""
echo "Database verification:"
node << 'EOF'
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'data/app.sqlite');
const db = new Database(dbPath);

const users = db.prepare('SELECT id, username, role FROM users').all();
console.log('Users:');
users.forEach(u => {
  const tm = db.prepare('SELECT COUNT(*) as c FROM trademarks WHERE user_id = ?').get(u.id).c;
  const pt = db.prepare('SELECT COUNT(*) as c FROM patents WHERE user_id = ?').get(u.id).c;
  const cp = db.prepare('SELECT COUNT(*) as c FROM copyrights WHERE user_id = ?').get(u.id).c;
  const cs = db.prepare('SELECT COUNT(*) as c FROM cases WHERE user_id = ?').get(u.id).c;
  const ct = db.prepare('SELECT COUNT(*) as c FROM contracts WHERE user_id = ?').get(u.id).c;
  const cl = db.prepare('SELECT COUNT(*) as c FROM clients WHERE manager_id = ?').get(u.id).c;
  const nf = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ?').get(u.id).c;
  console.log(`  ${u.username} (${u.role}): tm=${tm}, pt=${pt}, cp=${cp}, cs=${cs}, ct=${ct}, cl=${cl}, nf=${nf}`);
});

db.close();
EOF

echo ""
echo "Done!"
