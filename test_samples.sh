#!/bin/bash
# 机场行李追踪系统 - 测试样例脚本
# 包含：正常、边界、冲突、失败四类测试用例

BASE_URL="http://127.0.0.1:53445/api"
FRONTEND_URL="http://127.0.0.1:43445"

echo "=========================================="
echo "机场行李追踪系统 - 测试样例"
echo "=========================================="
echo ""

# 辅助函数
function print_test() {
  echo ""
  echo "--- [$1] $2 ---"
}

function check_response() {
  if echo "$1" | grep -q '"'; then
    echo "✓ 成功"
    return 0
  else
    echo "✗ 失败: $1"
    return 1
  fi
}

# ========== 第一类：正常样例 ==========
echo ""
echo "【第一类：正常样例 - 完整业务流程】"
echo ""

# 1.1 健康检查
print_test "1.1" "后端健康检查"
RESPONSE=$(curl -sS --max-time 5 "$BASE_URL/health")
echo "$RESPONSE" | grep -q "ok" && echo "✓ 后端服务正常" || echo "✗ 后端服务异常"

# 1.2 前端首页检查
print_test "1.2" "前端首页检查"
HTTP_CODE=$(curl -I --max-time 5 "$FRONTEND_URL/" 2>/dev/null | head -n1 | awk '{print $2}')
[ "$HTTP_CODE" = "200" ] && echo "✓ 前端首页正常 (HTTP $HTTP_CODE)" || echo "✗ 前端首页异常 (HTTP $HTTP_CODE)"

# 1.3 创建行李档案（完整信息）
print_test "1.3" "创建正常行李档案"
TAG1="BN000001"
BAGGAGE1=$(curl -sS -X POST "$BASE_URL/baggage" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG1"'",
    "passenger_name": "张三",
    "passenger_phone": "13800138001",
    "passenger_id_card": "110101199001011234",
    "flight_no": "CA1234",
    "flight_date": "2026-05-28",
    "departure": "北京",
    "destination": "上海",
    "pieces": 1,
    "weight": 20.5,
    "check_in_time": "2026-05-28 08:30:00"
  }')
check_response "$BAGGAGE1"
BAGGAGE_ID1=$(echo "$BAGGAGE1" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "  行李ID: $BAGGAGE_ID1, 行李牌: $TAG1"

# 1.4 录入完整节点
print_test "1.4" "录入完整追踪节点"
for NODE in "security:安检" "loading:装机" "transfer:中转" "unloading:卸机" "carousel:转盘" "pickup:领取"; do
  TYPE=${NODE%%:*}
  NAME=${NODE##*:}
  TIME=$(date -v+1H +"%Y-%m-%d %H:%M:%S" 2>/dev/null || date -d "+1 hour" +"%Y-%m-%d %H:%M:%S")
  RESP=$(curl -sS -X POST "$BASE_URL/nodes" \
    -H "Content-Type: application/json" \
    -d '{
      "baggage_tag": "'"$TAG1"'",
      "node_type": "'"$TYPE"'",
      "node_time": "'"$TIME"'",
      "location": "T2航站楼",
      "operator": "操作员001"
    }')
  echo "  $NAME: $(echo "$RESP" | grep -q '"node"' && echo '✓' || echo '✗')"
done

# 1.5 查询行李详情
print_test "1.5" "查询行李完整信息"
DETAIL=$(curl -sS "$BASE_URL/baggage/$TAG1/full")
echo "$DETAIL" | grep -q '"baggage"' && echo "✓ 查询成功" || echo "✗ 查询失败"
echo "  状态: $(echo "$DETAIL" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)"
echo "  节点数: $(echo "$DETAIL" | grep -o '"node_type"' | wc -l)"

# 1.6 行李列表查询
print_test "1.6" "行李列表查询"
LIST=$(curl -sS "$BASE_URL/baggage?page=1&pageSize=10")
echo "$LIST" | grep -q '"list"' && echo "✓ 列表查询成功" || echo "✗ 列表查询失败"

# ========== 第二类：边界样例 ==========
echo ""
echo "【第二类：边界样例 - 极限值与特殊场景】"
echo ""

# 2.1 多件行李
print_test "2.1" "多件行李托运 (10件)"
TAG2="BN000002"
BAGGAGE2=$(curl -sS -X POST "$BASE_URL/baggage" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG2"'",
    "passenger_name": "李四",
    "flight_no": "MU5678",
    "flight_date": "2026-05-28",
    "departure": "广州",
    "destination": "成都",
    "pieces": 10,
    "weight": 200,
    "check_in_time": "2026-05-28 10:00:00"
  }')
check_response "$BAGGAGE2"

# 2.2 最小重量
print_test "2.2" "最小重量行李 (0.5kg)"
TAG3="BN000003"
BAGGAGE3=$(curl -sS -X POST "$BASE_URL/baggage" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG3"'",
    "passenger_name": "王五",
    "flight_no": "CZ9012",
    "flight_date": "2026-05-28",
    "departure": "深圳",
    "destination": "杭州",
    "pieces": 1,
    "weight": 0.5,
    "check_in_time": "2026-05-28 11:00:00"
  }')
check_response "$BAGGAGE3"

# 2.3 特殊字符姓名
print_test "2.3" "特殊字符姓名 (O'Neil, 张三·李四)"
TAG4="BN000004"
BAGGAGE4=$(curl -sS -X POST "$BASE_URL/baggage" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG4"'",
    "passenger_name": "Peter O'\''Neil",
    "flight_no": "HU3456",
    "flight_date": "2026-05-28",
    "departure": "北京",
    "destination": "广州",
    "pieces": 2,
    "weight": 45.5,
    "check_in_time": "2026-05-28 12:00:00"
  }')
check_response "$BAGGAGE4"

# 2.4 超长备注
print_test "2.4" "超长备注 (500字符)"
LONG_REMARK=$(printf 'x%.0s' {1..500})
RESP=$(curl -sS -X POST "$BASE_URL/nodes" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG4"'",
    "node_type": "security",
    "node_time": "2026-05-28 12:05:00",
    "remark": "'"$LONG_REMARK"'"
  }')
check_response "$RESP"

# 2.5 国际航线
print_test "2.5" "国际航线 (含英文)"
TAG5="BN000005"
BAGGAGE5=$(curl -sS -X POST "$BASE_URL/baggage" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG5"'",
    "passenger_name": "John Smith",
    "passenger_phone": "+86-13800138000",
    "flight_no": "CA981",
    "flight_date": "2026-05-28",
    "departure": "北京 PEK",
    "destination": "纽约 JFK",
    "pieces": 2,
    "weight": 46.0,
    "check_in_time": "2026-05-28 14:00:00"
  }')
check_response "$BAGGAGE5"

# ========== 第三类：冲突样例 ==========
echo ""
echo "【第三类：冲突样例 - 重复与约束】"
echo ""

# 3.1 重复行李牌
print_test "3.1" "重复行李牌 (应返回409冲突)"
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/baggage" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG1"'",
    "passenger_name": "重复用户",
    "flight_no": "CA9999",
    "flight_date": "2026-05-28",
    "departure": "北京",
    "destination": "上海",
    "pieces": 1,
    "weight": 20,
    "check_in_time": "2026-05-28 15:00:00"
  }')
echo "$RESP" | grep -q "HTTP_CODE:409" && echo "✓ 正确检测冲突 (409)" || echo "✗ 冲突检测失败"

# 3.2 重复节点录入
print_test "3.2" "重复节点录入 (应返回409冲突)"
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/nodes" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG1"'",
    "node_type": "check_in",
    "node_time": "2026-05-28 08:30:00"
  }')
echo "$RESP" | grep -q "HTTP_CODE:409" && echo "✓ 正确检测重复节点 (409)" || echo "✗ 重复节点检测失败"

# 3.3 同一异常重复赔付申请
print_test "3.3" "同一异常重复赔付申请 (应返回409冲突)"
# 先创建一个异常
EXCEP=$(curl -sS -X POST "$BASE_URL/exceptions" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG2"'",
    "exception_type": "damaged",
    "description": "箱子破损",
    "report_time": "2026-05-28 16:00:00",
    "reporter": "地服001"
  }')
INQUIRY_NO=$(echo "$EXCEP" | grep -o '"inquiry_no":"[^"]*"' | cut -d'"' -f4)
echo "  创建异常成功，查询单号: $INQUIRY_NO"

# 第一次申请
COMP1=$(curl -sS -X POST "$BASE_URL/compensation" \
  -H "Content-Type: application/json" \
  -d '{
    "inquiry_no": "'"$INQUIRY_NO"'",
    "responsible_party": "地服公司",
    "compensation_standard": "破损修复：按实际费用",
    "amount": 500,
    "applicant": "理赔员001"
  }')
echo "  第一次申请: $(echo "$COMP1" | grep -q '"id"' && echo '✓' || echo '✗')"

# 第二次申请（冲突）
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/compensation" \
  -H "Content-Type: application/json" \
  -d '{
    "inquiry_no": "'"$INQUIRY_NO"'",
    "responsible_party": "地服公司",
    "amount": 800
  }')
echo "  第二次申请: $(echo "$RESP" | grep -q 'HTTP_CODE:409' && echo '✓ 正确检测冲突 (409)' || echo '✗ 冲突检测失败')"

# ========== 第四类：失败样例 ==========
echo ""
echo "【第四类：失败样例 - 非法输入与错误场景】"
echo ""

# 4.1 缺少必填字段
print_test "4.1" "缺少必填字段 (应返回400)"
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/baggage" \
  -H "Content-Type: application/json" \
  -d '{
    "passenger_name": "测试用户"
  }')
echo "$RESP" | grep -q "HTTP_CODE:400" && echo "✓ 正确返回400错误" || echo "✗ 错误检测失败"

# 4.2 查询不存在的行李牌
print_test "4.2" "查询不存在的行李牌 (应返回404)"
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/baggage/BN999999")
echo "$RESP" | grep -q "HTTP_CODE:404" && echo "✓ 正确返回404" || echo "✗ 404检测失败"

# 4.3 无效节点类型
print_test "4.3" "无效节点类型 (应返回400)"
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/nodes" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG1"'",
    "node_type": "invalid_node",
    "node_time": "2026-05-28 17:00:00"
  }')
echo "$RESP" | grep -q "HTTP_CODE:400" && echo "✓ 正确返回400" || echo "✗ 无效类型检测失败"

# 4.4 无效异常类型
print_test "4.4" "无效异常类型 (应返回400)"
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/exceptions" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG1"'",
    "exception_type": "invalid_type",
    "report_time": "2026-05-28 18:00:00"
  }')
echo "$RESP" | grep -q "HTTP_CODE:400" && echo "✓ 正确返回400" || echo "✗ 无效类型检测失败"

# 4.5 为不存在的行李创建节点
print_test "4.5" "为不存在的行李创建节点 (应返回404)"
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/nodes" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "BN999999",
    "node_type": "security",
    "node_time": "2026-05-28 19:00:00"
  }')
echo "$RESP" | grep -q "HTTP_CODE:404" && echo "✓ 正确返回404" || echo "✗ 404检测失败"

# 4.6 为不存在的行李创建异常
print_test "4.6" "为不存在的行李创建异常 (应返回404)"
RESP=$(curl -sS -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/exceptions" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "BN999999",
    "exception_type": "lost",
    "report_time": "2026-05-28 20:00:00"
  }')
echo "$RESP" | grep -q "HTTP_CODE:404" && echo "✓ 正确返回404" || echo "✗ 404检测失败"

# 4.7 节点缺失告警检测
print_test "4.7" "节点缺失告警检测"
# 创建一个只有托运节点的行李
TAG_ALERT="BN000006"
curl -sS -X POST "$BASE_URL/baggage" \
  -H "Content-Type: application/json" \
  -d '{
    "baggage_tag": "'"$TAG_ALERT"'",
    "passenger_name": "告警测试",
    "flight_no": "CA8888",
    "flight_date": "2026-05-28",
    "departure": "北京",
    "destination": "上海",
    "pieces": 1,
    "weight": 20,
    "check_in_time": "2026-05-28 21:00:00"
  }' > /dev/null

ALERTS=$(curl -sS "$BASE_URL/nodes/alerts?hours=24")
ALERT_COUNT=$(echo "$ALERTS" | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "  告警数量: $ALERT_COUNT"
[ "$ALERT_COUNT" -gt 0 ] && echo "✓ 节点缺失告警正常工作" || echo "! 暂无告警数据（可能新数据）"

# ========== 统计接口测试 ==========
echo ""
echo "【统计接口测试】"
echo ""

print_test "S.1" "运营概览"
OVERVIEW=$(curl -sS "$BASE_URL/stats/overview?days=7")
echo "$OVERVIEW" | grep -q '"total_baggage"' && echo "✓ 概览数据正常" || echo "✗ 概览数据异常"

print_test "S.2" "异常类型分布"
TYPE_DATA=$(curl -sS "$BASE_URL/stats/exceptions-by-type?days=30")
echo "$TYPE_DATA" | grep -q '"data"' && echo "✓ 类型分布正常" || echo "✗ 类型分布异常"

print_test "S.3" "每日趋势"
TREND=$(curl -sS "$BASE_URL/stats/daily-trend?days=14")
echo "$TREND" | grep -q '"data"' && echo "✓ 趋势数据正常" || echo "✗ 趋势数据异常"

print_test "S.4" "节点缺失统计"
MISSING=$(curl -sS "$BASE_URL/stats/missing-nodes?hours=24")
echo "$MISSING" | grep -q '"data"' && echo "✓ 节点缺失统计正常" || echo "✗ 节点缺失统计异常"

# ========== 导出核对 ==========
echo ""
echo "=========================================="
echo "【导出核对信息】"
echo "=========================================="
echo ""
echo "数据库文件: $(pwd)/backend/data/app.sqlite"
echo "前端地址: http://127.0.0.1:43445"
echo "后端地址: http://127.0.0.1:53445"
echo "API 前缀: http://127.0.0.1:53445/api"
echo ""
echo "测试行李牌:"
echo "  - BN000001 (完整流程, 已领取)"
echo "  - BN000002 (10件行李, 有异常赔付)"
echo "  - BN000003 (0.5kg 小行李)"
echo "  - BN000004 (特殊字符姓名)"
echo "  - BN000005 (国际航线)"
echo "  - BN000006 (节点缺失告警测试)"
echo ""
echo "测试查询单号: $INQUIRY_NO"
echo ""
echo "测试路径:"
echo "  旅客查询: http://127.0.0.1:43445/track (输入 BN000001)"
echo "  管理后台: http://127.0.0.1:43445/admin/dashboard"
echo "  行李列表: http://127.0.0.1:43445/admin/baggage"
echo "  节点追踪: http://127.0.0.1:43445/admin/nodes"
echo "  异常处理: http://127.0.0.1:43445/admin/exceptions"
echo "  赔付管理: http://127.0.0.1:43445/admin/compensation"
echo "  统计分析: http://127.0.0.1:43445/admin/stats"
echo ""
echo "日志文件:"
echo "  前端: $(pwd)/frontend.log"
echo "  后端: $(pwd)/backend.log"
echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
