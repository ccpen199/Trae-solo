#!/bin/bash

echo "========================================"
echo "  保险投保理赔系统 - 安装依赖"
echo "========================================"

echo ""
echo "正在安装后端依赖..."
cd backend
npm install

echo ""
echo "正在安装前端依赖..."
cd ../frontend
npm install

echo ""
echo "========================================"
echo "  依赖安装完成！"
echo "========================================"
echo ""
echo "下一步操作："
echo "  1. 初始化数据：./scripts/seed.sh"
echo "  2. 启动服务：./scripts/start.sh"
echo ""
