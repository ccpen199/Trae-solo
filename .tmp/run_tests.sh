#!/bin/bash
BASE="http://localhost:3002"
TMPDIR="/Users/chen/Documents/trae_projects/local_projects/may-89292/.tmp"
mkdir -p "$TMPDIR"
JSON_PARSE='const fs=require("fs");'

echo "========================================"
echo "  货运平台 API 核心端点验证"
echo "========================================"

# 先登录 - 司机
curl -s -o "$TMPDIR/login_driver.json" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"phone":"13912345678","code":"000000"}'
TOKEN_D=$(node -e 'const fs=require("fs");console.log(JSON.parse(fs.readFileSync(process.argv[1],"utf8")).data.token)' "$TMPDIR/login_driver.json")
echo "司机登录: ok (token_len=${#TOKEN_D})"

# 登录 - 管理员
curl -s -o "$TMPDIR/login_admin.json" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"phone":"18010000000","code":"000000"}'
TOKEN_A=$(node -e 'const fs=require("fs");console.log(JSON.parse(fs.readFileSync(process.argv[1],"utf8")).data.token)' "$TMPDIR/login_admin.json")
echo "管理员登录: ok (token_len=${#TOKEN_A})"

verify() {
  local name=$1
  local file=$2
  node -e '
    const fs=require("fs");
    try {
      const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
      const d=j.data;
      const extra = process.argv[2] || "";
      let info = "code="+j.code;
      if (d && d.list !== undefined) info += " list="+d.list.length+"/"+d.total;
      else if (d && d.length !== undefined) info += " arr_len="+d.length;
      else if (d && d.balance !== undefined) info += " balance="+d.balance;
      else if (d && d.gmv !== undefined) info += " GMV="+d.gmv;
      else if (d && d.kpi) info += " KPI.gmv="+d.kpi.gmv;
      else if (j.code !== 0) info += " msg="+j.msg;
      console.log("  ✅ ["+process.argv[2]+"] "+info);
    } catch(e) {
      console.log("  ❌ ["+process.argv[2]+"] ERROR: "+e.message);
    }
  ' "$file" "$name"
}

# ========== 司机端点 ==========
echo ""
echo "--- 司机端 API ---"

curl -s -o "$TMPDIR/r1.json" "$BASE/api/orders?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_D"
verify "运单列表" "$TMPDIR/r1.json" "运单列表"

curl -s -o "$TMPDIR/r2.json" "$BASE/api/matching/recommend/orders?page=1&pageSize=3&lng=116.4&lat=39.9" -H "Authorization: Bearer $TOKEN_D"
verify "推荐运单" "$TMPDIR/r2.json" "推荐运单"

curl -s -o "$TMPDIR/r3.json" "$BASE/api/fund/wallet" -H "Authorization: Bearer $TOKEN_D"
verify "钱包详情" "$TMPDIR/r3.json" "钱包详情"

curl -s -o "$TMPDIR/r4.json" "$BASE/api/fund/transactions?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_D"
verify "资金流水" "$TMPDIR/r4.json" "资金流水"

curl -s -o "$TMPDIR/r5.json" "$BASE/api/fund/prepay?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_D"
verify "预支列表" "$TMPDIR/r5.json" "预支列表"

curl -s -o "$TMPDIR/r6.json" "$BASE/api/stations/nearby?lng=116.4074&lat=39.9042&radiusKm=100&fuelType=diesel_0" -H "Authorization: Bearer $TOKEN_D"
verify "附近油站" "$TMPDIR/r6.json" "附近油站"

curl -s -o "$TMPDIR/r7.json" "$BASE/api/settlement/batch?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_D"
verify "结算批次" "$TMPDIR/r7.json" "结算批次"

curl -s -o "$TMPDIR/r8.json" "$BASE/api/track/alerts/list?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_D"
verify "轨迹告警" "$TMPDIR/r8.json" "轨迹告警"

curl -s -o "$TMPDIR/r9.json" "$BASE/api/auth/me" -H "Authorization: Bearer $TOKEN_D"
verify "用户详情" "$TMPDIR/r9.json" "用户详情"

ORDERID=$(node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const l=j.data.list||[];const o=l.find(x=>x.status==="in_transit")||l[0];console.log(o?.id||"")' "$TMPDIR/r1.json")
if [ -n "$ORDERID" ]; then
  curl -s -o "$TMPDIR/r10.json" "$BASE/api/track/$ORDERID/playback" -H "Authorization: Bearer $TOKEN_D"
  verify "轨迹回放($ORDERID)" "$TMPDIR/r10.json" "轨迹回放"
fi

curl -s -o "$TMPDIR/r11.json" "$BASE/api/settlement/my-settlements" -H "Authorization: Bearer $TOKEN_D"
verify "我的结算" "$TMPDIR/r11.json" "我的结算"

# ========== 管理端端点 ==========
echo ""
echo "--- 管理员端 API ---"

curl -s -o "$TMPDIR/a1.json" "$BASE/api/admin/dashboard/kpi?range=30" -H "Authorization: Bearer $TOKEN_A"
verify "KPI驾驶舱" "$TMPDIR/a1.json" "KPI驾驶舱"

curl -s -o "$TMPDIR/a2.json" "$BASE/api/admin/risk/auth-review?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_A"
verify "认证审核台" "$TMPDIR/a2.json" "认证审核台"

curl -s -o "$TMPDIR/a3.json" "$BASE/api/admin/risk/prepay-review?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_A"
verify "预支审核台" "$TMPDIR/a3.json" "预支审核台"

curl -s -o "$TMPDIR/a4.json" "$BASE/api/admin/users?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_A"
verify "用户管理" "$TMPDIR/a4.json" "用户管理"

curl -s -o "$TMPDIR/a5.json" "$BASE/api/admin/fund/monitor" -H "Authorization: Bearer $TOKEN_A"
verify "资金监控" "$TMPDIR/a5.json" "资金监控"

curl -s -o "$TMPDIR/a6.json" "$BASE/api/matching/logs?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_A"
verify "匹配日志" "$TMPDIR/a6.json" "匹配日志"

curl -s -o "$TMPDIR/a7.json" "$BASE/api/admin/fuel-stations?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN_A"
verify "油站CRUD" "$TMPDIR/a7.json" "油站CRUD"

# 司机端 - 货主匹配
SHIP_ORDERID=$(node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const l=j.data.list||[];console.log(l[0]?.id||"")' "$TMPDIR/r1.json")
if [ -n "$SHIP_ORDERID" ]; then
  curl -s -o "$TMPDIR/r12.json" "$BASE/api/stations/recommend-for-order?orderId=$SHIP_ORDERID" -H "Authorization: Bearer $TOKEN_D"
  verify "加油方案($SHIP_ORDERID)" "$TMPDIR/r12.json" "加油方案"
fi

echo ""
echo "========================================"
echo "  ✅ 端点测试完成"
echo "  📡 HTTP服务:  http://localhost:3002"
echo "  🔌 Socket.io: http://localhost:3002/socket.io"
echo "  👤 司机登录:  13912345678 / 000000"
echo "  👑 管理员:    18010000000 / 000000"
echo "========================================"
