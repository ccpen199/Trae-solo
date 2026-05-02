#!/bin/bash

# 电子签约系统 - 状态检查脚本
# 端口配置: 后端19171, 前端29171

echo "========================================"
echo "   电子签约系统 - 状态检查"
echo "========================================"
echo ""

# 端口配置
BACKEND_PORT=19171
FRONTEND_PORT=29171

# 检查后端
echo "后端服务 (端口 $BACKEND_PORT):"
BACKEND_PID=$(lsof -ti:$BACKEND_PORT 2>/dev/null)
if [ -n "$BACKEND_PID" ]; then
    echo "  ✓ 运行中 (PID: $BACKEND_PID)"
    
    # 检查健康检查接口
    HEALTH_RESPONSE=$(curl -s http://localhost:$BACKEND_PORT/health 2>/dev/null)
    if [ -n "$HEALTH_RESPONSE" ]; then
        echo "  ✓ 健康检查通过"
        echo "  响应: $HEALTH_RESPONSE"
    else
        echo "  ✗ 健康检查失败"
    fi
else
    echo "  ✗ 未运行"
fi

echo ""

# 检查前端
echo "前端服务 (端口 $FRONTEND_PORT):"
FRONTEND_PID=$(lsof -ti:$FRONTEND_PORT 2>/dev/null)
if [ -n "$FRONTEND_PID" ]; then
    echo "  ✓ 运行中 (PID: $FRONTEND_PID)"
    
    # 检查前端页面
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo "  ✓ 页面可访问"
    else
        echo "  ✗ 页面访问失败"
    fi
else
    echo "  ✗ 未运行"
fi

echo ""
echo "========================================"
echo "   访问地址"
echo "========================================"
echo ""
echo "   前端页面: http://localhost:$FRONTEND_PORT"
echo "   后端API:  http://localhost:$BACKEND_PORT"
echo "   健康检查: http://localhost:$BACKEND_PORT/health"
echo ""
