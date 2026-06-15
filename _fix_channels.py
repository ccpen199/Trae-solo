import sqlite3, uuid, random

db = sqlite3.connect('/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db')
cur = db.cursor()

cur.execute("SELECT id, supplier_id FROM products")
products = cur.fetchall()

cur.execute("SELECT id, code FROM suppliers")
suppliers = {s[1]: s[0] for s in cur.fetchall()}

imported_count = 0
for pid, main_sid in products:
    cur.execute("SELECT COUNT(*) FROM recharge_channels WHERE product_id = ?", (pid,))
    cur_count = cur.fetchone()[0]
    if cur_count >= 3:
        continue

    alt_suppliers = [sid for code, sid in suppliers.items() if sid != main_sid]
    num_extra = 2 if random.random() > 0.3 else 3
    channel_opts = ['高速通道', '稳定通道', '极速通道', '安全通道', '专用通道', '金牌通道', '标准通道', 'VIP专线', '备份通道']

    for i in range(cur_count, min(cur_count + num_extra, 5)):
        priority = (i + 1) * 10
        success_rate = round(0.90 + random.random() * 0.08, 4)
        use_alt = random.random() > 0.6 and len(alt_suppliers) > 0
        sid = random.choice(alt_suppliers) if use_alt else main_sid
        name = random.choice(channel_opts)
        last_fail = None
        if random.random() > 0.7:
            last_fail = int(random.randint(1_700_000_000, 1_718_000_000))
        status = 1 if random.random() > 0.15 else 0
        cid = str(uuid.uuid4())
        cur.execute("""
            INSERT OR IGNORE INTO recharge_channels (id, product_id, supplier_id, priority, success_rate, last_fail_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (cid, pid, sid, priority, success_rate, last_fail, status))
        if cur.rowcount > 0:
            imported_count += 1

cur.execute("SELECT COUNT(*) FROM recharge_channels")
total = cur.fetchone()[0]
cur.execute("SELECT AVG(cnt), MAX(cnt), MIN(cnt) FROM (SELECT product_id, COUNT(*) as cnt FROM recharge_channels GROUP BY product_id)")
avg, mx, mn = cur.fetchone()
cur.execute("SELECT COUNT(DISTINCT product_id) FROM recharge_channels r WHERE supplier_id != (SELECT supplier_id FROM products WHERE id = r.product_id)")
cross_count = cur.fetchone()[0]

db.commit()
db.close()

print(f"新增通道: {imported_count}")
print(f"总通道数: {total}")
print(f"平均/最多/最少: {avg:.1f}/{mx}/{mn}")
print(f"多供应商交叉通道: {cross_count}")
