#!/usr/bin/env python3
import sqlite3
import uuid
import time
import random

DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

print("="*60)
print("🔧 补充卡密池数据")
print("="*60)

now = int(time.time())
today_start = now - (now % 86400)

# 1. 检查现有供应商
print("\n1. 检查现有供应商...")
all_suppliers = c.execute('SELECT id, name FROM suppliers ORDER BY created_at').fetchall()
print(f"   现有 {len(all_suppliers)} 家供应商: {[s[1] for s in all_suppliers]}")
assert len(all_suppliers) >= 6, "供应商数量不足6家"

# 2. 补充 ¥10 和 ¥200 面值的商品
print("\n2. 补充 ¥10 和 ¥200 面值商品...")

# 检查现有面值
existing_fv = [r[0] for r in c.execute('SELECT DISTINCT face_value FROM products WHERE face_value IS NOT NULL').fetchall()]
print(f"   现有面值: {sorted(existing_fv)}")

# 为每个供应商创建 ¥10 和 ¥200 的商品
def generate_card_number():
    return ''.join([str(random.randint(0,9)) for _ in range(16)])

def generate_encrypted(card_num):
    key = 'key-v2.1'
    encrypted = ''
    for i, ch in enumerate(card_num):
        shift = ord(key[i % len(key)]) % 10
        encrypted += str((int(ch) + shift) % 10)
    return 'ENC_' + encrypted

fv_to_add = [10, 200]
new_product_ids = []

for supplier_id, supplier_name in all_suppliers:
    for fv in fv_to_add:
        pid = f'prod_{supplier_id}_{fv}'
        existing = c.execute('SELECT id FROM products WHERE id=?', (pid,)).fetchone()
        if not existing:
            c.execute('''
                INSERT INTO products (id, name, category_id, supplier_id, supplier_product_id, sku_type, face_value, price, cost_price, status, stock, created_at)
                VALUES (?, ?, 'cat_virtual', ?, ?, 'card', ?, ?, ?, 1, 100, ?)
            ''', (pid, f'{supplier_name}{fv}元', supplier_id, f'{supplier_id}_{fv}', fv, fv * 0.95, fv * 0.85, now))
            print(f"   ✅ 新增商品: {supplier_name} {fv}元")
        new_product_ids.append(pid)

# 3. 为新面值补充卡密数据，确保各面值都有卡密
print("\n3. 补充卡密数据...")

# 先统计现有各面值卡密数量
current_counts = {}
for r in c.execute('''
    SELECT p.face_value, COUNT(*) 
    FROM card_pool cp LEFT JOIN products p ON cp.product_id=p.id 
    WHERE p.face_value IS NOT NULL 
    GROUP BY p.face_value
''').fetchall():
    current_counts[r[0]] = r[1]

print(f"   现有各面值卡密数量: {current_counts}")

# 为 ¥10 和 ¥200 各补充25张卡密
cards_to_add = []
for fv in fv_to_add:
    target = 25
    current = current_counts.get(fv, 0)
    need = max(0, target - current)
    if need > 0:
        # 找一个该面值的产品
        product = c.execute('''
            SELECT p.id, p.supplier_id FROM products p 
            WHERE p.face_value=? LIMIT 1
        ''', (fv,)).fetchone()
        if product:
            pid, sid = product
            for i in range(need):
                card_id = str(uuid.uuid4())
                card_num = generate_card_number()
                encrypted = generate_encrypted(card_num)
                # 过期时间：随机分布在未来30-365天
                expire_time = now + random.randint(86400 * 30, 86400 * 365)
                card_pwd = ''.join([str(random.randint(0,9)) for _ in range(8)])
                encrypted_pwd = generate_encrypted(card_pwd)
                c.execute('''
                    INSERT INTO card_pool 
                    (id, product_id, supplier_id, card_number, card_password, encrypted_card, encrypted_password,
                     status, expire_time, created_at, encrypted, encryption_method, encryption_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, 1, 'AES-256-CBC', ?)
                ''', (card_id, pid, sid, card_num, card_pwd, encrypted, encrypted_pwd, expire_time, now, now))
                
                # 同时记录加密日志
                log_id = str(uuid.uuid4())
                c.execute('''
                    INSERT INTO card_crypto_logs
                    (id, card_id, operation, operator_id, operator_role, encryption_method,
                     key_version, decrypted_preview, ip_address, reason, success, created_at)
                    VALUES (?, ?, 'encrypt', 'user_1', '管理员', 'AES-256-CBC',
                            'key-v2.1', NULL, '127.0.0.1', '系统加密', 1, ?)
                ''', (log_id, card_id, now))
            print(f"   ✅ 为 ¥{fv} 补充 {need} 张卡密")

# 4. 修改4张卡密状态为 used（已使用）
print("\n4. 设置4张卡密为已使用状态...")
used_count = c.execute("SELECT COUNT(*) FROM card_pool WHERE status='used'").fetchone()[0]
print(f"   当前已使用: {used_count} 张")

if used_count < 4:
    need = 4 - used_count
    # 选择一些available的卡密标记为used
    cards = c.execute("SELECT id FROM card_pool WHERE status='available' LIMIT ?", (need,)).fetchall()
    for card in cards:
        c.execute("UPDATE card_pool SET status='used', used_at=? WHERE id=?", (now, card[0]))
    print(f"   ✅ 设置 {need} 张卡密为已使用")

# 5. 设置今日新增卡密
print("\n5. 设置今日新增卡密...")
today_count = c.execute("SELECT COUNT(*) FROM card_pool WHERE created_at >= ?", (today_start,)).fetchone()[0]
print(f"   当前今日新增: {today_count} 张")

if today_count == 0:
    # 修改最近创建的几张卡密时间为今日
    cards = c.execute("SELECT id FROM card_pool ORDER BY created_at DESC LIMIT 10").fetchall()
    for i, card in enumerate(cards):
        new_time = today_start + 3600 * (i + 1)
        c.execute("UPDATE card_pool SET created_at=? WHERE id=?", (new_time, card[0]))
    print(f"   ✅ 设置 {len(cards)} 张卡密创建时间为今日")

# 6. 调整即将过期卡密数量，确保30天内65张，7天内有数据
print("\n6. 调整卡密过期时间...")

# 先统计
expiring_30 = c.execute("SELECT COUNT(*) FROM card_pool WHERE status='available' AND expire_time>0 AND expire_time <= ?", (now + 86400*30,)).fetchone()[0]
expiring_7 = c.execute("SELECT COUNT(*) FROM card_pool WHERE status='available' AND expire_time>0 AND expire_time <= ?", (now + 86400*7,)).fetchone()[0]
print(f"   当前30天内过期: {expiring_30} 张, 7天内: {expiring_7} 张")

# 确保7天内有数据
if expiring_7 < 18:
    need = 18 - expiring_7
    cards = c.execute("SELECT id FROM card_pool WHERE status='available' AND expire_time > ? ORDER BY expire_time ASC LIMIT ?", (now + 86400*7, need + 10)).fetchall()
    for i in range(min(need, len(cards))):
        new_expire = now + random.randint(86400, 86400 * 6)
        c.execute("UPDATE card_pool SET expire_time=? WHERE id=?", (new_expire, cards[i][0]))
    print(f"   ✅ 调整 {min(need, len(cards))} 张卡密到7天内过期")

# 确保30天内有65张
expiring_30 = c.execute("SELECT COUNT(*) FROM card_pool WHERE status='available' AND expire_time>0 AND expire_time <= ?", (now + 86400*30,)).fetchone()[0]
if expiring_30 < 65:
    need = 65 - expiring_30
    cards = c.execute("SELECT id FROM card_pool WHERE status='available' AND expire_time > ? ORDER BY expire_time ASC LIMIT ?", (now + 86400*30, need + 50)).fetchall()
    for i in range(min(need, len(cards))):
        new_expire = now + random.randint(86400 * 8, 86400 * 29)
        c.execute("UPDATE card_pool SET expire_time=? WHERE id=?", (new_expire, cards[i][0]))
    print(f"   ✅ 调整 {min(need, len(cards))} 张卡密到30天内过期")

# 7. 重新分配供应商，确保6家供应商都有卡密
print("\n7. 重新分配供应商...")
supplier_counts = {}
for r in c.execute('''
    SELECT s.name, COUNT(*) 
    FROM card_pool cp LEFT JOIN suppliers s ON cp.supplier_id=s.id 
    GROUP BY s.name ORDER BY COUNT(*) DESC
''').fetchall():
    supplier_counts[r[0]] = r[1]
print(f"   当前供应商分布: {supplier_counts}")

# 确保每家供应商至少有一些卡密
all_supplier_ids = [s[0] for s in all_suppliers]
for sid in all_supplier_ids:
    cnt = c.execute("SELECT COUNT(*) FROM card_pool WHERE supplier_id=?", (sid,)).fetchone()[0]
    if cnt < 10:
        # 从卡密最多的供应商转移一些
        max_sid = max(supplier_counts, key=supplier_counts.get) if supplier_counts else None
        if max_sid:
            max_id = [s[0] for s in all_suppliers if s[1] == max_sid][0]
            cards = c.execute("SELECT id, product_id FROM card_pool WHERE supplier_id=? LIMIT 15", (max_id,)).fetchall()
            # 同时需要为这些卡密找到目标供应商的同面值产品
            for card_id, old_pid in cards:
                old_prod = c.execute("SELECT face_value FROM products WHERE id=?", (old_pid,)).fetchone()
                if old_prod:
                    fv = old_prod[0]
                    new_pid = c.execute("SELECT id FROM products WHERE supplier_id=? AND face_value=? LIMIT 1", (sid, fv)).fetchone()
                    if new_pid:
                        c.execute("UPDATE card_pool SET supplier_id=?, product_id=? WHERE id=?", (sid, new_pid[0], card_id))
        print(f"   ✅ 为供应商 {sid} 分配卡密")

conn.commit()

# 8. 最终验证
print("\n" + "="*60)
print("✅ 数据补充完成，最终验证:")
print("="*60)

rows = c.execute("SELECT status, COUNT(*) FROM card_pool GROUP BY status").fetchall()
print("\n卡密状态:")
for status, cnt in rows:
    print(f"  {status}: {cnt}")

print("\n即将过期:")
print(f"  30天内: {c.execute('SELECT COUNT(*) FROM card_pool WHERE status=\"available\" AND expire_time>0 AND expire_time <= ?', (now+86400*30,)).fetchone()[0]}")
print(f"  7天内: {c.execute('SELECT COUNT(*) FROM card_pool WHERE status=\"available\" AND expire_time>0 AND expire_time <= ?', (now+86400*7,)).fetchone()[0]}")
print(f"  已过期: {c.execute('SELECT COUNT(*) FROM card_pool WHERE status=\"expired\"').fetchone()[0]}")
print(f"  今日新增: {c.execute('SELECT COUNT(*) FROM card_pool WHERE created_at >= ?', (today_start,)).fetchone()[0]}")

print("\n面值分布:")
for r in c.execute('''
    SELECT p.face_value, COUNT(*) 
    FROM card_pool cp LEFT JOIN products p ON cp.product_id=p.id 
    WHERE p.face_value IS NOT NULL 
    GROUP BY p.face_value ORDER BY p.face_value
''').fetchall():
    print(f"  ¥{r[0]}: {r[1]} 张")

print("\n供应商分布:")
for r in c.execute('''
    SELECT s.name, COUNT(*) 
    FROM card_pool cp LEFT JOIN suppliers s ON cp.supplier_id=s.id 
    GROUP BY s.name ORDER BY COUNT(*) DESC
''').fetchall():
    print(f"  {r[0]}: {r[1]} 张")

print("\n加密日志:")
print(f"  总记录: {c.execute('SELECT COUNT(*) FROM card_crypto_logs').fetchone()[0]}")
for r in c.execute('SELECT operation, COUNT(*) FROM card_crypto_logs GROUP BY operation').fetchall():
    print(f"  {r[0]}: {r[1]}")

conn.close()
print("\n🎉 所有数据补充完成！")
