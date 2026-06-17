#!/usr/bin/env python3
import sqlite3

db = sqlite3.connect('backend/data.db')
cursor = db.cursor()

print('=== recharge_channels 统计表 ===')
cursor.execute('SELECT COUNT(*) FROM recharge_channels')
print(f'总通道数: {cursor.fetchone()[0]}')

cursor.execute('SELECT product_id, COUNT(*) as cnt FROM recharge_channels GROUP BY product_id ORDER BY cnt DESC LIMIT 10')
print('\n每个商品的通道数(前10):')
for row in cursor.fetchall():
    print(f'  商品 {row[0][:8]}...: {row[1]} 个通道')

cursor.execute('''
    SELECT p.id, p.name, COUNT(rc.id) as channel_count 
    FROM products p 
    LEFT JOIN recharge_channels rc ON p.id = rc.product_id 
    GROUP BY p.id 
    HAVING channel_count = 0
''')
zero_channels = cursor.fetchall()
print(f'\n通道数为0的商品数: {len(zero_channels)}')
if zero_channels:
    for row in zero_channels[:5]:
        print(f'  {row[0][:8]}... {row[1]}: {row[2]}')

print('\n=== region_limits 统计表 ===')
cursor.execute('SELECT COUNT(*) FROM region_limits')
print(f'总地域限制记录: {cursor.fetchone()[0]}')

cursor.execute('SELECT product_id, COUNT(*) as cnt FROM region_limits GROUP BY product_id LIMIT 5')
print('\n有地域限制的商品(前5):')
for row in cursor.fetchall():
    print(f'  商品 {row[0][:8]}...: {row[1]} 个地区')

print('\n=== stock_sync_history 统计表 ===')
cursor.execute('SELECT COUNT(*) FROM stock_sync_history')
print(f'总同步记录: {cursor.fetchone()[0]}')

cursor.execute('SELECT product_id, COUNT(*) as cnt FROM stock_sync_history GROUP BY product_id LIMIT 5')
print('\n有同步历史的商品(前5):')
for row in cursor.fetchall():
    print(f'  商品 {row[0][:8]}...: {row[1]} 次同步')

print('\n=== suppliers 统计表 ===')
cursor.execute('SELECT id, name, code, status FROM suppliers')
for row in cursor.fetchall():
    print(f'  {row[0][:8]}... {row[1]} ({row[2]}) status={row[3]}')

print('\n=== 产品示例数据 ===')
cursor.execute('''
    SELECT p.id, p.name, p.stock, p.channelCount, p.activeChannelCount, 
           p.region_limited, p.hasFallback
    FROM products p 
    LIMIT 3
''')
for row in cursor.fetchall():
    print(f'  ID: {row[0][:8]}...')
    print(f'    名称: {row[1]}')
    print(f'    库存: {row[2]}')
    print(f'    总通道数: {row[3]}')
    print(f'    活跃通道数: {row[4]}')
    print(f'    地域限制: {row[5]}')
    print(f'    有备用通道: {row[6]}')
    print()

db.close()
