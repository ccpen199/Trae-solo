#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
FRONTEND_LOG="$SCRIPT_DIR/frontend.log"
BACKEND_LOG="$SCRIPT_DIR/backend.log"
FRONTEND_PID_FILE="$SCRIPT_DIR/frontend.pid"
BACKEND_PID_FILE="$SCRIPT_DIR/backend.pid"

get_pid_cwd() {
    local pid=$1
    if [ -z "$pid" ]; then return 1; fi
    if ! kill -0 "$pid" 2>/dev/null; then return 1; fi
    local cwd
    cwd=$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//')
    if [ -z "$cwd" ]; then return 1; fi
    echo "$cwd"
}

is_current_project_pid() {
    local pid=$1
    local cwd
    cwd=$(get_pid_cwd "$pid") || return 1
    if [ "$cwd" = "$SCRIPT_DIR" ] || [[ "$cwd" == "$SCRIPT_DIR/"* ]]; then
        return 0
    fi
    return 1
}

safe_kill_pid() {
    local pid=$1
    local desc=$2
    if [ -z "$pid" ]; then return 0; fi
    if ! kill -0 "$pid" 2>/dev/null; then
        echo "[INFO] $desc PID $pid 不存在或已退出"
        return 0
    fi
    if is_current_project_pid "$pid"; then
        echo "[INFO] 终止当前项目的$desc进程 PID=$pid"
        kill "$pid" 2>/dev/null || true
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    else
        echo "[WARN] PID=$pid 不属于当前项目，不执行kill，改用备用端口"
        return 1
    fi
    return 0
}

load_env() {
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi
}

write_env() {
    local key=$1
    local value=$2
    if grep -q "^${key}=" "$ENV_FILE"; then
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
    export "${key}=${value}"
}

check_port() {
    local port=$1
    lsof -ti tcp:"$port" 2>/dev/null
}

find_available_ports() {
    load_env
    local tail4=${TAIL4:-1266}
    local slots=(0 1 2 3 4 5)
    local found_slot=-1
    local f_port b_port
    local f_pid b_pid
    local conflict_info=""

    for slot in "${slots[@]}"; do
        f_port=$((40000 + slot * 1000 + tail4))
        b_port=$((50000 + slot * 1000 + tail4))
        f_pid=$(check_port "$f_port")
        b_pid=$(check_port "$b_port")
        if [ -z "$f_pid" ] && [ -z "$b_pid" ]; then
            found_slot=$slot
            break
        else
            if [ -n "$f_pid" ]; then
                conflict_info+="端口 $f_port 被 PID=$f_pid 占用; "
            fi
            if [ -n "$b_pid" ]; then
                conflict_info+="端口 $b_port 被 PID=$b_pid 占用; "
            fi
        fi
    done

    if [ "$found_slot" -eq -1 ]; then
        echo "[ERROR] 所有端口槽位(0-5)均被占用！"
        echo "[ERROR] 占用情况: $conflict_info"
        echo "[ERROR] 处理建议："
        echo "  1. 确认上述PID是否为旧进程，可以手动kill：kill <PID>"
        echo "  2. 等待上述项目完成后释放端口"
        echo "  3. 修改PORT_SLOT使用其他槽位（需同时修改.env和vite.config.js公式）"
        exit 1
    fi

    f_port=$((40000 + found_slot * 1000 + tail4))
    b_port=$((50000 + found_slot * 1000 + tail4))
    echo "[INFO] 使用端口槽位 $found_slot: FRONTEND=$f_port, BACKEND=$b_port"

    write_env "PORT_SLOT" "$found_slot"
    write_env "FRONTEND_PORT" "$f_port"
    write_env "BACKEND_PORT" "$b_port"
    write_env "API_BASE_URL" "http://127.0.0.1:$b_port"
    write_env "CORS_ORIGIN" "http://127.0.0.1:$f_port"

    load_env
}

stop_processes() {
    load_env

    if [ -f "$FRONTEND_PID_FILE" ]; then
        f_pid=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
        if [ -n "$f_pid" ]; then
            if safe_kill_pid "$f_pid" "前端"; then
                rm -f "$FRONTEND_PID_FILE"
            fi
        fi
    fi

    if [ -f "$BACKEND_PID_FILE" ]; then
        b_pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null)
        if [ -n "$b_pid" ]; then
            if safe_kill_pid "$b_pid" "后端"; then
                rm -f "$BACKEND_PID_FILE"
            fi
        fi
    fi

    sleep 1
}

verify_process() {
    local pid=$1
    local port=$2
    local name=$3
    local url=$4

    sleep 5

    if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
        echo "[ERROR] $name 进程 PID=$pid 不存在"
        return 1
    fi

    local p_stat
    p_stat=$(ps -o stat= -p "$pid" 2>/dev/null | tr -d ' ')
    if [ -z "$p_stat" ]; then
        echo "[ERROR] $name 进程 PID=$pid 无法获取状态"
        return 1
    fi
    if [[ "$p_stat" == *T* ]] || [[ "$p_stat" == *Z* ]]; then
        echo "[ERROR] $name 进程 PID=$pid 处于异常状态 STAT=$p_stat"
        return 1
    fi

    local lsof_out
    lsof_out=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null)
    if [ -z "$lsof_out" ]; then
        echo "[ERROR] $name 端口 $port 无监听"
        return 1
    fi

    local http_code
    http_code=$(curl --max-time 5 -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$http_code" != "200" ] && [ "$http_code" != "301" ] && [ "$http_code" != "302" ] && [ "$http_code" != "304" ]; then
        echo "[ERROR] $name HTTP 访问失败 URL=$url CODE=$http_code"
        return 1
    fi

    echo "[OK] $name 验证通过: PID=$pid PORT=$port STAT=$p_stat HTTP=$http_code"
    return 0
}

start_backend() {
    load_env
    echo "[INFO] 启动后端服务..."

    cd "$SCRIPT_DIR/backend"

    if [ ! -d "node_modules" ]; then
        echo "[INFO] 安装后端依赖..."
        npm install --no-audit --no-fund >> "$BACKEND_LOG" 2>&1
    fi

    if [ ! -f "$SCRIPT_DIR/backend/data/app.sqlite" ]; then
        echo "[INFO] 初始化数据库..."
        npm run init-db >> "$BACKEND_LOG" 2>&1
    fi

    nohup npm run dev >> "$BACKEND_LOG" 2>&1 &
    local b_pid=$!
    echo $b_pid > "$BACKEND_PID_FILE"
    echo "[INFO] 后端进程已启动 PID=$b_pid，日志: $BACKEND_LOG"

    if ! verify_process "$b_pid" "$BACKEND_PORT" "后端" "http://127.0.0.1:$BACKEND_PORT/api/health"; then
        echo "[ERROR] 后端启动失败，查看日志: tail -n 50 $BACKEND_LOG"
        tail -n 50 "$BACKEND_LOG"
        exit 1
    fi
}

start_frontend() {
    load_env
    echo "[INFO] 启动前端服务..."

    cd "$SCRIPT_DIR/frontend"

    if [ ! -d "node_modules" ]; then
        echo "[INFO] 安装前端依赖..."
        npm install --no-audit --no-fund >> "$FRONTEND_LOG" 2>&1
    fi

    export VITE_PORT="$FRONTEND_PORT"
    export VITE_API_BASE_URL="http://127.0.0.1:$BACKEND_PORT"

    nohup npm run dev >> "$FRONTEND_LOG" 2>&1 &
    local f_pid=$!
    echo $f_pid > "$FRONTEND_PID_FILE"
    echo "[INFO] 前端进程已启动 PID=$f_pid，日志: $FRONTEND_LOG"

    if ! verify_process "$f_pid" "$FRONTEND_PORT" "前端" "http://127.0.0.1:$FRONTEND_PORT/"; then
        echo "[ERROR] 前端启动失败，查看日志: tail -n 50 $FRONTEND_LOG"
        tail -n 50 "$FRONTEND_LOG"
        exit 1
    fi
}

test_business_flow() {
    load_env
    echo "[INFO] 开始核心业务链路测试..."

    local base_url="http://127.0.0.1:$BACKEND_PORT/api"
    local token=""
    local appointment_id=""

    echo "[TEST 1/6] 登录API测试 (owner1/123456)"
    local login_res
    login_res=$(curl --max-time 5 -s -X POST "$base_url/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"owner1","password":"123456"}')
    token=$(echo "$login_res" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$token" ]; then
        echo "[FAIL] 登录失败，响应: $login_res"
        return 1
    fi
    echo "[OK] 登录成功，获取到token"

    echo "[TEST 2/6] 获取宠物列表"
    local pets_res
    pets_res=$(curl --max-time 5 -s -H "Authorization: Bearer $token" "$base_url/pets")
    if ! echo "$pets_res" | grep -q '"id"'; then
        echo "[FAIL] 获取宠物列表失败，响应: $pets_res"
        return 1
    fi
    echo "[OK] 宠物列表获取成功"

    echo "[TEST 3/6] 获取服务项目列表"
    local services_res
    services_res=$(curl --max-time 5 -s -H "Authorization: Bearer $token" "$base_url/services")
    if ! echo "$services_res" | grep -q '"id"'; then
        echo "[FAIL] 获取服务列表失败，响应: $services_res"
        return 1
    fi
    echo "[OK] 服务列表获取成功"

    echo "[TEST 4/6] 预约业务校验 (疫苗、体型、攻击性、容量)"
    local validate_res
    validate_res=$(curl --max-time 5 -s -X POST "$base_url/appointments/validate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{"petId":1,"serviceId":1,"slotId":1}')
    if ! echo "$validate_res" | grep -q '"valid"'; then
        echo "[FAIL] 预约校验失败，响应: $validate_res"
        return 1
    fi
    echo "[OK] 业务校验返回结果: $(echo "$validate_res" | grep -o '"valid":[a-z]*')"

    echo "[TEST 5/6] 获取预约列表"
    local appts_res
    appts_res=$(curl --max-time 5 -s -H "Authorization: Bearer $token" "$base_url/appointments")
    if ! echo "$appts_res" | grep -q '\[\|\]'; then
        echo "[FAIL] 获取预约列表失败，响应: $appts_res"
        return 1
    fi
    echo "[OK] 预约列表获取成功"

    echo "[TEST 6/6] 运营统计总览"
    local stats_res
    stats_res=$(curl --max-time 5 -s -H "Authorization: Bearer $token" "$base_url/stats/overview")
    if ! echo "$stats_res" | grep -q '"totalAppointments"'; then
        echo "[FAIL] 获取统计数据失败，响应: $stats_res"
        return 1
    fi
    echo "[OK] 运营统计获取成功"

    echo ""
    echo "[INFO] ✅ 所有核心业务链路测试通过！"
    return 0
}

main() {
    echo "========================================"
    echo "  宠物服务预约平台 - 启动脚本"
    echo "  项目目录: $SCRIPT_DIR"
    echo "========================================"
    echo ""

    if [ ! -f "$ENV_FILE" ]; then
        echo "[INFO] 创建环境配置文件..."
        cat > "$ENV_FILE" << 'EOF'
PROJECT_DIR=m4v2-12664
TAIL4=1266
PORT_SLOT=0

DB_PATH=./data/app.sqlite
JWT_SECRET=pet_platform_secret_key_2024
NODE_ENV=development
EOF
    fi

    stop_processes
    find_available_ports
    start_backend
    start_frontend
    test_business_flow

    echo ""
    echo "========================================"
    echo "  ✅ 系统启动成功！"
    echo "========================================"
    echo ""
    echo "  访问地址: http://127.0.0.1:$FRONTEND_PORT"
    echo "  后端API:  http://127.0.0.1:$BACKEND_PORT/api"
    echo ""
    echo "  前端日志: tail -f $FRONTEND_LOG"
    echo "  后端日志: tail -f $BACKEND_LOG"
    echo ""
    echo "  前端PID: $(cat "$FRONTEND_PID_FILE")"
    echo "  后端PID: $(cat "$BACKEND_PID_FILE")"
    echo ""
    echo "  演示账号:"
    echo "    宠物主人: owner1 / 123456"
    echo "    门店管理: store1 / 123456"
    echo "    服务人员: staff1 / 123456"
    echo "    司机    : driver1 / 123456"
    echo "    客服    : cs1 / 123456"
    echo "    管理员  : admin / 123456"
    echo ""
    echo "  关闭服务: kill $(cat "$FRONTEND_PID_FILE") $(cat "$BACKEND_PID_FILE")"
    echo "========================================"
}

main "$@"
