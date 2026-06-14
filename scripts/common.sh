#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

load_env() {
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    else
        echo "❌ .env 文件不存在: $ENV_FILE"
        exit 1
    fi
}

is_our_project_process() {
    local pid="$1"
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

get_pid_by_port() {
    local port="$1"
    lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1
}

get_process_info() {
    local pid="$1"
    if [ -z "$pid" ]; then
        echo "N/A"
        return
    fi
    ps -p "$pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "PID=$pid (not found)"
}

is_process_alive() {
    local pid="$1"
    if [ -z "$pid" ]; then
        return 1
    fi
    local stat
    stat=$(ps -o stat= -p "$pid" 2>/dev/null)
    if [ -z "$stat" ]; then
        return 1
    fi
    case "$stat" in
        *T*|*Z*) return 1 ;;
        *) return 0 ;;
    esac
}

is_port_listening() {
    local port="$1"
    lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1
}

kill_our_process() {
    local pid="$1"
    local port="$2"
    local name="$3"
    
    if [ -z "$pid" ]; then
        echo "ℹ️  $name: 没有运行中的进程"
        return 0
    fi
    
    if ! is_our_project_process "$pid"; then
        local cwd cmd
        cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "unknown")
        cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "unknown")
        echo "⚠️  $name: 端口 $port 的进程 $pid 不属于当前项目，跳过"
        echo "   cwd=$cwd"
        echo "   cmd=$cmd"
        return 1
    fi
    
    local cwd cmd
    cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    echo "🔪  终止 $name 进程 $pid"
    echo "   cwd=$cwd"
    echo "   cmd=$cmd"
    
    kill "$pid" 2>/dev/null
    
    local count=0
    while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
        sleep 0.5
        count=$((count + 1))
    done
    
    if kill -0 "$pid" 2>/dev/null; then
        echo "⚠️  强制终止进程 $pid"
        kill -9 "$pid" 2>/dev/null
    fi
    
    echo "✅ $name 已停止"
    return 0
}

check_url() {
    local url="$1"
    local name="$2"
    local max_time="${3:-5}"
    
    local response
    response=$(curl -sS --max-time "$max_time" -o /dev/null -w "%{http_code}" "$url" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo "❌ $name: 连接失败 ($url)"
        echo "   curl 退出码: $exit_code"
        return 1
    fi
    
    if [ "$response" -ge 200 ] && [ "$response" -lt 400 ]; then
        echo "✅ $name: HTTP $response ($url)"
        return 0
    else
        echo "❌ $name: HTTP $response ($url)"
        return 1
    fi
}

wait_for_port() {
    local port="$1"
    local name="$2"
    local timeout="${3:-30}"
    
    local start_time
    start_time=$(date +%s)
    
    while ! is_port_listening "$port"; do
        local current_time
        current_time=$(date +%s)
        if [ $((current_time - start_time)) -ge "$timeout" ]; then
            echo "❌ $name: 端口 $port 超时未启动"
            return 1
        fi
        sleep 1
    done
    
    echo "✅ $name: 端口 $port 已监听"
    return 0
}

wait_for_process() {
    local pid="$1"
    local name="$2"
    local timeout="${3:-10}"
    
    local start_time
    start_time=$(date +%s)
    
    while ! is_process_alive "$pid"; do
        local current_time
        current_time=$(date +%s)
        if [ $((current_time - start_time)) -ge "$timeout" ]; then
            echo "❌ $name: 进程 $pid 启动失败"
            return 1
        fi
        sleep 0.5
    done
    
    local stat
    stat=$(ps -o stat= -p "$pid" 2>/dev/null)
    echo "✅ $name: 进程 $pid 运行中 (stat=$stat)"
    return 0
}
