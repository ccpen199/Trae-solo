#!/usr/bin/env python3
"""补充风控日志、卡密加密日志、卡密过期时间的模拟数据（修正字段名）"""
import sqlite3, random, time, uuid
DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

now = int(time.time())

# ========== 1. 更新卡密过期时间 ==========
print("🔄 更新卡密过期时间...")
c.execute("SELECT id FROM card_pool")
all_card_ids = [r[0] for r in c.fetchall()]
print(f"  总卡密数: {len(all_card_ids)}")

# 随机选择一部分设置过期时间
updates = []
for idx, card_id in enumerate(all_card_ids):
    r = random.random()
    if r < 0.1:  # 10% 已过期
        expire = now - random.randint(1, 30) * 86400
        status = 'expired'
    elif r < 0.3:  # 20% 30天内过期
        expire = now + random.randint(1, 29) * 86400
        status = 'available'
    else:  # 70% 正常
        expire = now + random.randint(60, 365) * 86400
        status = 'available'
    updates.append((expire, status, card_id))

c.executemany("UPDATE card_pool SET expire_time = ?, status = ? WHERE id = ?", updates)
print(f"  ✅ 已更新 {len(updates)} 张卡密的过期时间")

# ========== 2. 补充风控拦截日志 ==========
print("\n🔄 补充风控拦截日志...")
c.execute("SELECT COUNT(*) FROM risk_logs")
current_cnt = c.fetchone()[0]
print(f"  当前风控日志: {current_cnt} 条")

if current_cnt < 80:
    risk_actions = [
        ('virtual_number', '虚拟号段识别', 'medium', 1),
        ('region_limit', '地域限制', 'medium', 1),
        ('frequency_control', '频次过高', 'high', 1),
        ('ip_blacklist', 'IP黑名单', 'critical', 1),
        ('abnormal_amount', '金额异常', 'high', 1),
        ('account_abnormal', '账户异常', 'medium', 1),
        ('risk_keyword', '敏感关键词', 'low', 0),
        ('device_fingerprint', '设备异常', 'high', 1),
    ]

    user_ids = [str(u) for u in range(1, 9)]
    regions = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '河南']
    ips = [f'192.168.{random.randint(1,255)}.{random.randint(1,255)}' for _ in range(20)]

    insert_count = max(0, 100 - current_cnt)
    risk_logs = []
    for i in range(insert_count):
        action, detail, level, blocked = random.choice(risk_actions)
        t = now - random.randint(0, 30 * 86400)
        log = (
            str(uuid.uuid4()),
            random.choice(user_ids),
            random.choice(ips),
            random.choice(regions),
            action,
            level,
            f'命中规则：{detail}，触发阈值',
            blocked,
            t,
        )
        risk_logs.append(log)

    c.executemany("""
        INSERT INTO risk_logs (id, user_id, ip, region, action, risk_level, detail, blocked, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, risk_logs)
    print(f"  ✅ 已插入 {len(risk_logs)} 条风控日志")

# ========== 3. 补充卡密加密/解密日志 ==========
print("\n🔄 补充卡密加密/解密日志...")
c.execute("SELECT COUNT(*) FROM card_crypto_logs")
current_crypto = c.fetchone()[0]
print(f"  当前加密日志: {current_crypto} 条")

c.execute("SELECT id, product_id FROM card_pool LIMIT 180")
cards_for_log = c.fetchall()

if current_crypto < 150:
    admin_ids = ['admin', 'admin1', 'admin2']
    ips = [f'10.0.{random.randint(1,255)}.{random.randint(1,255)}' for _ in range(10)]

    crypto_logs = []
    # 每张卡至少1条加密日志
    for card_id, product_id in cards_for_log:
        t = now - random.randint(1, 30) * 86400
        crypto_logs.append((
            str(uuid.uuid4()),
            card_id,
            'encrypt',
            random.choice(admin_ids),
            'admin',
            'AES-256-CBC',
            '',
            t,
            'v2.1',
            random.choice(ips),
            '批量加密任务',
            1,
        ))

    # 随机生成50条解密日志
    for _ in range(50):
        card = random.choice(cards_for_log)
        card_id = card[0]
        t = now - random.randint(0, 7 * 86400)
        reason = random.choice(['订单履约解密', '人工复核', '客户申诉', '风控核查', '对账需求'])
        crypto_logs.append((
            str(uuid.uuid4()),
            card_id,
            'decrypt',
            random.choice(admin_ids),
            'admin',
            'AES-256-CBC',
            f'{random.randint(1000,9999)}****{random.randint(1000,9999)}',
            t,
            'v2.1',
            random.choice(ips),
            reason,
            1,
        ))

    c.executemany("""
        INSERT INTO card_crypto_logs
        (id, card_id, operation, operator_id, operator_role, encryption_method,
         decrypted_preview, created_at, key_version, ip_address, reason, success)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, crypto_logs)
    print(f"  ✅ 已插入 {len(crypto_logs)} 条加密/解密日志")

# ========== 4. 更新卡密池的加密字段 ==========
print("\n🔄 更新卡密加密标记...")
c.execute("UPDATE card_pool SET encrypted = 1, encryption_method = 'AES-256-CBC', encryption_time = ? WHERE encrypted = 0 OR encrypted IS NULL", (now - 86400*7,))
print(f"  ✅ 已更新 {c.rowcount} 张卡密的加密标记")

conn.commit()

# 验证结果
print("\n" + "="*60)
print("✅ 数据补充完成！验证结果：")
print("="*60)
c.execute("SELECT COUNT(*) FROM risk_logs")
print(f"  风控日志: {c.fetchone()[0]} 条")
c.execute("SELECT COUNT(*) FROM card_crypto_logs")
print(f"  加密/解密日志: {c.fetchone()[0]} 条")
c.execute("SELECT COUNT(*) FROM card_pool WHERE status = 'expired'")
print(f"  已过期卡密: {c.fetchone()[0]} 张")
c.execute("SELECT COUNT(*) FROM card_pool WHERE status = 'available' AND expire_time > 0 AND expire_time <= ?", (now + 86400*30,))
print(f"  30天内过期: {c.fetchone()[0]} 张")
c.execute("SELECT COUNT(*) FROM card_pool WHERE encrypted = 1")
print(f"  已加密卡密: {c.fetchone()[0]} 张")

conn.close()
