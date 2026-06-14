#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

source "$ENV_FILE"

PROJECT_NUM="${PROJECT_NAME#may-}"
TAIL4=$(printf "%04d" "${PROJECT_NUM: -4}")

SLOT_BASES=(40000 41000 42000 43000 44000 45000)

update_env_port() {
    local key="$1"
    local value="$2"
    if grep -q "^${key}=" "$ENV_FILE"; then
        sed -i.bak "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        rm -f "${ENV_FILE}.bak"
    else
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

update_env_urls() {
    local fe_port="$1"
    local be_port="$2"
    
    update_env_port "FRONTEND_URL" "http://127.0.0.1:${fe_port}"
    update_env_port "BACKEND_URL" "http://127.0.0.1:${be_port}"
    update_env_port "APP_URL" "http://127.0.0.1:${fe_port}"
    update_env_port "API_BASE_URL" "http://127.0.0.1:${be_port}/api"
    update_env_port "VITE_API_BASE_URL" "http://127.0.0.1:${be_port}/api"
    update_env_port "VITE_API_URL" "http://127.0.0.1:${be_port}/api"
    update_env_port "CORS_ORIGIN" "http://127.0.0.1:${fe_port}"
    update_env_port "CORS_ORIGINS" "http://127.0.0.1:${fe_port},http://localhost:${fe_port}"
}

is_port_available() {
    local port="$1"
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    fi
    return 0
}

get_port_owner() {
    local port="$1"
    local pid
    pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t | head -n1)
    if [ -n "$pid" ]; then
        local cwd cmd
        cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "unknown")
        cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "unknown")
        echo "PID=$pid CWD=$cwd CMD=$cmd"
    fi
}

is_our_project_process() {
    local pid="$1"
    local cwd
    cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    case "$cwd" in
        "$PROJECT_DIR"/*) return 0 ;;
        *) return 1 ;;
    esac
}

echo "=== 端口初始化 (项目: $PROJECT_NAME, tail4: $TAIL4) ==="
echo "项目目录: $PROJECT_DIR"

CURRENT_FE_PORT=$FRONTEND_PORT
CURRENT_BE_PORT=$BACKEND_PORT

FE_AVAILABLE=true
BE_AVAILABLE=true

if ! is_port_available "$CURRENT_FE_PORT"; then
    FE_AVAILABLE=false
    OWNER=$(get_port_owner "$CURRENT_FE_PORT")
    echo "⚠️  前端端口 $CURRENT_FE_PORT 已被占用: $OWNER"
fi

if ! is_port_available "$CURRENT_BE_PORT"; then
    BE_AVAILABLE=false
    OWNER=$(get_port_owner "$CURRENT_BE_PORT")
    echo "⚠️  后端端口 $CURRENT_BE_PORT 已被占用: $OWNER"
fi

if $FE_AVAILABLE && $BE_AVAILABLE; then
    echo "✅ 默认端口可用: FRONTEND=$CURRENT_FE_PORT, BACKEND=$CURRENT_BE_PORT"
    exit 0
fi

echo ""
echo "🔄 尝试切换备用槽位..."

SLOT_FOUND=false
for i in "${!SLOT_BASES[@]}"; do
    SLOT_FE=$(( ${SLOT_BASES[$i]} + TAIL4 ))
    SLOT_BE=$(( ${SLOT_BASES[$i]} + 10000 + TAIL4 ))
    
    if [ "$SLOT_FE" -eq "$CURRENT_FE_PORT" ]; then
        continue
    fi
    
    echo "  检查槽位 $((i+1)): FRONTEND=$SLOT_FE, BACKEND=$SLOT_BE"
    
    if is_port_available "$SLOT_FE" && is_port_available "$SLOT_BE"; then
        echo "✅ 找到可用槽位 $((i+1)): FRONTEND=$SLOT_FE, BACKEND=$SLOT_BE"
        
        update_env_port "FRONTEND_PORT" "$SLOT_FE"
        update_env_port "BACKEND_PORT" "$SLOT_BE"
        update_env_port "APP_PORT" "$SLOT_FE"
        update_env_urls "$SLOT_FE" "$SLOT_BE"
        
        echo "✅ 已更新 .env 配置"
        source "$ENV_FILE"
        SLOT_FOUND=true
        break
    else
        FE_OWNER=""
        BE_OWNER=""
        if ! is_port_available "$SLOT_FE"; then
            FE_OWNER="  前端端口 $SLOT_FE 被占用: $(get_port_owner "$SLOT_FE")"
        fi
        if ! is_port_available "$SLOT_BE"; then
            BE_OWNER="  后端端口 $SLOT_BE 被占用: $(get_port_owner "$SLOT_BE")"
        fi
        [ -n "$FE_OWNER" ] && echo "$FE_OWNER"
        [ -n "$BE_OWNER" ] && echo "$BE_OWNER"
    fi
done

if ! $SLOT_FOUND; then
    echo ""
    echo "❌ 所有槽位端口均被占用！"
    echo ""
    echo "端口占用详情:"
    for i in "${!SLOT_BASES[@]}"; do
        SLOT_FE=$(( ${SLOT_BASES[$i]} + TAIL4 ))
        SLOT_BE=$(( ${SLOT_BASES[$i]} + 10000 + TAIL4 ))
        echo "  槽位 $((i+1)):"
        if ! is_port_available "$SLOT_FE"; then
            echo "    FRONTEND=$SLOT_FE: $(get_port_owner "$SLOT_FE")"
        fi
        if ! is_port_available "$SLOT_BE"; then
            echo "    BACKEND=$SLOT_BE: $(get_port_owner "$SLOT_BE")"
        fi
    done
    echo ""
    echo "处理建议:"
    echo "1. 手动释放上述占用端口的进程（确认归属后）"
    echo "2. 等待占用端口的项目关闭后重试"
    echo "3. 修改端口公式使用其他基数值"
    exit 1
fi

echo ""
echo "=== 端口初始化完成 ==="
echo "FRONTEND_PORT=$FRONTEND_PORT"
echo "BACKEND_PORT=$BACKEND_PORT"
echo "FRONTEND_URL=$FRONTEND_URL"
echo "BACKEND_URL=$BACKEND_URL"
