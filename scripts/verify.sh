#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "错误: 找不到 .env 文件: $ENV_FILE"
    exit 1
fi

source "$ENV_FILE"

echo "=========================================="
echo "  项目服务验收验证 - $PROJECT_NAME"
echo "=========================================="
echo ""
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo "当前槽位: $ACTIVE_SLOT"
echo ""

echo "=========================================="
echo "  固定命令模板验证"
echo "=========================================="

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo ""
echo "--- 前端进程信息 ---"
if [ -n "$frontend_pid" ]; then
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
else
    echo "FAIL: 前端端口 $FRONTEND_PORT 无监听进程"
fi

echo ""
echo "--- 后端进程信息 ---"
if [ -n "$backend_pid" ]; then
    ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
else
    echo "FAIL: 后端端口 $BACKEND_PORT 无监听进程"
fi

echo ""
echo "--- 前端 HTTP 检查 ---"
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/

echo ""
echo "--- 后端健康检查 ---"
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health

echo ""
echo "=========================================="
echo "  详细验证结果"
echo "=========================================="

ALL_OK=true

echo ""
echo "[1] 前端端口监听检查"
if [ -n "$frontend_pid" ]; then
    echo "    PASS: 前端端口 $FRONTEND_PORT 正在监听 (PID=$frontend_pid)"
else
    echo "    FAIL: 前端端口 $FRONTEND_PORT 无监听进程"
    ALL_OK=false
fi

echo ""
echo "[2] 后端端口监听检查"
if [ -n "$backend_pid" ]; then
    echo "    PASS: 后端端口 $BACKEND_PORT 正在监听 (PID=$backend_pid)"
else
    echo "    FAIL: 后端端口 $BACKEND_PORT 无监听进程"
    ALL_OK=false
fi

echo ""
echo "[3] 前端进程状态检查"
if [ -n "$frontend_pid" ]; then
    fe_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
    case "$fe_stat" in
        T*)
            echo "    FAIL: 前端进程处于停止态 (STAT=$fe_stat)"
            ALL_OK=false
            ;;
        Z*)
            echo "    FAIL: 前端进程处于僵尸态 (STAT=$fe_stat)"
            ALL_OK=false
            ;;
        "")
            echo "    FAIL: 前端进程不存在"
            ALL_OK=false
            ;;
        *)
            echo "    PASS: 前端进程状态正常 (STAT=$fe_stat)"
            ;;
    esac
else
    echo "    FAIL: 无前端进程可检查"
    ALL_OK=false
fi

echo ""
echo "[4] 后端进程状态检查"
if [ -n "$backend_pid" ]; then
    be_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
    case "$be_stat" in
        T*)
            echo "    FAIL: 后端进程处于停止态 (STAT=$be_stat)"
            ALL_OK=false
            ;;
        Z*)
            echo "    FAIL: 后端进程处于僵尸态 (STAT=$be_stat)"
            ALL_OK=false
            ;;
        "")
            echo "    FAIL: 后端进程不存在"
            ALL_OK=false
            ;;
        *)
            echo "    PASS: 后端进程状态正常 (STAT=$be_stat)"
            ;;
    esac
else
    echo "    FAIL: 无后端进程可检查"
    ALL_OK=false
fi

echo ""
echo "[5] 前端进程归属检查"
if [ -n "$frontend_pid" ]; then
    fe_cwd=$(ps -o cwd= -p "$frontend_pid" 2>/dev/null | xargs)
    case "$fe_cwd" in
        "$PROJECT_DIR"/*)
            echo "    PASS: 前端进程属于当前项目 (cwd=$fe_cwd)"
            ;;
        *)
            echo "    WARNING: 前端进程不属于当前项目 (cwd=$fe_cwd)"
            ;;
    esac
fi

echo ""
echo "[6] 后端进程归属检查"
if [ -n "$backend_pid" ]; then
    be_cwd=$(ps -o cwd= -p "$backend_pid" 2>/dev/null | xargs)
    case "$be_cwd" in
        "$PROJECT_DIR"/*)
            echo "    PASS: 后端进程属于当前项目 (cwd=$be_cwd)"
            ;;
        *)
            echo "    WARNING: 后端进程不属于当前项目 (cwd=$be_cwd)"
            ;;
    esac
fi

echo ""
echo "[7] 前端 HTTP 响应检查"
fe_http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>/dev/null || echo "000")
if [ "$fe_http_code" = "200" ]; then
    echo "    PASS: 前端首页返回 HTTP 200"
elif [ "$fe_http_code" = "000" ]; then
    echo "    FAIL: 前端连接超时"
    ALL_OK=false
else
    echo "    INFO: 前端返回 HTTP $fe_http_code"
fi

echo ""
echo "[8] 后端 API 响应检查"
be_http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "000")
if [ "$be_http_code" = "200" ] || [ "$be_http_code" = "201" ] || [ "$be_http_code" = "301" ] || [ "$be_http_code" = "302" ]; then
    echo "    PASS: 后端健康检查返回 HTTP $be_http_code"
elif [ "$be_http_code" = "000" ]; then
    echo "    FAIL: 后端连接超时"
    ALL_OK=false
elif [ "$be_http_code" = "404" ]; then
    echo "    INFO: 健康检查接口不存在 (HTTP 404)，请确认后端路由配置"
else
    echo "    FAIL: 后端健康检查返回 HTTP $be_http_code"
    ALL_OK=false
fi

echo ""
echo "=========================================="
echo "  访问地址汇总"
echo "=========================================="
echo "前端: $FRONTEND_URL"
echo "后端: $BACKEND_URL"
echo "API:  $API_BASE_URL"
echo ""
echo "日志文件:"
echo "  前端: $PROJECT_DIR/logs/frontend.log"
echo "  后端: $PROJECT_DIR/logs/backend.log"
echo ""

echo "=========================================="
if [ "$ALL_OK" = true ]; then
    echo "  结果: 全部通过 ✓"
else
    echo "  结果: 存在问题，请检查日志并修复 ✗"
fi
echo "=========================================="
