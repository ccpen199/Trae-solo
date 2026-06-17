#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('/Users/chen/Documents/trae_projects/local_projects/may-89218/backend/data/app.sqlite')
c = conn.cursor()

print("=== 1. 检查订单状态分布 ===")
for t in ['labor', 'delivery', 'moving']:
    c.execute(f'SELECT status, COUNT(*) FROM {t}_orders GROUP BY status')
    print(f"  {t}: {[(r[0], r[1]) for r in c.fetchall()]}")

print("\n=== 2. 检查GPS总数和按状态 ===")
c.execute('SELECT COUNT(*) FROM gps_tracks')
print(f"  总数: {c.fetchone()[0]}")
c.execute('SELECT order_type, COUNT(*) FROM gps_tracks GROUP BY order_type')
print(f"  按类型: {[(r[0], r[1]) for r in c.fetchall()]}")

print("\n=== 3. 检查三方确认总数 ===")
c.execute('SELECT COUNT(*) FROM order_confirmations')
print(f"  总数: {c.fetchone()[0]}")
c.execute('SELECT order_type, COUNT(*) FROM order_confirmations GROUP BY order_type')
print(f"  按类型: {[(r[0], r[1]) for r in c.fetchall()]}")

print("\n=== 4. 检查labor_order_bids ===")
c.execute('SELECT COUNT(*) FROM labor_order_bids')
print(f"  总数: {c.fetchone()[0]}")
if c.fetchone():
    c.execute('SELECT status, COUNT(*) FROM labor_order_bids GROUP BY status')
    print(f"  按状态: {[(r[0], r[1]) for r in c.fetchall()]}")

print("\n=== 5. 找一条in_progress的用工订单看GPS ===")
c.execute("SELECT id, status, worker_id FROM labor_orders WHERE status = 'in_progress' LIMIT 1")
row = c.fetchone()
if row:
    oid = row[0]
    print(f"  订单ID: {oid}, status={row[1]}, worker_id={row[2]}")
    c.execute("SELECT COUNT(*) FROM gps_tracks WHERE order_id = ? AND order_type = 'labor'", (oid,))
    print(f"  GPS点数: {c.fetchone()[0]}")
    c.execute("SELECT COUNT(*) FROM order_confirmations WHERE order_id = ? AND order_type = 'labor'", (oid,))
    print(f"  确认记录: {c.fetchone()[0]}")
    c.execute("SELECT COUNT(*) FROM labor_order_bids WHERE order_id = ?", (oid,))
    print(f"  接单记录: {c.fetchone()[0]}")

print("\n=== 6. 检查delivery_bids ===")
c.execute('SELECT COUNT(*) FROM delivery_bids')
print(f"  delivery_bids总数: {c.fetchone()[0]}")

conn.close()
