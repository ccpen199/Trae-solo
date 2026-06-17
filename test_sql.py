#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('/Users/chen/Documents/trae_projects/local_projects/may-89218/backend/data/app.sqlite')
c = conn.cursor()

# 测试LIKE语法
print("=== 测试LIKE语法 ===")

# 方法1: 参数内包含%
c.execute("SELECT title FROM labor_orders WHERE title LIKE ? LIMIT 3", ("%装修%",))
print("方法1 (参数内%):", [r[0] for r in c.fetchall()])

# 方法2: SQL内拼接 || % || ? || %
c.execute("SELECT title FROM labor_orders WHERE title LIKE '%' || ? || '%' LIMIT 3", ("装修",))
print("方法2 (||拼接):", [r[0] for r in c.fetchall()])

# 测试找车订单家具搜索
c.execute("SELECT title, goods_type FROM delivery_orders WHERE goods_type LIKE '%' || ? || '%' LIMIT 3", ("家具",))
print("找车家具搜索:", [r[0] for r in c.fetchall()])

# 测试搬家朝阳区搜索
c.execute("SELECT title, from_address FROM moving_orders WHERE from_address LIKE '%' || ? || '%' LIMIT 3", ("朝阳",))
print("搬家朝阳搜索:", [r for r in c.fetchall()])

# 检查搬家订单所有字段
c.execute("PRAGMA table_info(moving_orders)")
print("\n=== 搬家订单字段 ===")
for r in c.fetchall():
    print(f"  {r[1]}: {r[2]}")

# 检查搬家订单实际数据
c.execute("SELECT id, title, from_address, to_address, service_packages FROM moving_orders LIMIT 3")
print("\n=== 搬家订单实际数据 ===")
for r in c.fetchall():
    print(f"  {r[0][:8]}... title={r[1][:30]} from={r[2][:20]} svc_pkg={r[4][:40] if r[4] else None}")

conn.close()
