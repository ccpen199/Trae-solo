#!/usr/bin/env python3
import sqlite3, json

DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

print("=" * 70)
print("📋 订单表结构")
print("=" * 70)
c.execute("PRAGMA table_info(orders)")
for col in c.fetchall():
    print(f"  {col[1]:25s} {col[2]:15s} {'PK' if col[5] else ''}")

print("\n" + "=" * 70)
print("📊 订单状态分布")
print("=" * 70)
c.execute("SELECT status, COUNT(*) as cnt FROM orders GROUP BY status")
for status, cnt in c.fetchall():
    bar = '█' * min(cnt // 2, 50)
    print(f"  {status:15s} {cnt:5d}  {bar}")

print("\n" + "=" * 70)
print("❌ 失败订单详情（前3条）")
print("=" * 70)
c.execute("""
    SELECT id, order_no, product_name, recharge_account, final_amount, 
           status, fail_reason, retry_count, channel_switched, 
           supplier_id, channel_id, created_at, finish_time
    FROM orders WHERE status='failed' LIMIT 3
""")
cols = [d[0] for d in c.description]
for row in c.fetchall():
    d = dict(zip(cols, row))
    print(f"\n  订单ID: {d['id']}")
    print(f"  订单号: {d['order_no']}")
    print(f"  商品: {d['product_name']}")
    print(f"  账号: {d['recharge_account']}")
    print(f"  金额: ¥{d['final_amount']:.2f}")
    print(f"  失败原因: {d['fail_reason']}")
    print(f"  重试次数: {d['retry_count']}")
    print(f"  切换通道: {d['channel_switched']}")
    print(f"  供应商ID: {d['supplier_id']}")
    print(f"  通道ID: {d['channel_id']}")

print("\n" + "=" * 70)
print("🔄 通道切换日志表结构")
print("=" * 70)
try:
    c.execute("PRAGMA table_info(channel_switch_logs)")
    for col in c.fetchall():
        print(f"  {col[1]:25s} {col[2]:15s}")
    
    print("\n📋 通道切换日志（前3条）:")
    c.execute("SELECT * FROM channel_switch_logs LIMIT 3")
    cols = [d[0] for d in c.description]
    for row in c.fetchall():
        d = dict(zip(cols, row))
        print(f"  {json.dumps(d, ensure_ascii=False, indent=2)}")
except Exception as e:
    print(f"  表不存在: {e}")

print("\n" + "=" * 70)
print("📋 错误码映射表")
print("=" * 70)
try:
    c.execute("PRAGMA table_info(error_code_mapping)")
    for col in c.fetchall():
        print(f"  {col[1]:25s} {col[2]:15s}")
    
    print("\n📋 错误码数据:")
    c.execute("SELECT * FROM error_code_mapping LIMIT 5")
    cols = [d[0] for d in c.description]
    for row in c.fetchall():
        d = dict(zip(cols, row))
        print(f"  {d['supplier_code']:10s} {d['error_code']:15s} {d['user_message']}")
except Exception as e:
    print(f"  表不存在: {e}")

conn.close()
print("\n✅ 探测完成")
