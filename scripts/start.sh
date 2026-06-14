#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

"$SCRIPT_DIR/init-ports.sh"

load_env

echo ""
echo "=== 启动项目服务 ($PROJECT_NAME) ==="
echo "项目目录: $PROJECT_DIR"
echo ""

frontend_pid=$(get_pid_by_port "$FRONTEND_PORT")
backend_pid=$(get_pid_by_port "$BACKEND_PORT")

if [ -n "$frontend_pid" ]; then
    if is_our_project_process "$frontend_pid"; then
        echo "ℹ️  前端已在运行 (PID: $frontend_pid)"
        echo "   如需重启请先执行: ./scripts/stop.sh"
    else
        echo "❌ 前端端口 $FRONTEND_PORT 被其他进程占用"
        get_process_info "$frontend_pid"
        echo "   请释放端口或切换备用槽位"
        exit 1
    fi
fi

if [ -n "$backend_pid" ]; then
    if is_our_project_process "$backend_pid"; then
        echo "ℹ️  后端已在运行 (PID: $backend_pid)"
        echo "   如需重启请先执行: ./scripts/stop.sh"
    else
        echo "❌ 后端端口 $BACKEND_PORT 被其他进程占用"
        get_process_info "$backend_pid"
        echo "   请释放端口或切换备用槽位"
        exit 1
    fi
fi

if [ -n "$frontend_pid" ] && [ -n "$backend_pid" ]; then
    echo ""
    echo "✅ 前后端服务均已在运行"
    echo "   前端: $FRONTEND_URL"
    echo "   后端: $BACKEND_URL"
    exit 0
fi

echo ""
echo "=== 启动后端服务 ==="
if [ -z "$backend_pid" ]; then
    if [ -f "$PROJECT_DIR/backend/package.json" ]; then
        echo "启动 Node.js 后端..."
        cd "$PROJECT_DIR/backend"
        nohup npm start >> "$PROJECT_DIR/backend.log" 2>&1 &
        backend_pid=$!
    else
        echo "⚠️  未检测到后端项目文件，跳过后端启动"
        echo "   待后端代码创建后再执行启动"
        backend_pid=""
    fi
    
    if [ -n "$backend_pid" ]; then
        echo "后端进程 PID: $backend_pid"
        sleep 2
        if wait_for_process "$backend_pid" "后端"; then
            if wait_for_port "$BACKEND_PORT" "后端" 30; then
                echo "✅ 后端启动成功"
            else
                echo "❌ 后端端口未监听，检查日志: tail -f backend.log"
            fi
        else
            echo "❌ 后端进程启动失败，检查日志: tail -f backend.log"
        fi
    fi
fi

echo ""
echo "=== 启动前端服务 ==="
if [ -z "$frontend_pid" ]; then
    if [ -f "$PROJECT_DIR/frontend/package.json" ]; then
        echo "启动前端静态服务器..."
        cd "$PROJECT_DIR/frontend"
        nohup npm start >> "$PROJECT_DIR/frontend.log" 2>&1 &
        frontend_pid=$!
    else
        echo "⚠️  未检测到前端项目文件，跳过前端启动"
        echo "   待前端代码创建后再执行启动"
        frontend_pid=""
    fi
    
    if [ -n "$frontend_pid" ]; then
        echo "前端进程 PID: $frontend_pid"
        sleep 2
        if wait_for_process "$frontend_pid" "前端"; then
            if wait_for_port "$FRONTEND_PORT" "前端" 30; then
                echo "✅ 前端启动成功"
            else
                echo "❌ 前端端口未监听，检查日志: tail -f frontend.log"
            fi
        else
            echo "❌ 前端进程启动失败，检查日志: tail -f frontend.log"
        fi
    fi
fi

cd "$PROJECT_DIR"

echo ""
echo "=== 启动完成 ==="
echo ""
echo "访问地址:"
echo "  前端: $FRONTEND_URL"
echo "  后端: $BACKEND_URL"
echo "  API:  $API_BASE_URL"
echo ""
echo "进程信息:"
[ -n "$frontend_pid" ] && echo "  前端 PID: $frontend_pid" || echo "  前端: 未启动"
[ -n "$backend_pid" ] && echo "  后端 PID: $backend_pid" || echo "  后端: 未启动"
echo ""
echo "日志文件:"
echo "  前端: tail -f $PROJECT_DIR/frontend.log"
echo "  后端: tail -f $PROJECT_DIR/backend.log"
echo ""
echo "状态检查: ./scripts/check-status.sh"
echo "停止服务: ./scripts/stop.sh"

echo ""
sleep 5
echo "=== 启动后验证 ==="
"$SCRIPT_DIR/check-status.sh" || true
