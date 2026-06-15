#!/usr/bin/env python3
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.db')

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print('=== 商品统计 ===')
    cursor.execute('SELECT COUNT(*) FROM products')
    print(f'总商品数: {cursor.fetchone()[0]}')

    print('\n=== 按分类统计 ===')
    cursor.execute('''
        SELECT c.name, COUNT(p.id) as cnt 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id 
        GROUP BY c.id 
        ORDER BY c.sort
    ''')
    for row in cursor.fetchall():
        print(f'  {row[0]}: {row[1]} 个')

    print('\n=== 通道统计 ===')
    cursor.execute('SELECT COUNT(*) FROM recharge_channels')
    print(f'总通道数: {cursor.fetchone()[0]}')

    print('\n=== 库存同步历史 ===')
    cursor.execute('SELECT COUNT(*) FROM stock_sync_history')
    print(f'同步历史记录数: {cursor.fetchone()[0]}')

    print('\n=== 供应商统计 ===')
    cursor.execute('SELECT COUNT(*) FROM suppliers')
    print(f'供应商数: {cursor.fetchone()[0]}')
    cursor.execute('SELECT name, code FROM suppliers ORDER BY created_at')
    for row in cursor.fetchall():
        print(f'  - {row[0]} ({row[1]})')

    print('\n=== 前5个商品详情 ===')
    cursor.execute('''
        SELECT p.id, p.name, p.price, p.stock, p.sku_type, s.name as sup_name, c.name as cat_name
        FROM products p 
        LEFT JOIN suppliers s ON p.supplier_id = s.id 
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 5
    ''')
    for row in cursor.fetchall():
        pid, name, price, stock, sku_type, sup_name, cat_name = row
        print(f'  [{cat_name}] {name}')
        print(f'    价格: ¥{price}, 库存: {stock}, 类型: {sku_type}, 供应商: {sup_name}')
        
        cursor.execute('SELECT COUNT(*) FROM recharge_channels WHERE product_id = ?', (pid,))
        ch_count = cursor.fetchone()[0]
        print(f'    通道数: {ch_count}')
        
        cursor.execute('SELECT COUNT(*) FROM stock_sync_history WHERE product_id = ?', (pid,))
        hist_count = cursor.fetchone()[0]
        print(f'    同步历史: {hist_count} 条')
        
        if hist_count > 0:
            cursor.execute('''
                SELECT before_stock, after_stock, variance, sync_time 
                FROM stock_sync_history 
                WHERE product_id = ? 
                ORDER BY sync_time DESC 
                LIMIT 2
            ''', (pid,))
            for h in cursor.fetchall():
                print(f'      - 库存: {h[0]} -> {h[1]} (变化: {h[2]})')

    conn.close()

if __name__ == '__main__':
    main()
