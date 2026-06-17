#!/usr/bin/env python3
import sqlite3
DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

tables = ['risk_logs', 'card_crypto_logs', 'card_pool']
for t in tables:
    print(f"\n--- {t} 表结构 ---")
    cols = c.execute(f'PRAGMA table_info({t})').fetchall()
    for col in cols:
        print(f"  {col[1]} ({col[2]})")

# 检查card_pool expire_time
print("\n--- card_pool 检查 ---")
c.execute("SELECT COUNT(*) FROM card_pool WHERE expire_time > 0")
print(f"  有过期时间: {c.fetchone()[0]}")
c.execute("SELECT COUNT(*) FROM card_pool WHERE status = 'expired'")
print(f"  已过期: {c.fetchone()[0]}")
c.execute("SELECT COUNT(*) FROM card_pool WHERE status = 'available' AND expire_time > 0 AND expire_time <= ?", (int(__import__('time').time()) + 86400*30,))
print(f"  30天内过期: {c.fetchone()[0]}")

conn.close()
