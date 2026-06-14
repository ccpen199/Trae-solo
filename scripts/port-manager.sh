#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

load_env() {
    if [ -f "$ENV_FILE" ]; then
        while IFS='=' read -r key value; do
            [[ -z "$key" || "$key" =~ ^# ]] && continue
            export "$key=$value"
        done < "$ENV_FILE"
    fi
}

get_port_for_slot() {
    local slot=$1
    local tail4=$2
    local frontend_base=$((40000 + slot * 1000))
    local backend_base=$((50000 + slot * 1000))
    echo "$((frontend_base + tail4)) $((backend_base + tail4))"
}

is_port_available() {
    local port=$1
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    fi
    return 0
}

get_pid_for_port() {
    local port=$1
    lsof -nP -iTCP:"$port" -sTCP:LISTEN -t | head -n1
}

pid_cwd() {
    lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

verify_pid_belongs_to_project() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi
    local cwd
    cwd=$(pid_cwd "$pid")
    if [[ "$cwd" == "$PROJECT_DIR"/* ]]; then
        return 0
    fi
    return 1
}

update_env_ports() {
    local frontend_port=$1
    local backend_port=$2
    local slot=$3

    sed -i.bak "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$frontend_port/" "$ENV_FILE"
    sed -i.bak "s/^BACKEND_PORT=.*/BACKEND_PORT=$backend_port/" "$ENV_FILE"
    if grep -q '^PORT=' "$ENV_FILE"; then
        sed -i.bak "s/^PORT=.*/PORT=$backend_port/" "$ENV_FILE"
    else
        printf "\nPORT=%s\n" "$backend_port" >> "$ENV_FILE"
    fi
    sed -i.bak "s/^PORT_SLOT=.*/PORT_SLOT=$slot/" "$ENV_FILE"
    sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
    sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$backend_port|" "$ENV_FILE"
    sed -i.bak "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
    sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
    sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
    if grep -q '^DATABASE_URL=' "$ENV_FILE"; then
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=file:../data/app.sqlite|" "$ENV_FILE"
    else
        printf "DATABASE_URL=file:../data/app.sqlite\n" >> "$ENV_FILE"
    fi
    rm -f "${ENV_FILE}.bak"
}

find_available_ports() {
    load_env
    local tail4=${TAIL4:-9082}

    for slot in 0 1 2 3 4 5; do
        read frontend_port backend_port <<< $(get_port_for_slot "$slot" "$tail4")
        echo "检查槽位 $slot: 前端=$frontend_port, 后端=$backend_port"

        local frontend_available=true
        local backend_available=true

        if ! is_port_available "$frontend_port"; then
            local pid
            pid=$(get_pid_for_port "$frontend_port")
            if verify_pid_belongs_to_project "$pid"; then
                echo "  前端端口 $frontend_port 被本项目占用 (PID=$pid)，可安全终止"
            else
                echo "  前端端口 $frontend_port 被其他项目占用 (PID=$pid)，跳过"
                frontend_available=false
            fi
        fi

        if ! is_port_available "$backend_port"; then
            local pid
            pid=$(get_pid_for_port "$backend_port")
            if verify_pid_belongs_to_project "$pid"; then
                echo "  后端端口 $backend_port 被本项目占用 (PID=$pid)，可安全终止"
            else
                echo "  后端端口 $backend_port 被其他项目占用 (PID=$pid)，跳过"
                backend_available=false
            fi
        fi

        if $frontend_available && $backend_available; then
            echo "使用槽位 $slot: FRONTEND_PORT=$frontend_port, BACKEND_PORT=$backend_port"
            update_env_ports "$frontend_port" "$backend_port" "$slot"
            return 0
        fi
    done

    echo "错误：所有端口槽位均被占用！"
    echo "请手动释放端口或检查其他项目进程。"
    return 1
}

check_ports() {
    load_env
    local frontend_port=${FRONTEND_PORT:-49082}
    local backend_port=${BACKEND_PORT:-59082}
    echo "=== 端口状态检查 ==="
    echo "项目目录: $PROJECT_DIR"
    echo "前端端口: $frontend_port"
    echo "后端端口: $backend_port"
    echo ""

    local frontend_pid
    local backend_pid
    frontend_pid=$(get_pid_for_port "$frontend_port")
    backend_pid=$(get_pid_for_port "$backend_port")

    if [ -n "$frontend_pid" ]; then
        echo "前端端口 $frontend_port 被占用 (PID=$frontend_pid)"
        ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "  进程信息不可用"
        if verify_pid_belongs_to_project "$frontend_pid"; then
            echo "  ✓ 归属本项目"
        else
            echo "  ✗ 归属其他项目，请勿终止"
        fi
    else
        echo "前端端口 $frontend_port 空闲"
    fi

    echo ""

    if [ -n "$backend_pid" ]; then
        echo "后端端口 $backend_port 被占用 (PID=$backend_pid)"
        ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "  进程信息不可用"
        if verify_pid_belongs_to_project "$backend_pid"; then
            echo "  ✓ 归属本项目"
        else
            echo "  ✗ 归属其他项目，请勿终止"
        fi
    else
        echo "后端端口 $backend_port 空闲"
    fi
}

kill_project_pid() {
    local port=$1
    local pid
    pid=$(get_pid_for_port "$port")

    if [ -z "$pid" ]; then
        echo "端口 $port 无进程"
        return 0
    fi

    local cwd
    local cmd
    cwd=$(pid_cwd "$pid")
    cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)

    case "$cwd" in
        "$PROJECT_DIR"/*)
            echo "终止本项目进程 PID=$pid (端口=$port)"
            echo "  cwd=$cwd"
            echo "  cmd=$cmd"
            kill "$pid"
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                echo "  强制终止..."
                kill -9 "$pid"
            fi
            ;;
        *)
            echo "跳过终止: 进程不属于本项目"
            echo "  cwd=$cwd"
            echo "  cmd=$cmd"
            return 1
            ;;
    esac
}

case "${1:-}" in
    check)
        check_ports
        ;;
    find)
        find_available_ports
        ;;
    kill-frontend)
        load_env
        kill_project_pid "$FRONTEND_PORT"
        ;;
    kill-backend)
        load_env
        kill_project_pid "$BACKEND_PORT"
        ;;
    kill-all)
        load_env
        kill_project_pid "$FRONTEND_PORT" || true
        kill_project_pid "$BACKEND_PORT" || true
        ;;
    *)
        echo "用法: $0 {check|find|kill-frontend|kill-backend|kill-all}"
        exit 1
        ;;
esac
