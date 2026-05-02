#!/bin/bash

echo "========================================"
echo "  保险投保理赔系统 - 初始化数据"
echo "========================================"

cd backend

echo ""
echo "正在初始化数据库..."
npm run seed

echo ""
echo "========================================"
echo "  数据初始化完成！"
echo "========================================"
echo ""
echo "默认登录账号："
echo "  管理员: admin / admin123"
echo "  代理人: agent1 / agent123"
echo "  核保员: underwriter1 / under123"
echo "  理赔员: claim1 / claim123"
echo "  投保人: user1 / user123"
echo ""
