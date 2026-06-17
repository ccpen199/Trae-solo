#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('/Users/chen/Documents/trae_projects/local_projects/may-89218/backend/data/app.sqlite')
c = conn.cursor()

print("=== 1. 各订单GPS点数明细 ===")
for t in ['labor', 'delivery', 'moving']:
    c.execute(f"""
        SELECT o.id, o.status, COUNT(g.id) as gps_count
        FROM {t}_orders o
        LEFT JOIN gps_tracks g ON o.id = g.order_id AND g.order_type = '{t}'
        WHERE o.status IN ('in_progress', 'completed', 'accepted')
        GROUP BY o.id, o.status
        ORDER BY gps_count DESC
    """)
    rows = c.fetchall()
    print(f"\n  {t} ({len(rows)}个活跃订单):")
    for r in rows:
        mark = "✅" if r[2] >= 5 else "❌"
        print(f"    {mark} {r[0][:8]}... status={r[1]} gps={r[2]}")

print("\n=== 2. 各pending用工订单bids数 ===")
c.execute("""
    SELECT o.id, o.status, o.title, COUNT(b.id) as bids_count
    FROM labor_orders o
    LEFT JOIN labor_order_bids b ON o.id = b.order_id
    WHERE o.status = 'pending'
    GROUP BY o.id, o.status, o.title
""")
for r in c.fetchall():
    mark = "✅" if r[3] >= 2 else "❌"
    print(f"    {mark} {r[0][:8]}... bids={r[3]} title={r[2][:30]}")

print("\n=== 3. 各订单确认记录 ===")
for t in ['labor', 'delivery', 'moving']:
    c.execute(f"""
        SELECT o.id, o.status, COUNT(c.id) as conf_count
        FROM {t}_orders o
        LEFT JOIN order_confirmations c ON o.id = c.order_id AND c.order_type = '{t}'
        WHERE o.status IN ('in_progress', 'completed', 'accepted')
        GROUP BY o.id, o.status
    """)
    rows = c.fetchall()
    print(f"\n  {t}:")
    for r in rows:
        mark = "✅" if r[2] >= 1 else "❌"
        print(f"    {mark} {r[0][:8]}... status={r[1]} conf={r[2]}")

conn.close()
