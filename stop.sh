#!/bin/bash

# ERP系统停止脚本

echo "========================================"
echo "        ERP System 停止脚本"
echo "========================================"
echo ""

# 停止后端服务
echo "停止后端服务..."
pkill -f "node backend/dist" 2>/dev/null || true
echo "  后端服务已停止"

# 停止前端服务
echo "停止前端服务..."
pkill -f "vite" 2>/dev/null || true
echo "  前端服务已停止"

echo ""
echo "========================================"
echo "            所有服务已停止"
echo "========================================"
echo ""
