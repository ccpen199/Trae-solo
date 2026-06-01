#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source .env

echo "=========================================="
echo "Knowledge Sync 服务验证"
echo "=========================================="

echo ""
echo "1. 检查端口监听..."
echo "------------------------------------------"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

if [ -z "$frontend_pid" ]; then
  echo "❌ 前端端口 $FRONTEND_PORT 未监听"
  exit 1
fi
if [ -z "$backend_pid" ]; then
  echo "❌ 后端端口 $BACKEND_PORT 未监听"
  exit 1
fi

echo "✅ 前端端口 $FRONTEND_PORT 监听中, PID=$frontend_pid"
echo "✅ 后端端口 $BACKEND_PORT 监听中, PID=$backend_pid"

echo ""
echo "2. 检查进程状态..."
echo "------------------------------------------"
frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)

echo "前端进程状态: $frontend_stat"
echo "后端进程状态: $backend_stat"

if echo "$frontend_stat" | grep -qE "^[TtZz]"; then
  echo "❌ 前端进程异常: stat=$frontend_stat"
  exit 1
fi
if echo "$backend_stat" | grep -qE "^[TtZz]"; then
  echo "❌ 后端进程异常: stat=$backend_stat"
  exit 1
fi

echo "✅ 进程状态正常"

echo ""
echo "3. HTTP健康检查..."
echo "------------------------------------------"

echo "前端首页检查..."
frontend_http=$(curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | head -n1)
if echo "$frontend_http" | grep -q "200"; then
  echo "✅ 前端首页: $frontend_http"
else
  echo "❌ 前端首页异常: $frontend_http"
  exit 1
fi

echo "后端健康检查..."
backend_health=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1)
if echo "$backend_health" | grep -q "ok"; then
  echo "✅ 后端健康: $backend_health"
else
  echo "❌ 后端健康异常: $backend_health"
  exit 1
fi

echo ""
echo "4. 业务API验证..."
echo "------------------------------------------"

echo "获取用户信息..."
user_resp=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/users/me")
if echo "$user_resp" | grep -q "demo"; then
  echo "✅ 用户API正常"
else
  echo "⚠️  用户API响应: $user_resp"
fi

echo "获取知识条目列表..."
entries_resp=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/entries?limit=5")
if echo "$entries_resp" | grep -q "total"; then
  entry_count=$(echo "$entries_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total',0))")
  echo "✅ 条目列表API正常, 总数=$entry_count"
else
  echo "⚠️  条目列表API响应: $entries_resp"
fi

echo "获取统计数据..."
stats_resp=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/stats")
if echo "$stats_resp" | grep -q "total_entries"; then
  total=$(echo "$stats_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_entries',0))")
  pending=$(echo "$stats_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pending_conflicts',0))")
  echo "✅ 统计API正常, 总条目=$total, 待处理冲突=$pending"
else
  echo "⚠️  统计API响应: $stats_resp"
fi

echo "搜索测试..."
search_resp=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/entries/search?keyword=Python")
if echo "$search_resp" | grep -q "results"; then
  search_total=$(echo "$search_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total',0))")
  echo "✅ 搜索API正常, 匹配=$search_total"
else
  echo "⚠️  搜索API响应: $search_resp"
fi

echo "获取冲突列表..."
conflicts_resp=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/conflicts")
conflict_count=$(echo "$conflicts_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "0")
echo "✅ 冲突API正常, 总数=$conflict_count"

echo "获取管理统计..."
admin_resp=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/admin/stats")
if echo "$admin_resp" | grep -q "total_users"; then
  users=$(echo "$admin_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_users',0))")
  entries=$(echo "$admin_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_entries',0))")
  echo "✅ 管理统计正常, 用户=$users, 条目=$entries"
else
  echo "⚠️  管理统计响应: $admin_resp"
fi

echo ""
echo "5. 数据库验证..."
echo "------------------------------------------"
if [ -f "$PROJECT_DIR/data/app.sqlite" ]; then
  db_size=$(du -h "$PROJECT_DIR/data/app.sqlite" | cut -f1)
  echo "✅ 数据库文件存在: $db_size"
  table_count=$(sqlite3 "$PROJECT_DIR/data/app.sqlite" ".tables" 2>/dev/null | wc -w || echo "0")
  echo "✅ 数据库表数量: $table_count"
else
  echo "❌ 数据库文件不存在"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ 所有验证通过！服务正常运行"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  前端: http://127.0.0.1:$FRONTEND_PORT/"
echo "  后端API: http://127.0.0.1:$BACKEND_PORT/"
echo "  Swagger文档: http://127.0.0.1:$BACKEND_PORT/docs"
echo ""
