#!/usr/bin/env python3
import sqlite3, json
DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

print("="*60)
print("🎴 卡密池详细统计")
print("="*60)
rows = c.execute("SELECT status, COUNT(*) FROM card_pool GROUP BY status").fetchall()
for status, cnt in rows:
    print(f"  {status}: {cnt}")

print("\n即将过期(30天内):", c.execute("SELECT COUNT(*) FROM card_pool WHERE status='available' AND expire_time>0 AND expire_time <= strftime('%s','now')+86400*30").fetchone()[0])
print("即将过期(7天内):", c.execute("SELECT COUNT(*) FROM card_pool WHERE status='available' AND expire_time>0 AND expire_time <= strftime('%s','now')+86400*7").fetchone()[0])
print("今日新增:", c.execute("SELECT COUNT(*) FROM card_pool WHERE created_at >= strftime('%s','now','start of day')").fetchone()[0])

print("\n" + "="*60)
print("💰 面值分布")
print("="*60)
rows = c.execute("""
    SELECT p.face_value, COUNT(*) 
    FROM card_pool cp LEFT JOIN products p ON cp.product_id=p.id 
    WHERE p.face_value IS NOT NULL 
    GROUP BY p.face_value ORDER BY p.face_value
""").fetchall()
for fv, cnt in rows:
    print(f"  ¥{fv}: {cnt} 张")

print("\n" + "="*60)
print("🏭 供应商分布")
print("="*60)
rows = c.execute("""
    SELECT s.name, COUNT(*) 
    FROM card_pool cp LEFT JOIN suppliers s ON cp.supplier_id=s.id 
    GROUP BY s.name ORDER BY COUNT(*) DESC
""").fetchall()
for name, cnt in rows:
    print(f"  {name}: {cnt} 张")

print("\n" + "="*60)
print("🔐 加密日志统计")
print("="*60)
print("总记录:", c.execute("SELECT COUNT(*) FROM card_crypto_logs").fetchone()[0])
rows = c.execute("SELECT operation, COUNT(*) FROM card_crypto_logs GROUP BY operation").fetchall()
for op, cnt in rows:
    print(f"  {op}: {cnt}")
print("今日解密:", c.execute("SELECT COUNT(*) FROM card_crypto_logs WHERE operation='decrypt' AND DATE(created_at,'unixepoch')=DATE('now')").fetchone()[0])

print("\n" + "="*60)
print("📝 加密日志字段检查")
print("="*60)
row = c.execute("SELECT * FROM card_crypto_logs LIMIT 1").fetchone()
cols = [d[0] for d in c.description]
print("字段名:", cols)
print("有 success 字段:", 'success' in cols)
print("有 operation_success 字段:", 'operation_success' in cols)

print("\n最近3条加密日志:")
rows = c.execute("SELECT id, card_id, operation, success, created_at FROM card_crypto_logs ORDER BY created_at DESC LIMIT 3").fetchall()
for r in rows:
    print(f"  {r}")

print("\n" + "="*60)
print("📝 卡密池字段检查")
print("="*60)
row = c.execute("SELECT * FROM card_pool LIMIT 1").fetchone()
cols = [d[0] for d in c.description]
print("字段名:", cols)
print("有 encrypted 字段:", 'encrypted' in cols)
print("有 encrypted_card 字段:", 'encrypted_card' in cols)
print("有 is_encrypted 字段:", 'is_encrypted' in cols)

print("\n最近3条卡密:")
rows = c.execute("SELECT id, card_number, status, encrypted_card, expire_time FROM card_pool ORDER BY created_at DESC LIMIT 3").fetchall()
for r in rows:
    print(f"  id={r[0]}, status={r[2]}, has_encrypted={r[3] is not None}, expire={r[4]}")

conn.close()
print("\n✅ 探测完成")
