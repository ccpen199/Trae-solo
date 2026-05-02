#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
游戏内购商城系统后端
使用 Flask + 原生 SQLite，无需编译，快速启动
"""

import os
import json
import sqlite3
import hashlib
import uuid
import hmac
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import secrets

app = Flask(__name__)
CORS(app, origins=["http://localhost:21682"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), 'data')
DB_PATH = os.path.join(DATA_DIR, 'app.sqlite')
JWT_SECRET = os.environ.get('JWT_SECRET', 'game-shop-secret-key-2026')
BACKEND_PORT = int(os.environ.get('PORT', 21681))

os.makedirs(DATA_DIR, exist_ok=True)


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def execute_query(query, args=(), commit=False):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(query, args)
    if commit:
        db.commit()
    return cursor


def dict_from_row(row):
    if row is None:
        return None
    return dict(row)


def dict_from_rows(rows):
    return [dict(r) for r in rows]


def generate_uuid():
    return str(uuid.uuid4())


def hash_password(password):
    return hashlib.sha256((password + JWT_SECRET).encode()).hexdigest()


def verify_password(password, hashed):
    return hash_password(password) == hashed


def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': (datetime.now() + timedelta(days=7)).timestamp()
    }
    payload_json = json.dumps(payload)
    signature = hmac.new(JWT_SECRET.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
    return f"{payload_json}:{signature}"


def verify_token(token):
    try:
        payload_json, signature = token.rsplit(':', 1)
        expected_signature = hmac.new(JWT_SECRET.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            return None
        payload = json.loads(payload_json)
        if payload['exp'] < datetime.now().timestamp():
            return None
        return payload
    except:
        return None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': '未授权访问'}), 401
        token = auth_header[7:]
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token无效或已过期'}), 401
        g.current_user = {
            'id': payload['user_id'],
            'role': payload['role']
        }
        return f(*args, **kwargs)
    return decorated


def idempotency_check():
    idempotency_key = request.headers.get('X-Idempotency-Key')
    if idempotency_key:
        existing = execute_query(
            'SELECT id FROM orders WHERE idempotency_key = ?',
            (idempotency_key,)
        ).fetchone()
        if existing:
            return jsonify({'error': '重复请求', 'order_id': existing['id']}), 409
    return None


def init_database():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        cursor.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nickname TEXT,
            email TEXT,
            phone TEXT,
            avatar TEXT,
            role TEXT NOT NULL DEFAULT 'PLAYER',
            vip_level INTEGER DEFAULT 0,
            balance REAL DEFAULT 0,
            total_paid INTEGER DEFAULT 0,
            points INTEGER DEFAULT 0,
            metadata TEXT DEFAULT '{}',
            is_active INTEGER DEFAULT 1,
            last_login_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            original_price REAL NOT NULL,
            current_price REAL NOT NULL,
            inventory_quantity INTEGER DEFAULT -1,
            max_per_order INTEGER DEFAULT 99,
            max_per_player INTEGER DEFAULT -1,
            min_vip_level INTEGER DEFAULT 0,
            item_data TEXT DEFAULT '{}',
            tags TEXT DEFAULT '[]',
            image_url TEXT,
            created_by TEXT NOT NULL,
            approved_by TEXT,
            approved_at TEXT,
            status TEXT NOT NULL DEFAULT 'DRAFT',
            start_time TEXT,
            end_time TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_no TEXT UNIQUE NOT NULL,
            player_id TEXT NOT NULL,
            order_type TEXT NOT NULL DEFAULT 'PURCHASE',
            original_amount REAL NOT NULL,
            discount_amount REAL DEFAULT 0,
            final_amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'CNY',
            payment_method TEXT,
            channel_order_id TEXT,
            status TEXT NOT NULL DEFAULT 'PENDING',
            paid_at TEXT,
            shipped_at TEXT,
            completed_at TEXT,
            cancelled_at TEXT,
            refunded_at TEXT,
            idempotency_key TEXT UNIQUE,
            retry_count INTEGER DEFAULT 0,
            client_ip TEXT,
            user_agent TEXT,
            metadata TEXT DEFAULT '{}',
            parent_order_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_code TEXT NOT NULL,
            product_name TEXT NOT NULL,
            product_type TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            original_price REAL NOT NULL,
            discount_price REAL NOT NULL,
            unit_price REAL NOT NULL,
            subtotal REAL NOT NULL,
            discount_amount REAL DEFAULT 0,
            final_amount REAL NOT NULL,
            item_data TEXT DEFAULT '{}',
            delivery_data TEXT DEFAULT '{}',
            is_delivered INTEGER DEFAULT 0,
            delivered_at TEXT,
            is_refunded INTEGER DEFAULT 0,
            refund_amount REAL DEFAULT 0,
            refunded_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            payment_no TEXT UNIQUE NOT NULL,
            order_id TEXT NOT NULL,
            player_id TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'CNY',
            payment_method TEXT NOT NULL,
            channel TEXT,
            channel_order_id TEXT,
            channel_data TEXT,
            callback_signature TEXT,
            is_verified INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'PENDING',
            retry_count INTEGER DEFAULT 0,
            paid_at TEXT,
            failed_at TEXT,
            refunded_at TEXT,
            idempotency_key TEXT UNIQUE,
            metadata TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS backpack_items (
            id TEXT PRIMARY KEY,
            player_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_code TEXT NOT NULL,
            product_name TEXT NOT NULL,
            product_type TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            locked_quantity INTEGER DEFAULT 0,
            item_data TEXT DEFAULT '{}',
            expire_data TEXT DEFAULT '{}',
            expire_at TEXT,
            order_item_id TEXT,
            source_id TEXT,
            source_type TEXT NOT NULL DEFAULT 'PURCHASE',
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS inventory_locks (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            product_code TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            order_id TEXT NOT NULL,
            player_id TEXT NOT NULL,
            lock_type TEXT NOT NULL DEFAULT 'ORDER',
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            expire_at TEXT NOT NULL,
            released_at TEXT,
            released_by TEXT,
            metadata TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vip_benefits (
            id TEXT PRIMARY KEY,
            vip_level INTEGER UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            discount_percent REAL DEFAULT 0,
            extra_points_rate REAL DEFAULT 1,
            daily_gift_quantity INTEGER DEFAULT 0,
            daily_gift_items TEXT DEFAULT '[]',
            priority_access_days INTEGER DEFAULT 0,
            exclusive_product_ids TEXT DEFAULT '[]',
            can_use_coupon INTEGER DEFAULT 1,
            can_stack_discounts INTEGER DEFAULT 0,
            max_simultaneous_orders INTEGER DEFAULT 5,
            refund_grace_hours INTEGER DEFAULT 24,
            is_enabled INTEGER DEFAULT 1,
            metadata TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS promotions (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            discount_type TEXT,
            discount_value REAL,
            min_order_amount REAL DEFAULT 0,
            max_uses_per_player INTEGER DEFAULT 1,
            max_uses_total INTEGER DEFAULT -1,
            used_count INTEGER DEFAULT 0,
            product_ids TEXT DEFAULT '[]',
            category_ids TEXT DEFAULT '[]',
            excluded_product_ids TEXT DEFAULT '[]',
            min_vip_level INTEGER DEFAULT 0,
            stackable TEXT DEFAULT 'NEVER',
            priority INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'DRAFT',
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            created_by TEXT NOT NULL,
            approved_by TEXT,
            approved_at TEXT,
            metadata TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            channel TEXT NOT NULL DEFAULT 'IN_APP',
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            metadata TEXT DEFAULT '{}',
            is_read INTEGER DEFAULT 0,
            read_at TEXT,
            is_deleted INTEGER DEFAULT 0,
            deleted_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS status_flows (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            old_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            reason TEXT,
            operator_id TEXT,
            operator_role TEXT,
            client_ip TEXT,
            metadata TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            old_value TEXT DEFAULT '{}',
            new_value TEXT DEFAULT '{}',
            operator_id TEXT,
            operator_role TEXT,
            operator_ip TEXT,
            user_agent TEXT,
            request_info TEXT DEFAULT '{}',
            idempotency_key TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stats_snapshots (
            id TEXT PRIMARY KEY,
            snapshot_date TEXT NOT NULL,
            snapshot_type TEXT NOT NULL,
            granularity TEXT NOT NULL DEFAULT 'DAILY',
            total_orders INTEGER DEFAULT 0,
            completed_orders INTEGER DEFAULT 0,
            cancelled_orders INTEGER DEFAULT 0,
            total_revenue REAL DEFAULT 0,
            total_discount REAL DEFAULT 0,
            total_refund REAL DEFAULT 0,
            new_players INTEGER DEFAULT 0,
            paying_players INTEGER DEFAULT 0,
            items_sold INTEGER DEFAULT 0,
            product_stats TEXT DEFAULT '{}',
            category_stats TEXT DEFAULT '{}',
            channel_stats TEXT DEFAULT '{}',
            vip_stats TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(snapshot_date, snapshot_type, granularity)
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            ticket_no TEXT UNIQUE NOT NULL,
            player_id TEXT NOT NULL,
            order_id TEXT,
            type TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'NORMAL',
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'OPEN',
            assigned_to TEXT,
            source TEXT DEFAULT 'PLAYER_SUBMIT',
            metadata TEXT DEFAULT '{}',
            resolved_at TEXT,
            closed_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS ticket_messages (
            id TEXT PRIMARY KEY,
            ticket_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            sender_role TEXT NOT NULL,
            sender_name TEXT,
            content TEXT NOT NULL,
            message_type TEXT NOT NULL DEFAULT 'TEXT',
            attachment_ids TEXT DEFAULT '[]',
            is_internal INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_tickets_player ON tickets(player_id);
        CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
        CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);
        CREATE INDEX IF NOT EXISTS idx_ticket_messages ON ticket_messages(ticket_id, created_at);
        ''')
        
        db.commit()
        
        cursor.execute('SELECT COUNT(*) as cnt FROM users')
        if cursor.fetchone()['cnt'] == 0:
            init_seed_data()
        
        print('数据库初始化完成')


def init_seed_data():
    now = datetime.now().isoformat()
    start_30d_ago = (datetime.now() - timedelta(days=30)).isoformat()
    end_365d_later = (datetime.now() + timedelta(days=365)).isoformat()
    end_7d_later = (datetime.now() + timedelta(days=7)).isoformat()
    start_7d_ago = (datetime.now() - timedelta(days=7)).isoformat()
    end_30d_later = (datetime.now() + timedelta(days=30)).isoformat()
    
    pwd = hash_password('123456')
    
    execute_query('''
    INSERT INTO vip_benefits (id, vip_level, name, description, discount_percent, extra_points_rate, 
                                daily_gift_quantity, daily_gift_items, priority_access_days, exclusive_product_ids,
                                can_use_coupon, can_stack_discounts, max_simultaneous_orders, refund_grace_hours, is_enabled)
    VALUES 
        ('00000000-0000-0000-0000-000000000000', 0, '普通玩家', '基础会员等级', 0, 1.0, 0, '[]', 0, '[]', 1, 0, 3, 24, 1),
        ('00000000-0000-0000-0000-000000000001', 1, 'VIP1', 'VIP1会员', 5, 1.2, 1, '[{"code":"GOLD_COIN","quantity":100}]', 0, '[]', 1, 0, 5, 48, 1),
        ('00000000-0000-0000-0000-000000000002', 2, 'VIP2', 'VIP2会员', 10, 1.5, 2, '[{"code":"GOLD_COIN","quantity":200},{"code":"EXP_BOOST","quantity":1}]', 1, '[]', 1, 0, 8, 72, 1),
        ('00000000-0000-0000-0000-000000000003', 3, 'VIP3', 'VIP3会员', 15, 2.0, 3, '[{"code":"GOLD_COIN","quantity":500},{"code":"EXP_BOOST","quantity":2},{"code":"GEM","quantity":10}]', 3, '[]', 1, 1, 10, 168, 1)
    ''', commit=True)
    
    execute_query('''
    INSERT INTO users (id, username, password, nickname, email, phone, role, vip_level, balance, total_paid, points, metadata, is_active)
    VALUES 
        ('10000000-0000-0000-0000-000000000001', 'admin', ?, '系统管理员', 'admin@game.com', '13800000001', 'ADMIN', 0, 0, 0, 0, '{}', 1),
        ('10000000-0000-0000-0000-000000000002', 'planner01', ?, '策划师小王', 'planner01@game.com', '13800000002', 'PLANNER', 0, 0, 0, 0, '{}', 1),
        ('10000000-0000-0000-0000-000000000003', 'operator01', ?, '运营小李', 'operator01@game.com', '13800000003', 'OPERATOR', 0, 0, 0, 0, '{}', 1),
        ('10000000-0000-0000-0000-000000000004', 'cs01', ?, '客服小张', 'cs01@game.com', '13800000004', 'CUSTOMER_SERVICE', 0, 0, 0, 0, '{}', 1),
        ('10000000-0000-0000-0000-000000000010', 'player01', ?, '勇敢的战士', 'player01@game.com', '13900000010', 'PLAYER', 2, 1000.00, 5000, 12500, '{"server_id":1,"character_id":"CHAR_001"}', 1),
        ('10000000-0000-0000-0000-000000000011', 'player02', ?, '神秘法师', 'player02@game.com', '13900000011', 'PLAYER', 0, 100.00, 0, 0, '{"server_id":1,"character_id":"CHAR_002"}', 1)
    ''', (pwd, pwd, pwd, pwd, pwd, pwd), commit=True)
    
    execute_query('''
    INSERT INTO products (id, code, name, description, type, category, original_price, current_price, 
                           inventory_quantity, max_per_order, max_per_player, min_vip_level, item_data, tags, image_url,
                           created_by, approved_by, approved_at, status)
    VALUES 
        ('20000000-0000-0000-0000-000000000001', 'GOLD_1000', '金币礼包(1000)', '获得1000金币', 'CURRENCY', 'CURRENCY', 10.00, 10.00, 
         -1, 99, -1, 0, '{"currency_type":"GOLD","amount":1000}', '["热销","金币"]', '/images/products/gold_1000.png',
         '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', ?, 'ACTIVE'),
        ('20000000-0000-0000-0000-000000000002', 'GOLD_5000', '金币礼包(5000)', '获得5000金币，附赠500金币', 'CURRENCY', 'CURRENCY', 50.00, 45.00, 
         -1, 99, -1, 0, '{"currency_type":"GOLD","amount":5500}', '["热销","金币","特惠"]', '/images/products/gold_5000.png',
         '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', ?, 'ACTIVE'),
        ('20000000-0000-0000-0000-000000000003', 'GEM_100', '宝石礼包(100)', '获得100宝石', 'CURRENCY', 'CURRENCY', 30.00, 30.00, 
         -1, 99, -1, 0, '{"currency_type":"GEM","amount":100}', '["宝石","高级"]', '/images/products/gem_100.png',
         '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', ?, 'ACTIVE'),
        ('20000000-0000-0000-0000-000000000004', 'EXP_BOOST_7D', '经验加成卡(7天)', '7天内经验获得+50%', 'ITEM', 'POTION', 50.00, 40.00, 
         -1, 10, -1, 0, '{"effect_type":"EXP_BOOST","value":0.5,"duration_days":7}', '["经验","加成","限时特惠"]', '/images/products/exp_boost.png',
         '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', ?, 'ACTIVE'),
        ('20000000-0000-0000-0000-000000000005', 'LIMITED_WEAPON_01', '屠龙宝刀(限量)', '传说级武器，全服限量1000把', 'ITEM', 'WEAPON', 999.00, 888.00, 
         876, 1, 1, 2, '{"item_level":50,"attack":1500,"defense":200,"critical_rate":0.15}', '["限时","限量","传说"]', '/images/products/dragon_sword.png',
         '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', ?, 'ACTIVE'),
        ('20000000-0000-0000-0000-000000000006', 'VIP_MONTHLY', '月卡会员', '30天VIP会员，每日领取奖励', 'SUBSCRIPTION', 'VIP', 98.00, 88.00, 
         -1, 1, -1, 0, '{"vip_level":1,"duration_days":30,"daily_rewards":[{"code":"GOLD_COIN","quantity":200},{"code":"GEM","quantity":10}]}', '["月卡","VIP","超值"]', '/images/products/vip_monthly.png',
         '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', ?, 'ACTIVE')
    ''', (now, now, now, now, now, now), commit=True)
    
    execute_query('''
    INSERT INTO promotions (id, code, name, type, discount_type, discount_value, min_order_amount, 
                             max_uses_per_player, max_uses_total, used_count, product_ids, category_ids, 
                             excluded_product_ids, min_vip_level, stackable, priority, status, 
                             start_time, end_time, created_by, approved_by, approved_at, metadata)
    VALUES 
        ('30000000-0000-0000-0000-000000000001', 'NEW_PLAYER_20', '新人首单立减20%', 'DISCOUNT', 'PERCENTAGE', 20, 0, 
         1, -1, 0, '[]', '[]', '[]', 0, 'NEVER', 100, 'ACTIVE', 
         ?, ?, '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', ?, '{"description":"新玩家首单享受20%折扣"}'),
        ('30000000-0000-0000-0000-000000000002', 'SAVE_100', '满500减100', 'COUPON', 'FIXED_AMOUNT', 100, 500, 
         3, 10000, 2345, '[]', '[]', '[]', 0, 'WITH_OTHER_TYPES', 50, 'ACTIVE', 
         ?, ?, '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', ?, '{"description":"限时促销，满500立减100"}')
    ''', (start_30d_ago, end_365d_later, now, start_7d_ago, end_7d_later, now), commit=True)
    
    print('种子数据初始化完成')


def create_notification(user_id, title, content, category, entity_type=None, entity_id=None, metadata='{}'):
    execute_query('''
    INSERT INTO notifications (id, user_id, channel, title, content, category, entity_type, entity_id, metadata)
    VALUES (?, ?, 'IN_APP', ?, ?, ?, ?, ?, ?)
    ''', (generate_uuid(), user_id, title, content, category, entity_type, entity_id, metadata), commit=True)


def create_status_flow(entity_type, entity_id, old_status, new_status, reason=None, operator_id=None, operator_role=None, client_ip=None, metadata='{}'):
    execute_query('''
    INSERT INTO status_flows (id, entity_type, entity_id, old_status, new_status, reason, operator_id, operator_role, client_ip, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (generate_uuid(), entity_type, entity_id, old_status, new_status, reason, operator_id, operator_role, client_ip, metadata), commit=True)


def create_audit_log(action, entity_type, entity_id=None, old_value='{}', new_value='{}', operator_id=None, operator_role=None, operator_ip=None, metadata='{}'):
    execute_query('''
    INSERT INTO audit_logs (id, action, entity_type, entity_id, old_value, new_value, operator_id, operator_role, operator_ip, request_info)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (generate_uuid(), action, entity_type, entity_id, old_value, new_value, operator_id, operator_role, operator_ip, metadata), commit=True)


def get_vip_benefits(vip_level):
    return dict_from_row(execute_query(
        'SELECT * FROM vip_benefits WHERE vip_level <= ? AND is_enabled = 1 ORDER BY vip_level DESC LIMIT 1',
        (vip_level,)
    ).fetchone())


def get_active_promotions(product_ids=None):
    now = datetime.now().isoformat()
    query = '''
    SELECT * FROM promotions 
    WHERE status = 'ACTIVE' 
    AND start_time <= ? 
    AND end_time >= ?
    ORDER BY priority DESC
    '''
    rows = execute_query(query, (now, now)).fetchall()
    return dict_from_rows(rows)


def apply_vip_discount(price, vip_level):
    benefits = get_vip_benefits(vip_level)
    if benefits and benefits['discount_percent'] > 0:
        discount = price * benefits['discount_percent'] / 100
        return round(price - discount, 2), round(discount, 2)
    return price, 0


def apply_promotions(original_amount, player_id, vip_level, promotion_codes=None):
    total_discount = 0
    applied_promotions = []
    
    if promotion_codes:
        for code in promotion_codes:
            promo = dict_from_row(execute_query(
                '''SELECT * FROM promotions WHERE code = ? AND status = 'ACTIVE' 
                   AND start_time <= ? AND end_time >= ? AND min_vip_level <= ?''',
                (code, datetime.now().isoformat(), datetime.now().isoformat(), vip_level)
            ).fetchone())
            
            if not promo:
                continue
            
            if promo['max_uses_total'] > 0 and promo['used_count'] >= promo['max_uses_total']:
                continue
            
            if promo['min_order_amount'] > original_amount:
                continue
            
            if promo['discount_type'] == 'PERCENTAGE':
                discount = original_amount * promo['discount_value'] / 100
            elif promo['discount_type'] == 'FIXED_AMOUNT':
                discount = promo['discount_value']
            else:
                continue
            
            total_discount += discount
            applied_promotions.append({
                'id': promo['id'],
                'code': promo['code'],
                'name': promo['name'],
                'discount': discount
            })
    
    return total_discount, applied_promotions


def generate_order_no():
    now = datetime.now()
    prefix = now.strftime('%Y%m%d%H%M%S')
    suffix = secrets.token_hex(4).upper()
    return f'ORD{prefix}{suffix}'


def generate_payment_no():
    now = datetime.now()
    prefix = now.strftime('%Y%m%d%H%M%S')
    suffix = secrets.token_hex(4).upper()
    return f'PAY{prefix}{suffix}'


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    nickname = data.get('nickname', username)
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    existing = execute_query('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
    if existing:
        return jsonify({'error': '用户名已存在'}), 400
    
    user_id = generate_uuid()
    hashed_pwd = hash_password(password)
    
    execute_query('''
    INSERT INTO users (id, username, password, nickname, role, vip_level, balance, total_paid, points, is_active)
    VALUES (?, ?, ?, ?, 'PLAYER', 0, 0, 0, 0, 1)
    ''', (user_id, username, hashed_pwd, nickname), commit=True)
    
    create_audit_log('REGISTER', 'USER', user_id, '{}', f'{{"username":"{username}"}}', user_id, 'PLAYER', request.remote_addr)
    
    token = generate_token(user_id, 'PLAYER')
    return jsonify({
        'success': True,
        'data': {
            'user_id': user_id,
            'username': username,
            'nickname': nickname,
            'token': token,
            'role': 'PLAYER'
        }
    })


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    user = dict_from_row(execute_query('SELECT * FROM users WHERE username = ?', (username,)).fetchone())
    
    if not user or not verify_password(password, user['password']):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    if not user['is_active']:
        return jsonify({'error': '账户已被禁用'}), 403
    
    token = generate_token(user['id'], user['role'])
    
    execute_query('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?',
                  (datetime.now().isoformat(), datetime.now().isoformat(), user['id']), commit=True)
    
    create_audit_log('LOGIN', 'USER', user['id'], operator_id=user['id'], operator_role=user['role'], operator_ip=request.remote_addr)
    
    return jsonify({
        'success': True,
        'data': {
            'user_id': user['id'],
            'username': user['username'],
            'nickname': user['nickname'],
            'role': user['role'],
            'vip_level': user['vip_level'],
            'balance': user['balance'],
            'points': user['points'],
            'token': token
        }
    })


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    user = dict_from_row(execute_query('SELECT * FROM users WHERE id = ?', (g.current_user['id'],)).fetchone())
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    return jsonify({
        'success': True,
        'data': {
            'user_id': user['id'],
            'username': user['username'],
            'nickname': user['nickname'],
            'role': user['role'],
            'vip_level': user['vip_level'],
            'balance': user['balance'],
            'points': user['points'],
            'email': user['email'],
            'phone': user['phone']
        }
    })


@app.route('/api/products', methods=['GET'])
def list_products():
    category = request.args.get('category')
    search = request.args.get('search')
    status = request.args.get('status', 'ACTIVE')
    
    query = 'SELECT id, code, name, description, type, category, original_price, current_price, inventory_quantity, max_per_order, max_per_player, min_vip_level, item_data, tags, image_url, status, start_time, end_time FROM products WHERE 1=1'
    params = []
    
    if status:
        query += ' AND status = ?'
        params.append(status)
    if category:
        query += ' AND category = ?'
        params.append(category)
    if search:
        query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)'
        search_pattern = f'%{search}%'
        params.extend([search_pattern, search_pattern, search_pattern])
    
    query += ' ORDER BY created_at DESC'
    
    rows = execute_query(query, params).fetchall()
    products = dict_from_rows(rows)
    
    for p in products:
        p['item_data'] = json.loads(p['item_data']) if p['item_data'] else {}
        p['tags'] = json.loads(p['tags']) if p['tags'] else []
    
    return jsonify({
        'success': True,
        'data': products
    })


@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    product = dict_from_row(execute_query(
        'SELECT * FROM products WHERE id = ? OR code = ?', (product_id, product_id)
    ).fetchone())
    
    if not product:
        return jsonify({'error': '商品不存在'}), 404
    
    product['item_data'] = json.loads(product['item_data']) if product['item_data'] else {}
    product['tags'] = json.loads(product['tags']) if product['tags'] else []
    
    return jsonify({
        'success': True,
        'data': product
    })


@app.route('/api/products', methods=['POST'])
@login_required
def create_product():
    if g.current_user['role'] not in ['PLANNER', 'OPERATOR', 'ADMIN']:
        return jsonify({'error': '无权限创建商品'}), 403
    
    data = request.json
    product_id = generate_uuid()
    
    execute_query('''
    INSERT INTO products (id, code, name, description, type, category, original_price, current_price, 
                           inventory_quantity, max_per_order, max_per_player, min_vip_level, item_data, tags, 
                           image_url, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
    ''', (
        product_id,
        data.get('code'),
        data.get('name'),
        data.get('description', ''),
        data.get('type', 'ITEM'),
        data.get('category', 'OTHER'),
        data.get('original_price', 0),
        data.get('current_price', data.get('original_price', 0)),
        data.get('inventory_quantity', -1),
        data.get('max_per_order', 99),
        data.get('max_per_player', -1),
        data.get('min_vip_level', 0),
        json.dumps(data.get('item_data', {})),
        json.dumps(data.get('tags', [])),
        data.get('image_url', ''),
        g.current_user['id']
    ), commit=True)
    
    create_audit_log('CREATE_PRODUCT', 'PRODUCT', product_id, new_value=json.dumps(data), 
                     operator_id=g.current_user['id'], operator_role=g.current_user['role'], operator_ip=request.remote_addr)
    
    return jsonify({
        'success': True,
        'data': {'id': product_id, 'code': data.get('code'), 'name': data.get('name')}
    })


@app.route('/api/orders/preview', methods=['POST'])
@login_required
def preview_order():
    data = request.json
    items = data.get('items', [])
    promotion_codes = data.get('promotion_codes', [])
    
    if not items:
        return jsonify({'error': '商品列表不能为空'}), 400
    
    user = dict_from_row(execute_query('SELECT * FROM users WHERE id = ?', (g.current_user['id'],)).fetchone())
    vip_level = user['vip_level'] if user else 0
    
    order_items = []
    original_total = 0
    vip_discount_total = 0
    
    for item in items:
        product_id = item.get('product_id')
        quantity = item.get('quantity', 1)
        
        product = dict_from_row(execute_query(
            'SELECT * FROM products WHERE id = ? AND status = "ACTIVE"', (product_id,)
        ).fetchone())
        
        if not product:
            return jsonify({'error': f'商品 {product_id} 不存在或已下架'}), 400
        
        if product['min_vip_level'] > vip_level:
            return jsonify({'error': f'商品 {product["name"]} 需要 VIP{product["min_vip_level"]} 才能购买'}), 400
        
        if quantity > product['max_per_order']:
            return jsonify({'error': f'商品 {product["name"]} 单次最多购买 {product["max_per_order"]} 件'}), 400
        
        if product['inventory_quantity'] >= 0 and quantity > product['inventory_quantity']:
            return jsonify({'error': f'商品 {product["name"]} 库存不足'}), 400
        
        item_original = product['original_price'] * quantity
        item_current = product['current_price'] * quantity
        vip_price, vip_discount = apply_vip_discount(item_current, vip_level)
        
        original_total += item_original
        vip_discount_total += vip_discount
        
        order_items.append({
            'product_id': product['id'],
            'product_code': product['code'],
            'product_name': product['name'],
            'product_type': product['type'],
            'quantity': quantity,
            'original_price': product['original_price'],
            'discount_price': product['current_price'],
            'unit_price': vip_price / quantity,
            'subtotal': item_current,
            'discount_amount': vip_discount,
            'final_amount': vip_price,
            'item_data': json.loads(product['item_data']) if product['item_data'] else {}
        })
    
    subtotal_after_vip = original_total - vip_discount_total
    promo_discount, applied_promos = apply_promotions(
        subtotal_after_vip, 
        g.current_user['id'], 
        vip_level, 
        promotion_codes
    )
    
    final_amount = max(0, subtotal_after_vip - promo_discount)
    
    return jsonify({
        'success': True,
        'data': {
            'items': order_items,
            'original_amount': round(original_total, 2),
            'vip_discount_amount': round(vip_discount_total, 2),
            'promotion_discount_amount': round(promo_discount, 2),
            'final_amount': round(final_amount, 2),
            'applied_promotions': applied_promos,
            'currency': 'CNY'
        }
    })


@app.route('/api/orders', methods=['POST'])
@login_required
def create_order():
    idempotency_check_result = idempotency_check()
    if idempotency_check_result:
        return idempotency_check_result
    
    data = request.json
    items = data.get('items', [])
    promotion_codes = data.get('promotion_codes', [])
    payment_method = data.get('payment_method', 'BALANCE')
    
    if not items:
        return jsonify({'error': '商品列表不能为空'}), 400
    
    user = dict_from_row(execute_query('SELECT * FROM users WHERE id = ?', (g.current_user['id'],)).fetchone())
    vip_level = user['vip_level']
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        preview_resp = preview_order()
        if preview_resp.status_code != 200:
            return preview_resp
        
        preview_data = preview_resp.json.get('data', {})
        final_amount = preview_data.get('final_amount', 0)
        idempotency_key = request.headers.get('X-Idempotency-Key')
        
        if payment_method == 'BALANCE' and user['balance'] < final_amount:
            return jsonify({'error': '余额不足'}), 400
        
        order_id = generate_uuid()
        order_no = generate_order_no()
        now = datetime.now().isoformat()
        
        cursor.execute('''
        INSERT INTO orders (id, order_no, player_id, order_type, original_amount, discount_amount, 
                            final_amount, currency, payment_method, status, idempotency_key, client_ip, user_agent)
        VALUES (?, ?, ?, 'PURCHASE', ?, ?, ?, 'CNY', ?, 'PENDING', ?, ?, ?)
        ''', (
            order_id, order_no, g.current_user['id'],
            preview_data.get('original_amount', 0),
            preview_data.get('vip_discount_amount', 0) + preview_data.get('promotion_discount_amount', 0),
            final_amount,
            payment_method,
            idempotency_key,
            request.remote_addr,
            request.user_agent.string if request.user_agent else ''
        ))
        
        for item in preview_data.get('items', []):
            item_id = generate_uuid()
            cursor.execute('''
            INSERT INTO order_items (id, order_id, product_id, product_code, product_name, product_type, 
                                      quantity, original_price, discount_price, unit_price, subtotal, 
                                      discount_amount, final_amount, item_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                item_id, order_id, item['product_id'], item['product_code'], item['product_name'],
                item['product_type'], item['quantity'], item['original_price'], item['discount_price'],
                item['unit_price'], item['subtotal'], item['discount_amount'], item['final_amount'],
                json.dumps(item['item_data'])
            ))
            
            product = dict_from_row(execute_query(
                'SELECT * FROM products WHERE id = ?', (item['product_id'],)
            ).fetchone())
            
            if product and product['inventory_quantity'] >= 0:
                lock_id = generate_uuid()
                expire_at = (datetime.now() + timedelta(minutes=30)).isoformat()
                cursor.execute('''
                INSERT INTO inventory_locks (id, product_id, product_code, quantity, order_id, player_id, 
                                              lock_type, status, expire_at)
                VALUES (?, ?, ?, ?, ?, ?, 'ORDER', 'ACTIVE', ?)
                ''', (lock_id, item['product_id'], item['product_code'], item['quantity'], 
                      order_id, g.current_user['id'], expire_at))
        
        cursor.execute('''
        UPDATE orders SET status = 'LOCKED', updated_at = ? WHERE id = ?
        ''', (now, order_id))
        
        create_status_flow('ORDER', order_id, 'PENDING', 'LOCKED', 
                           operator_id=g.current_user['id'], operator_role=g.current_user['role'])
        
        create_notification(g.current_user['id'], '订单创建成功', 
                           f'您的订单 {order_no} 已创建，请完成支付', 'ORDER', 'ORDER', order_id)
        
        create_audit_log('CREATE_ORDER', 'ORDER', order_id, 
                         new_value=json.dumps({'order_no': order_no, 'amount': final_amount}),
                         operator_id=g.current_user['id'], operator_role=g.current_user['role'], 
                         operator_ip=request.remote_addr)
        
        db.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'order_id': order_id,
                'order_no': order_no,
                'final_amount': final_amount,
                'status': 'LOCKED',
                'payment_method': payment_method
            }
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders/<order_id>/pay', methods=['POST'])
@login_required
def pay_order(order_id):
    idempotency_key = request.headers.get('X-Idempotency-Key')
    
    order = dict_from_row(execute_query(
        'SELECT * FROM orders WHERE id = ? AND player_id = ?', 
        (order_id, g.current_user['id'])
    ).fetchone())
    
    if not order:
        return jsonify({'error': '订单不存在'}), 404
    
    if order['status'] not in ['PENDING', 'LOCKED']:
        if order['status'] == 'PAID':
            return jsonify({'error': '订单已支付', 'order_id': order_id}), 409
        return jsonify({'error': f'订单状态 {order["status"]} 不可支付'}), 400
    
    user = dict_from_row(execute_query('SELECT * FROM users WHERE id = ?', (g.current_user['id'],)).fetchone())
    db = get_db()
    cursor = db.cursor()
    
    try:
        if order['payment_method'] == 'BALANCE':
            if user['balance'] < order['final_amount']:
                return jsonify({'error': '余额不足'}), 400
            
            new_balance = user['balance'] - order['final_amount']
            cursor.execute('UPDATE users SET balance = ?, updated_at = ? WHERE id = ?',
                          (new_balance, datetime.now().isoformat(), g.current_user['id']))
        else:
            pass
        
        payment_id = generate_uuid()
        payment_no = generate_payment_no()
        now = datetime.now().isoformat()
        
        cursor.execute('''
        INSERT INTO payments (id, payment_no, order_id, player_id, amount, currency, 
                              payment_method, status, paid_at, idempotency_key)
        VALUES (?, ?, ?, ?, ?, 'CNY', ?, 'SUCCESS', ?, ?)
        ''', (payment_id, payment_no, order_id, g.current_user['id'], 
              order['final_amount'], order['payment_method'], now, idempotency_key))
        
        old_status = order['status']
        cursor.execute('''
        UPDATE orders SET status = 'PAID', paid_at = ?, updated_at = ?, channel_order_id = ?
        WHERE id = ?
        ''', (now, now, payment_no, order_id))
        
        create_status_flow('ORDER', order_id, old_status, 'PAID', '支付成功',
                           operator_id=g.current_user['id'], operator_role=g.current_user['role'])
        
        create_notification(g.current_user['id'], '支付成功', 
                           f'订单 {order["order_no"]} 支付成功，金额 ¥{order["final_amount"]}', 
                           'PAYMENT', 'ORDER', order_id)
        
        order_items = dict_from_rows(execute_query(
            'SELECT * FROM order_items WHERE order_id = ?', (order_id,)
        ).fetchall())
        
        for item in order_items:
            product = dict_from_row(execute_query(
                'SELECT * FROM products WHERE id = ?', (item['product_id'],)
            ).fetchone())
            
            if product and product['inventory_quantity'] >= 0:
                cursor.execute('''
                UPDATE products SET inventory_quantity = inventory_quantity - ?, updated_at = ?
                WHERE id = ?
                ''', (item['quantity'], now, item['product_id']))
                
                cursor.execute('''
                UPDATE inventory_locks SET status = 'CONFIRMED', released_at = ?
                WHERE order_id = ? AND product_id = ?
                ''', (now, order_id, item['product_id']))
            
            backpack_id = generate_uuid()
            item_data = json.loads(item['item_data']) if item['item_data'] else {}
            
            existing_backpack = dict_from_row(execute_query('''
                SELECT * FROM backpack_items WHERE player_id = ? AND product_code = ? AND is_active = 1
            ''', (g.current_user['id'], item['product_code'])).fetchone())
            
            if existing_backpack:
                cursor.execute('''
                UPDATE backpack_items SET quantity = quantity + ?, updated_at = ?, version = version + 1
                WHERE id = ?
                ''', (item['quantity'], now, existing_backpack['id']))
            else:
                cursor.execute('''
                INSERT INTO backpack_items (id, player_id, product_id, product_code, product_name, 
                                            product_type, quantity, item_data, order_item_id, source_type, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PURCHASE', 1)
                ''', (backpack_id, g.current_user['id'], item['product_id'], item['product_code'],
                      item['product_name'], item['product_type'], item['quantity'], 
                      json.dumps(item_data), item['id']))
        
        cursor.execute('''
        UPDATE order_items SET is_delivered = 1, delivered_at = ?, updated_at = ? WHERE order_id = ?
        ''', (now, now, order_id))
        
        cursor.execute('''
        UPDATE orders SET status = 'SHIPPED', shipped_at = ?, updated_at = ? WHERE id = ?
        ''', (now, now, order_id))
        
        cursor.execute('''
        UPDATE orders SET status = 'COMPLETED', completed_at = ?, updated_at = ? WHERE id = ?
        ''', (now, now, order_id))
        
        create_status_flow('ORDER', order_id, 'PAID', 'COMPLETED', '发货完成',
                           operator_id=g.current_user['id'], operator_role=g.current_user['role'])
        
        create_notification(g.current_user['id'], '发货完成', 
                           f'订单 {order["order_no"]} 商品已发放到背包', 
                           'DELIVERY', 'ORDER', order_id)
        
        points_earned = int(order['final_amount'] * 10)
        cursor.execute('''
        UPDATE users SET points = points + ?, total_paid = total_paid + ?, updated_at = ? WHERE id = ?
        ''', (points_earned, int(order['final_amount']), now, g.current_user['id']))
        
        create_audit_log('PAY_ORDER', 'ORDER', order_id, 
                         old_value=json.dumps({'status': old_status}),
                         new_value=json.dumps({'status': 'COMPLETED', 'payment_id': payment_id}),
                         operator_id=g.current_user['id'], operator_role=g.current_user['role'],
                         operator_ip=request.remote_addr)
        
        db.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'order_id': order_id,
                'order_no': order['order_no'],
                'status': 'COMPLETED',
                'payment_id': payment_id,
                'payment_no': payment_no,
                'points_earned': points_earned
            }
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders', methods=['GET'])
@login_required
def list_orders():
    status = request.args.get('status')
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))
    
    query = 'SELECT * FROM orders WHERE player_id = ?'
    params = [g.current_user['id']]
    
    if status:
        query += ' AND status = ?'
        params.append(status)
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.extend([page_size, (page - 1) * page_size])
    
    rows = execute_query(query, params).fetchall()
    orders = dict_from_rows(rows)
    
    for order in orders:
        order_items = dict_from_rows(execute_query(
            'SELECT * FROM order_items WHERE order_id = ?', (order['id'],)
        ).fetchall())
        order['items'] = []
        for item in order_items:
            item['item_data'] = json.loads(item['item_data']) if item['item_data'] else {}
            order['items'].append(item)
    
    return jsonify({
        'success': True,
        'data': {
            'orders': orders,
            'page': page,
            'page_size': page_size
        }
    })


@app.route('/api/orders/<order_id>', methods=['GET'])
@login_required
def get_order(order_id):
    order = dict_from_row(execute_query(
        'SELECT * FROM orders WHERE id = ? AND player_id = ?', 
        (order_id, g.current_user['id'])
    ).fetchone())
    
    if not order:
        return jsonify({'error': '订单不存在'}), 404
    
    order_items = dict_from_rows(execute_query(
        'SELECT * FROM order_items WHERE order_id = ?', (order_id,)
    ).fetchall())
    
    for item in order_items:
        item['item_data'] = json.loads(item['item_data']) if item['item_data'] else {}
    
    order['items'] = order_items
    
    status_flows = dict_from_rows(execute_query(
        'SELECT * FROM status_flows WHERE entity_type = ? AND entity_id = ? ORDER BY created_at',
        ('ORDER', order_id)
    ).fetchall())
    order['status_flows'] = status_flows
    
    return jsonify({
        'success': True,
        'data': order
    })


@app.route('/api/backpack', methods=['GET'])
@login_required
def get_backpack():
    rows = execute_query('''
    SELECT * FROM backpack_items WHERE player_id = ? AND is_active = 1 ORDER BY created_at DESC
    ''', (g.current_user['id'],)).fetchall()
    
    items = dict_from_rows(rows)
    for item in items:
        item['item_data'] = json.loads(item['item_data']) if item['item_data'] else {}
    
    return jsonify({
        'success': True,
        'data': items
    })


@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))
    
    query = 'SELECT * FROM notifications WHERE user_id = ? AND is_deleted = 0'
    params = [g.current_user['id']]
    
    if unread_only:
        query += ' AND is_read = 0'
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.extend([page_size, (page - 1) * page_size])
    
    rows = execute_query(query, params).fetchall()
    
    return jsonify({
        'success': True,
        'data': dict_from_rows(rows)
    })


@app.route('/api/notifications/<notification_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    execute_query('''
    UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ?
    ''', (datetime.now().isoformat(), notification_id, g.current_user['id']), commit=True)
    
    return jsonify({'success': True})


@app.route('/api/stats/summary', methods=['GET'])
@login_required
def get_stats_summary():
    user = dict_from_row(execute_query('SELECT * FROM users WHERE id = ?', (g.current_user['id'],)).fetchone())
    
    order_count = execute_query(
        'SELECT COUNT(*) as cnt FROM orders WHERE player_id = ? AND status = "COMPLETED"',
        (g.current_user['id'],)
    ).fetchone()['cnt']
    
    total_spent = execute_query(
        'SELECT SUM(final_amount) as total FROM orders WHERE player_id = ? AND status = "COMPLETED"',
        (g.current_user['id'],)
    ).fetchone()['total'] or 0
    
    backpack_count = execute_query(
        'SELECT SUM(quantity) as total FROM backpack_items WHERE player_id = ? AND is_active = 1',
        (g.current_user['id'],)
    ).fetchone()['total'] or 0
    
    vip_benefits = get_vip_benefits(user['vip_level'])
    
    return jsonify({
        'success': True,
        'data': {
            'order_count': order_count,
            'total_spent': round(total_spent, 2),
            'points': user['points'],
            'balance': user['balance'],
            'vip_level': user['vip_level'],
            'backpack_items_count': backpack_count,
            'vip_benefits': vip_benefits
        }
    })


@app.route('/api/admin/stats', methods=['GET'])
@login_required
def get_admin_stats():
    if g.current_user['role'] not in ['ADMIN', 'OPERATOR']:
        return jsonify({'error': '无权限'}), 403
    
    today = datetime.now().date().isoformat()
    
    today_orders = execute_query(
        'SELECT COUNT(*) as cnt FROM orders WHERE date(created_at) = ?', (today,)
    ).fetchone()['cnt']
    
    today_revenue = execute_query(
        'SELECT SUM(final_amount) as total FROM orders WHERE date(created_at) = ? AND status = "COMPLETED"',
        (today,)
    ).fetchone()['total'] or 0
    
    total_users = execute_query('SELECT COUNT(*) as cnt FROM users WHERE role = "PLAYER"').fetchone()['cnt']
    total_products = execute_query('SELECT COUNT(*) as cnt FROM products WHERE status = "ACTIVE"').fetchone()['cnt']
    total_orders = execute_query('SELECT COUNT(*) as cnt FROM orders').fetchone()['cnt']
    total_revenue = execute_query(
        'SELECT SUM(final_amount) as total FROM orders WHERE status = "COMPLETED"'
    ).fetchone()['total'] or 0
    
    return jsonify({
        'success': True,
        'data': {
            'today_orders': today_orders,
            'today_revenue': round(today_revenue, 2),
            'total_users': total_users,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': round(total_revenue, 2)
        }
    })


def generate_ticket_no():
    now = datetime.now()
    prefix = now.strftime('%Y%m%d%H%M%S')
    suffix = secrets.token_hex(3).upper()
    return f'TKT{prefix}{suffix}'


@app.route('/api/tickets/types', methods=['GET'])
def get_ticket_types():
    types = [
        {'code': 'REFUND', 'name': '退款申请', 'description': '订单退款相关问题'},
        {'code': 'DELIVERY', 'name': '发货问题', 'description': '商品未到账或发放异常'},
        {'code': 'PAYMENT', 'name': '支付问题', 'description': '支付失败或扣款异常'},
        {'code': 'PRODUCT', 'name': '商品问题', 'description': '商品描述与实际不符'},
        {'code': 'ACCOUNT', 'name': '账户问题', 'description': '账户余额、积分异常'},
        {'code': 'OTHER', 'name': '其他问题', 'description': '其他类型问题'}
    ]
    return jsonify({'success': True, 'data': types})


@app.route('/api/tickets', methods=['GET'])
@login_required
def list_player_tickets():
    status = request.args.get('status')
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))
    
    query = 'SELECT * FROM tickets WHERE player_id = ?'
    params = [g.current_user['id']]
    
    if status:
        query += ' AND status = ?'
        params.append(status)
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.extend([page_size, (page - 1) * page_size])
    
    rows = execute_query(query, params).fetchall()
    tickets = dict_from_rows(rows)
    
    for ticket in tickets:
        if ticket.get('metadata'):
            ticket['metadata'] = json.loads(ticket['metadata'])
    
    return jsonify({
        'success': True,
        'data': {
            'tickets': tickets,
            'page': page,
            'page_size': page_size
        }
    })


@app.route('/api/tickets/<ticket_id>', methods=['GET'])
@login_required
def get_ticket_detail(ticket_id):
    ticket = dict_from_row(execute_query(
        'SELECT * FROM tickets WHERE id = ? AND player_id = ?',
        (ticket_id, g.current_user['id'])
    ).fetchone())
    
    if not ticket:
        if g.current_user['role'] in ['CUSTOMER_SERVICE', 'ADMIN', 'OPERATOR']:
            ticket = dict_from_row(execute_query(
                'SELECT * FROM tickets WHERE id = ?', (ticket_id,)
            ).fetchone())
    
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    if ticket.get('metadata'):
        ticket['metadata'] = json.loads(ticket['metadata'])
    
    messages = dict_from_rows(execute_query(
        'SELECT * FROM ticket_messages WHERE ticket_id = ? AND is_internal = 0 ORDER BY created_at',
        (ticket_id,)
    ).fetchall())
    
    for msg in messages:
        if msg.get('attachment_ids'):
            msg['attachment_ids'] = json.loads(msg['attachment_ids'])
    
    ticket['messages'] = messages
    
    return jsonify({'success': True, 'data': ticket})


@app.route('/api/tickets', methods=['POST'])
@login_required
def create_ticket():
    data = request.json
    ticket_type = data.get('type')
    title = data.get('title')
    content = data.get('content')
    order_id = data.get('order_id')
    priority = data.get('priority', 'NORMAL')
    
    if not ticket_type or not title or not content:
        return jsonify({'error': '请填写完整信息'}), 400
    
    if ticket_type == 'REFUND' and not order_id:
        return jsonify({'error': '退款申请需要关联订单'}), 400
    
    if order_id:
        order = dict_from_row(execute_query(
            'SELECT * FROM orders WHERE id = ? AND player_id = ?',
            (order_id, g.current_user['id'])
        ).fetchone())
        if not order:
            return jsonify({'error': '订单不存在'}), 404
    
    ticket_id = generate_uuid()
    ticket_no = generate_ticket_no()
    now = datetime.now().isoformat()
    
    execute_query('''
    INSERT INTO tickets (id, ticket_no, player_id, order_id, type, priority, title, content, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
    ''', (ticket_id, ticket_no, g.current_user['id'], order_id, ticket_type, priority, title, content, now, now), commit=True)
    
    user = dict_from_row(execute_query(
        'SELECT nickname FROM users WHERE id = ?', (g.current_user['id'],)
    ).fetchone())
    
    message_id = generate_uuid()
    execute_query('''
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, sender_name, content, created_at)
    VALUES (?, ?, ?, 'PLAYER', ?, ?, ?)
    ''', (message_id, ticket_id, g.current_user['id'], user['nickname'] if user else None, content, now), commit=True)
    
    create_notification(g.current_user['id'], '工单创建成功', 
                       f'您的工单 {ticket_no} 已提交，客服将尽快处理', 
                       'SYSTEM', 'TICKET', ticket_id)
    
    create_audit_log('CREATE_TICKET', 'TICKET', ticket_id,
                     new_value=json.dumps({'ticket_no': ticket_no, 'type': ticket_type, 'title': title}),
                     operator_id=g.current_user['id'], operator_role=g.current_user['role'],
                     operator_ip=request.remote_addr)
    
    return jsonify({
        'success': True,
        'data': {
            'ticket_id': ticket_id,
            'ticket_no': ticket_no,
            'status': 'OPEN'
        }
    })


@app.route('/api/tickets/<ticket_id>/reply', methods=['POST'])
@login_required
def reply_ticket(ticket_id):
    data = request.json
    content = data.get('content')
    
    if not content:
        return jsonify({'error': '请输入回复内容'}), 400
    
    ticket = dict_from_row(execute_query(
        'SELECT * FROM tickets WHERE id = ?', (ticket_id,)
    ).fetchone())
    
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    if g.current_user['role'] == 'PLAYER' and ticket['player_id'] != g.current_user['id']:
        return jsonify({'error': '无权限操作此工单'}), 403
    
    if ticket['status'] == 'CLOSED':
        return jsonify({'error': '工单已关闭，无法回复'}), 400
    
    user = dict_from_row(execute_query(
        'SELECT nickname, role FROM users WHERE id = ?', (g.current_user['id'],)
    ).fetchone())
    
    message_id = generate_uuid()
    now = datetime.now().isoformat()
    
    execute_query('''
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, sender_name, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (message_id, ticket_id, g.current_user['id'], g.current_user['role'], 
          user['nickname'] if user else None, content, now), commit=True)
    
    execute_query('''
    UPDATE tickets SET updated_at = ? WHERE id = ?
    ''', (now, ticket_id), commit=True)
    
    create_audit_log('REPLY_TICKET', 'TICKET', ticket_id,
                     new_value=json.dumps({'sender': g.current_user['role']}),
                     operator_id=g.current_user['id'], operator_role=g.current_user['role'],
                     operator_ip=request.remote_addr)
    
    return jsonify({'success': True, 'data': {'message_id': message_id}})


@app.route('/api/admin/tickets', methods=['GET'])
@login_required
def list_all_tickets():
    if g.current_user['role'] not in ['CUSTOMER_SERVICE', 'ADMIN', 'OPERATOR']:
        return jsonify({'error': '无权限'}), 403
    
    status = request.args.get('status')
    ticket_type = request.args.get('type')
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))
    
    query = '''
    SELECT t.*, u.nickname as player_name, u.username as player_username
    FROM tickets t LEFT JOIN users u ON t.player_id = u.id
    WHERE 1=1
    '''
    params = []
    
    if status:
        query += ' AND t.status = ?'
        params.append(status)
    if ticket_type:
        query += ' AND t.type = ?'
        params.append(ticket_type)
    
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?'
    params.extend([page_size, (page - 1) * page_size])
    
    rows = execute_query(query, params).fetchall()
    tickets = dict_from_rows(rows)
    
    for ticket in tickets:
        if ticket.get('metadata'):
            ticket['metadata'] = json.loads(ticket['metadata'])
    
    return jsonify({
        'success': True,
        'data': {
            'tickets': tickets,
            'page': page,
            'page_size': page_size
        }
    })


@app.route('/api/admin/tickets/<ticket_id>/<action>', methods=['POST'])
@login_required
def handle_ticket(ticket_id, action):
    if g.current_user['role'] not in ['CUSTOMER_SERVICE', 'ADMIN', 'OPERATOR']:
        return jsonify({'error': '无权限'}), 403
    
    ticket = dict_from_row(execute_query(
        'SELECT * FROM tickets WHERE id = ?', (ticket_id,)
    ).fetchone())
    
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    now = datetime.now().isoformat()
    data = request.json or {}
    reply_content = data.get('content', '')
    
    user = dict_from_row(execute_query(
        'SELECT nickname FROM users WHERE id = ?', (g.current_user['id'],)
    ).fetchone())
    
    if action == 'assign':
        execute_query('''
        UPDATE tickets SET assigned_to = ?, updated_at = ? WHERE id = ?
        ''', (g.current_user['id'], now, ticket_id), commit=True)
        
        new_status = ticket['status']
        create_audit_log('ASSIGN_TICKET', 'TICKET', ticket_id,
                         operator_id=g.current_user['id'], operator_role=g.current_user['role'],
                         operator_ip=request.remote_addr)
        
    elif action == 'resolve':
        execute_query('''
        UPDATE tickets SET status = 'RESOLVED', resolved_at = ?, updated_at = ? WHERE id = ?
        ''', (now, now, ticket_id), commit=True)
        
        new_status = 'RESOLVED'
        create_status_flow('TICKET', ticket_id, ticket['status'], 'RESOLVED',
                           operator_id=g.current_user['id'], operator_role=g.current_user['role'])
        
        create_notification(ticket['player_id'], '工单已解决',
                           f'您的工单 {ticket["ticket_no"]} 已解决，请查看详情',
                           'SYSTEM', 'TICKET', ticket_id)
        
        if reply_content:
            message_id = generate_uuid()
            execute_query('''
            INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, sender_name, content, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (message_id, ticket_id, g.current_user['id'], g.current_user['role'],
                  user['nickname'] if user else None, reply_content, now), commit=True)
        
    elif action == 'close':
        execute_query('''
        UPDATE tickets SET status = 'CLOSED', closed_at = ?, updated_at = ? WHERE id = ?
        ''', (now, now, ticket_id), commit=True)
        
        new_status = 'CLOSED'
        create_status_flow('TICKET', ticket_id, ticket['status'], 'CLOSED',
                           operator_id=g.current_user['id'], operator_role=g.current_user['role'])
        
        create_notification(ticket['player_id'], '工单已关闭',
                           f'您的工单 {ticket["ticket_no"]} 已关闭',
                           'SYSTEM', 'TICKET', ticket_id)
        
    else:
        return jsonify({'error': '无效操作'}), 400
    
    return jsonify({'success': True, 'data': {'ticket_id': ticket_id, 'action': action}})


@app.route('/api/orders/<order_id>/refund-request', methods=['POST'])
@login_required
def request_refund(order_id):
    data = request.json
    reason = data.get('reason', '')
    description = data.get('description', '')
    
    order = dict_from_row(execute_query(
        'SELECT * FROM orders WHERE id = ? AND player_id = ?',
        (order_id, g.current_user['id'])
    ).fetchone())
    
    if not order:
        return jsonify({'error': '订单不存在'}), 404
    
    if order['status'] not in ['COMPLETED', 'PAID', 'SHIPPED']:
        return jsonify({'error': '当前订单状态不可申请退款'}), 400
    
    existing_ticket = dict_from_row(execute_query(
        'SELECT id FROM tickets WHERE order_id = ? AND type = "REFUND" AND status NOT IN ("CLOSED", "RESOLVED")',
        (order_id,)
    ).fetchone())
    
    if existing_ticket:
        return jsonify({'error': '该订单已有退款申请正在处理中'}), 400
    
    ticket_id = generate_uuid()
    ticket_no = generate_ticket_no()
    now = datetime.now().isoformat()
    
    title = f'退款申请 - 订单 {order["order_no"]}'
    content = f'退款原因: {reason}\n\n详细描述: {description}\n\n订单金额: ¥{order["final_amount"]}'
    
    execute_query('''
    INSERT INTO tickets (id, ticket_no, player_id, order_id, type, priority, title, content, status, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'REFUND', 'HIGH', ?, ?, 'OPEN', ?, ?, ?)
    ''', (ticket_id, ticket_no, g.current_user['id'], order_id, title, content,
          json.dumps({'order_amount': order['final_amount'], 'refund_reason': reason}),
          now, now), commit=True)
    
    user = dict_from_row(execute_query(
        'SELECT nickname FROM users WHERE id = ?', (g.current_user['id'],)
    ).fetchone())
    
    message_id = generate_uuid()
    execute_query('''
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, sender_name, content, created_at)
    VALUES (?, ?, ?, 'PLAYER', ?, ?, ?)
    ''', (message_id, ticket_id, g.current_user['id'], user['nickname'] if user else None, content, now), commit=True)
    
    create_notification(g.current_user['id'], '退款申请已提交',
                       f'您的退款申请已提交，工单编号: {ticket_no}',
                       'SYSTEM', 'TICKET', ticket_id)
    
    create_audit_log('REQUEST_REFUND', 'ORDER', order_id,
                     new_value=json.dumps({'ticket_no': ticket_no, 'reason': reason}),
                     operator_id=g.current_user['id'], operator_role=g.current_user['role'],
                     operator_ip=request.remote_addr)
    
    return jsonify({
        'success': True,
        'data': {
            'ticket_id': ticket_id,
            'ticket_no': ticket_no
        }
    })


@app.route('/api/admin/orders/<order_id>/refund', methods=['POST'])
@login_required
def process_refund(order_id):
    if g.current_user['role'] not in ['CUSTOMER_SERVICE', 'ADMIN', 'OPERATOR']:
        return jsonify({'error': '无权限'}), 403
    
    data = request.json
    refund_amount = data.get('refund_amount')
    ticket_id = data.get('ticket_id')
    reason = data.get('reason', '客服处理退款')
    
    order = dict_from_row(execute_query(
        'SELECT * FROM orders WHERE id = ?', (order_id,)
    ).fetchone())
    
    if not order:
        return jsonify({'error': '订单不存在'}), 404
    
    if order['status'] not in ['COMPLETED', 'PAID', 'SHIPPED']:
        return jsonify({'error': '当前订单状态不可退款'}), 400
    
    if refund_amount is None:
        refund_amount = order['final_amount']
    
    if refund_amount <= 0 or refund_amount > order['final_amount']:
        return jsonify({'error': '退款金额无效'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        now = datetime.now().isoformat()
        
        cursor.execute('''
        UPDATE users SET balance = balance + ?, updated_at = ? WHERE id = ?
        ''', (refund_amount, now, order['player_id']))
        
        old_status = order['status']
        if refund_amount >= order['final_amount']:
            cursor.execute('''
            UPDATE orders SET status = 'REFUNDED', refunded_at = ?, updated_at = ? WHERE id = ?
            ''', (now, now, order_id))
            new_status = 'REFUNDED'
        else:
            cursor.execute('''
            UPDATE orders SET status = 'PARTIAL_REFUNDED', updated_at = ? WHERE id = ?
            ''', (now, order_id))
            new_status = 'PARTIAL_REFUNDED'
        
        cursor.execute('''
        UPDATE order_items SET is_refunded = 1, refund_amount = ?, refunded_at = ?, updated_at = ?
        WHERE order_id = ?
        ''', (refund_amount, now, now, order_id))
        
        payment_id = generate_uuid()
        payment_no = generate_payment_no()
        cursor.execute('''
        INSERT INTO payments (id, payment_no, order_id, player_id, amount, currency, payment_method, status, refunded_at)
        VALUES (?, ?, ?, ?, ?, 'CNY', 'REFUND', 'REFUNDED', ?)
        ''', (payment_id, payment_no, order_id, order['player_id'], -refund_amount, now))
        
        create_status_flow('ORDER', order_id, old_status, new_status,
                          f'退款 ¥{refund_amount}',
                          operator_id=g.current_user['id'], operator_role=g.current_user['role'])
        
        create_notification(order['player_id'], '退款成功',
                           f'订单 {order["order_no"]} 已退款 ¥{refund_amount}，款项已返还至余额',
                           'REFUND', 'ORDER', order_id)
        
        create_audit_log('PROCESS_REFUND', 'ORDER', order_id,
                         old_value=json.dumps({'status': old_status}),
                         new_value=json.dumps({'status': new_status, 'refund_amount': refund_amount}),
                         operator_id=g.current_user['id'], operator_role=g.current_user['role'],
                         operator_ip=request.remote_addr)
        
        if ticket_id:
            cursor.execute('''
            UPDATE tickets SET status = 'RESOLVED', resolved_at = ?, updated_at = ? WHERE id = ?
            ''', (now, now, ticket_id))
            
            user = dict_from_row(execute_query(
                'SELECT nickname FROM users WHERE id = ?', (g.current_user['id'],)
            ).fetchone())
            
            msg_id = generate_uuid()
            cursor.execute('''
            INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, sender_name, content, created_at)
            VALUES (?, ?, ?, 'CUSTOMER_SERVICE', ?, ?, ?)
            ''', (msg_id, ticket_id, g.current_user['id'], 
                  user['nickname'] if user else None,
                  f'退款已处理完成，退款金额 ¥{refund_amount} 已返还至您的余额。{reason}',
                  now))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'order_id': order_id,
                'refund_amount': refund_amount,
                'status': new_status
            }
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        init_database()
    
    print(f'游戏内购商城后端服务启动于 http://localhost:{BACKEND_PORT}')
    app.run(host='0.0.0.0', port=BACKEND_PORT, debug=False)
