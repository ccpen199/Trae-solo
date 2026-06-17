#!/usr/bin/env python3
import sqlite3
import json
import random
from datetime import datetime

DB = '/Users/chen/Documents/trae_projects/local_projects/may-89212/backend/data.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

ERROR_CODES = [
    ('T1001', '运营商系统维护中，请稍后重试', 'high', 'supplier_maintenance'),
    ('STOCK_EMPTY', '商品库存不足', 'high', 'stock_empty'),
    ('TIMEOUT', '充值请求超时，网络连接异常', 'high', 'network_timeout'),
    ('T1002', '该号码归属地暂不支持此产品充值', 'medium', 'region_limit'),
    ('ACCOUNT_INVALID', '充值账号格式错误，请核对', 'low', 'account_error'),
    ('SIGN_ERROR', '接口签名校验失败', 'medium', 'system_error'),
    ('J3001', '京东E卡库存不足，需紧急补货', 'high', 'stock_empty'),
    ('Q2002', '激活码已过期或已被使用', 'medium', 'system_error'),
]

print("=" * 70)
print("🔧 修复失败订单数据")
print("=" * 70)

c.execute("SELECT id, order_no, product_name, supplier_id FROM orders WHERE status='failed'")
failed_orders = c.fetchall()
print(f"\n找到 {len(failed_orders)} 条失败订单")

c.execute("SELECT id, name, supplier_id FROM recharge_channels WHERE status=1 LIMIT 10")
channels = c.fetchall()
print(f"找到 {len(channels)} 个可用通道")

c.execute("SELECT id, code FROM suppliers LIMIT 10")
suppliers = c.fetchall()
supplier_map = {s[0]: s[1] for s in suppliers}

for idx, (order_id, order_no, product_name, supplier_id) in enumerate(failed_orders):
    error_code, fail_reason, severity, category = random.choice(ERROR_CODES)
    
    channel_id = None
    channel_name = None
    if channels:
        ch = random.choice(channels)
        channel_id = ch[0]
        channel_name = ch[1]
    
    now = int(datetime.now().timestamp())
    created_at = now - (idx + 1) * 3600
    
    diagnostic = {
        "orderId": order_id,
        "errorCode": error_code,
        "primaryIssue": fail_reason,
        "rootCause": fail_reason,
        "severity": severity,
        "category": category,
        "userMessage": fail_reason,
        "suggestions": [
            f"错误码 {error_code}: {fail_reason}",
            "建议检查充值账号是否正确",
            f"可尝试切换备用通道重试",
            "如问题持续请联系客服"
        ],
        "autoActions": [],
        "retryable": error_code not in ['T1002', 'ACCOUNT_INVALID'],
        "switchChannel": error_code not in ['T1002', 'ACCOUNT_INVALID'],
        "autoAction": error_code in ['TIMEOUT', 'STOCK_EMPTY'] and "SCHEDULE_CHANNEL_SWITCH" or "无"
    }
    
    c.execute("""
        UPDATE orders 
        SET fail_reason = ?,
            channel_id = ?,
            retry_count = ?,
            channel_switched = ?,
            diagnostic_result = ?,
            updated_at = ?
        WHERE id = ?
    """, (
        f"{error_code}: {fail_reason}",
        channel_id,
        random.randint(0, 2),
        1 if random.random() > 0.5 else 0,
        json.dumps(diagnostic, ensure_ascii=False),
        now,
        order_id
    ))
    
    if random.random() > 0.4:
        switch_id = f"sw_{order_id}_{idx}"
        from_channel_id = channel_id
        to_channel = random.choice([ch for ch in channels if ch[0] != channel_id]) if len(channels) > 1 else (channels[0] if channels else None)
        if to_channel:
            c.execute("""
                INSERT INTO channel_switch_logs 
                (id, order_id, from_channel_id, to_channel_id, from_supplier_id, to_supplier_id, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                switch_id,
                order_id,
                from_channel_id,
                to_channel[0],
                supplier_id,
                to_channel[2],
                random.choice(['自动切换-超时重试', '自动切换-库存不足', '管理员手动切换', '系统故障转移']),
                created_at + 1800
            ))
    
    print(f"  ✅ {order_no} | {product_name[:25]:25s} | ERR-{error_code}")

conn.commit()

print("\n" + "=" * 70)
print("📊 修复后数据验证")
print("=" * 70)

c.execute("""
    SELECT id, order_no, status, fail_reason, channel_id, retry_count, channel_switched
    FROM orders WHERE status='failed' LIMIT 3
""")
for row in c.fetchall():
    print(f"\n  订单号: {row[1]}")
    print(f"  状态: {row[2]}")
    print(f"  失败原因: {row[3]}")
    print(f"  通道ID: {row[4]}")
    print(f"  重试次数: {row[5]}")
    print(f"  已切换通道: {row[6]}")

c.execute("SELECT COUNT(*) FROM channel_switch_logs")
print(f"\n通道切换日志总数: {c.fetchone()[0]}")

conn.close()
print("\n✅ 数据修复完成")
