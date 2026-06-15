import sqlite3, uuid, random, time

DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
cur = conn.cursor()

# 确保表存在
cur.execute('''
CREATE TABLE IF NOT EXISTS stock_sync_history (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    before_stock INTEGER NOT NULL,
    after_stock INTEGER NOT NULL,
    variance INTEGER NOT NULL,
    sync_time INTEGER NOT NULL,
    sync_batch TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
)
''')
conn.commit()

# 给没有历史记录的商品补3条
cur.execute("SELECT id, stock FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM stock_sync_history)")
products = cur.fetchall()
print(f"无同步历史的商品: {len(products)}个")

now = int(time.time())
count = 0
for pid, stock in products:
    prev = stock
    for i in range(3):
        hid = str(uuid.uuid4())
        variance = random.randint(-50, 50)
        before = prev - variance
        after = prev
        sync_time = now - (i+1) * 3600 * random.randint(2, 10)
        batch = time.strftime('BATCH%Y%m%d%H', time.localtime(sync_time))
        cur.execute("""
            INSERT INTO stock_sync_history (id, product_id, before_stock, after_stock, variance, sync_time, sync_batch)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (hid, pid, before, after, variance, sync_time, batch))
        count += 1
        prev = before

conn.commit()

# 验证
cur.execute("SELECT COUNT(*) FROM stock_sync_history")
total = cur.fetchone()[0]
cur.execute("SELECT COUNT(DISTINCT product_id) FROM stock_sync_history")
prods = cur.fetchone()[0]
cur.execute("SELECT product_id, COUNT(*) as cnt FROM stock_sync_history GROUP BY product_id ORDER BY cnt LIMIT 3")
sample = cur.fetchall()

print(f"新增历史记录: {count}条")
print(f"总记录数: {total}")
print(f"覆盖商品数: {prods}")
print(f"样例(每商品几条): {sample}")

# 给没有sync_batch的products也补上
cur.execute("SELECT id FROM products WHERE sync_batch IS NULL OR sync_batch = ''")
no_batch = cur.fetchall()
print(f"无sync_batch字段或为空的商品: {len(no_batch)}")
# 用ALTER TABLE加字段（如果没有的话）
try:
    cur.execute("ALTER TABLE products ADD COLUMN sync_batch TEXT")
    print("  已新增 sync_batch 列")
except:
    pass

cur.execute("SELECT id FROM products WHERE sync_batch IS NULL OR sync_batch = ''")
no_batch = cur.fetchall()
print(f"需要补sync_batch的商品: {len(no_batch)}")

for pid, in no_batch:
    # 取最近一次同步的批次号
    cur.execute("SELECT sync_batch FROM stock_sync_history WHERE product_id = ? ORDER BY sync_time DESC LIMIT 1", (pid,))
    row = cur.fetchone()
    batch = row[0] if row and row[0] else time.strftime('BATCH%Y%m%d08', time.localtime(now - 3600*4))
    cur.execute("UPDATE products SET sync_batch = ? WHERE id = ?", (batch, pid))

conn.commit()

# 再检查
cur.execute("SELECT COUNT(*) FROM products WHERE sync_batch IS NOT NULL AND sync_batch != ''")
has_batch = cur.fetchone()[0]
print(f"已补sync_batch: {has_batch} 个商品")

# 同理补 available_regions 和 region_limited
try:
    cur.execute("ALTER TABLE products ADD COLUMN available_regions TEXT")
    print("  已新增 available_regions 列")
except: pass
try:
    cur.execute("ALTER TABLE products ADD COLUMN region_limited INTEGER DEFAULT 0")
    print("  已新增 region_limited 列")
except: pass

# 有地域限制的商品设为有限制地区，其他为全国
cur.execute("SELECT DISTINCT product_id FROM region_limits WHERE allow = 0")
limited = set(r[0] for r in cur.fetchall())
print(f"有地域限制的商品: {len(limited)}个")

import json
cur.execute("SELECT id FROM products WHERE available_regions IS NULL OR available_regions = ''")
need_region = cur.fetchall()
for pid, in need_region:
    if pid in limited:
        regions = ["北京","上海","广东","江苏","浙江","四川"]
        cur.execute("UPDATE products SET available_regions = ?, region_limited = 1 WHERE id = ?",
                   (json.dumps(regions, ensure_ascii=False), pid))
    else:
        cur.execute("UPDATE products SET available_regions = ?, region_limited = 0 WHERE id = ?",
                   (json.dumps(["全国"], ensure_ascii=False), pid))

conn.commit()

cur.execute("SELECT COUNT(*) FROM products WHERE region_limited = 1")
lim = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM products WHERE region_limited = 0")
nlim = cur.fetchone()[0]
print(f"地域限制: {lim}个有限制, {nlim}个全国可用")

conn.close()
print("\n✅ 完成")
