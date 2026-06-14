#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
    while IFS='=' read -r key value; do
        [[ -z "$key" || "$key" =~ ^# ]] && continue
        export "$key=$value"
    done < .env
fi

FRONTEND_PORT=${FRONTEND_PORT:-49082}
BACKEND_PORT=${BACKEND_PORT:-59082}

ERRORS=0

pid_cwd() {
    lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

echo "=== 服务验收检查 ==="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

echo "--- 1. 端口监听检查 ---"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1 || true)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1 || true)

if [ -n "$frontend_pid" ]; then
    echo "✓ 前端端口 $FRONTEND_PORT 正在监听 (PID=$frontend_pid)"
else
    echo "✗ 前端端口 $FRONTEND_PORT 无监听"
    ERRORS=$((ERRORS + 1))
fi

if [ -n "$backend_pid" ]; then
    echo "✓ 后端端口 $BACKEND_PORT 正在监听 (PID=$backend_pid)"
else
    echo "✗ 后端端口 $BACKEND_PORT 无监听"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "--- 2. 进程状态检查 ---"
if [ -n "$frontend_pid" ]; then
    frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs || echo "UNKNOWN")
    case "$frontend_stat" in
        T*)
            echo "✗ 前端进程处于停止态 (STAT=$frontend_stat)"
            ERRORS=$((ERRORS + 1))
            ;;
        Z*)
            echo "✗ 前端进程处于僵尸态 (STAT=$frontend_stat)"
            ERRORS=$((ERRORS + 1))
            ;;
        *)
            echo "✓ 前端进程状态正常 (STAT=$frontend_stat)"
            ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || true
            ;;
    esac
fi

if [ -n "$backend_pid" ]; then
    backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs || echo "UNKNOWN")
    case "$backend_stat" in
        T*)
            echo "✗ 后端进程处于停止态 (STAT=$backend_stat)"
            ERRORS=$((ERRORS + 1))
            ;;
        Z*)
            echo "✗ 后端进程处于僵尸态 (STAT=$backend_stat)"
            ERRORS=$((ERRORS + 1))
            ;;
        *)
            echo "✓ 后端进程状态正常 (STAT=$backend_stat)"
            ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || true
            ;;
    esac
fi
echo ""

echo "--- 3. HTTP 响应检查 ---"
echo "检查前端首页 (http://127.0.0.1:$FRONTEND_PORT/)..."
frontend_http_code=$(curl -I --max-time 5 -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$FRONTEND_PORT/" || echo "000")
if [ "$frontend_http_code" = "200" ]; then
    echo "✓ 前端首页返回 HTTP 200"
else
    echo "✗ 前端首页返回 HTTP $frontend_http_code"
    ERRORS=$((ERRORS + 1))
fi

echo "检查后端健康接口 (http://127.0.0.1:$BACKEND_PORT/api/health)..."
backend_response=$(curl -sS --max-time 5 -w "\nHTTP_CODE:%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1 || true)
backend_http_code=$(echo "$backend_response" | tail -n1 | sed 's/.*HTTP_CODE://')
backend_body=$(echo "$backend_response" | sed '$d')

if [ "$backend_http_code" = "200" ] || [ "$backend_http_code" = "201" ] || [ "$backend_http_code" = "301" ] || [ "$backend_http_code" = "302" ]; then
    echo "✓ 后端健康接口返回 HTTP $backend_http_code"
    if [ -n "$backend_body" ]; then
        echo "  响应: $backend_body"
    fi
else
    echo "✗ 后端健康接口返回 HTTP $backend_http_code"
    if [ -n "$backend_body" ]; then
        echo "  响应: $backend_body"
    fi
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "--- 4. 进程归属检查 ---"
if [ -n "$frontend_pid" ]; then
    frontend_cwd=$(pid_cwd "$frontend_pid")
    if [[ "$frontend_cwd" == "$PROJECT_DIR"/* ]]; then
        echo "✓ 前端进程归属本项目 (cwd=$frontend_cwd)"
    else
        echo "✗ 前端进程归属异常 (cwd=$frontend_cwd, expected=$PROJECT_DIR)"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -n "$backend_pid" ]; then
    backend_cwd=$(pid_cwd "$backend_pid")
    if [[ "$backend_cwd" == "$PROJECT_DIR"/* ]]; then
        echo "✓ 后端进程归属本项目 (cwd=$backend_cwd)"
    else
        echo "✗ 后端进程归属异常 (cwd=$backend_cwd, expected=$PROJECT_DIR)"
        ERRORS=$((ERRORS + 1))
    fi
fi
echo ""

echo "=== 验收结果 ==="
if [ "$ERRORS" -eq 0 ]; then
    echo "✓ 所有检查通过！服务运行正常。"
    echo ""
    echo "访问地址:"
    echo "  前端: http://127.0.0.1:$FRONTEND_PORT"
    echo "  后端: http://127.0.0.1:$BACKEND_PORT"
    echo "  API:  http://127.0.0.1:$BACKEND_PORT/api"
    exit 0
else
    echo "✗ 发现 $ERRORS 个问题，请检查日志并修复。"
    echo ""
    if [ -f "$PROJECT_DIR/logs/frontend.log" ]; then
        echo "前端日志尾部:"
        tail -n 20 "$PROJECT_DIR/logs/frontend.log"
        echo ""
    fi
    if [ -f "$PROJECT_DIR/logs/backend.log" ]; then
        echo "后端日志尾部:"
        tail -n 20 "$PROJECT_DIR/logs/backend.log"
        echo ""
    fi
    exit 1
fi
