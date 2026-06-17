#!/usr/bin/env python3
"""补充风控日志、卡密加密日志、卡密过期时间的模拟数据"""
import sqlite3, random, time, uuid
DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

now = int(time.time())

# ========== 1. 补充卡密过期时间 ==========
print("🔄 补充卡密过期时间...")
c.execute("SELECT id, created_at FROM card_pool WHERE expire_time = 0 OR expire_time IS NULL")
cards = c.fetchall()
print(f"  需设置过期时间的卡密: {len(cards)} 张")

expire_updates = []
for card_id, created_at in cards:
    # 70% 卡密设为180天后过期，20% 30天内（即将过期），10% 已过期
    r = random.random()
    if r < 0.1:
        expire = now - random.randint(1, 30) * 86400  # 已过期
        status = 'expired'
    elif r < 0.3:
        expire = now + random.randint(1, 25) * 86400   # 30天内过期
        status = 'available'
    else:
        expire = now + random.randint(60, 365) * 86400  # 正常
        status = 'available'
    expire_updates.append((expire, status, card_id))

c.executemany("UPDATE card_pool SET expire_time = ?, status = ? WHERE id = ?", expire_updates)
print(f"  ✅ 已设置 {len(expire_updates)} 张卡密的过期时间")

# ========== 2. 补充风控拦截日志 ==========
print("\n🔄 补充风控拦截日志...")
c.execute("SELECT COUNT(*) FROM risk_logs")
current_cnt = c.fetchone()[0]
print(f"  当前风控日志: {current_cnt} 条")

if current_cnt < 50:
    risk_rules = [
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
    user_phones = [f'1380013800{i:02d}' for i in range(1, 9)]
    regions = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '河南']
    ips = [f'192.168.{random.randint(1,255)}.{random.randint(1,255)}' for _ in range(20)]

    insert_count = max(0, 80 - current_cnt)
    risk_logs = []
    for i in range(insert_count):
        rule_code, rule_name, level, blocked = random.choice(risk_rules)
        t = now - random.randint(0, 30 * 86400)
        user_idx = random.randint(0, 7)
        log = (
            str(uuid.uuid4()),
            user_ids[user_idx],
            random.choice(ips),
            random.choice(regions),
            rule_code,
            f'命中规则：{rule_name}，触发阈值',
            level,
            blocked,
            random.choice(user_phones),
            t,
        )
        risk_logs.append(log)

    c.executemany("""
        INSERT INTO risk_logs (id, user_id, ip, region, rule_code, detail, risk_level, blocked, user_phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, risk_logs)
    print(f"  ✅ 已插入 {len(risk_logs)} 条风控日志")

# ========== 3. 补充卡密加密/解密日志 ==========
print("\n🔄 补充卡密加密/解密日志...")
c.execute("SELECT COUNT(*) FROM card_crypto_logs")
current_crypto = c.fetchone()[0]
print(f"  当前加密日志: {current_crypto} 条")

c.execute("SELECT id, product_id, product_name, is_encrypted, encryption_time, key_version FROM card_pool LIMIT 150")
cards_for_log = c.fetchall()

if current_crypto < 100:
    admin_ids = ['admin', 'admin1', 'admin2']
    ips = [f'10.0.{random.randint(1,255)}.{random.randint(1,255)}' for _ in range(10)]

    crypto_logs = []
    # 每张卡至少1条加密日志
    for card_id, product_id, product_name, is_encrypted, enc_time, key_ver in cards_for_log:
        t = enc_time or (now - random.randint(0, 30) * 86400)
        crypto_logs.append((
            str(uuid.uuid4()),
            card_id,
            'encrypt',
            'admin',
            'admin',
            'AES-256-CBC',
            key_ver or 'v2.1',
            '',
            random.choice(ips),
            '批量加密任务',
            1,
            product_name,
            t,
        ))

    # 随机生成30条解密日志
    for _ in range(40):
        card = random.choice(cards_for_log)
        card_id = card[0]
        product_name = card[2]
        t = now - random.randint(0, 7 * 86400)
        reason = random.choice(['订单履约解密', '人工复核', '客户申诉', '风控核查', '对账需求'])
        crypto_logs.append((
            str(uuid.uuid4()),
            card_id,
            'decrypt',
            random.choice(admin_ids),
            'admin',
            'AES-256-CBC',
            'v2.1',
            f'{random.randint(1000,9999)}****{random.randint(1000,9999)}',
            random.choice(ips),
            reason,
            1,
            product_name,
            t,
        ))

    c.executemany("""
        INSERT INTO card_crypto_logs
        (id, card_id, operation, operator_id, operator_role, encryption_method, key_version,
         decrypted_preview, ip_address, reason, operation_success, product_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, crypto_logs)
    print(f"  ✅ 已插入 {len(crypto_logs)} 条加密/解密日志")

# ========== 4. 更新卡密池的加密字段 ==========
print("\n🔄 检查并更新卡密加密字段...")
c.execute("SELECT COUNT(*) FROM card_pool WHERE is_encrypted = 1")
enc_count = c.fetchone()[0]
print(f"  已加密卡密: {enc_count}/{len(cards_for_log)}")
if enc_count < len(cards_for_log):
    c.execute("UPDATE card_pool SET is_encrypted = 1, encryption_method = 'AES-256-CBC', key_version = 'v2.1' WHERE is_encrypted = 0 OR is_encrypted IS NULL")
    print(f"  ✅ 已更新 {c.rowcount} 张卡密的加密标记")

conn.commit()
conn.close()

print("\n" + "="*60)
print("✅ 数据补充完成！")
print("="*60)
print("  卡密过期时间已设置（含即将过期/已过期）")
print("  风控日志已补充（80条，8大规则）")
print("  加密/解密日志已补充（190条）")
print("  卡密加密标记已完善")
