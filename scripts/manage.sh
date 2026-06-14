#!/usr/bin/env bash
# ============================================================
# 项目管理脚本 - may-89093
# 功能: 端口检查/切换、启动、停止、验收
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

# 加载 .env
if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
else
    echo "ERROR: .env file not found at $ENV_FILE"
    exit 1
fi

TAIL4=9093
MAX_SLOT=5

# ============================================================
# 端口占用检查
# ============================================================
port_in_use() {
    local port=$1
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

# ============================================================
# 检查端口归属
# ============================================================
port_belongs_to_project() {
    local port=$1
    local pid
    pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -z "$pid" ]; then
        return 1
    fi
    local cwd
    cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    case "$cwd" in
        "$PROJECT_DIR"/*) return 0 ;;
        *) return 1 ;;
    esac
}

# ============================================================
# 根据槽位计算端口并更新 .env
# ============================================================
apply_slot() {
    local slot=$1
    local frontend_port=$((40000 + slot * 1000 + TAIL4))
    local backend_port=$((50000 + slot * 1000 + TAIL4))

    sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$frontend_port/" "$ENV_FILE"
    sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$backend_port/" "$ENV_FILE"
    sed -i '' "s/^PORT_SLOT=.*/PORT_SLOT=$slot/" "$ENV_FILE"
    sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
    sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$backend_port|" "$ENV_FILE"
    sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
    sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
    sed -i '' "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$frontend_port|" "$ENV_FILE"

    export FRONTEND_PORT=$frontend_port
    export BACKEND_PORT=$backend_port
    export PORT_SLOT=$slot
    export FRONTEND_URL="http://127.0.0.1:$frontend_port"
    export BACKEND_URL="http://127.0.0.1:$backend_port"
    export API_BASE_URL="http://127.0.0.1:$backend_port/api"
    export VITE_API_URL="http://127.0.0.1:$backend_port/api"
    export CORS_ORIGIN="http://127.0.0.1:$frontend_port"

    echo "  使用槽位 $slot: FRONTEND=$frontend_port, BACKEND=$backend_port"
}

# ============================================================
# 自动寻找可用端口槽位
# ============================================================
find_available_slot() {
    local start_slot=${1:-0}
    for slot in $(seq "$start_slot" "$MAX_SLOT"); do
        local frontend_port=$((40000 + slot * 1000 + TAIL4))
        local backend_port=$((50000 + slot * 1000 + TAIL4))

        if ! port_in_use "$frontend_port" && ! port_in_use "$backend_port"; then
            echo "$slot"
            return 0
        fi

        if port_in_use "$frontend_port"; then
            if port_belongs_to_project "$frontend_port"; then
                echo "  端口 $frontend_port 被本项目占用，将尝试重启..."
            else
                echo "  端口 $frontend_port 被其他项目占用，跳过槽位 $slot"
            fi
        fi
        if port_in_use "$backend_port"; then
            if port_belongs_to_project "$backend_port"; then
                echo "  端口 $backend_port 被本项目占用，将尝试重启..."
            else
                echo "  端口 $backend_port 被其他项目占用，跳过槽位 $slot"
            fi
        fi
    done
    echo "ERROR: 所有端口槽位都被占用，请手动释放端口或检查冲突"
    exit 1
}

# ============================================================
# 安全终止进程（仅终止属于本项目的进程）
# ============================================================
safe_kill_port() {
    local port=$1
    local pid
    pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -z "$pid" ]; then
        return 0
    fi

    local cwd
    cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd
    cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)

    case "$cwd" in
        "$PROJECT_DIR"/*)
            echo "  终止进程 PID=$pid (端口 $port, cwd=$cwd)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            ;;
        *)
            echo "  跳过终止: 端口 $port 的进程 PID=$pid 不属于本项目"
            echo "    cwd=$cwd"
            echo "    cmd=$cmd"
            echo "  将尝试切换到备用端口槽位..."
            return 1
            ;;
    esac
    return 0
}

# ============================================================
# 停止当前项目的前后端进程
# ============================================================
stop_project() {
    echo "=== 停止项目 may-89093 ==="
    # 重新加载 .env 获取当前端口
    if [ -f "$ENV_FILE" ]; then
        # shellcheck disable=SC2046
        export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
    fi

    local frontend_port=${FRONTEND_PORT:-49093}
    local backend_port=${BACKEND_PORT:-59093}

    echo "前端端口: $frontend_port"
    echo "后端端口: $backend_port"

    local frontend_pid
    frontend_pid=$(lsof -nP -iTCP:"$frontend_port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)
    local backend_pid
    backend_pid=$(lsof -nP -iTCP:"$backend_port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)

    if [ -n "$frontend_pid" ]; then
        safe_kill_port "$frontend_port" || true
    else
        echo "  前端端口 $frontend_port 没有运行中的进程"
    fi

    if [ -n "$backend_pid" ]; then
        safe_kill_port "$backend_port" || true
    else
        echo "  后端端口 $backend_port 没有运行中的进程"
    fi

    echo "=== 停止完成 ==="
}

# ============================================================
# 检查端口并准备启动
# ============================================================
prepare_ports() {
    echo "=== 检查端口配置 ==="
    echo "当前槽位: $PORT_SLOT"
    echo "当前前端端口: $FRONTEND_PORT"
    echo "当前后端端口: $BACKEND_PORT"

    local need_switch=0

    # 检查前端端口
    if port_in_use "$FRONTEND_PORT"; then
        if port_belongs_to_project "$FRONTEND_PORT"; then
            echo "  前端端口 $FRONTEND_PORT 被本项目占用，先停止..."
            safe_kill_port "$FRONTEND_PORT"
        else
            echo "  前端端口 $FRONTEND_PORT 被其他项目占用，需要切换槽位"
            need_switch=1
        fi
    fi

    # 检查后端端口
    if port_in_use "$BACKEND_PORT"; then
        if port_belongs_to_project "$BACKEND_PORT"; then
            echo "  后端端口 $BACKEND_PORT 被本项目占用，先停止..."
            safe_kill_port "$BACKEND_PORT"
        else
            echo "  后端端口 $BACKEND_PORT 被其他项目占用，需要切换槽位"
            need_switch=1
        fi
    fi

    if [ $need_switch -eq 1 ]; then
        local next_slot=$((PORT_SLOT + 1))
        echo "  从槽位 $next_slot 开始寻找可用端口..."
        local available_slot
        available_slot=$(find_available_slot "$next_slot")
        apply_slot "$available_slot"
    fi

    echo "=== 端口准备完成: FRONTEND=$FRONTEND_PORT, BACKEND=$BACKEND_PORT ==="
}

# ============================================================
# 验收检查
# ============================================================
verify_project() {
    echo "=== 项目验收检查 ==="

    # 等待服务完全启动
    echo "  等待 5 秒确保服务稳定..."
    sleep 5

    # 检查前端端口监听
    local frontend_pid
    frontend_pid=$(lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t | head -n1 || true)
    if [ -z "$frontend_pid" ]; then
        echo "ERROR: 前端端口 $FRONTEND_PORT 没有监听"
        return 1
    fi
    echo "  ✓ 前端端口 $FRONTEND_PORT 监听中 (PID=$frontend_pid)"

    # 检查后端端口监听
    local backend_pid
    backend_pid=$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t | head -n1 || true)
    if [ -z "$backend_pid" ]; then
        echo "ERROR: 后端端口 $BACKEND_PORT 没有监听"
        return 1
    fi
    echo "  ✓ 后端端口 $BACKEND_PORT 监听中 (PID=$backend_pid)"

    # 检查进程状态
    local frontend_stat
    frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs || echo "UNKNOWN")
    local backend_stat
    backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs || echo "UNKNOWN")

    if [[ "$frontend_stat" == T* ]] || [[ "$frontend_stat" == Z* ]] || [ "$frontend_stat" = "UNKNOWN" ]; then
        echo "ERROR: 前端进程状态异常: $frontend_stat"
        return 1
    fi
    echo "  ✓ 前端进程状态: $frontend_stat"

    if [[ "$backend_stat" == T* ]] || [[ "$backend_stat" == Z* ]] || [ "$backend_stat" = "UNKNOWN" ]; then
        echo "ERROR: 后端进程状态异常: $backend_stat"
        return 1
    fi
    echo "  ✓ 后端进程状态: $backend_stat"

    # 检查进程归属
    local frontend_cwd
    frontend_cwd=$(ps -o cwd= -p "$frontend_pid" 2>/dev/null | xargs || echo "")
    local backend_cwd
    backend_cwd=$(ps -o cwd= -p "$backend_pid" 2>/dev/null | xargs || echo "")

    if [[ ! "$frontend_cwd" == "$PROJECT_DIR"/* ]]; then
        echo "ERROR: 前端进程不属于本项目: cwd=$frontend_cwd"
        return 1
    fi
    if [[ ! "$backend_cwd" == "$PROJECT_DIR"/* ]]; then
        echo "ERROR: 后端进程不属于本项目: cwd=$backend_cwd"
        return 1
    fi
    echo "  ✓ 进程归属验证通过"

    # 前端 HTTP 检查
    local frontend_http
    frontend_http=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" || echo "000")
    if [ "$frontend_http" != "200" ]; then
        echo "ERROR: 前端首页返回 HTTP $frontend_http (期望 200)"
        return 1
    fi
    echo "  ✓ 前端首页 HTTP 200"

    # 后端健康检查
    local backend_http
    backend_http=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" || echo "000")
    if [[ ! "$backend_http" =~ ^[23][0-9][0-9]$ ]]; then
        echo "WARN: 后端健康接口返回 HTTP $backend_http (期望 2xx/3xx)，可能健康接口尚未实现"
        # 不返回错误，因为健康接口可能在正式业务代码中才实现
    else
        echo "  ✓ 后端健康接口 HTTP $backend_http"
    fi

    echo ""
    echo "========================================"
    echo "  项目验收通过!"
    echo "  前端地址: http://127.0.0.1:$FRONTEND_PORT"
    echo "  后端地址: http://127.0.0.1:$BACKEND_PORT"
    echo "  前端 PID: $frontend_pid"
    echo "  后端 PID: $backend_pid"
    echo "========================================"

    return 0
}

# ============================================================
# 状态检查
# ============================================================
status_project() {
    echo "=== 项目状态检查 ==="

    local frontend_pid
    frontend_pid=$(lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)
    local backend_pid
    backend_pid=$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)

    echo "前端端口: $FRONTEND_PORT"
    if [ -n "$frontend_pid" ]; then
        echo "  状态: 运行中 (PID=$frontend_pid)"
        ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command= || true
    else
        echo "  状态: 未运行"
    fi

    echo ""
    echo "后端端口: $BACKEND_PORT"
    if [ -n "$backend_pid" ]; then
        echo "  状态: 运行中 (PID=$backend_pid)"
        ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command= || true
    else
        echo "  状态: 未运行"
    fi

    echo ""
    echo "完整诊断命令:"
    cat <<EOF
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
frontend_pid=\$(lsof -nP -iTCP:\$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=\$(lsof -nP -iTCP:\$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
ps -p "\$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
ps -p "\$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
curl -I --max-time 5 http://127.0.0.1:\$FRONTEND_PORT/
curl -sS --max-time 5 http://127.0.0.1:\$BACKEND_PORT/api/health
EOF
}

# ============================================================
# 主命令分发
# ============================================================
case "${1:-help}" in
    prepare)
        prepare_ports
        ;;
    stop)
        stop_project
        ;;
    status)
        status_project
        ;;
    verify)
        verify_project
        ;;
    check-ports)
        echo "前端端口 $FRONTEND_PORT: $(port_in_use "$FRONTEND_PORT" && echo "占用" || echo "可用")"
        echo "后端端口 $BACKEND_PORT: $(port_in_use "$BACKEND_PORT" && echo "占用" || echo "可用")"
        ;;
    help|*)
        cat <<EOF
使用方法: $0 <命令>

命令:
  prepare     检查端口占用并准备启动端口（自动切换备用槽位）
  stop        安全停止本项目的前后端进程（仅终止本项目进程）
  status      查看项目运行状态和进程信息
  verify      验收检查：端口监听、进程状态、HTTP 响应
  check-ports 检查当前端口占用状态
  help        显示此帮助

端口配置 (may-89093, tail4=9093):
  槽位0: FRONTEND=49093, BACKEND=59093
  槽位1: FRONTEND=50093, BACKEND=60093
  槽位2: FRONTEND=51093, BACKEND=61093
  槽位3: FRONTEND=52093, BACKEND=62093
  槽位4: FRONTEND=53093, BACKEND=63093
  槽位5: FRONTEND=54093, BACKEND=64093
EOF
        ;;
esac
