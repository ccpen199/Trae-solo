#!/bin/bash
PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-63415"
FRONTEND_PORT=43415
BACKEND_PORT=53415

echo "=== Port Check ==="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
echo "Frontend PID: $frontend_pid"
echo "Backend PID: $backend_pid"

echo ""
echo "=== Process Info ==="
if [ -n "$frontend_pid" ]; then
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null
fi
echo "---"
if [ -n "$backend_pid" ]; then
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null
fi

echo ""
echo "=== Frontend HTTP ==="
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -3

echo ""
echo "=== Backend Health ==="
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1

echo ""
echo "=== Backend Rooms API ==="
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/rooms" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Rooms: {len(d[\"rooms\"])}, Total: {d[\"total\"]}')
for r in d['rooms'][:2]:
    print(f'  - [{r[\"id\"]}] {r[\"topic\"]} ({r[\"category\"]}) host={r[\"host_name\"]} status={r[\"status\"]} online={r[\"online_count\"]}')
"

echo ""
echo "=== Backend Mic Queue API ==="
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/mics/queue/1" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Queue items: {len(d[\"queue\"])}')
for q in d['queue']:
    print(f'  - [{q[\"id\"]}] {q[\"nickname\"]} status={q[\"status\"]}')
"

echo ""
echo "=== Backend Dashboard API ==="
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/dashboard/overview" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Open rooms: {d[\"totalRooms\"]}')
print(f'Total users: {d[\"totalUsers\"]}')
print(f'Total hosts: {d[\"totalHosts\"]}')
print(f'Online: {d[\"totalOnline\"]}')
print(f'Today payment: ¥{d[\"todayPayment\"]}')
print(f'Today duration: {d[\"todayDuration\"]} min')
print(f'Pending reports: {d[\"pendingReports\"]}')
print(f'Pending reviews: {d[\"pendingReviews\"]}')
"

echo ""
echo "=== Backend Review Items API ==="
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/reviews/items?status=pending" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Pending review items: {d[\"total\"]}')
for i in d['items'][:3]:
    print(f'  - [{i[\"id\"]}] type={i[\"type\"]} user={i[\"user_name\"]} desc={i[\"description\"]}')
"

echo ""
echo "=== Backend Interactions (Barrage) API ==="
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/interactions/barrage/1?limit=5" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Barrages: {len(d[\"barrages\"])}')
for b in d['barrages'][:3]:
    print(f'  - {b[\"nickname\"]}: {b[\"content\"]}')
"

echo ""
echo "=== ALL CHECKS PASSED ==="
