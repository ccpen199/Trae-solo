#!/usr/bin/env python3
import sqlite3, json
DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

print("="*60)
print("📊 数据库真实数据量统计")
print("="*60)

tables = [
    ('orders', '订单'),
    ('commission_records', '佣金记录'),
    ('risk_logs', '风控日志'),
    ('card_pool', '卡密池'),
    ('card_crypto_logs', '卡密加密日志'),
    ('users', '用户'),
    ('products', '商品'),
    ('suppliers', '供应商'),
    ('recharge_channels', '充值通道'),
    ('stock_sync_history', '库存同步历史'),
]

for t, name in tables:
    try:
        cnt = c.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]
        print(f"  {name:12s}: {cnt:6d} 条")
    except Exception as e:
        print(f"  {name:12s}: 表不存在 - {e}")

print("\n" + "="*60)
print("📦 订单状态分布")
print("="*60)
try:
    rows = c.execute("SELECT status, COUNT(*) as cnt FROM orders GROUP BY status").fetchall()
    for status, cnt in rows:
        bar = '█' * min(cnt // 5, 40)
        print(f"  {status:12s}: {cnt:6d}  {bar}")
except Exception as e:
    print(f"  错误: {e}")

print("\n" + "="*60)
print("💰 最近5条订单")
print("="*60)
try:
    cols = ['id','order_no','product_name','recharge_account','final_amount','status','supplier_id','created_at']
    rows = c.execute(f"SELECT {','.join(cols)} FROM orders ORDER BY created_at DESC LIMIT 5").fetchall()
    for r in rows:
        d = dict(zip(cols, r))
        print(f"  {d['order_no']} | {d['product_name'][:20]:20s} | ¥{d['final_amount']:.2f} | {d['status']:10s} | {d['recharge_account']}")
except Exception as e:
    print(f"  错误: {e}")

print("\n" + "="*60)
print("📈 佣金统计")
print("="*60)
try:
    total = c.execute("SELECT COALESCE(SUM(amount),0) FROM commission_records").fetchone()[0]
    pending = c.execute("SELECT COALESCE(SUM(amount),0) FROM commission_records WHERE status='pending'").fetchone()[0]
    paid = c.execute("SELECT COALESCE(SUM(amount),0) FROM commission_records WHERE status='paid'").fetchone()[0]
    print(f"  总佣金: ¥{total:.2f}")
    print(f"  待结算: ¥{pending:.2f}")
    print(f"  已到账: ¥{paid:.2f}")
except Exception as e:
    print(f"  错误: {e}")

print("\n" + "="*60)
print("🎯 前3个商品的通道数")
print("="*60)
try:
    rows = c.execute("""
        SELECT p.id, p.name, p.supplier_name,
               COUNT(rc.id) as channel_count,
               SUM(CASE WHEN rc.status=1 THEN 1 ELSE 0 END) as active_count
        FROM products p
        LEFT JOIN recharge_channels rc ON rc.product_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT 3
    """).fetchall()
    for r in rows:
        print(f"  {r[1][:30]:30s} | 供应商: {r[2][:10]:10s} | 通道: {r[4]}/{r[3]}")
except Exception as e:
    print(f"  错误: {e}")

conn.close()
print("\n✅ 探测完成")
