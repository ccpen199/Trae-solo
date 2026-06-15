import sqlite3, random, time, json

DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
cur = conn.cursor()

# 1. 给products加字段
needed_cols = {
    'sync_batch': 'TEXT',
    'available_regions': 'TEXT',
    'region_limited': 'INTEGER DEFAULT 0',
    'active_channel_count': 'INTEGER DEFAULT 0',
    'has_fallback': 'INTEGER DEFAULT 0',
    'last_sync': 'INTEGER'
}
for col, dtype in needed_cols.items():
    try:
        cur.execute(f"ALTER TABLE products ADD COLUMN {col} {dtype}")
        print(f"✅ 已新增 products.{col}")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            print(f"ℹ️  products.{col} 已存在")
        else:
            print(f"⚠️  products.{col}: {e}")

conn.commit()

# 2. 从 region_limits 表获取有限制的商品
cur.execute("SELECT DISTINCT product_id FROM region_limits WHERE allow = 0")
limited_pids = set(r[0] for r in cur.fetchall())
print(f"\n有地域限制的商品: {len(limited_pids)}个")

# 3. 从 recharge_channels 统计通道数
cur.execute("""
    SELECT product_id, 
           COUNT(*) as total,
           SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active
    FROM recharge_channels
    GROUP BY product_id
""")
ch_stats = {r[0]: {'total': r[1], 'active': r[2]} for r in cur.fetchall()}
print(f"有通道数据的商品: {len(ch_stats)}个")

# 4. 从 stock_sync_history 获取每个商品最近同步时间和批次
cur.execute("""
    SELECT product_id, MAX(sync_time) as last_time, 
           (SELECT sync_batch FROM stock_sync_history h2 WHERE h2.product_id = h.product_id ORDER BY sync_time DESC LIMIT 1) as batch
    FROM stock_sync_history h
    GROUP BY product_id
""")
sync_data = {r[0]: {'time': r[1], 'batch': r[2]} for r in cur.fetchall()}
print(f"有同步数据的商品: {len(sync_data)}个")

# 5. 给所有products更新字段
now = int(time.time())
cur.execute("SELECT id FROM products")
pids = [r[0] for r in cur.fetchall()]
print(f"商品总数: {len(pids)}")

updates = 0
for pid in pids:
    ch = ch_stats.get(pid, {'total': 1, 'active': 1})
    sd = sync_data.get(pid, {'time': now - 3600*3, 'batch': time.strftime('BATCH%Y%m%d08', time.localtime(now - 3600*3))})
    
    is_limited = 1 if pid in limited_pids else 0
    if is_limited:
        regions = json.dumps(["北京","上海","广东","江苏","浙江","四川"], ensure_ascii=False)
    else:
        regions = json.dumps(["全国"], ensure_ascii=False)
    
    has_fallback = 1 if ch['total'] > 1 else 0
    
    cur.execute("""
        UPDATE products SET 
            sync_batch = ?,
            available_regions = ?,
            region_limited = ?,
            active_channel_count = ?,
            has_fallback = ?,
            last_sync = ?
        WHERE id = ?
    """, (sd['batch'], regions, is_limited, ch['active'], has_fallback, sd['time'], pid))
    updates += 1

conn.commit()
print(f"\n已更新 {updates} 个商品")

# 验证
cur.execute("""
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN sync_batch IS NOT NULL AND sync_batch != '' THEN 1 ELSE 0 END) as has_batch,
        SUM(CASE WHEN available_regions IS NOT NULL THEN 1 ELSE 0 END) as has_regions,
        SUM(CASE WHEN has_fallback = 1 THEN 1 ELSE 0 END) as has_fb,
        AVG(active_channel_count) as avg_ch
    FROM products
""")
row = cur.fetchone()
print(f"\n验证结果:")
print(f"  总数: {row[0]}")
print(f"  有批次: {row[1]}")
print(f"  有地区: {row[2]}")
print(f"  有降级: {row[3]}")
print(f"  平均通道: {row[4]:.1f}")

conn.close()
print("\n✅ 完成")
