#!/usr/bin/env python3
"""
SKU 扩充脚本 - 向数据库插入 200+ 商品和对应通道
6大分类，每类30-40个商品，共200+
每个商品3-5个通道，含跨供应商备选
"""

import sqlite3
import uuid
import time
import random
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.db')

def generate_id():
    return str(uuid.uuid4())

def now():
    return int(time.time())

def get_or_create_suppliers(conn):
    """获取或创建供应商"""
    cursor = conn.cursor()
    
    suppliers = [
        {'name': '腾讯充值中心', 'code': 'tencent', 'endpoint': 'https://api.tencent.example.com', 'key': 'tencent_demo_key'},
        {'name': '爱奇艺会员中心', 'code': 'iqiyi', 'endpoint': 'https://api.iqiyi.example.com', 'key': 'iqiyi_demo_key'},
        {'name': '美团外卖券', 'code': 'meituan', 'endpoint': 'https://api.meituan.example.com', 'key': 'meituan_demo_key'},
        {'name': '京东E卡', 'code': 'jd', 'endpoint': 'https://api.jd.example.com', 'key': 'jd_demo_key'},
        {'name': '联通数科', 'code': 'unicom', 'endpoint': 'https://api.unicom.example.com', 'key': 'unicom_demo_key'},
        {'name': '浙江电信', 'code': 'zjtelecom', 'endpoint': 'https://api.zjtelecom.example.com', 'key': 'zjtelecom_demo_key'},
    ]
    
    result = {}
    t = now()
    for sup in suppliers:
        cursor.execute('SELECT id FROM suppliers WHERE code = ?', (sup['code'],))
        row = cursor.fetchone()
        if row:
            result[sup['code']] = row[0]
        else:
            sid = generate_id()
            ratio = round(0.88 + random.random() * 0.08, 2)
            cursor.execute('''
                INSERT INTO suppliers (id, name, code, api_endpoint, api_key, api_secret, status, settlement_ratio, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
            ''', (sid, sup['name'], sup['code'], sup['endpoint'], sup['key'], None, ratio, t))
            result[sup['code']] = sid
            print(f'  新增供应商: {sup["name"]} ({sup["code"]})')
    
    conn.commit()
    return result

def get_or_create_categories(conn):
    """获取或创建分类"""
    cursor = conn.cursor()
    
    categories = [
        {'id': 'c_phone', 'name': '话费充值', 'code': 'phone', 'icon': '📱', 'sort': 1},
        {'id': 'c_data', 'name': '流量充值', 'code': 'data', 'icon': '🌐', 'sort': 2},
        {'id': 'c_video', 'name': '视频会员', 'code': 'video', 'icon': '🎬', 'sort': 3},
        {'id': 'c_food', 'name': '外卖券', 'code': 'food', 'icon': '🍔', 'sort': 4},
        {'id': 'c_card', 'name': '电商购物卡', 'code': 'card', 'icon': '🛒', 'sort': 5},
        {'id': 'c_music', 'name': '音乐会员', 'code': 'music', 'icon': '🎵', 'sort': 6},
    ]
    
    result = {}
    t = now()
    for cat in categories:
        cursor.execute('SELECT id FROM categories WHERE id = ?', (cat['id'],))
        row = cursor.fetchone()
        if row:
            result[cat['code']] = cat['id']
        else:
            cursor.execute('''
                INSERT INTO categories (id, name, code, icon, sort, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (cat['id'], cat['name'], cat['code'], cat['icon'], cat['sort'], t))
            result[cat['code']] = cat['id']
            print(f'  新增分类: {cat["name"]}')
    
    conn.commit()
    return result

def generate_phone_products(suppliers, category_id):
    """生成话费充值商品 - 约36个"""
    products = []
    operators = [
        {'name': '中国移动', 'prefix': '移动', 'supplier_code': 'tencent'},
        {'name': '中国联通', 'prefix': '联通', 'supplier_code': 'unicom'},
        {'name': '中国电信', 'prefix': '电信', 'supplier_code': 'zjtelecom'},
    ]
    values = [10, 20, 30, 50, 100, 200, 300, 500]
    
    sort = 1
    for op in operators:
        for val in values:
            is_hot = 1 if val in [50, 100] and op['prefix'] == '移动' else 0
            price = round(val * (0.98 + random.random() * 0.015), 2)
            cost = round(price * 0.96, 2)
            commission = round(0.02 + random.random() * 0.02, 3)
            stock = 5000 + random.randint(0, 5000)
            
            products.append({
                'name': f'{op["prefix"]}话费{val}元',
                'category_id': category_id,
                'supplier_id': suppliers[op['supplier_code']],
                'supplier_product_id': f'PHONE-{op["prefix"]}-{val}',
                'sku_type': 'recharge',
                'face_value': val,
                'price': price,
                'cost_price': cost,
                'commission_rate': commission,
                'stock': stock,
                'image': f'话费{val}元',
                'description': f'{op["prefix"]}话费{val}元，官方直充，1-10分钟到账',
                'is_hot': is_hot,
                'recharge_type': 'auto',
                'sort': sort,
            })
            sort += 1
    
    return products

def generate_data_products(suppliers, category_id):
    """生成流量充值商品 - 约40个"""
    products = []
    types = [
        {'name': '全国通用', 'prefix': '全国', 'suffix': '', 'supplier_code': 'tencent'},
        {'name': '定向流量', 'prefix': '定向', 'suffix': '（抖音/快手）', 'supplier_code': 'unicom'},
        {'name': '省内流量', 'prefix': '省内', 'suffix': '（广东）', 'supplier_code': 'zjtelecom'},
        {'name': '日租包', 'prefix': '日租', 'suffix': '（当日有效）', 'supplier_code': 'tencent'},
    ]
    sizes = [
        ('100M', 100, 3),
        ('500M', 500, 8),
        ('1GB', 1024, 12),
        ('3GB', 3072, 25),
        ('5GB', 5120, 38),
        ('10GB', 10240, 68),
        ('20GB', 20480, 118),
        ('50GB', 51200, 198),
        ('100GB', 102400, 298),
    ]
    
    sort = 1
    for tp in types:
        for size_label, size_mb, base_price in sizes:
            is_hot = 1 if size_label in ['1GB', '5GB', '10GB'] and tp['prefix'] == '全国' else 0
            price = round(base_price * (0.95 + random.random() * 0.1), 2)
            cost = round(price * 0.92, 2)
            commission = round(0.04 + random.random() * 0.03, 3)
            stock = 3000 + random.randint(0, 4000)
            
            products.append({
                'name': f'{tp["prefix"]}流量{size_label}{tp["suffix"]}',
                'category_id': category_id,
                'supplier_id': suppliers[tp['supplier_code']],
                'supplier_product_id': f'DATA-{tp["prefix"]}-{size_label}',
                'sku_type': 'recharge',
                'face_value': base_price,
                'price': price,
                'cost_price': cost,
                'commission_rate': commission,
                'stock': stock,
                'image': f'流量{size_label}',
                'description': f'{tp["prefix"]}流量{size_label}{tp["suffix"]}，官方直充，即时到账',
                'is_hot': is_hot,
                'recharge_type': 'auto',
                'sort': sort,
            })
            sort += 1
    
    return products[:40]

def generate_video_products(suppliers, category_id):
    """生成视频会员商品 - 约36个"""
    products = []
    platforms = [
        {'name': '爱奇艺', 'brand': '爱奇艺', 'member': '黄金会员', 'supplier_code': 'iqiyi'},
        {'name': '腾讯视频', 'brand': '腾讯视频', 'member': 'VIP会员', 'supplier_code': 'tencent'},
        {'name': '优酷视频', 'brand': '优酷', 'member': 'VIP会员', 'supplier_code': 'unicom'},
        {'name': '芒果TV', 'brand': '芒果TV', 'member': 'VIP会员', 'supplier_code': 'iqiyi'},
        {'name': '哔哩哔哩', 'brand': 'B站', 'member': '大会员', 'supplier_code': 'tencent'},
        {'name': '搜狐视频', 'brand': '搜狐', 'member': 'VIP会员', 'supplier_code': 'zjtelecom'},
    ]
    durations = [
        {'name': '周卡', 'days': 7, 'base_price': 15},
        {'name': '月卡', 'days': 30, 'base_price': 30},
        {'name': '季卡', 'days': 90, 'base_price': 78},
        {'name': '半年卡', 'days': 180, 'base_price': 148},
        {'name': '年卡', 'days': 365, 'base_price': 248},
        {'name': '连续包月', 'days': 30, 'base_price': 25},
    ]
    
    sort = 1
    for plat in platforms:
        for dur in durations:
            is_hot = 1 if dur['name'] in ['月卡', '年卡'] and plat['brand'] in ['爱奇艺', '腾讯视频'] else 0
            price = round(dur['base_price'] * (0.8 + random.random() * 0.15), 2)
            cost = round(price * 0.88, 2)
            commission = round(0.06 + random.random() * 0.05, 3)
            stock = 2000 + random.randint(0, 3000)
            
            products.append({
                'name': f'{plat["brand"]}{plat["member"]}{dur["name"]}',
                'category_id': category_id,
                'supplier_id': suppliers[plat['supplier_code']],
                'supplier_product_id': f'VIDEO-{plat["brand"]}-{dur["name"]}',
                'sku_type': 'recharge',
                'face_value': dur['base_price'],
                'price': price,
                'cost_price': cost,
                'commission_rate': commission,
                'stock': stock,
                'image': f'{plat["brand"]}{dur["name"]}',
                'description': f'{plat["name"]}{plat["member"]}{dur["name"]}，官方直充，秒到账',
                'is_hot': is_hot,
                'recharge_type': 'auto',
                'sort': sort,
            })
            sort += 1
    
    return products

def generate_food_products(suppliers, category_id):
    """生成外卖券商品 - 约35个"""
    products = []
    brands = [
        {'name': '美团外卖', 'prefix': '美团外卖券', 'supplier_code': 'meituan', 'sku_type': 'card'},
        {'name': '饿了么', 'prefix': '饿了么券', 'supplier_code': 'jd', 'sku_type': 'card'},
        {'name': '肯德基', 'prefix': '肯德基', 'supplier_code': 'meituan', 'sku_type': 'card'},
        {'name': '麦当劳', 'prefix': '麦当劳', 'supplier_code': 'meituan', 'sku_type': 'card'},
        {'name': '星巴克', 'prefix': '星巴克', 'supplier_code': 'jd', 'sku_type': 'card'},
    ]
    values = [5, 10, 20, 30, 50, 100, 200]
    
    sort = 1
    for brand in brands:
        for val in values:
            is_hot = 1 if val in [20, 50] and brand['prefix'] == '美团外卖券' else 0
            price = round(val * (0.92 + random.random() * 0.05), 2)
            cost = round(price * 0.94, 2)
            commission = round(0.03 + random.random() * 0.02, 3)
            stock = 1000 + random.randint(0, 2000)
            
            products.append({
                'name': f'{brand["prefix"]}{val}元',
                'category_id': category_id,
                'supplier_id': suppliers[brand['supplier_code']],
                'supplier_product_id': f'FOOD-{brand["prefix"]}-{val}',
                'sku_type': brand['sku_type'],
                'face_value': val,
                'price': price,
                'cost_price': cost,
                'commission_rate': commission,
                'stock': stock,
                'image': f'{brand["prefix"]}{val}',
                'description': f'{brand["name"]}{val}元代金券，正品卡密，即买即用',
                'is_hot': is_hot,
                'recharge_type': 'card',
                'sort': sort,
            })
            sort += 1
    
    return products

def generate_card_products(suppliers, category_id):
    """生成电商购物卡商品 - 约35个"""
    products = []
    brands = [
        {'name': '京东E卡', 'prefix': '京东E卡', 'supplier_code': 'jd', 'sku_type': 'card'},
        {'name': '天猫超市卡', 'prefix': '天猫超市卡', 'supplier_code': 'tencent', 'sku_type': 'card'},
        {'name': '苏宁易购卡', 'prefix': '苏宁卡', 'supplier_code': 'zjtelecom', 'sku_type': 'card'},
        {'name': '唯品会卡', 'prefix': '唯品卡', 'supplier_code': 'jd', 'sku_type': 'card'},
        {'name': '当当卡', 'prefix': '当当卡', 'supplier_code': 'unicom', 'sku_type': 'card'},
    ]
    values = [10, 20, 50, 100, 200, 500, 1000]
    
    sort = 1
    for brand in brands:
        for val in values:
            is_hot = 1 if val in [100, 500] and brand['prefix'] == '京东E卡' else 0
            price = round(val * (0.97 + random.random() * 0.02), 2)
            cost = round(price * 0.98, 2)
            commission = round(0.015 + random.random() * 0.015, 3)
            stock = 800 + random.randint(0, 1500)
            
            products.append({
                'name': f'{brand["prefix"]}{val}元',
                'category_id': category_id,
                'supplier_id': suppliers[brand['supplier_code']],
                'supplier_product_id': f'CARD-{brand["prefix"]}-{val}',
                'sku_type': brand['sku_type'],
                'face_value': val,
                'price': price,
                'cost_price': cost,
                'commission_rate': commission,
                'stock': stock,
                'image': f'{brand["prefix"]}{val}',
                'description': f'{brand["name"]}{val}元电子卡，官方正品，全国通用',
                'is_hot': is_hot,
                'recharge_type': 'card',
                'sort': sort,
            })
            sort += 1
    
    return products

def generate_music_products(suppliers, category_id):
    """生成音乐会员商品 - 约36个"""
    products = []
    platforms = [
        {'name': 'QQ音乐', 'brand': 'QQ音乐', 'member': '绿钻豪华版', 'supplier_code': 'tencent'},
        {'name': '网易云音乐', 'brand': '网易云音乐', 'member': '黑胶VIP', 'supplier_code': 'iqiyi'},
        {'name': '酷狗音乐', 'brand': '酷狗音乐', 'member': 'VIP会员', 'supplier_code': 'unicom'},
        {'name': '酷我音乐', 'brand': '酷我音乐', 'member': '豪华VIP', 'supplier_code': 'zjtelecom'},
        {'name': '咪咕音乐', 'brand': '咪咕音乐', 'member': '白金会员', 'supplier_code': 'unicom'},
        {'name': '全民K歌', 'brand': '全民K歌', 'member': 'VIP会员', 'supplier_code': 'tencent'},
    ]
    durations = [
        {'name': '周卡', 'days': 7, 'base_price': 8},
        {'name': '月卡', 'days': 30, 'base_price': 18},
        {'name': '季卡', 'days': 90, 'base_price': 48},
        {'name': '半年卡', 'days': 180, 'base_price': 88},
        {'name': '年卡', 'days': 365, 'base_price': 168},
        {'name': '连续包月', 'days': 30, 'base_price': 15},
    ]
    
    sort = 1
    for plat in platforms:
        for dur in durations:
            is_hot = 1 if dur['name'] in ['月卡', '年卡'] and plat['brand'] in ['QQ音乐', '网易云音乐'] else 0
            price = round(dur['base_price'] * (0.82 + random.random() * 0.12), 2)
            cost = round(price * 0.88, 2)
            commission = round(0.05 + random.random() * 0.04, 3)
            stock = 2500 + random.randint(0, 3000)
            
            products.append({
                'name': f'{plat["brand"]}{plat["member"]}{dur["name"]}',
                'category_id': category_id,
                'supplier_id': suppliers[plat['supplier_code']],
                'supplier_product_id': f'MUSIC-{plat["brand"]}-{dur["name"]}',
                'sku_type': 'recharge',
                'face_value': dur['base_price'],
                'price': price,
                'cost_price': cost,
                'commission_rate': commission,
                'stock': stock,
                'image': f'{plat["brand"]}{dur["name"]}',
                'description': f'{plat["name"]}{plat["member"]}{dur["name"]}，官方直充，秒到账',
                'is_hot': is_hot,
                'recharge_type': 'auto',
                'sort': sort,
            })
            sort += 1
    
    return products

def generate_channels_for_product(product_id, main_supplier_id, all_supplier_ids):
    """为商品生成3-5个通道，含跨供应商备选"""
    channels = []
    
    num_channels = random.randint(3, 5)
    
    supplier_pool = [main_supplier_id]
    for sid in all_supplier_ids:
        if sid != main_supplier_id and len(supplier_pool) < num_channels:
            if random.random() > 0.3:
                supplier_pool.append(sid)
    
    while len(supplier_pool) < num_channels:
        sid = random.choice(all_supplier_ids)
        if sid not in supplier_pool:
            supplier_pool.append(sid)
    
    supplier_pool = supplier_pool[:num_channels]
    
    for idx, sup_id in enumerate(supplier_pool):
        priority = (idx + 1) * 10
        base_success = 0.92 if idx == 0 else 0.85 + random.random() * 0.08
        success_rate = round(min(0.99, base_success + random.random() * 0.05), 3)
        status = 1 if idx < 3 else random.choice([1, 1, 0])
        
        channels.append({
            'product_id': product_id,
            'supplier_id': sup_id,
            'priority': priority,
            'success_rate': success_rate,
            'status': status,
        })
    
    return channels

def insert_products(conn, products):
    """批量插入商品"""
    cursor = conn.cursor()
    t = now()
    product_ids = []
    
    for p in products:
        pid = generate_id()
        cursor.execute('''
            INSERT INTO products (
                id, name, category_id, supplier_id, supplier_product_id, sku_type,
                face_value, price, cost_price, commission_rate, stock, stock_warning,
                image, description, status, sort, is_hot, recharge_type, region_limit,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, ?, 1, ?, ?, ?, NULL, ?, ?)
        ''', (
            pid, p['name'], p['category_id'], p['supplier_id'], p['supplier_product_id'],
            p['sku_type'], p['face_value'], p['price'], p['cost_price'], p['commission_rate'],
            p['stock'], p['image'], p['description'], p['sort'], p['is_hot'],
            p['recharge_type'], t, t
        ))
        product_ids.append((pid, p['supplier_id']))
    
    conn.commit()
    return product_ids

def insert_channels(conn, product_supplier_pairs, all_supplier_ids):
    """批量插入通道"""
    cursor = conn.cursor()
    t = now()
    channel_count = 0
    
    for product_id, main_supplier_id in product_supplier_pairs:
        channels = generate_channels_for_product(product_id, main_supplier_id, all_supplier_ids)
        for ch in channels:
            ch_id = generate_id()
            cursor.execute('''
                INSERT INTO recharge_channels (
                    id, product_id, supplier_id, priority, success_rate, last_fail_time, status
                ) VALUES (?, ?, ?, ?, ?, NULL, ?)
            ''', (ch_id, ch['product_id'], ch['supplier_id'], ch['priority'], ch['success_rate'], ch['status']))
            channel_count += 1
    
    conn.commit()
    return channel_count

def insert_region_limits(conn, product_ids):
    """为部分商品添加地域限制"""
    cursor = conn.cursor()
    t = now()
    count = 0
    
    regions = ['新疆', '西藏', '青海', '内蒙古', '宁夏']
    
    for i, (pid, _) in enumerate(product_ids):
        if i % 7 == 0:
            num_regions = random.randint(1, 2)
            selected = random.sample(regions, num_regions)
            for reg in selected:
                rid = generate_id()
                cursor.execute('''
                    INSERT INTO region_limits (id, product_id, region_code, allow, created_at)
                    VALUES (?, ?, ?, 0, ?)
                ''', (rid, pid, reg, t))
                count += 1
    
    conn.commit()
    return count

def insert_stock_sync_history(conn, product_ids):
    """为商品插入库存同步历史（最近3次）"""
    cursor = conn.cursor()
    t = now()
    count = 0
    
    for pid, _ in product_ids:
        product = cursor.execute('SELECT stock FROM products WHERE id = ?', (pid,)).fetchone()
        if not product:
            continue
        
        current_stock = product[0]
        prev_stock = current_stock
        
        for i in range(3):
            hid = generate_id()
            variance = random.randint(-50, 50)
            before = prev_stock - variance
            after = prev_stock
            sync_time = t - (i + 1) * 3600 * (random.randint(2, 8))
            batch_no = time.strftime('BATCH%Y%m%d%H', time.localtime(sync_time))
            
            cursor.execute('''
                INSERT INTO stock_sync_history (
                    id, product_id, before_stock, after_stock, variance, sync_time, sync_batch
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (hid, pid, before, after, variance, sync_time, batch_no))
            count += 1
            prev_stock = before
    
    conn.commit()
    return count

def init_tables(conn):
    """初始化需要的表"""
    cursor = conn.cursor()
    
    cursor.execute('''
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
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_stock_sync_product ON stock_sync_history(product_id)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_stock_sync_time ON stock_sync_history(sync_time)
    ''')
    
    conn.commit()

def main():
    print('=' * 60)
    print('SKU 扩充脚本 - 向数据库插入 200+ 商品')
    print('=' * 60)
    
    conn = sqlite3.connect(DB_PATH)
    conn.execute('PRAGMA foreign_keys = ON')
    
    init_tables(conn)
    
    try:
        print('\n1. 检查/创建供应商...')
        suppliers = get_or_create_suppliers(conn)
        supplier_ids = list(suppliers.values())
        print(f'   共 {len(supplier_ids)} 个供应商')
        
        print('\n2. 检查/创建分类...')
        categories = get_or_create_categories(conn)
        print(f'   共 {len(categories)} 个分类')
        
        print('\n3. 生成商品数据...')
        all_products = []
        
        generators = [
            ('话费充值', generate_phone_products, 'phone'),
            ('流量充值', generate_data_products, 'data'),
            ('视频会员', generate_video_products, 'video'),
            ('外卖券', generate_food_products, 'food'),
            ('电商购物卡', generate_card_products, 'card'),
            ('音乐会员', generate_music_products, 'music'),
        ]
        
        for name, generator, cat_code in generators:
            cat_id = categories[cat_code]
            prods = generator(suppliers, cat_id)
            all_products.extend(prods)
            print(f'   {name}: {len(prods)} 个商品')
        
        print(f'   总计: {len(all_products)} 个商品')
        
        print('\n4. 插入商品数据...')
        product_supplier_pairs = insert_products(conn, all_products)
        print(f'   已插入 {len(product_supplier_pairs)} 个商品')
        
        print('\n5. 插入通道数据...')
        channel_count = insert_channels(conn, product_supplier_pairs, supplier_ids)
        print(f'   已插入 {channel_count} 个通道')
        
        print('\n6. 插入地域限制...')
        region_count = insert_region_limits(conn, product_supplier_pairs)
        print(f'   已添加 {region_count} 条地域限制')
        
        print('\n7. 插入库存同步历史...')
        history_count = insert_stock_sync_history(conn, product_supplier_pairs)
        print(f'   已插入 {history_count} 条同步历史')
        
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM products')
        total_products = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM recharge_channels')
        total_channels = cursor.fetchone()[0]
        
        print('\n' + '=' * 60)
        print('✅ 完成！')
        print(f'   商品总数: {total_products}')
        print(f'   通道总数: {total_channels}')
        print('=' * 60)
        
    except Exception as e:
        print(f'\n❌ 错误: {e}')
        conn.rollback()
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == '__main__':
    main()
