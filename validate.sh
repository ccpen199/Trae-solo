#!/bin/bash
BASE=http://127.0.0.1:59081
FRONT=http://127.0.0.1:49081
HDR="X-User-Id: 1"
OUT=/tmp/validation_output.txt

> $OUT

echo "=== IR Remote Platform - Business Flow Validation ===" | tee -a $OUT
echo "Started: $(date)" | tee -a $OUT
echo "" | tee -a $OUT

# 1. Health check
echo "=== 1. Health Check ===" | tee -a $OUT
curl -sS --max-time 5 $BASE/api/health | tee -a $OUT
echo -e "\n" | tee -a $OUT

# 2. Frontend check
echo "=== 2. Frontend HTTP Check ===" | tee -a $OUT
curl -sS --max-time 5 -o /dev/null -w "Status: %{http_code}\n" $FRONT/ | tee -a $OUT
echo "" | tee -a $OUT

# 3. Device types
echo "=== 3. Device Types ===" | tee -a $OUT
curl -sS --max-time 5 $BASE/api/device-types | python3 -m json.tool | head -30 | tee -a $OUT
echo "" | tee -a $OUT

# 4. Brands
echo "=== 4. Brands ===" | tee -a $OUT
curl -sS --max-time 5 $BASE/api/brands | python3 -m json.tool | head -30 | tee -a $OUT
echo "" | tee -a $OUT

# 5. IR Code Models
echo "=== 5. IR Code Models (for brand 1) ===" | tee -a $OUT
curl -sS --max-time 5 "$BASE/api/ir-code-models?brandId=1" | python3 -m json.tool | head -30 | tee -a $OUT
echo "" | tee -a $OUT

# 6. User devices
echo "=== 6. User Devices (user 1) ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" $BASE/api/devices | python3 -m json.tool | head -50 | tee -a $OUT
echo "" | tee -a $OUT

# 7. Get a specific device
echo "=== 7. Get Single Device (ID 1) ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" $BASE/api/devices/1 | python3 -m json.tool | tee -a $OUT
echo "" | tee -a $OUT

# 8. Send IR command
echo "=== 8. Send IR Command (power on) ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" -H "Content-Type: application/json" \
  -X POST $BASE/api/ir/send \
  -d '{"deviceId": 1, "command": "power", "params": {"state": "on"}}' | python3 -m json.tool | tee -a $OUT
echo "" | tee -a $OUT

# 9. Send temperature command
echo "=== 9. Send IR Command (temperature 24C) ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" -H "Content-Type: application/json" \
  -X POST $BASE/api/ir/send \
  -d '{"deviceId": 1, "command": "temperature", "params": {"value": 24, "mode": "cool"}}' | python3 -m json.tool | tee -a $OUT
echo "" | tee -a $OUT

# 10. IR Match
echo "=== 10. IR Code Match ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" "$BASE/api/ir/match?rawCode=0000000100000001" | python3 -m json.tool | tee -a $OUT
echo "" | tee -a $OUT

# 11. Learn IR
echo "=== 11. Learn IR Code ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" -H "Content-Type: application/json" \
  -X POST $BASE/api/ir/learn \
  -d '{"deviceId": 1, "commandName": "custom_mode", "rawCodeData": "000000010000000100000011"}' | python3 -m json.tool | tee -a $OUT
echo "" | tee -a $OUT

# 12. Scenes
echo "=== 12. Scenes List ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" $BASE/api/scenes | python3 -m json.tool | head -50 | tee -a $OUT
echo "" | tee -a $OUT

# 13. Execute "观影模式" scene
echo "=== 13. Execute Scene '观影模式' (ID 1) ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" -X POST $BASE/api/scenes/1/execute | python3 -m json.tool | tee -a $OUT
echo "" | tee -a $OUT

# 14. Schedules
echo "=== 14. Schedules List ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" $BASE/api/schedules | python3 -m json.tool | head -40 | tee -a $OUT
echo "" | tee -a $OUT

# 15. Power Statistics
echo "=== 15. Power Statistics ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" "$BASE/api/statistics/power?period=7" | python3 -m json.tool | head -40 | tee -a $OUT
echo "" | tee -a $OUT

# 16. Usage Statistics
echo "=== 16. Usage Statistics ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" "$BASE/api/statistics/usage?period=30" | python3 -m json.tool | head -40 | tee -a $OUT
echo "" | tee -a $OUT

# 17. Admin: Code Versions
echo "=== 17. Admin: IR Code Versions ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" $BASE/api/admin/code-versions | python3 -m json.tool | head -40 | tee -a $OUT
echo "" | tee -a $OUT

# 18. Admin: OTA Push
echo "=== 18. Admin: OTA Push (version 1) ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" -X POST $BASE/api/admin/code-versions/1/ota | python3 -m json.tool | tee -a $OUT
echo "" | tee -a $OUT

# 19. Admin: Device Graph
echo "=== 19. Admin: Device Binding Graph ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" "$BASE/api/admin/device-graph?userId=1" | python3 -m json.tool | head -50 | tee -a $OUT
echo "" | tee -a $OUT

# 20. Admin: Error Analysis
echo "=== 20. Admin: Error Analysis ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" $BASE/api/admin/error-analysis | python3 -m json.tool | head -50 | tee -a $OUT
echo "" | tee -a $OUT

# 21. Admin: Feedbacks
echo "=== 21. Admin: Feedback Tickets ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" $BASE/api/admin/feedbacks | python3 -m json.tool | head -40 | tee -a $OUT
echo "" | tee -a $OUT

# 22. Offline Codes
echo "=== 22. Offline IR Codes Cache ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" $BASE/api/offline/codes | python3 -m json.tool | head -40 | tee -a $OUT
echo "" | tee -a $OUT

# 23. Test weak network header
echo "=== 23. Weak Network Mode Test ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" -H "X-Network-Status: weak" $BASE/api/health | python3 -m json.tool | tee -a $OUT
echo "" | tee -a $OUT

# 24. Command logs verify
echo "=== 24. Recent Command Logs ===" | tee -a $OUT
curl -sS --max-time 5 -H "$HDR" "$BASE/api/devices?includeLogs=true" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict) and 'commandLogs' in data:
    logs = data['commandLogs'][:5]
    for l in logs:
        print(f\"  {l.get('created_at')} - {l.get('command')} - success={l.get('success')}\")
else:
    print('No command logs in response')
" | tee -a $OUT

echo "" | tee -a $OUT
echo "=== Validation Complete ===" | tee -a $OUT
echo "Full output saved to $OUT"
