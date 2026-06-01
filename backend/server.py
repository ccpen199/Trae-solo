#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import hashlib
import os
import re
import sqlite3
import sys
import threading
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parents[1]

def load_env():
    env_path = ROOT / ".env"
    values = {}
    if env_path.exists():
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values

ENV = load_env()
HOST = ENV.get("BACKEND_HOST", "127.0.0.1")
PORT = int(ENV.get("BACKEND_PORT", "58676"))
DB_PATH = ROOT / ENV.get("DATABASE_PATH", "data/app.sqlite")
FRONTEND_ORIGIN = f"http://127.0.0.1:{ENV.get('FRONTEND_PORT', '48676')}"

db_lock = threading.Lock()

def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript("""
            DROP TABLE IF EXISTS scalper_flags;
            DROP TABLE IF EXISTS box_office_reports;
            DROP TABLE IF EXISTS ticket_contracts;
            DROP TABLE IF EXISTS tickets;
            DROP TABLE IF EXISTS orders;
            DROP TABLE IF EXISTS seats;
            DROP TABLE IF EXISTS user_social;
            DROP TABLE IF EXISTS user_preferences;
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS reviews;
            DROP TABLE IF EXISTS videos;
            DROP TABLE IF EXISTS show_creators;
            DROP TABLE IF EXISTS creators;
            DROP TABLE IF EXISTS shows;
            DROP TABLE IF EXISTS local_services;
            DROP TABLE IF EXISTS service_status;

            CREATE TABLE shows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('movie','concert','drama','exhibition','sports')),
                venue TEXT NOT NULL,
                address TEXT DEFAULT '',
                show_date TEXT NOT NULL,
                show_time TEXT DEFAULT '19:30',
                end_date TEXT DEFAULT '',
                duration_minutes INTEGER DEFAULT 120,
                heat_index REAL DEFAULT 0,
                sentiment_score REAL DEFAULT 0,
                description TEXT DEFAULT '',
                poster_url TEXT DEFAULT '',
                price_min REAL DEFAULT 0,
                price_max REAL DEFAULT 0,
                total_seats INTEGER DEFAULT 0,
                available_seats INTEGER DEFAULT 0,
                status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','selling','sold_out','ended','cancelled')),
                is_flash_sale INTEGER DEFAULT 0,
                flash_sale_start TEXT DEFAULT '',
                flash_sale_end TEXT DEFAULT '',
                upstream_source TEXT DEFAULT '',
                upstream_id TEXT DEFAULT '',
                inventory_shard TEXT DEFAULT 'A',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE creators (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('actor','director','singer','performer','writer','composer')),
                ip_score REAL DEFAULT 50,
                avatar_url TEXT DEFAULT '',
                bio TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE show_creators (
                show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
                creator_id INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                PRIMARY KEY (show_id, creator_id, role)
            );

            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                credit_score INTEGER DEFAULT 100,
                risk_level TEXT DEFAULT 'normal' CHECK(risk_level IN ('normal','warning','danger')),
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                genre TEXT NOT NULL,
                weight REAL DEFAULT 1.0,
                UNIQUE(user_id, genre)
            );

            CREATE TABLE user_social (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (user_id, friend_id)
            );

            CREATE TABLE seats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
                zone TEXT NOT NULL,
                row_num INTEGER NOT NULL,
                col_num INTEGER NOT NULL,
                price REAL NOT NULL,
                sight_score REAL DEFAULT 5.0,
                is_accessible INTEGER DEFAULT 0,
                status TEXT DEFAULT 'available' CHECK(status IN ('available','locked','sold','disabled')),
                locked_until TEXT DEFAULT '',
                locked_by TEXT DEFAULT '',
                UNIQUE(show_id, zone, row_num, col_num)
            );

            CREATE TABLE orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL REFERENCES users(id),
                show_id INTEGER NOT NULL REFERENCES shows(id),
                total_price REAL NOT NULL,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled','refunded')),
                ip_address TEXT DEFAULT '',
                device_fingerprint TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_no TEXT NOT NULL UNIQUE,
                order_id INTEGER NOT NULL REFERENCES orders(id),
                show_id INTEGER NOT NULL REFERENCES shows(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                seat_id INTEGER NOT NULL REFERENCES seats(id),
                price REAL NOT NULL,
                status TEXT DEFAULT 'valid' CHECK(status IN ('valid','used','transferred','refunded','expired')),
                blockchain_hash TEXT DEFAULT '',
                transfer_count INTEGER DEFAULT 0,
                max_transfers INTEGER DEFAULT 2,
                qr_code TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE ticket_contracts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
                transfer_allowed INTEGER DEFAULT 1,
                max_transfer_count INTEGER DEFAULT 2,
                refund_policy TEXT DEFAULT 'standard',
                refund_rules TEXT DEFAULT '',
                blockchain_txid TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id),
                content TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                sentiment_score REAL DEFAULT 0,
                is_critic INTEGER DEFAULT 0,
                influencer_weight REAL DEFAULT 1.0,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                show_id INTEGER REFERENCES shows(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                tags TEXT DEFAULT '',
                cover_url TEXT DEFAULT '',
                view_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                influencer_weight REAL DEFAULT 1.0,
                duration_seconds INTEGER DEFAULT 60,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE local_services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL CHECK(type IN ('escape_room','ktv','food_deal')),
                name TEXT NOT NULL,
                address TEXT DEFAULT '',
                latitude REAL DEFAULT 0,
                longitude REAL DEFAULT 0,
                price REAL DEFAULT 0,
                description TEXT DEFAULT '',
                availability INTEGER DEFAULT 1,
                cover_url TEXT DEFAULT '',
                voucher_code TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE box_office_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                show_id INTEGER NOT NULL REFERENCES shows(id),
                report_date TEXT NOT NULL,
                total_tickets INTEGER DEFAULT 0,
                total_revenue REAL DEFAULT 0,
                online_sales INTEGER DEFAULT 0,
                offline_sales INTEGER DEFAULT 0,
                reported_to_authority INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                UNIQUE(show_id, report_date)
            );

            CREATE TABLE scalper_flags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                order_id INTEGER REFERENCES orders(id),
                reason TEXT NOT NULL,
                risk_score REAL DEFAULT 0,
                ip_address TEXT DEFAULT '',
                device_fingerprint TEXT DEFAULT '',
                order_frequency INTEGER DEFAULT 0,
                status TEXT DEFAULT 'flagged' CHECK(status IN ('flagged','confirmed','cleared')),
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE service_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                order_id TEXT NOT NULL,
                frontend_url TEXT NOT NULL,
                backend_url TEXT NOT NULL,
                status TEXT NOT NULL,
                message TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)

        conn.execute("""
            INSERT OR REPLACE INTO service_status (id, order_id, frontend_url, backend_url, status, message)
            VALUES (1, 'may-88676', ?, ?, 'online', '文娱消费决策与履约一体化平台运行中')
        """, (FRONTEND_ORIGIN, f"http://{HOST}:{PORT}"))

        seed_data(conn)
        conn.commit()

def seed_data(conn):
    creators_data = [
        ('周杰伦', 'singer', 98.5, '', '华语流行音乐天王，代表作《青花瓷》《稻香》'),
        ('陈奕迅', 'singer', 92.3, '', '歌神级歌手，代表作《十年》《浮夸》'),
        ('林俊杰', 'singer', 89.7, '', '实力唱作人，代表作《江南》《修炼爱情》'),
        ('张艺谋', 'director', 95.2, '', '国际知名导演，代表作《英雄》《满城尽带黄金甲》'),
        ('陈凯歌', 'director', 88.6, '', '第五代导演代表，代表作《霸王别姬》'),
        ('吴京', 'actor', 93.1, '', '票房之王，代表作《战狼》系列'),
        ('沈腾', 'actor', 90.4, '', '喜剧之王，代表作《夏洛特烦恼》'),
        ('刘昊然', 'actor', 82.5, '', '新生代实力演员，代表作《唐人街探案》'),
        ('郎朗', 'performer', 96.8, '', '国际钢琴大师'),
        ('赖声川', 'director', 87.3, '', '话剧导演，代表作《暗恋桃花源》'),
    ]
    creator_ids = []
    for name, ctype, ip, avatar, bio in creators_data:
        cur = conn.execute("INSERT INTO creators (name,type,ip_score,avatar_url,bio) VALUES (?,?,?,?,?)", (name, ctype, ip, avatar, bio))
        creator_ids.append(cur.lastrowid)

    shows_data = [
        ('周杰伦「嘉年华」世界巡回演唱会', 'concert', '国家体育场（鸟巢）', '北京市朝阳区国家体育场南路1号', '2026-07-15', '19:30', '2026-07-16', 180, 96.8, 0.92, '周杰伦2026世界巡演北京站，全新舞美，经典曲目串联，打造沉浸式音乐嘉年华', '', 580, 2580, 60000, 45000, 'selling', 1, '2026-07-15T10:00:00', '2026-07-15T10:05:00', '鸟巢官方', 'BJ-2026-JAY'),
        ('张艺谋导演《影》话剧版', 'drama', '国家大剧院', '北京市西城区西长安街2号', '2026-08-01', '19:00', '2026-08-03', 150, 88.5, 0.85, '张艺谋亲执导筒，将电影《影》搬上话剧舞台，水墨视觉美学极致呈现', '', 280, 1280, 1200, 800, 'selling', 0, '', '', '国家大剧院API', 'NAT-2026-SHADOW'),
        ('《流浪地球3》IMAX首映', 'movie', '万达影城CBD店', '北京市朝阳区建国路93号', '2026-06-20', '00:00', '2026-07-20', 148, 94.2, 0.88, '中国科幻巨制第三部，地球再次面临危机，人类命运共同体最后的抉择', '', 80, 150, 300, 120, 'selling', 1, '2026-06-20T00:00:00', '2026-06-20T00:03:00', '猫眼接口', 'MY-2026-EARTH3'),
        ('郎朗钢琴独奏音乐会', 'concert', '上海交响乐团音乐厅', '上海市徐汇区复兴中路1380号', '2026-09-10', '19:30', '2026-09-10', 120, 91.3, 0.90, '郎朗2026独奏巡演上海站，演奏肖邦、李斯特经典曲目', '', 380, 1980, 1500, 1100, 'upcoming', 0, '', '', '上交API', 'SH-2026-LANG'),
        ('《唐人街探案4》首映', 'movie', '百老汇影城', '北京市东城区东方新天地', '2026-08-08', '20:00', '2026-09-08', 130, 85.6, 0.78, '唐探宇宙再续，Q的身份终将揭晓', '', 60, 120, 400, 280, 'upcoming', 0, '', '', '淘票票接口', 'TPP-2026-TANG4'),
        ('赖声川《暗恋桃花源》', 'drama', '北京保利剧院', '北京市东城区东直门南大街14号', '2026-07-20', '19:30', '2026-07-22', 160, 86.7, 0.82, '经典话剧重新编排，两个剧组同一个舞台的悲喜交织', '', 180, 880, 900, 650, 'selling', 0, '', '', '保利剧院API', 'BL-2026-SECRET'),
        ('中超联赛：北京国安vs上海申花', 'sports', '工人体育场', '北京市朝阳区工人体育场北路', '2026-07-05', '19:35', '2026-07-05', 105, 78.3, 0.65, '京沪大战！国安主场迎战申花', '', 120, 680, 68000, 52000, 'selling', 0, '', '', '大麦接口', 'DM-2026-FOOTBALL'),
        ('沉浸式数字艺术展「幻境」', 'exhibition', '798艺术区', '北京市朝阳区酒仙桥路4号', '2026-06-01', '10:00', '2026-09-30', 90, 82.1, 0.87, 'AI生成艺术与传统美学的碰撞，全场沉浸式互动体验', '', 98, 298, 500, 350, 'selling', 0, '', '', '798官方', '798-2026-MAGIC'),
    ]
    show_ids = []
    for s in shows_data:
        cur = conn.execute("""
            INSERT INTO shows (title,type,venue,address,show_date,show_time,end_date,duration_minutes,
            heat_index,sentiment_score,description,poster_url,price_min,price_max,
            total_seats,available_seats,status,is_flash_sale,flash_sale_start,flash_sale_end,
            upstream_source,upstream_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, s)
        show_ids.append(cur.lastrowid)

    show_creator_map = [
        (0, 0, '主演/歌手'), (0, 0, '艺术总监'),
        (1, 3, '导演'), (1, 9, '导演'),
        (2, 3, '导演'), (2, 5, '主演'),
        (3, 8, '演奏'),
        (4, 6, '主演'),
        (5, 9, '导演'),
        (6, 5, '品牌大使'),
        (7, 4, '艺术顾问'),
    ]
    for si, ci, role in show_creator_map:
        conn.execute("INSERT INTO show_creators (show_id,creator_id,role) VALUES (?,?,?)",
                     (show_ids[si], creator_ids[ci], role))

    users_data = [
        ('张三', 'zhangsan@example.com', '13800138001', '', 100, 'normal'),
        ('李四', 'lisi@example.com', '13800138002', '', 85, 'normal'),
        ('王五', 'wangwu@example.com', '13800138003', '', 72, 'warning'),
        ('赵六', 'zhaoliu@example.com', '13800138004', '', 45, 'danger'),
        ('孙七', 'sunqi@example.com', '13800138005', '', 95, 'normal'),
        ('周八', 'zhouba@example.com', '13800138006', '', 100, 'normal'),
    ]
    user_ids = []
    for name, email, phone, avatar, credit, risk in users_data:
        cur = conn.execute("INSERT INTO users (username,email,phone,avatar_url,credit_score,risk_level) VALUES (?,?,?,?,?,?)",
                          (name, email, phone, avatar, credit, risk))
        user_ids.append(cur.lastrowid)

    prefs_data = [
        (0, ['concert', 'drama', 'movie'], [0.9, 0.6, 0.7]),
        (1, ['movie', 'exhibition', 'sports'], [0.8, 0.5, 0.3]),
        (2, ['concert', 'movie'], [0.7, 0.6]),
        (3, ['movie', 'sports'], [0.5, 0.4]),
        (4, ['drama', 'exhibition', 'concert'], [0.8, 0.7, 0.6]),
        (5, ['sports', 'movie'], [0.9, 0.5]),
    ]
    for ui, genres, weights in prefs_data:
        for g, w in zip(genres, weights):
            conn.execute("INSERT INTO user_preferences (user_id,genre,weight) VALUES (?,?,?)",
                        (user_ids[ui], g, w))

    social_data = [(0,1),(0,2),(1,2),(1,3),(2,4),(3,5),(4,5),(0,4)]
    for u, f in social_data:
        conn.execute("INSERT INTO user_social (user_id,friend_id) VALUES (?,?)", (user_ids[u], user_ids[f]))

    for si, show_id in enumerate(show_ids):
        show = shows_data[si]
        zones = []
        if show[2] == '国家体育场（鸟巢）':
            zones = [('VIP', 3, 20, 2580, 9.5), ('A', 5, 25, 1580, 8.0), ('B', 8, 30, 980, 6.5), ('C', 10, 35, 680, 5.0), ('D', 12, 40, 580, 4.0)]
        elif show[2] == '工人体育场':
            zones = [('VIP', 3, 20, 680, 9.0), ('A', 5, 25, 480, 7.5), ('B', 8, 30, 280, 5.5), ('C', 10, 35, 180, 4.0), ('D', 12, 40, 120, 3.0)]
        elif '大剧院' in show[2] or '保利' in show[2] or '音乐厅' in show[2]:
            zones = [('VIP', 2, 15, show[13], 9.5), ('A', 4, 18, round(show[13]*0.7), 8.0), ('B', 6, 20, round(show[13]*0.5), 6.5), ('C', 8, 22, show[12], 5.0)]
        else:
            zones = [('VIP', 2, 10, show[13], 9.5), ('A', 3, 12, round(show[13]*0.8), 7.5), ('B', 4, 15, round(show[13]*0.6), 6.0), ('C', 5, 18, show[12], 4.5)]

        seat_count = 0
        for zone, rows, cols, price, sight in zones:
            for r in range(1, rows + 1):
                for c in range(1, cols + 1):
                    is_acc = 1 if (r == 1 and c <= 2) else 0
                    status = 'available'
                    conn.execute("""
                        INSERT INTO seats (show_id,zone,row_num,col_num,price,sight_score,is_accessible,status)
                        VALUES (?,?,?,?,?,?,?,?)
                    """, (show_id, zone, r, c, price, sight, is_acc, status))
                    seat_count += 1
        conn.execute("UPDATE shows SET total_seats=?, available_seats=? WHERE id=?", (seat_count, seat_count - si * 3, show_id))

    reviews_data = [
        (0, 0, '太震撼了！从开场到结尾全程高能，周董的经典串烧让人泪目', 5, 0.95, 0, 1.0),
        (0, 1, '音效和舞美一流，但后排视线有些遮挡', 4, 0.70, 0, 1.0),
        (0, 2, '经典曲目太少了，新歌偏多', 3, 0.40, 1, 2.5),
        (1, 3, '水墨美学做到了极致，张艺谋的舞台调度无与伦比', 5, 0.93, 1, 3.0),
        (1, 4, '节奏偏慢，但视觉效果确实惊艳', 4, 0.65, 0, 1.0),
        (2, 0, '流浪地球3比前两部更宏大，但剧情稍显散乱', 4, 0.60, 1, 2.8),
        (2, 1, 'IMAX效果绝了！值得二刷', 5, 0.92, 0, 1.0),
        (3, 5, '郎朗的肖邦太动人了，技巧与情感的完美融合', 5, 0.96, 1, 3.2),
        (5, 3, '暗恋桃花源永远的神，这次新编排也很出色', 5, 0.90, 0, 1.0),
        (6, 2, '工体氛围太棒了！国安加油！', 5, 0.88, 0, 1.0),
        (7, 4, '沉浸式体验超预期，适合拍照打卡', 4, 0.75, 0, 1.0),
    ]
    for si, ui, content, rating, sentiment, is_critic, weight in reviews_data:
        conn.execute("""
            INSERT INTO reviews (show_id,user_id,content,rating,sentiment_score,is_critic,influencer_weight)
            VALUES (?,?,?,?,?,?,?)
        """, (show_ids[si], user_ids[ui], content, rating, sentiment, is_critic, weight))

    videos_data = [
        (0, '周杰伦演唱会彩排幕后花絮', '演唱会,周杰伦,幕后', '', 125000, 8900, 3.5, 180),
        (0, '嘉年华世界巡演舞美揭秘', '演唱会,舞美,科技', '', 89000, 5600, 2.8, 120),
        (2, '流浪地球3预告片震撼发布', '电影,科幻,流浪地球', '', 2300000, 156000, 5.0, 90),
        (2, '吴京专访：流浪地球3的突破', '电影,访谈,吴京', '', 560000, 32000, 4.0, 300),
        (1, '张艺谋《影》话剧排练纪录', '话剧,张艺谋,幕后', '', 120000, 7800, 3.2, 240),
        (3, '郎朗练琴日常：肖邦夜曲', '钢琴,郎朗,古典', '', 340000, 22000, 4.5, 180),
        (5, '《暗恋桃花源》经典台词回顾', '话剧,经典,台词', '', 78000, 4500, 2.0, 150),
        (7, '沉浸式艺术展「幻境」探馆', '展览,798,沉浸式', '', 95000, 6200, 2.5, 200),
    ]
    for si, title, tags, cover, views, likes, weight, duration in videos_data:
        conn.execute("""
            INSERT INTO videos (show_id,title,tags,cover_url,view_count,like_count,influencer_weight,duration_seconds)
            VALUES (?,?,?,?,?,?,?,?)
        """, (show_ids[si], title, tags, cover, views, likes, weight, duration))

    local_services_data = [
        ('escape_room', '迷境密室·恐怖医院主题', '北京市朝阳区三里屯路19号', 39.9342, 116.4541, 128, '沉浸式恐怖密室，4-6人组队，90分钟极限逃脱', 1, '', ''),
        ('escape_room', '时空裂隙·科幻解谜', '北京市海淀区中关村大街15号', 39.9825, 116.3105, 158, '硬核科幻密室，融合AR解谜，适合2-4人', 0, '', ''),
        ('escape_room', '古墓迷踪·盗墓笔记', '北京市东城区东四十条22号', 39.9345, 116.4251, 98, '盗墓题材密室，机关重重，3-5人挑战', 1, '', ''),
        ('ktv', 'K-Star量贩KTV', '北京市朝阳区建国门外大街1号', 39.9087, 116.4606, 88, '豪华包厢，海量曲库，自助餐饮', 1, '', ''),
        ('ktv', '唱吧麦颂KTV', '北京市海淀区五道口华联商场3层', 39.9925, 116.3383, 58, '学生友好，周末特惠，小包到大包全选', 0, '', ''),
        ('ktv', '纯K·潮流KTV', '北京市西城区西单大悦城6层', 39.9098, 116.3726, 108, '潮流音效，网红打卡，酒水畅饮', 1, '', ''),
        ('food_deal', '火锅江湖·双人套餐', '北京市朝阳区望京SOHO T1', 39.9942, 116.4765, 168, '川味老火锅双人套餐，含锅底+4荤4素+饮品', 1, '', ''),
        ('food_deal', '寿司之匠·精致料理', '北京市东城区王府井大街138号', 39.9145, 116.4101, 298, '日式Omakase双人体验，主厨手握8贯+刺身拼盘', 1, '', ''),
        ('food_deal', '烤肉实验室·四人欢聚', '北京市海淀区五道口华联2层', 39.9921, 116.3381, 228, '黑毛和牛+澳牛四人套餐，炭火直烤', 0, '', ''),
    ]
    for stype, name, addr, lat, lng, price, desc, avail, cover, voucher in local_services_data:
        code = f"VOUCHER-{uuid.uuid4().hex[:8].upper()}" if stype == 'food_deal' else ''
        conn.execute("""
            INSERT INTO local_services (type,name,address,latitude,longitude,price,description,availability,cover_url,voucher_code)
                VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (stype, name, addr, lat, lng, price, desc, avail, cover, code))

    for si, show_id in enumerate(show_ids):
        show = shows_data[si]
        for day_offset in range(3):
            report_date = f"2026-06-{10+day_offset:02d}"
            total = max(10, 50 - si * 5 - day_offset * 8)
            revenue = total * (show[12] + show[13]) / 2
            conn.execute("""
                INSERT INTO box_office_reports (show_id,report_date,total_tickets,total_revenue,online_sales,offline_sales,reported_to_authority)
                VALUES (?,?,?,?,?,?,?)
            """, (show_id, report_date, total, revenue, int(total * 0.8), int(total * 0.2), 1 if day_offset < 2 else 0))

    scalper_data = [
        (3, None, '高频下单：1分钟内连续下单5次', 85.5, '192.168.1.100', 'FP-ABC123', 5, 'flagged'),
        (3, None, 'IP集群：同IP下3个账号同时抢票', 92.3, '192.168.1.100', 'FP-DEF456', 3, 'confirmed'),
        (2, None, '设备指纹异常：模拟器特征', 65.2, '10.0.0.5', 'FP-GHI789', 2, 'flagged'),
        (3, None, '短时间多次退票重购', 55.0, '172.16.0.88', 'FP-JKL012', 4, 'cleared'),
    ]
    for uid, oid, reason, risk, ip, fp, freq, status in scalper_data:
        conn.execute("""
            INSERT INTO scalper_flags (user_id,order_id,reason,risk_score,ip_address,device_fingerprint,order_frequency,status)
            VALUES (?,?,?,?,?,?,?,?)
        """, (user_ids[uid], oid, reason, risk, ip, fp, freq, status))

    demo_orders = [
        (0, 0, 'paid', 2, 1, 1, 5, 'valid', '192.168.1.50', 'FP-USER001'),
        (0, 2, 'paid', 1, 0, 2, 8, 'valid', '192.168.1.50', 'FP-USER001'),
        (1, 1, 'paid', 1, 1, 3, 6, 'valid', '192.168.1.51', 'FP-USER002'),
        (2, 4, 'refunded', 1, 0, 1, 3, 'refunded', '192.168.1.52', 'FP-USER003'),
        (0, 6, 'paid', 1, 0, 2, 5, 'transferred', '192.168.1.50', 'FP-USER001'),
    ]
    for ui, si, ostatus, cnt, zi, ri, ci, tstatus, ip, fp in demo_orders:
        show_id = show_ids[si]
        user_id = user_ids[ui]
        show = shows_data[si]
        zones = [('VIP', 3, 20, 2580, 9.5)]
        if show[2] == '国家体育场（鸟巢）':
            zones = [('VIP', 3, 20, 2580, 9.5), ('A', 5, 25, 1580, 8.0), ('B', 8, 30, 980, 6.5)]
        else:
            zones = [('VIP', 2, 15, show[13], 9.5), ('A', 4, 18, round(show[13]*0.7), 8.0)]
        zone = zones[zi][0]
        price = zones[zi][3]
        row_num = ri
        col_num = ci

        cur = conn.execute("SELECT id FROM seats WHERE show_id=? AND zone=? AND row_num=? AND col_num=?", (show_id, zone, row_num, col_num))
        seat_row = cur.fetchone()
        if seat_row:
            seat_start_id = seat_row[0]
            total_price = price * cnt
            order_no = "ORD" + uuid.uuid4().hex[:12].upper()
            conn.execute("""
                INSERT INTO orders (order_no,user_id,show_id,total_price,status,ip_address,device_fingerprint)
                VALUES (?,?,?,?,?,?,?)
            """, (order_no, user_id, show_id, total_price, ostatus, ip, fp))
            order_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

            for i in range(cnt):
                ticket_no = "TK" + uuid.uuid4().hex[:10].upper()
                blockchain_data = ticket_no + "|" + str(user_id) + "|" + str(show_id) + "|" + str(seat_start_id + i)
                blockchain_hash = make_hash(blockchain_data)
                tcount = 1 if tstatus == 'transferred' else 0
                conn.execute("""
                    INSERT INTO tickets (ticket_no,order_id,user_id,show_id,seat_id,price,status,blockchain_hash,transfer_count,max_transfers)
                    VALUES (?,?,?,?,?,?,?,?,?,?)
                """, (ticket_no, order_id, user_id, show_id, seat_start_id + i, price, tstatus, blockchain_hash, tcount, 2))
                ticket_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

                contract_str = "contract:" + str(ticket_id) + ":" + ticket_no + ":" + str(user_id) + ":" + str(show_id)
                contract_hash = make_hash(contract_str)
                refund_rules = '演出前7天全额退款，3-7天退80%，3天内退50%'
                conn.execute("""
                    INSERT INTO ticket_contracts (ticket_id,transfer_allowed,max_transfer_count,refund_policy,refund_rules,blockchain_txid)
                    VALUES (?,?,?,?,?,?)
                """, (ticket_id, 1 if tstatus == 'valid' else 0, 2, 'standard', refund_rules, contract_hash))

                if tstatus == 'valid':
                    conn.execute("UPDATE seats SET status='sold' WHERE id=?", (seat_start_id + i,))

def make_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()

def json_response(payload, status=200):
    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    return status, body

def parse_path(request_path):
    parsed = urlparse(request_path)
    return parsed.path, parse_qs(parsed.query)

flash_sale_lock = threading.Lock()
seat_lock = threading.Lock()

class Handler(BaseHTTPRequestHandler):
    server_version = "EntertainmentPlatform/1.0"

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        path, query = parse_path(self.path)
        try:
            if path == "/api/health":
                self._handle_health()
            elif path == "/api/dashboard":
                self._handle_dashboard(query)
            elif path == "/api/shows":
                self._handle_list_shows(query)
            elif re.match(r'^/api/shows/\d+$', path):
                sid = int(path.split('/')[-1])
                self._handle_show_detail(sid)
            elif re.match(r'^/api/shows/\d+/creators$', path):
                sid = int(path.split('/')[-2])
                self._handle_show_creators(sid)
            elif re.match(r'^/api/shows/\d+/reviews$', path):
                sid = int(path.split('/')[-2])
                self._handle_show_reviews(sid, query)
            elif re.match(r'^/api/shows/\d+/seats$', path):
                sid = int(path.split('/')[-2])
                self._handle_show_seats(sid, query)
            elif path == "/api/creators":
                self._handle_list_creators(query)
            elif re.match(r'^/api/creators/\d+$', path):
                cid = int(path.split('/')[-1])
                self._handle_creator_detail(cid)
            elif path == "/api/users":
                self._handle_list_users()
            elif re.match(r'^/api/users/\d+$', path):
                uid = int(path.split('/')[-1])
                self._handle_user_detail(uid)
            elif re.match(r'^/api/users/\d+/preferences$', path):
                uid = int(path.split('/')[-2])
                self._handle_user_preferences(uid)
            elif re.match(r'^/api/users/\d+/social$', path):
                uid = int(path.split('/')[-2])
                self._handle_user_social(uid)
            elif path == "/api/tickets":
                self._handle_list_tickets(query)
            elif re.match(r'^/api/tickets/\d+$', path):
                tid = int(path.split('/')[-1])
                self._handle_ticket_detail(tid)
            elif path == "/api/orders":
                self._handle_list_orders(query)
            elif re.match(r'^/api/orders/\d+$', path):
                oid = int(path.split('/')[-1])
                self._handle_order_detail(oid)
            elif path == "/api/videos":
                self._handle_list_videos(query)
            elif path == "/api/videos/trending":
                self._handle_trending_videos(query)
            elif path == "/api/local-services":
                self._handle_list_local_services(query)
            elif re.match(r'^/api/local-services/\d+/voucher$', path):
                sid = int(path.split('/')[-2])
                self._handle_generate_voucher(sid)
            elif path == "/api/admin/box-office":
                self._handle_box_office_reports(query)
            elif path == "/api/admin/scalper-flags":
                self._handle_scalper_flags(query)
            elif path == "/api/admin/stats":
                self._handle_admin_stats()
            else:
                code, body = json_response({"ok": False, "error": "Not found"}, 404)
                self._send_json(code, body)
        except Exception as exc:
            code, body = json_response({"ok": False, "error": str(exc)}, 500)
            self._send_json(code, body)

    def do_POST(self):
        path, _ = parse_path(self.path)
        body_data = self._read_body()
        try:
            if re.match(r'^/api/shows/\d+/purchase$', path):
                sid = int(path.split('/')[-2])
                self._handle_purchase(sid, body_data)
            elif re.match(r'^/api/tickets/\d+/transfer$', path):
                tid = int(path.split('/')[-2])
                self._handle_ticket_transfer(tid, body_data)
            elif re.match(r'^/api/tickets/\d+/refund$', path):
                tid = int(path.split('/')[-2])
                self._handle_ticket_refund(tid, body_data)
            elif path == "/api/seats/lock":
                self._handle_seat_lock(body_data)
            elif path == "/api/seats/unlock":
                self._handle_seat_unlock(body_data)
            elif path == "/api/seats/recommend":
                self._handle_seat_recommend(body_data)
            elif path == "/api/flash-sale/enter":
                self._handle_flash_sale_enter(body_data)
            elif path == "/api/flash-sale/status":
                self._handle_flash_sale_status(body_data)
            elif path == "/api/reviews":
                self._handle_create_review(body_data)
            elif path == "/api/admin/box-office/report":
                self._handle_box_office_report(body_data)
            elif re.match(r'^/api/admin/scalper-flags/\d+/confirm$', path):
                fid = int(path.split('/')[-2])
                self._handle_scalper_confirm(fid)
            elif re.match(r'^/api/admin/scalper-flags/\d+/clear$', path):
                fid = int(path.split('/')[-2])
                self._handle_scalper_clear(fid)
            else:
                code, body = json_response({"ok": False, "error": "Not found"}, 404)
                self._send_json(code, body)
        except Exception as exc:
            code, body = json_response({"ok": False, "error": str(exc)}, 500)
            self._send_json(code, body)

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length:
            raw = self.rfile.read(length)
            try:
                return json.loads(raw)
            except Exception:
                return {}
        return {}

    def _send_json(self, code, body):
        self.send_response(code)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_cors_headers(self):
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Vary", "Origin")

    def _ok(self, data=None, **kwargs):
        payload = {"ok": True}
        if data is not None:
            payload["data"] = data
        payload.update(kwargs)
        code, body = json_response(payload)
        self._send_json(code, body)

    def _handle_health(self):
        with get_db() as conn:
            conn.execute("SELECT 1 FROM service_status LIMIT 1")
        self._ok(service="EntertainmentPlatform", sqlite="connected")

    def _handle_dashboard(self, query):
        with get_db() as conn:
            show_count = conn.execute("SELECT COUNT(*) FROM shows").fetchone()[0]
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            order_count = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
            ticket_count = conn.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
            hot_shows = conn.execute("""
                SELECT id, title, type, heat_index, sentiment_score, venue, show_date, price_min, price_max, status
                FROM shows ORDER BY heat_index DESC LIMIT 5
            """).fetchall()
            recent_orders = conn.execute("""
                SELECT o.id, o.order_no, o.total_price, o.status, o.created_at, u.username, s.title
                FROM orders o JOIN users u ON o.user_id=u.id JOIN shows s ON o.show_id=s.id
                ORDER BY o.created_at DESC LIMIT 5
            """).fetchall()
            scalper_alerts = conn.execute("SELECT COUNT(*) FROM scalper_flags WHERE status='flagged'").fetchone()[0]
        self._ok(
            show_count=show_count,
            user_count=user_count,
            order_count=order_count,
            ticket_count=ticket_count,
            scalper_alerts=scalper_alerts,
            hot_shows=[dict(r) for r in hot_shows],
            recent_orders=[dict(r) for r in recent_orders],
        )

    def _handle_list_shows(self, query):
        type_filter = query.get('type', [None])[0]
        status_filter = query.get('status', [None])[0]
        search = query.get('search', [None])[0]
        page = int(query.get('page', ['1'])[0])
        page_size = int(query.get('page_size', ['12'])[0])
        offset = (page - 1) * page_size

        with get_db() as conn:
            sql = "SELECT * FROM shows WHERE 1=1"
            params = []
            if type_filter:
                sql += " AND type=?"
                params.append(type_filter)
            if status_filter:
                sql += " AND status=?"
                params.append(status_filter)
            if search:
                sql += " AND (title LIKE ? OR venue LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%"])
            total = conn.execute(f"SELECT COUNT(*) FROM ({sql})", params).fetchone()[0]
            sql += " ORDER BY heat_index DESC LIMIT ? OFFSET ?"
            params.extend([page_size, offset])
            rows = conn.execute(sql, params).fetchall()
            shows = [dict(r) for r in rows]
            for show in shows:
                creators = conn.execute("""
                    SELECT c.*, sc.role FROM creators c
                    JOIN show_creators sc ON c.id=sc.creator_id
                    WHERE sc.show_id=?
                """, (show['id'],)).fetchall()
                show['creators'] = [dict(c) for c in creators]
        self._ok(items=shows, total=total, page=page, page_size=page_size)

    def _handle_show_detail(self, sid):
        with get_db() as conn:
            show = conn.execute("SELECT * FROM shows WHERE id=?", (sid,)).fetchone()
            if not show:
                code, body = json_response({"ok": False, "error": "Show not found"}, 404)
                return self._send_json(code, body)
            creators = conn.execute("""
                SELECT c.*, sc.role FROM creators c
                JOIN show_creators sc ON c.id=sc.creator_id
                WHERE sc.show_id=?
            """, (sid,)).fetchall()
            review_stats = conn.execute("""
                SELECT COUNT(*) as count, AVG(rating) as avg_rating, AVG(sentiment_score) as avg_sentiment
                FROM reviews WHERE show_id=?
            """, (sid,)).fetchone()
        data = dict(show)
        data['creators'] = [dict(r) for r in creators]
        data['review_stats'] = dict(review_stats)
        self._ok(data=data)

    def _handle_show_creators(self, sid):
        with get_db() as conn:
            rows = conn.execute("""
                SELECT c.*, sc.role FROM creators c
                JOIN show_creators sc ON c.id=sc.creator_id
                WHERE sc.show_id=?
            """, (sid,)).fetchall()
            related = conn.execute("""
                SELECT DISTINCT s.id, s.title, s.type, s.heat_index
                FROM shows s JOIN show_creators sc ON s.id=sc.show_id
                WHERE sc.creator_id IN (SELECT creator_id FROM show_creators WHERE show_id=?)
                AND s.id != ?
                LIMIT 10
            """, (sid, sid)).fetchall()
        self._ok(creators=[dict(r) for r in rows], related_shows=[dict(r) for r in related])

    def _handle_show_reviews(self, sid, query):
        sort = query.get('sort', ['recent'])[0]
        with get_db() as conn:
            order_by = "created_at DESC" if sort == 'recent' else "influencer_weight DESC, created_at DESC"
            rows = conn.execute(f"""
                SELECT r.*, u.username FROM reviews r
                JOIN users u ON r.user_id=u.id
                WHERE r.show_id=? ORDER BY {order_by}
            """, (sid,)).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_show_seats(self, sid, query):
        zone = query.get('zone', [None])[0]
        with get_db() as conn:
            sql = "SELECT * FROM seats WHERE show_id=?"
            params = [sid]
            if zone:
                sql += " AND zone=?"
                params.append(zone)
            sql += " ORDER BY zone, row_num, col_num"
            rows = conn.execute(sql, params).fetchall()
            zones = conn.execute("SELECT DISTINCT zone FROM seats WHERE show_id=? ORDER BY zone", (sid,)).fetchall()
        self._ok(items=[dict(r) for r in rows], zones=[r['zone'] for r in zones])

    def _handle_list_creators(self, query):
        type_filter = query.get('type', [None])[0]
        with get_db() as conn:
            sql = "SELECT * FROM creators WHERE 1=1"
            params = []
            if type_filter:
                sql += " AND type=?"
                params.append(type_filter)
            sql += " ORDER BY ip_score DESC"
            rows = conn.execute(sql, params).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_creator_detail(self, cid):
        with get_db() as conn:
            creator = conn.execute("SELECT * FROM creators WHERE id=?", (cid,)).fetchone()
            if not creator:
                code, body = json_response({"ok": False, "error": "Creator not found"}, 404)
                return self._send_json(code, body)
            shows = conn.execute("""
                SELECT s.*, sc.role FROM shows s
                JOIN show_creators sc ON s.id=sc.show_id
                WHERE sc.creator_id=?
            """, (cid,)).fetchall()
        data = dict(creator)
        data['shows'] = [dict(r) for r in shows]
        self._ok(data=data)

    def _handle_list_users(self):
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM users ORDER BY id").fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_user_detail(self, uid):
        with get_db() as conn:
            user = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
            if not user:
                code, body = json_response({"ok": False, "error": "User not found"}, 404)
                return self._send_json(code, body)
            prefs = conn.execute("SELECT * FROM user_preferences WHERE user_id=?", (uid,)).fetchall()
            friends = conn.execute("""
                SELECT u.id, u.username, u.avatar_url FROM users u
                JOIN user_social us ON u.id=us.friend_id
                WHERE us.user_id=?
            """, (uid,)).fetchall()
            tickets = conn.execute("""
                SELECT t.*, s.title as show_title, st.zone, st.row_num, st.col_num
                FROM tickets t
                JOIN shows s ON t.show_id=s.id
                JOIN seats st ON t.seat_id=st.id
                WHERE t.user_id=?
                ORDER BY t.created_at DESC
            """, (uid,)).fetchall()
        data = dict(user)
        data['preferences'] = [dict(r) for r in prefs]
        data['friends'] = [dict(r) for r in friends]
        data['tickets'] = [dict(r) for r in tickets]
        self._ok(data=data)

    def _handle_user_preferences(self, uid):
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM user_preferences WHERE user_id=?", (uid,)).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_user_social(self, uid):
        with get_db() as conn:
            friends = conn.execute("""
                SELECT u.id, u.username, u.avatar_url FROM users u
                JOIN user_social us ON u.id=us.friend_id
                WHERE us.user_id=?
            """, (uid,)).fetchall()
        self._ok(friends=[dict(r) for r in friends])

    def _handle_purchase(self, sid, body):
        user_id = body.get('user_id', 1)
        seat_ids = body.get('seat_ids', [])
        ip_address = body.get('ip_address', '127.0.0.1')
        device_fingerprint = body.get('device_fingerprint', '')

        with seat_lock:
            with get_db() as conn:
                show = conn.execute("SELECT * FROM shows WHERE id=? AND status='selling'", (sid,)).fetchone()
                if not show:
                    return self._ok(error="演出不可购买", ok=False)
                if show['is_flash_sale']:
                    now = time.strftime('%Y-%m-%dT%H:%M:%S')
                    if now < show['flash_sale_start'] or now > show['flash_sale_end']:
                        return self._ok(error="秒杀未开放", ok=False)
                if not seat_ids:
                    return self._ok(error="请选择座位", ok=False)

                seats = []
                total = 0
                for seat_id in seat_ids:
                    seat = conn.execute("SELECT * FROM seats WHERE id=? AND show_id=? AND status='available'", (seat_id, sid)).fetchone()
                    if not seat:
                        return self._ok(error=f"座位{seat_id}不可用", ok=False)
                    seats.append(seat)
                    total += seat['price']

                order_no = f"ORD-{uuid.uuid4().hex[:12].upper()}"
                cur = conn.execute("""
                    INSERT INTO orders (order_no,user_id,show_id,total_price,status,ip_address,device_fingerprint)
                    VALUES (?,?,?,?,'paid',?,?)
                """, (order_no, user_id, sid, total, ip_address, device_fingerprint))
                order_id = cur.lastrowid

                tickets = []
                for seat in seats:
                    ticket_no = f"TKT-{uuid.uuid4().hex[:10].upper()}"
                    bhash = make_hash(f"{ticket_no}:{seat['id']}:{time.time()}")
                    qr = f"QR-{uuid.uuid4().hex[:8].upper()}"
                    tcur = conn.execute("""
                        INSERT INTO tickets (ticket_no,order_id,show_id,user_id,seat_id,price,blockchain_hash,qr_code)
                        VALUES (?,?,?,?,?,?,?,?)
                    """, (ticket_no, order_id, sid, user_id, seat['id'], seat['price'], bhash, qr))
                    tid = tcur.lastrowid
                    conn.execute("""
                        INSERT INTO ticket_contracts (ticket_id,transfer_allowed,max_transfer_count,refund_policy,refund_rules,blockchain_txid)
                        VALUES (1,2,'standard','开场前7天全额退款;开场前3天退款80%;开场前1天退款50%;开场后不可退款',?)
                    """, (f"TX-{uuid.uuid4().hex[:12].upper()}",))
                    conn.execute("UPDATE seats SET status='sold' WHERE id=?", (seat['id'],))
                    tickets.append({'ticket_no': ticket_no, 'seat': f"{seat['zone']}{seat['row_num']}排{seat['col_num']}号", 'price': seat['price'], 'blockchain_hash': bhash})

                conn.execute("UPDATE shows SET available_seats=available_seats-? WHERE id=?", (len(seat_ids), sid))
                conn.commit()

        self._ok(order_no=order_no, total_price=total, tickets=tickets)

    def _handle_ticket_transfer(self, tid, body):
        target_user_id = body.get('target_user_id')
        with get_db() as conn:
            ticket = conn.execute("SELECT * FROM tickets WHERE id=? AND status='valid'", (tid,)).fetchone()
            if not ticket:
                return self._ok(error="票务不可转赠", ok=False)
            contract = conn.execute("SELECT * FROM ticket_contracts WHERE ticket_id=?", (tid,)).fetchone()
            if not contract or not contract['transfer_allowed']:
                return self._ok(error="该票不允许转赠", ok=False)
            if ticket['transfer_count'] >= ticket['max_transfers']:
                return self._ok(error="已达最大转赠次数", ok=False)
            target = conn.execute("SELECT * FROM users WHERE id=?", (target_user_id,)).fetchone()
            if not target:
                return self._ok(error="目标用户不存在", ok=False)

            new_hash = make_hash(f"transfer:{tid}:{target_user_id}:{time.time()}")
            conn.execute("""
                UPDATE tickets SET user_id=?, transfer_count=transfer_count+1,
                blockchain_hash=?, status='transferred', updated_at=datetime('now')
                WHERE id=?
            """, (target_user_id, new_hash, tid))
            conn.execute("UPDATE tickets SET status='valid' WHERE id=?", (tid,))
            conn.execute("""
                UPDATE ticket_contracts SET blockchain_txid=? WHERE ticket_id=?
            """, (f"TX-TRANSFER-{uuid.uuid4().hex[:8].upper()}", tid))
            conn.commit()
            new_ticket = conn.execute("SELECT * FROM tickets WHERE id=?", (tid,)).fetchone()
        self._ok(data=dict(new_ticket))

    def _handle_ticket_refund(self, tid, body):
        with get_db() as conn:
            ticket = conn.execute("SELECT * FROM tickets WHERE id=? AND status='valid'", (tid,)).fetchone()
            if not ticket:
                return self._ok(error="票务不可退改", ok=False)
            contract = conn.execute("SELECT * FROM ticket_contracts WHERE ticket_id=?", (tid,)).fetchone()
            refund_policy = contract['refund_policy'] if contract else 'standard'
            refund_pct = 1.0
            if refund_policy == 'standard':
                refund_pct = 0.8

            refund_amount = round(ticket['price'] * refund_pct, 2)
            conn.execute("UPDATE tickets SET status='refunded', updated_at=datetime('now') WHERE id=?", (tid,))
            conn.execute("UPDATE seats SET status='available' WHERE id=?", (ticket['seat_id'],))
            conn.execute("UPDATE orders SET status='refunded', updated_at=datetime('now') WHERE id=?", (ticket['order_id'],))
            conn.execute("UPDATE shows SET available_seats=available_seats+1 WHERE id=?", (ticket['show_id'],))
            conn.commit()
        self._ok(refund_amount=refund_amount, refund_pct=refund_pct, ticket_id=tid)

    def _handle_seat_lock(self, body):
        seat_ids = body.get('seat_ids', [])
        user_id = body.get('user_id', 1)
        lock_seconds = body.get('lock_seconds', 300)
        locked_until = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(time.time() + lock_seconds))
        with seat_lock:
            with get_db() as conn:
                locked = []
                for sid in seat_ids:
                    seat = conn.execute("SELECT * FROM seats WHERE id=? AND status='available'", (sid,)).fetchone()
                    if seat:
                        conn.execute("UPDATE seats SET status='locked', locked_until=?, locked_by=? WHERE id=?",
                                    (locked_until, str(user_id), sid))
                        locked.append(sid)
                conn.commit()
        self._ok(locked_seats=locked, locked_until=locked_until)

    def _handle_seat_unlock(self, body):
        seat_ids = body.get('seat_ids', [])
        with seat_lock:
            with get_db() as conn:
                for sid in seat_ids:
                    conn.execute("UPDATE seats SET status='available', locked_until='', locked_by='' WHERE id=?", (sid,))
                conn.commit()
        self._ok(unlocked=seat_ids)

    def _handle_seat_recommend(self, body):
        show_id = body.get('show_id')
        count = body.get('count', 2)
        prefer_accessible = body.get('prefer_accessible', False)
        with get_db() as conn:
            if prefer_accessible:
                rows = conn.execute("""
                    SELECT * FROM seats WHERE show_id=? AND status='available' AND is_accessible=1
                    ORDER BY sight_score DESC, row_num, col_num LIMIT ?
                """, (show_id, count)).fetchall()
            else:
                rows = conn.execute("""
                    SELECT * FROM seats WHERE show_id=? AND status='available'
                    ORDER BY sight_score DESC, row_num, col_num LIMIT 50
                """, (show_id,)).fetchall()

            best_group = []
            if len(rows) >= count:
                for i in range(len(rows) - count + 1):
                    group = rows[i:i+count]
                    if all(g['row_num'] == group[0]['row_num'] for g in group):
                        cols = sorted(g['col_num'] for g in group)
                        if cols[-1] - cols[0] == count - 1:
                            best_group = group
                            break
                if not best_group:
                    best_group = list(rows[:count])
            else:
                best_group = list(rows)

        self._ok(recommended=[dict(r) for r in best_group])

    def _handle_flash_sale_enter(self, body):
        show_id = body.get('show_id')
        user_id = body.get('user_id', 1)
        with flash_sale_lock:
            with get_db() as conn:
                show = conn.execute("SELECT * FROM shows WHERE id=? AND is_flash_sale=1", (show_id,)).fetchone()
                if not show:
                    return self._ok(error="非秒杀演出", ok=False)
                now = time.strftime('%Y-%m-%dT%H:%M:%S')
                if now < show['flash_sale_start']:
                    return self._ok(error="秒杀未开始", ok=False, queue_position=-1)
                if show['available_seats'] <= 0:
                    return self._ok(error="已售罄", ok=False, queue_position=-1)
                user_orders = conn.execute("""
                    SELECT COUNT(*) FROM orders WHERE user_id=? AND show_id=? AND status='paid'
                """, (user_id, show_id)).fetchone()[0]
                if user_orders > 0:
                    return self._ok(error="每人限购一次", ok=False)
                queue_pos = max(1, show['available_seats'] - 1)
        self._ok(queue_position=queue_pos, can_purchase=True)

    def _handle_flash_sale_status(self, body):
        show_id = body.get('show_id')
        with get_db() as conn:
            show = conn.execute("SELECT available_seats, flash_sale_start, flash_sale_end, is_flash_sale FROM shows WHERE id=?", (show_id,)).fetchone()
        if not show:
            return self._ok(error="演出不存在", ok=False)
        self._ok(available=show['available_seats'], is_flash_sale=show['is_flash_sale'])

    def _handle_list_tickets(self, query):
        user_id = query.get('user_id', [None])[0]
        status = query.get('status', [None])[0]
        with get_db() as conn:
            sql = """
                SELECT t.*, s.title as show_title, s.venue, s.show_date, s.show_time,
                       st.zone, st.row_num, st.col_num,
                       tc.transfer_allowed, tc.max_transfer_count, tc.refund_policy, tc.refund_rules, tc.blockchain_txid
                FROM tickets t
                JOIN shows s ON t.show_id=s.id
                JOIN seats st ON t.seat_id=st.id
                LEFT JOIN ticket_contracts tc ON tc.ticket_id=t.id
                WHERE 1=1
            """
            params = []
            if user_id:
                sql += " AND t.user_id=?"
                params.append(user_id)
            if status:
                sql += " AND t.status=?"
                params.append(status)
            sql += " ORDER BY t.created_at DESC"
            rows = conn.execute(sql, params).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_ticket_detail(self, tid):
        with get_db() as conn:
            ticket = conn.execute("""
                SELECT t.*, s.title as show_title, s.venue, s.show_date, s.show_time,
                       st.zone, st.row_num, st.col_num, st.sight_score, st.is_accessible
                FROM tickets t
                JOIN shows s ON t.show_id=s.id
                JOIN seats st ON t.seat_id=st.id
                WHERE t.id=?
            """, (tid,)).fetchone()
            if not ticket:
                code, body = json_response({"ok": False, "error": "Ticket not found"}, 404)
                return self._send_json(code, body)
            contract = conn.execute("SELECT * FROM ticket_contracts WHERE ticket_id=?", (tid,)).fetchone()
        data = dict(ticket)
        data['contract'] = dict(contract) if contract else None
        self._ok(data=data)

    def _handle_list_orders(self, query):
        user_id = query.get('user_id', [None])[0]
        with get_db() as conn:
            sql = """
                SELECT o.*, s.title as show_title, u.username
                FROM orders o
                JOIN shows s ON o.show_id=s.id
                JOIN users u ON o.user_id=u.id
                WHERE 1=1
            """
            params = []
            if user_id:
                sql += " AND o.user_id=?"
                params.append(user_id)
            sql += " ORDER BY o.created_at DESC"
            rows = conn.execute(sql, params).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_order_detail(self, oid):
        with get_db() as conn:
            order = conn.execute("""
                SELECT o.*, s.title as show_title, u.username
                FROM orders o
                JOIN shows s ON o.show_id=s.id
                JOIN users u ON o.user_id=u.id
                WHERE o.id=?
            """, (oid,)).fetchone()
            if not order:
                code, body = json_response({"ok": False, "error": "Order not found"}, 404)
                return self._send_json(code, body)
            tickets = conn.execute("""
                SELECT t.*, st.zone, st.row_num, st.col_num, st.sight_score
                FROM tickets t
                JOIN seats st ON t.seat_id=st.id
                WHERE t.order_id=?
            """, (oid,)).fetchall()
            ticket_ids = [t['id'] for t in tickets]
            contracts = []
            if ticket_ids:
                placeholders = ','.join('?' * len(ticket_ids))
                contracts = conn.execute(f"""
                    SELECT * FROM ticket_contracts WHERE ticket_id IN ({placeholders})
                """, ticket_ids).fetchall()
            scalper_flags = conn.execute("""
                SELECT * FROM scalper_flags WHERE user_id=? ORDER BY created_at DESC LIMIT 1
            """, (order['user_id'],)).fetchone()
            regulatory = conn.execute("""
                SELECT * FROM box_office_reports WHERE show_id=? ORDER BY report_date DESC LIMIT 1
            """, (order['show_id'],)).fetchone()

        data = dict(order)
        result = {
            "ok": True,
            "data": data,
            "tickets": [dict(r) for r in tickets],
            "contract": dict(contracts[0]) if contracts else {},
            "scalper_check": dict(scalper_flags) if scalper_flags else {"is_flagged": False, "risk_score": 0},
            "regulatory": dict(regulatory) if regulatory else {"report_no": "REG-" + str(order['order_no']), "reported_at": order['created_at']}
        }
        code, body = json_response(result)
        self._send_json(code, body)

    def _handle_list_videos(self, query):
        tags = query.get('tags', [None])[0]
        show_id = query.get('show_id', [None])[0]
        with get_db() as conn:
            sql = "SELECT v.*, s.title as show_title FROM videos v LEFT JOIN shows s ON v.show_id=s.id WHERE 1=1"
            params = []
            if tags:
                sql += " AND v.tags LIKE ?"
                params.append(f"%{tags}%")
            if show_id:
                sql += " AND v.show_id=?"
                params.append(show_id)
            sql += " ORDER BY influencer_weight DESC, view_count DESC"
            rows = conn.execute(sql, params).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_trending_videos(self, query):
        limit = int(query.get('limit', ['10'])[0])
        with get_db() as conn:
            rows = conn.execute("""
                SELECT v.*, s.title as show_title FROM videos v
                LEFT JOIN shows s ON v.show_id=s.id
                ORDER BY (v.view_count * 0.3 + v.like_count * 0.5 + v.influencer_weight * 1000) DESC
                LIMIT ?
            """, (limit,)).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_list_local_services(self, query):
        type_filter = query.get('type', [None])[0]
        with get_db() as conn:
            sql = "SELECT * FROM local_services WHERE 1=1"
            params = []
            if type_filter:
                sql += " AND type=?"
                params.append(type_filter)
            sql += " ORDER BY type, price"
            rows = conn.execute(sql, params).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_generate_voucher(self, sid):
        code = f"VOUCHER-{uuid.uuid4().hex[:8].upper()}"
        with get_db() as conn:
            conn.execute("UPDATE local_services SET voucher_code=? WHERE id=?", (code, sid))
            conn.commit()
        self._ok(voucher_code=code, service_id=sid)

    def _handle_box_office_reports(self, query):
        show_id = query.get('show_id', [None])[0]
        with get_db() as conn:
            sql = """
                SELECT b.*, s.title as show_title FROM box_office_reports b
                JOIN shows s ON b.show_id=s.id WHERE 1=1
            """
            params = []
            if show_id:
                sql += " AND b.show_id=?"
                params.append(show_id)
            sql += " ORDER BY b.report_date DESC"
            rows = conn.execute(sql, params).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_box_office_report(self, body):
        show_id = body.get('show_id')
        with get_db() as conn:
            conn.execute("""
                UPDATE box_office_reports SET reported_to_authority=1
                WHERE show_id=? AND reported_to_authority=0
            """, (show_id,))
            conn.commit()
        self._ok(reported=True, show_id=show_id)

    def _handle_scalper_flags(self, query):
        status = query.get('status', [None])[0]
        with get_db() as conn:
            sql = """
                SELECT sf.*, u.username, u.credit_score, u.risk_level
                FROM scalper_flags sf
                JOIN users u ON sf.user_id=u.id
                WHERE 1=1
            """
            params = []
            if status:
                sql += " AND sf.status=?"
                params.append(status)
            sql += " ORDER BY sf.risk_score DESC"
            rows = conn.execute(sql, params).fetchall()
        self._ok(items=[dict(r) for r in rows])

    def _handle_scalper_confirm(self, fid):
        with get_db() as conn:
            flag = conn.execute("SELECT * FROM scalper_flags WHERE id=?", (fid,)).fetchone()
            if flag:
                conn.execute("UPDATE scalper_flags SET status='confirmed' WHERE id=?", (fid,))
                conn.execute("UPDATE users SET risk_level='danger', credit_score=MIN(credit_score-30,0) WHERE id=?", (flag['user_id'],))
                conn.commit()
        self._ok(confirmed=True, flag_id=fid)

    def _handle_scalper_clear(self, fid):
        with get_db() as conn:
            conn.execute("UPDATE scalper_flags SET status='cleared' WHERE id=?", (fid,))
            conn.commit()
        self._ok(cleared=True, flag_id=fid)

    def _handle_create_review(self, body):
        show_id = body.get('show_id')
        user_id = body.get('user_id', 1)
        content = body.get('content', '')
        rating = body.get('rating', 5)
        positive_words = ['震撼', '精彩', '感动', '绝了', '好看', '出色', '完美', '惊艳', '一流', '棒']
        negative_words = ['失望', '差', '难看', '烂', '垃圾', '无聊', '浪费时间', '退款']
        sentiment = 0.5
        for w in positive_words:
            if w in content:
                sentiment = min(1.0, sentiment + 0.15)
        for w in negative_words:
            if w in content:
                sentiment = max(0.0, sentiment - 0.2)
        with get_db() as conn:
            conn.execute("""
                INSERT INTO reviews (show_id,user_id,content,rating,sentiment_score,is_critic,influencer_weight)
                VALUES (?,?,?,?,?,0,1.0)
            """, (show_id, user_id, content, rating, sentiment))
            avg = conn.execute("SELECT AVG(sentiment_score) FROM reviews WHERE show_id=?", (show_id,)).fetchone()[0]
            conn.execute("UPDATE shows SET sentiment_score=? WHERE id=?", (round(avg or 0, 2), show_id))
            conn.commit()
        self._ok(created=True, sentiment_score=sentiment)

    def _handle_admin_stats(self):
        with get_db() as conn:
            total_revenue = conn.execute("SELECT COALESCE(SUM(total_price),0) FROM orders WHERE status='paid'").fetchone()[0]
            total_orders = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
            total_tickets_sold = conn.execute("SELECT COUNT(*) FROM tickets WHERE status IN ('valid','used','transferred')").fetchone()[0]
            flagged_users = conn.execute("SELECT COUNT(*) FROM scalper_flags WHERE status='flagged'").fetchone()[0]
            confirmed_scalpers = conn.execute("SELECT COUNT(*) FROM scalper_flags WHERE status='confirmed'").fetchone()[0]
            unreported = conn.execute("SELECT COUNT(*) FROM box_office_reports WHERE reported_to_authority=0").fetchone()[0]
        self._ok(
            total_revenue=total_revenue,
            total_orders=total_orders,
            total_tickets_sold=total_tickets_sold,
            flagged_users=flagged_users,
            confirmed_scalpers=confirmed_scalpers,
            unreported_box_office=unreported,
        )

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), fmt % args))


def main():
    init_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Backend listening on http://{HOST}:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
