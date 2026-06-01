#!/bin/bash

cd "$(dirname "$0")"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-53361}
API_BASE="http://127.0.0.1:$BACKEND_PORT/api"

echo "========================================"
echo "  AI采购谈判助手 - 验收测试脚本"
echo "========================================"
echo ""

PASS=0
FAIL=0

run_test() {
  local name=$1
  local cmd=$2
  local expected=$3
  
  echo -n "测试: $name ... "
  
  result=$(eval $cmd 2>/dev/null)
  exit_code=$?
  
  if [ $exit_code -eq 0 ] && [[ "$result" == *"$expected"* ]]; then
    echo "✅ 通过"
    ((PASS++))
    return 0
  else
    echo "❌ 失败"
    echo "   期望: $expected"
    echo "   实际: $result"
    ((FAIL++))
    return 1
  fi
}

echo "=== 基础接口测试 ==="
run_test "健康检查" "curl -s $API_BASE/health" "ok"
run_test "获取用户列表" "curl -s $API_BASE/users" "success"
run_test "获取品类列表" "curl -s $API_BASE/categories" "success"
run_test "获取供应商列表" "curl -s $API_BASE/suppliers" "success"
run_test "获取谈判列表" "curl -s $API_BASE/negotiations" "success"
run_test "获取配置列表" "curl -s $API_BASE/configurations" "success"
run_test "获取看板统计" "curl -s $API_BASE/dashboard/stats" "success"

echo ""
echo "=== 数据一致性测试 ==="
run_test "谈判列表有数据" "curl -s $API_BASE/negotiations | grep -c 'NGT'" "1"
run_test "操作日志可查询" "curl -s $API_BASE/operation-logs" "success"

echo ""
echo "=== 详情数据测试 ==="
NEGO_ID=$(curl -s $API_BASE/negotiations | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$NEGO_ID" ]; then
  run_test "谈判详情" "curl -s $API_BASE/negotiations/$NEGO_ID" "details"
  run_test "谈判记录轨迹" "curl -s $API_BASE/negotiations/$NEGO_ID" "records"
  run_test "历史版本" "curl -s $API_BASE/negotiations/$NEGO_ID" "versions"
fi

echo ""
echo "=== 导出功能测试 ==="
run_test "导出谈判数据" "curl -s $API_BASE/export/negotiations" "编号"

echo ""
echo "========================================"
echo "  测试结果: $PASS 通过, $FAIL 失败"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo ""
  echo "✅ 所有验收测试通过!"
  exit 0
else
  echo ""
  echo "❌ 部分测试失败，请检查服务状态"
  exit 1
fi
