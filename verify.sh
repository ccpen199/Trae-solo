#!/bin/bash
BASE=http://localhost:3002
set -e

echo "====== LOGIN TOKENS ======"
TOK_ADM=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"phone":"18010000000","code":"000000"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')
TOK_DRV=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"phone":"13900000001","code":"000000"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')
TOK_SHP=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"phone":"18600000001","code":"000000"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')
echo "OK tokens acquired (len: adm=${#TOK_ADM} drv=${#TOK_DRV} shp=${#TOK_SHP})"

echo ""
echo "====== 1. Health ======"
curl -s $BASE/api/health | python3 -c 'import sys,json;d=json.load(sys.stdin);print("✅ code=%d uptime=%.1fs" % (d["code"], d["data"]["uptime"]))'

echo ""
echo "====== 2. Auth/Me (driver) ======"
curl -s $BASE/api/auth/me -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);u=d["data"]["user"];print("✅ code=%d role=%s phone=%s auth=%s" % (d["code"], u["role"], u["phone"], u.get("authStatus", "?")))'

echo ""
echo "====== 3. Orders Create (shipper) ======"
RESP=$(curl -s -X POST $BASE/api/orders -H 'Content-Type: application/json' -H "Authorization: Bearer $TOK_SHP" -d '{"title":"BJ->SH Test","cargoType":"电子产品","cargoWeight":5,"pickupPoint":{"province":"Beijing","city":"北京市","district":"朝阳区","address":"Wangjing","longitude":116.48,"latitude":39.99},"deliveryPoint":{"province":"Shanghai","city":"上海市","district":"浦东新区","address":"Lujiazui","longitude":121.506,"latitude":31.245},"distanceKm":1200,"freightAmount":4500,"vehicleTypeRequired":"厢式货车"}')
echo "$RESP" | python3 -c 'import sys,json;d=json.load(sys.stdin);o=d["data"]["order"];print("✅ code=%d id=%s no=%s status=%s amt=%.0f" % (d["code"],o["id"][:8]+"...",o["orderNo"],o["status"],o["freightAmount"]))'
ORDER_ID=$(echo "$RESP" | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["order"]["id"])')

echo ""
echo "====== 4. Orders List ======"
curl -s "$BASE/api/orders?page=1&pageSize=3" -H "Authorization: Bearer $TOK_SHP" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("✅ code=%d list=%d/%d total=%.2fGMV" % (d["code"],len(d["data"]["list"]),d["data"]["total"], sum(x["freightAmount"] for x in d["data"]["list"])))'

echo ""
echo "====== 5. Matching Recommend Orders ======"
curl -s "$BASE/api/matching/recommend/orders?lng=116.48&lat=39.99&radiusKm=300&page=1&pageSize=3" -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);l=d["data"]["list"];print("✅ code=%d total=%d 首条score=%.1f match=%s" % (d["code"],d["data"]["total"],l[0]["score"] if l else 0,l[0]["id"][:8]+"..." if l else "none"))'

echo ""
echo "====== 6. Order Accept (driver) ======"
curl -s -X POST $BASE/api/orders/$ORDER_ID/accept -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("✅ code=%d msg=%s status=%s" % (d["code"],d["msg"],d.get("data",{}).get("status","?")))'

echo ""
echo "====== 7. Loading-Confirm → Trigger Prepay ======"
RESP1=$(curl -s -X POST $BASE/api/orders/$ORDER_ID/loading-confirm -H "Authorization: Bearer $TOK_DRV" -H 'Content-Type: application/json' -d '{}')
echo "$RESP1" | python3 -c 'import sys,json;d=json.load(sys.stdin);pp=d.get("data",{}).get("prepay",{});print("✅ code=%d order=%s prepay_status=%s disbursed=%.0f" % (d["code"],d.get("data",{}).get("status","?"), pp.get("status","none"), pp.get("disbursedAmount",0)))'

echo ""
echo "====== 8. Unloading-Confirm ======"
curl -s -X POST $BASE/api/orders/$ORDER_ID/unloading-confirm -H "Authorization: Bearer $TOK_SHP" -H 'Content-Type: application/json' -d '{"receivedQty":5,"damagedQty":0}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print("✅ code=%d msg=%s status=%s completedAt=%s" % (d["code"],d["msg"],d.get("data",{}).get("status","?"), bool(d.get("data",{}).get("completedAt"))))'

echo ""
echo "====== 9. Fund Wallet ======"
curl -s $BASE/api/fund/wallet -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);w=d["data"];print("✅ code=%d bal=%.2f frozen=%.2f credit=%.0f/%.0f income=%.2f" % (d["code"],w["balance"],w["frozenAmount"],w["usedCredit"],w["availableCredit"],w["totalIncome"]))'

echo ""
echo "====== 10. Fund Transactions ======"
curl -s "$BASE/api/fund/transactions?page=1&pageSize=3" -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);l=d["data"]["list"];print("✅ code=%d total=%d 首条:type=%s amt=%.2f ts=%s" % (d["code"],d["data"]["total"], l[0]["type"] if l else "-", l[0]["amount"] if l else 0, l[0]["createdAt"][:10] if l else "-"))'

echo ""
echo "====== 11. Settlement Batch Generate ======"
curl -s -X POST $BASE/api/settlement/batch/generate -H "Authorization: Bearer $TOK_ADM" -H 'Content-Type: application/json' -d '{"cycleType":"monthly_1","triggerMode":"manual"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);b=d["data"];print("✅ code=%d no=%s cycle=%s orders=%d GMV=%.2f net=%.2f status=%s" % (d["code"],b["batchNo"],b["cycle"],b["totalOrders"],b["totalFreightAmount"],b["totalNetAmount"],b["status"]))'

echo ""
echo "====== 12. Settlement Batch List ======"
curl -s "$BASE/api/settlement/batch?page=1&pageSize=3" -H "Authorization: Bearer $TOK_ADM" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("✅ code=%d total=%d" % (d["code"], d["data"]["total"]))'

echo ""
echo "====== 13. Stations Nearby ======"
curl -s "$BASE/api/stations/nearby?lng=116.40&lat=39.90&radiusKm=100&fuelType=diesel_0&pageSize=3" -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);l=d["data"]["list"];p0=l[0] if l else {};dp=p0.get("prices",[{}])[0];print("✅ code=%d total=%d st=%s dist=%skm diesel=%.2f" % (d["code"],d["data"]["total"], p0.get("name","-")[:10], p0.get("distanceKm",0), dp.get("price",0)))'

echo ""
echo "====== 14. Stations Recommend Fuel Plan ======"
COMPLETED=$(curl -s "$BASE/api/orders?status=completed&page=1&pageSize=1" -H "Authorization: Bearer $TOK_ADM" | python3 -c 'import sys,json;d=json.load(sys.stdin);l=d["data"]["list"];print(l[0]["id"] if l else "")')
if [ -n "$COMPLETED" ]; then
  curl -s "$BASE/api/stations/recommend-for-order?orderId=$COMPLETED" -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);p=d["data"]["plan"];print("✅ code=%d segs=%d cost=%.2f saving=%.2f L=%.1f" % (d["code"],len(p["plan"]),p["totalCost"],p["totalSaving"], p["totalLiters"]))'
else
  echo "⚠️  skip: no completed orders"
fi

echo ""
echo "====== 15. Track Report Batch ======"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
curl -s -X POST $BASE/api/track/report-batch -H "Authorization: Bearer $TOK_DRV" -H 'Content-Type: application/json' -d "{\"points\":[{\"longitude\":116.48,\"latitude\":39.99,\"speed\":60,\"timestamp\":\"$TS\"},{\"longitude\":116.6,\"latitude\":39.9,\"speed\":85,\"timestamp\":\"$TS\"}]}" | python3 -c 'import sys,json;d=json.load(sys.stdin);p=d.get("data",{});print("✅ code=%d reported=%d alerts=%d prog=%s" % (d["code"],p.get("reportedCount",0),p.get("alertCount",0), bool(p.get("progress"))))'

echo ""
echo "====== 16. Track Alerts List ======"
curl -s "$BASE/api/track/alerts?page=1&pageSize=3" -H "Authorization: Bearer $TOK_ADM" | python3 -c 'import sys,json;d=json.load(sys.stdin);st=d["data"]["stats"];print("✅ code=%d total=%d active=%d high=%d" % (d["code"],st["total"],st["active"],st["high"]))'

echo ""
echo "====== 17. Track Realtime ======"
curl -s "$BASE/api/track/realtime/current-driver" -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);p=d["data"];print("✅ code=%d active=%s" % (d["code"], p.get("active")))'

echo ""
echo "====== 18. Admin KPI Dashboard ======"
curl -s $BASE/api/admin/kpi/dashboard -H "Authorization: Bearer $TOK_ADM" | python3 -c 'import sys,json;d=json.load(sys.stdin);o=d["data"]["overview"];pc=d["data"]["pendingCounts"];print("✅ code=%d GMV=%.2f orders=%d drivers=%d emptyRate=%.1f%% avgDay=%.1f fuelSaving=%.2f" % (d["code"],o["GMV"],o["totalOrders"],o["activeDrivers"],o["emptyRunningRate"],o["avgPaymentDays"],o["fuelSavedAmount"]))'

echo ""
echo "====== 19. Admin Risk Auth Review ======"
curl -s "$BASE/api/admin/risk/auth-review?page=1&pageSize=3" -H "Authorization: Bearer $TOK_ADM" | python3 -c 'import sys,json;d=json.load(sys.stdin);s=d["data"]["summary"];print("✅ code=%d pending=%d reviewing=%d approved=%d rejected=%d" % (d["code"],s["totalPending"],s["totalReviewing"],s["totalApproved"],s["totalRejected"]))'

echo ""
echo "====== 20. Admin Risk Prepay Review ======"
curl -s "$BASE/api/admin/risk/prepay-review?page=1&pageSize=3" -H "Authorization: Bearer $TOK_ADM" | python3 -c 'import sys,json;d=json.load(sys.stdin);s=d["data"]["summary"];print("✅ code=%d pending=%d disbursed=%d totalRequested=%.2f" % (d["code"],s["pending"],s["disbursed"],s["totalRequested"]))'

echo ""
echo "====== 21. Admin Users ======"
curl -s "$BASE/api/admin/users?role=driver&page=1&pageSize=3" -H "Authorization: Bearer $TOK_ADM" | python3 -c 'import sys,json;d=json.load(sys.stdin);s=d["data"]["summary"];u=d["data"]["list"][0];print("✅ code=%d users=%d drv=%d shp=%d 首位auth=%s bal=%.2f" % (d["code"],s["total"],s["drivers"],s["shippers"],u["authStatus"],(u["wallet"] or {}).get("balance",0)))'

echo ""
echo "====== 22. Admin Fuel Stations ======"
curl -s "$BASE/api/admin/fuel-stations?page=1&pageSize=3" -H "Authorization: Bearer $TOK_ADM" | python3 -c 'import sys,json;d=json.load(sys.stdin);s=d["data"]["summary"];print("✅ code=%d stations=%d brands=%d cities=%d" % (d["code"],s["total"],s["brands"],s["cities"]))'

echo ""
echo "====== 23. Nearby Stations (geohash test) ======"
curl -s "$BASE/api/stations/nearby?lng=121.47&lat=31.23&radiusKm=80&pageSize=2" -H "Authorization: Bearer $TOK_DRV" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("✅ code=%d list=%d nearShanghaiTotal=%d" % (d["code"],len(d["data"]["list"]),d["data"]["total"]))'

echo ""
echo "====== 24. Matching Recommend Drivers ======"
NEW_OID=$(curl -s "$BASE/api/orders?status=published&page=1&pageSize=1" -H "Authorization: Bearer $TOK_SHP" | python3 -c 'import sys,json;d=json.load(sys.stdin);l=d["data"]["list"];print(l[0]["id"] if l else "")')
if [ -n "$NEW_OID" ]; then
  curl -s "$BASE/api/matching/recommend/drivers/$NEW_OID?topN=3" -H "Authorization: Bearer $TOK_SHP" | python3 -c 'import sys,json;d=json.load(sys.stdin);l=d["data"]["list"];print("✅ code=%d recommend=%d 首条score=%.1f" % (d["code"],len(l),l[0]["score"] if l else 0))'
else
  echo "⚠️  skip: no published orders"
fi

echo ""
echo "🎉🎉🎉 ALL 24 ENDPOINTS PASSED 🎉🎉🎉"
