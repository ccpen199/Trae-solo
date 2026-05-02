#!/bin/bash
"""
启动脚本 - 管理电商系统所有服务
"""

# 服务列表
SERVICES=(
    "gateway:8000"
    "user-service:8001"
    "product-service:8002"
    "order-service:8003"
    "payment-service:8004"
    "marketing-service:8005"
    "warehouse-service:8006"
)

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# 启动服务
start_service() {
    local service=$1
    local port=$2
    local service_dir="services/$service"
    
    echo -e "${YELLOW}Starting $service on port $port...${NC}"
    
    # 检查服务目录是否存在
    if [ ! -d "$service_dir" ]; then
        echo -e "${RED}Error: $service directory not found${NC}"
        return 1
    fi
    
    # 安装依赖
    if [ ! -f "$service_dir/requirements.txt" ]; then
        cp requirements.txt "$service_dir/"
    fi
    
    # 启动服务（后台运行）
    cd "$service_dir" && python3 main.py > ../${service}.log 2>&1 &
    
    # 记录PID
    echo $! > ../${service}.pid
    
    echo -e "${GREEN}$service started (PID: $(cat ../${service}.pid))${NC}"
    cd ../..
}

# 停止服务
stop_service() {
    local service=$1
    local pid_file="services/${service}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        echo -e "${YELLOW}Stopping $service (PID: $pid)...${NC}"
        
        # 停止进程
        kill $pid 2>/dev/null || true
        
        # 清理PID文件
        rm -f "$pid_file"
        
        echo -e "${GREEN}$service stopped${NC}"
    else
        echo -e "${YELLOW}$service is not running${NC}"
    fi
}

# 查看服务状态
status_service() {
    local service=$1
    local port=$2
    local pid_file="services/${service}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${GREEN}$service is running on port $port (PID: $pid)${NC}"
        else
            echo -e "${RED}$service PID file exists but process is not running${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}$service is not running${NC}"
    fi
}

# 主菜单
usage() {
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
}

# 检查参数
if [ $# -ne 1 ]; then
    usage
fi

case "$1" in
    start)
        echo -e "${GREEN}Starting all services...${NC}"
        for service_info in "${SERVICES[@]}"; do
            IFS=":" read -r service port <<< "$service_info"
            start_service "$service" "$port"
        done
        echo -e "${GREEN}All services started${NC}"
        ;;
    stop)
        echo -e "${GREEN}Stopping all services...${NC}"
        for service_info in "${SERVICES[@]}"; do
            IFS=":" read -r service port <<< "$service_info"
            stop_service "$service"
        done
        echo -e "${GREEN}All services stopped${NC}"
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        echo -e "${GREEN}Service status:${NC}"
        for service_info in "${SERVICES[@]}"; do
            IFS=":" read -r service port <<< "$service_info"
            status_service "$service" "$port"
        done
        ;;
    *)
        usage
        ;;
esac
