#!/bin/bash

echo "========================================="
echo "  外卖聚合接单系统 - 端口配置工具"
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

show_help() {
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --list              显示当前端口配置"
    echo "  --set-backend <端口> 设置后端端口"
    echo "  --set-frontend <端口> 设置前端端口"
    echo "  --set-mysql <端口>   设置MySQL端口"
    echo "  --set-redis <端口>   设置Redis端口"
    echo "  --set-rabbitmq <端口> 设置RabbitMQ端口"
    echo "  --reset             重置为默认配置"
    echo "  --help              显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --set-backend 8080 --set-frontend 3000"
    echo "  $0 --list"
}

list_config() {
    echo ""
    echo "当前端口配置:"
    echo "-----------------------------------------"
    
    if [ -f "$ENV_FILE" ]; then
        while IFS='=' read -r key value; do
            case "$key" in
                SERVER_PORT) echo "  后端服务: $value" ;;
                FRONTEND_PORT) echo "  前端服务: $value" ;;
                MYSQL_PORT) echo "  MySQL: $value" ;;
                REDIS_PORT) echo "  Redis: $value" ;;
                RABBITMQ_PORT) echo "  RabbitMQ: $value" ;;
            esac
        done < "$ENV_FILE"
    else
        echo "  (使用默认配置)"
        echo "  后端服务: 8362"
        echo "  前端服务: 9471"
        echo "  MySQL: 3306"
        echo "  Redis: 6379"
        echo "  RabbitMQ: 5672"
    fi
    
    echo "-----------------------------------------"
    echo ""
    echo "注意: 修改端口后需要同步更新:"
    echo "  1. CORS 允许的源地址"
    echo "  2. 回调地址 (CALLBACK_BASE_URL)"
    echo "  3. 前端代理配置 (API_BASE_URL)"
}

update_env() {
    local key=$1
    local value=$2
    
    if [ -f "$ENV_FILE" ]; then
        if grep -q "^${key}=" "$ENV_FILE"; then
            sed -i.bak "s/^${key}=.*/${key}=${value}/" "$ENV_FILE"
            rm -f "${ENV_FILE}.bak"
        else
            echo "${key}=${value}" >> "$ENV_FILE"
        fi
    else
        echo "${key}=${value}" > "$ENV_FILE"
    fi
    
    echo "✓ 已设置 ${key}=${value}"
}

update_cors_and_callback() {
    local backend_port=$1
    local frontend_port=$2
    
    if [ -f "$ENV_FILE" ]; then
        local frontend_url="http://localhost:${frontend_port}"
        local callback_url="http://localhost:${backend_port}"
        local cors_origins="http://localhost:${frontend_port},http://localhost:${backend_port}"
        
        update_env "FRONTEND_URL" "$frontend_url"
        update_env "CALLBACK_BASE_URL" "$callback_url"
        update_env "CORS_ALLOWED_ORIGINS" "$cors_origins"
        
        echo ""
        echo "✓ 已同步更新相关配置:"
        echo "  - FRONTEND_URL: $frontend_url"
        echo "  - CALLBACK_BASE_URL: $callback_url"
        echo "  - CORS_ALLOWED_ORIGINS: $cors_origins"
    fi
}

reset_config() {
    echo ""
    echo "重置为默认配置..."
    
    cat > "$ENV_FILE" << 'EOF'
SERVER_PORT=8362
FRONTEND_PORT=9471

MYSQL_ROOT_PASSWORD=Root@123456
MYSQL_DATABASE=food_delivery
MYSQL_USERNAME=delivery_admin
MYSQL_PASSWORD=Delivery@2024
MYSQL_PORT=3306

REDIS_PORT=6379
REDIS_PASSWORD=

RABBITMQ_PORT=5672
RABBITMQ_MGMT_PORT=15672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

JWT_SECRET=FoodDeliveryOrderAggregationSystemJwtSecretKey2024VeryLongSecret123456

FRONTEND_URL=http://localhost:9471
CALLBACK_BASE_URL=http://localhost:8362
CORS_ALLOWED_ORIGINS=http://localhost:9471,http://localhost:8362

MEITUAN_API_URL=https://waimai.meituan.com/openapi
ELEME_API_URL=https://open-api.shop.ele.me
EOF

    echo "✓ 配置已重置为默认值"
    list_config
}

if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

backend_port=""
frontend_port=""

while [ $# -gt 0 ]; do
    case "$1" in
        --list)
            list_config
            exit 0
            ;;
        --set-backend)
            if [ -z "$2" ]; then
                echo "错误: 请指定后端端口号"
                exit 1
            fi
            backend_port="$2"
            update_env "SERVER_PORT" "$backend_port"
            shift 2
            ;;
        --set-frontend)
            if [ -z "$2" ]; then
                echo "错误: 请指定前端端口号"
                exit 1
            fi
            frontend_port="$2"
            update_env "FRONTEND_PORT" "$frontend_port"
            shift 2
            ;;
        --set-mysql)
            if [ -z "$2" ]; then
                echo "错误: 请指定MySQL端口号"
                exit 1
            fi
            update_env "MYSQL_PORT" "$2"
            shift 2
            ;;
        --set-redis)
            if [ -z "$2" ]; then
                echo "错误: 请指定Redis端口号"
                exit 1
            fi
            update_env "REDIS_PORT" "$2"
            shift 2
            ;;
        --set-rabbitmq)
            if [ -z "$2" ]; then
                echo "错误: 请指定RabbitMQ端口号"
                exit 1
            fi
            update_env "RABBITMQ_PORT" "$2"
            shift 2
            ;;
        --reset)
            reset_config
            exit 0
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

if [ -n "$backend_port" ] || [ -n "$frontend_port" ]; then
    if [ -z "$backend_port" ]; then
        backend_port="8362"
        if [ -f "$ENV_FILE" ]; then
            while IFS='=' read -r key value; do
                if [ "$key" = "SERVER_PORT" ]; then
                    backend_port="$value"
                fi
            done < "$ENV_FILE"
        fi
    fi
    
    if [ -z "$frontend_port" ]; then
        frontend_port="9471"
        if [ -f "$ENV_FILE" ]; then
            while IFS='=' read -r key value; do
                if [ "$key" = "FRONTEND_PORT" ]; then
                    frontend_port="$value"
                fi
            done < "$ENV_FILE"
        fi
    fi
    
    update_cors_and_callback "$backend_port" "$frontend_port"
fi

echo ""
echo "✓ 配置更新完成"
list_config
