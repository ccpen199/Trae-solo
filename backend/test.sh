#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-63415/backend
node server.js &
BGPID=$!
sleep 3
echo "=== Health ==="
curl -sS --max-time 5 http://127.0.0.1:53415/api/health
echo ""
echo "=== Rooms ==="
curl -sS --max-time 5 "http://127.0.0.1:53415/api/rooms" -H "x-user-id: 1" | python3 -m json.tool 2>/dev/null | head -30
echo ""
echo "=== Users ==="
curl -sS --max-time 5 "http://127.0.0.1:53415/api/users" | python3 -m json.tool 2>/dev/null | head -20
kill $BGPID 2>/dev/null
wait $BGPID 2>/dev/null
echo "DONE"
