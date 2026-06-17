#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('/Users/chen/Documents/trae_projects/local_projects/may-89218/backend/data/app.sqlite')
c = conn.cursor()

# 检查用工订单
c.execute('SELECT id, title, description, status, category FROM labor_orders LIMIT 5')
print('=== 用工订单 ===')
for r in c.fetchall():
    print(f'  {r[0][:8]}... {r[1][:40]} cat={r[4]} status={r[3]}')

# 检查找车订单
c.execute('SELECT id, title, description, goods_type, pickup_address FROM delivery_orders LIMIT 5')
print('=== 找车订单 ===')
for r in c.fetchall():
    print(f'  {r[0][:8]}... {r[1][:40]} goods={r[3]} pickup={r[4][:15]}')

# 检查搬家订单
c.execute('SELECT id, title, from_address, to_address, package_type FROM moving_orders LIMIT 5')
print('=== 搬家订单 ===')
for r in c.fetchall():
    print(f'  {r[0][:8]}... {r[1][:20]} from={r[2][:15]} to={r[3][:15]} pkg={r[4]}')

# 检查GPS轨迹
c.execute('SELECT COUNT(*) FROM gps_tracks')
print(f'=== GPS轨迹总数: {c.fetchone()[0]} ===')
c.execute('SELECT order_id, order_type, COUNT(*) FROM gps_tracks GROUP BY order_id, order_type LIMIT 5')
print('=== GPS轨迹按订单 ===')
for r in c.fetchall():
    print(f'  {r[0][:8]}... type={r[1]} count={r[2]}')

# 检查三方确认
c.execute('SELECT COUNT(*) FROM order_confirmations')
print(f'=== 三方确认总数: {c.fetchone()[0]} ===')
if c.fetchone():
    c.execute('SELECT * FROM order_confirmations LIMIT 3')
    cols = [d[0] for d in c.description]
    for r in c.fetchall():
        print(f'  {dict(zip(cols, r))}')

# 检查labor_order_bids
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='labor_order_bids'")
print(f'=== labor_order_bids表存在: {bool(c.fetchone())} ===')
if c.fetchone():
    c.execute('SELECT COUNT(*) FROM labor_order_bids')
    print(f'=== labor_order_bids总数: {c.fetchone()[0]} ===')

# 检查delivery_bids
c.execute('SELECT COUNT(*) FROM delivery_bids')
print(f'=== delivery_bids总数: {c.fetchone()[0]} ===')
c.execute('SELECT * FROM delivery_bids LIMIT 3')
cols = [d[0] for d in c.description]
for r in c.fetchall():
    print(f'  {dict(zip(cols, r))}')

conn.close()
