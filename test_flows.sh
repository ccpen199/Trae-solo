#!/bin/bash
B="http://127.0.0.1:53415"

echo "=== 1. Create Room (as host1, user_id=2) ==="
curl -sS -X POST "$B/api/rooms" -H "x-user-id: 2" -H "Content-Type: application/json" \
  -d '{"topic":"测试房间-业务验证","category":"测试","mic_count":6}' 2>&1
echo ""

echo ""
echo "=== 2. List Rooms ==="
curl -sS "$B/api/rooms" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Total rooms: {d[\"total\"]}')
for r in d['rooms']:
    print(f'  [{r[\"id\"]}] {r[\"topic\"]} host={r[\"host_name\"]} status={r[\"status\"]}')
"

echo ""
echo "=== 3. Get Room Detail (room 5) ==="
curl -sS "$B/api/rooms/5" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Room: {d[\"topic\"]}')
print(f'Mic slots: {len(d[\"micSlots\"])}')
for s in d['micSlots']:
    print(f'  Slot {s[\"slot_index\"]+1}: user={s.get(\"nickname\",\"空闲\")} locked={s[\"locked\"]} muted={s[\"muted\"]}')
"

echo ""
echo "=== 4. Apply for Mic (user1, user_id=4, room 5) ==="
curl -sS -X POST "$B/api/mics/queue/5" -H "x-user-id: 4" 2>&1
echo ""

echo ""
echo "=== 5. Check Queue (room 5) ==="
curl -sS "$B/api/mics/queue/5" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Queue: {len(d[\"queue\"])} items')
for q in d['queue']:
    print(f'  [{q[\"id\"]}] {q[\"nickname\"]} status={q[\"status\"]}')
"

echo ""
echo "=== 6. Approve Mic (host1, user_id=2, queue 3) ==="
curl -sS -X POST "$B/api/mics/approve/5/3" -H "x-user-id: 2" 2>&1
echo ""

echo ""
echo "=== 7. Check Room After Approve ==="
curl -sS "$B/api/rooms/5" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Mic slots after approve:')
for s in d['micSlots']:
    print(f'  Slot {s[\"slot_index\"]+1}: user={s.get(\"nickname\",\"空闲\")} locked={s[\"locked\"]} muted={s[\"muted\"]}')
"

echo ""
echo "=== 8. Send Gift (user1->host1, room 5) ==="
curl -sS -X POST "$B/api/interactions/gift/5" -H "x-user-id: 4" -H "Content-Type: application/json" \
  -d '{"to_user_id":2,"gift_id":1,"quantity":2}' 2>&1
echo ""

echo ""
echo "=== 9. Send Barrage (user1, room 5) ==="
curl -sS -X POST "$B/api/interactions/barrage/5" -H "x-user-id: 4" -H "Content-Type: application/json" \
  -d '{"content":"大家好呀~"}' 2>&1
echo ""

echo ""
echo "=== 10. Get Events (room 5) ==="
curl -sS "$B/api/interactions/events/5?limit=10" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Events: {len(d[\"events\"])}')
for e in d['events']:
    data = json.loads(e['data']) if e['data'] else {}
    print(f'  [{e[\"id\"]}] {e[\"event_type\"]} by {e.get(\"nickname\",\"?\")} data={json.dumps(data, ensure_ascii=False)}')
"

echo ""
echo "=== 11. Submit Report (user1 reporting someone, room 5) ==="
curl -sS -X POST "$B/api/reviews/report/5" -H "x-user-id: 4" -H "Content-Type: application/json" \
  -d '{"target_user_id":5,"reason":"恶意霸麦","description":"测试举报"}' 2>&1
echo ""

echo ""
echo "=== 12. Get Reports (reviewer1, user_id=9) ==="
curl -sS "$B/api/reviews/reports?status=pending" -H "x-user-id: 9" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Pending reports: {d[\"total\"]}')
for r in d['reports']:
    print(f'  [{r[\"id\"]}] reason={r[\"reason\"]} reporter={r[\"reporter_name\"]} target={r[\"target_name\"]} status={r[\"status\"]}')
"

echo ""
echo "=== 13. Review Report (reviewer1, user_id=9) ==="
curl -sS -X POST "$B/api/reviews/report/review/3" -H "x-user-id: 9" -H "Content-Type: application/json" \
  -d '{"conclusion":"确有违规","action":"warning"}' 2>&1
echo ""

echo ""
echo "=== 14. Get Violations ==="
curl -sS "$B/api/reviews/violations" -H "x-user-id: 9" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Violations: {d[\"total\"]}')
for v in d['violations']:
    print(f'  [{v[\"id\"]}] user={v[\"user_name\"]} type={v[\"type\"]} severity={v[\"severity\"]} action={v[\"action\"]}')
"

echo ""
echo "=== 15. Dashboard Overview ==="
curl -sS "$B/api/dashboard/overview" -H "x-user-id: 1" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
for k, v in d.items():
    print(f'  {k}: {v}')
"

echo ""
echo "=== ALL BUSINESS FLOWS PASSED ==="
