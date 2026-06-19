from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    env_path = ROOT / ".env"
    if env_path.exists():
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


ENV = load_env()
HOST = ENV.get("BACKEND_HOST", ENV.get("HOST", "127.0.0.1"))
PORT = int(ENV.get("BACKEND_PORT", ENV.get("PORT", "59231")))
DB_PATH = ROOT / ENV.get("SQLITE_PATH", "data/app.sqlite3")


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(
            """
            DROP TABLE IF EXISTS service_status;
            DROP TABLE IF EXISTS metrics;
            DROP TABLE IF EXISTS work_items;

            CREATE TABLE IF NOT EXISTS ayahs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                avatar TEXT,
                role TEXT NOT NULL,
                city TEXT NOT NULL,
                age INTEGER NOT NULL,
                experience INTEGER NOT NULL,
                rating REAL DEFAULT 5.0,
                order_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'available',
                skills TEXT DEFAULT '',
                id_card TEXT,
                phone TEXT,
                checkin_today INTEGER DEFAULT 0,
                face_verified INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS employers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                city TEXT NOT NULL,
                address TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS demands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employer_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                role_needed TEXT NOT NULL,
                city TEXT NOT NULL,
                salary_from INTEGER NOT NULL,
                salary_to INTEGER NOT NULL,
                start_date TEXT,
                duration TEXT,
                description TEXT,
                status TEXT DEFAULT 'open',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT NOT NULL UNIQUE,
                demand_id INTEGER,
                ayah_id INTEGER NOT NULL,
                employer_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                city TEXT NOT NULL,
                salary INTEGER NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                status TEXT DEFAULT 'pending',
                service_nodes INTEGER DEFAULT 0,
                checkin_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS service_nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                node_type TEXT NOT NULL,
                node_name TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                reported_at TEXT,
                remark TEXT
            );

            CREATE TABLE IF NOT EXISTS checkins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                ayah_id INTEGER NOT NULL,
                checkin_type TEXT DEFAULT 'on_duty',
                location TEXT,
                face_verified INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                duration INTEGER DEFAULT 0,
                total_quiz INTEGER DEFAULT 0,
                pass_score INTEGER DEFAULT 60,
                status TEXT DEFAULT 'published',
                cover TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS certificates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ayah_id INTEGER NOT NULL,
                course_id INTEGER,
                cert_no TEXT NOT NULL UNIQUE,
                cert_name TEXT NOT NULL,
                issuer TEXT NOT NULL,
                issue_date TEXT NOT NULL,
                valid_until TEXT,
                stored_on_chain INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS salaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                ayah_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                salary_month TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                paid_at TEXT,
                remark TEXT
            );

            CREATE TABLE IF NOT EXISTS disputes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'pending',
                expert_id INTEGER,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author TEXT NOT NULL,
                author_role TEXT DEFAULT 'ayah',
                title TEXT NOT NULL,
                content TEXT,
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS experts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                specialty TEXT NOT NULL,
                avatar TEXT,
                rating REAL DEFAULT 5.0
            );

            CREATE TABLE IF NOT EXISTS city_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL UNIQUE,
                ayah_count INTEGER DEFAULT 0,
                demand_count INTEGER DEFAULT 0,
                order_count INTEGER DEFAULT 0,
                conversion_rate REAL DEFAULT 0,
                avg_salary REAL DEFAULT 0
            );
            """
        )

        now = datetime.now(timezone.utc).isoformat()

        ayahs_data = [
            ("王秀兰", None, "月嫂", "北京", 42, 8, 4.9, 126, "on_duty", "母婴护理,新生儿护理,催乳", "1101011982xxxx", "13800138001", 1, 1),
            ("李桂芳", None, "保姆", "上海", 48, 12, 4.8, 203, "available", "老人陪护,家务烹饪,保洁", "3101011976xxxx", "13800138002", 0, 1),
            ("张美玲", None, "保洁", "广州", 35, 5, 4.7, 89, "available", "深度保洁,开荒保洁,家电清洗", "4401011989xxxx", "13800138003", 0, 1),
            ("刘淑珍", None, "月嫂", "深圳", 39, 7, 4.9, 98, "on_duty", "月子餐,产后恢复,婴儿抚触", "4403011985xxxx", "13800138004", 1, 1),
            ("陈阿姨", None, "保姆", "杭州", 51, 15, 4.9, 312, "on_duty", "育儿嫂,早教,辅食制作", "3301011973xxxx", "13800138005", 1, 1),
            ("赵雅琴", None, "保洁", "成都", 40, 6, 4.6, 67, "available", "日常保洁,收纳整理", "5101011984xxxx", "13800138006", 0, 0),
        ]
        for name, avatar, role, city, age, exp, rating, orders, status, skills, id_card, phone, cin, fv in ayahs_data:
            conn.execute(
                "INSERT INTO ayahs (name, avatar, role, city, age, experience, rating, order_count, status, skills, id_card, phone, checkin_today, face_verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (name, avatar, role, city, age, exp, rating, orders, status, skills, id_card, phone, cin, fv, now),
            )

        employers_data = [
            ("周女士", "13900139001", "北京", "朝阳区望京SOHO"),
            ("吴先生", "13900139002", "上海", "浦东新区陆家嘴"),
            ("郑女士", "13900139003", "广州", "天河区珠江新城"),
            ("孙先生", "13900139004", "深圳", "南山区科技园"),
        ]
        for name, phone, city, address in employers_data:
            conn.execute(
                "INSERT INTO employers (name, phone, city, address, created_at) VALUES (?,?,?,?,?)",
                (name, phone, city, address, now),
            )

        demands_data = [
            (1, "急聘金牌月嫂", "月嫂", "北京", 18000, 25000, "2026-06-25", "26天", "预产期7月初，需要有高端家庭经验，会做月子餐"),
            (2, "住家保姆照顾老人", "保姆", "上海", 8000, 10000, "2026-06-20", "长期", "照顾80岁独居老人，能做饭，有耐心"),
            (3, "日常保洁阿姨", "保洁", "广州", 4500, 6000, "2026-06-21", "每周5次", "120平，每周一到周五上午3小时"),
            (4, "育儿嫂带2岁宝宝", "保姆", "深圳", 10000, 14000, "2026-07-01", "长期", "带2岁男宝，会早教，做辅食"),
            (1, "家庭深度保洁", "保洁", "北京", 200, 400, "2026-06-22", "单次", "160平深度保洁，擦玻璃，油烟机清洗"),
        ]
        for eid, title, role, city, sfrom, sto, sdate, dur, desc in demands_data:
            conn.execute(
                "INSERT INTO demands (employer_id, title, role_needed, city, salary_from, salary_to, start_date, duration, description, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (eid, title, role, city, sfrom, sto, sdate, dur, desc, "open", now),
            )

        orders_data = [
            ("YYS20260618001", None, 1, 1, "月嫂", "北京", 22000, "2026-06-18", "2026-07-14", "in_service", 3, 5),
            ("BM20260615001", None, 5, 2, "保姆", "上海", 9500, "2026-06-15", None, "in_service", 2, 8),
            ("BJ20260610001", 5, 1, 1, "保洁", "北京", 380, "2026-06-10", "2026-06-10", "completed", 4, 1),
            ("YS20260612001", None, 4, 4, "月嫂", "深圳", 20000, "2026-06-12", "2026-07-08", "in_service", 2, 6),
        ]
        for ono, did, aid, eid, role, city, sal, sdate, edate, st, nodes, cins in orders_data:
            conn.execute(
                "INSERT INTO orders (order_no, demand_id, ayah_id, employer_id, role, city, salary, start_date, end_date, status, service_nodes, checkin_count, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (ono, did, aid, eid, role, city, sal, sdate, edate, st, nodes, cins, now),
            )

        service_nodes_data = [
            (1, "checkin", "上户签到", "done", now, "已完成人脸识别"),
            (1, "assessment", "母婴健康评估", "done", now, "宝宝体温正常，产妇恢复良好"),
            (1, "meal", "月子餐制作", "in_progress", None, ""),
            (1, "care", "新生儿护理", "pending", None, ""),
            (1, "checkout", "下户签退", "pending", None, ""),
            (2, "checkin", "上户签到", "done", now, ""),
            (2, "care", "老人日常陪护", "in_progress", None, ""),
            (2, "checkout", "下户签退", "pending", None, ""),
        ]
        for oid, ntype, nname, st, rep, remark in service_nodes_data:
            conn.execute(
                "INSERT INTO service_nodes (order_id, node_type, node_name, status, reported_at, remark) VALUES (?,?,?,?,?,?)",
                (oid, ntype, nname, st, rep, remark),
            )

        checkins_data = [
            (1, 1, "on_duty", "朝阳区望京SOHO", 1, now),
            (2, 5, "on_duty", "浦东新区陆家嘴", 1, now),
            (4, 4, "on_duty", "南山区科技园", 1, now),
        ]
        for oid, aid, ctype, loc, fv, cat in checkins_data:
            conn.execute(
                "INSERT INTO checkins (order_id, ayah_id, checkin_type, location, face_verified, created_at) VALUES (?,?,?,?,?,?)",
                (oid, aid, ctype, loc, fv, cat),
            )

        courses_data = [
            ("金牌月嫂岗前特训营", "月嫂", 48, 20, 80, "published", None),
            ("高级家政服务礼仪规范", "保姆", 24, 15, 70, "published", None),
            ("深度保洁专业技能培训", "保洁", 32, 12, 75, "published", None),
            ("新生儿急救与安全防护", "月嫂", 16, 10, 80, "published", None),
            ("营养月子餐制作大全", "月嫂", 20, 8, 70, "published", None),
            ("老人陪护心理关怀指南", "保姆", 18, 10, 70, "published", None),
        ]
        for title, cat, dur, quiz, ps, st, cover in courses_data:
            conn.execute(
                "INSERT INTO courses (title, category, duration, total_quiz, pass_score, status, cover, created_at) VALUES (?,?,?,?,?,?,?,?)",
                (title, cat, dur, quiz, ps, st, cover, now),
            )

        certificates_data = [
            (1, 1, "CERT202401001", "高级月嫂证书", "中国家庭服务业协会", "2024-01-15", "2029-01-14", 1),
            (1, 4, "CERT202403001", "新生儿急救资格证", "红十字会", "2024-03-20", "2027-03-19", 1),
            (2, 2, "CERT202311001", "高级家政服务师", "中国家庭服务业协会", "2023-11-10", "2028-11-09", 1),
            (3, 3, "CERT202405001", "高级保洁师证书", "中国家政保洁协会", "2024-05-08", "2029-05-07", 1),
            (4, 1, "CERT202309001", "金牌月嫂认证", "中国母婴护理协会", "2023-09-12", "2028-09-11", 1),
            (5, 2, "CERT202306001", "高级育儿嫂证书", "中国家庭服务业协会", "2023-06-25", "2028-06-24", 1),
        ]
        for aid, cid, cno, cname, issuer, idate, vdate, chain in certificates_data:
            conn.execute(
                "INSERT INTO certificates (ayah_id, course_id, cert_no, cert_name, issuer, issue_date, valid_until, stored_on_chain, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                (aid, cid, cno, cname, issuer, idate, vdate, chain, now),
            )

        salaries_data = [
            (1, 1, 18500.0, "2026-05", "paid", "2026-06-05", "含500元满勤奖励"),
            (None, 1, 4800.0, "2026-06", "processing", None, "6月上户中"),
            (2, 5, 8200.0, "2026-05", "paid", "2026-06-05", ""),
            (None, 5, 7600.0, "2026-06", "processing", None, "6月服务中"),
            (4, 4, 17800.0, "2026-05", "paid", "2026-06-05", ""),
        ]
        for oid, aid, amt, month, st, paid, remark in salaries_data:
            conn.execute(
                "INSERT INTO salaries (order_id, ayah_id, amount, salary_month, status, paid_at, remark) VALUES (?,?,?,?,?,?,?)",
                (oid, aid, amt, month, st, paid, remark),
            )

        disputes_data = [
            (1, "服务时长争议", "雇主认为服务时长不足，需要专家介入调解", "mediating", 1),
        ]
        for oid, title, desc, st, eid in disputes_data:
            conn.execute(
                "INSERT INTO disputes (order_id, title, description, status, expert_id, created_at) VALUES (?,?,?,?,?,?)",
                (oid, title, desc, st, eid, now),
            )

        posts_data = [
            ("王秀兰", "ayah", "月子餐分享：适合产后第一周的五道菜", "今天给大家分享五道适合产妇第一周吃的清淡营养月子餐...", 128, 36),
            ("李桂芳", "ayah", "照顾独居老人的心得体会", "做保姆12年了，分享一些和老人相处的小技巧...", 96, 28),
            ("家政小助手", "admin", "【通知】7月岗前培训报名开始啦", "本月金牌月嫂特训营名额有限，先到先得...", 256, 64),
            ("张美玲", "ayah", "深度保洁的正确打开方式", "很多人问我怎么做到120平3小时干净如新，今天分享一下...", 84, 19),
        ]
        for author, role, title, content, likes, comments in posts_data:
            conn.execute(
                "INSERT INTO posts (author, author_role, title, content, likes, comments, created_at) VALUES (?,?,?,?,?,?,?)",
                (author, role, title, content, likes, comments, now),
            )

        experts_data = [
            ("陈医生", "主任医师", "母婴健康", None, 4.9),
            ("李律师", "资深律师", "家政纠纷调解", None, 4.8),
            ("王老师", "高级营养师", "月子餐营养搭配", None, 4.9),
        ]
        for name, title, spec, avatar, rating in experts_data:
            conn.execute(
                "INSERT INTO experts (name, title, specialty, avatar, rating) VALUES (?,?,?,?,?)",
                (name, title, spec, avatar, rating),
            )

        city_stats_data = [
            ("北京", 186, 342, 856, 68.5, 13200),
            ("上海", 152, 298, 724, 65.2, 12800),
            ("广州", 128, 256, 612, 62.8, 10500),
            ("深圳", 142, 278, 668, 64.1, 13500),
            ("杭州", 98, 186, 445, 60.3, 11200),
            ("成都", 86, 168, 398, 58.9, 8800),
        ]
        for city, ac, dc, oc, cr, avgs in city_stats_data:
            conn.execute(
                "INSERT INTO city_stats (city, ayah_count, demand_count, order_count, conversion_rate, avg_salary) VALUES (?,?,?,?,?,?)",
                (city, ac, dc, oc, cr, avgs),
            )

        conn.commit()


def rows(query: str, params: tuple = ()) -> list[dict[str, object]]:
    with connect() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]


def row(query: str, params: tuple = ()) -> dict[str, object]:
    with connect() as conn:
        result = conn.execute(query, params).fetchone()
        return dict(result) if result else {}


class Handler(BaseHTTPRequestHandler):
    server_version = "may-89231-api/1.0"

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"{self.address_string()} - {fmt % args}", flush=True)

    def _send_json(self, payload: dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._send_json({"ok": True})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json({
                "ok": True,
                "service": "家政从业者赋能工作台",
                "status": "running",
                "updatedAt": datetime.now(timezone.utc).isoformat(),
            })
            return

        if path == "/api/dashboard":
            ayah_total = row("SELECT COUNT(*) as cnt FROM ayahs")["cnt"]
            order_total = row("SELECT COUNT(*) as cnt FROM orders")["cnt"]
            demand_total = row("SELECT COUNT(*) as cnt FROM demands WHERE status = 'open'")["cnt"]
            in_service = row("SELECT COUNT(*) as cnt FROM orders WHERE status = 'in_service'")["cnt"]
            avg_rating = row("SELECT AVG(rating) as avg FROM ayahs")["avg"] or 0
            cert_total = row("SELECT COUNT(*) as cnt FROM certificates")["cnt"]

            metrics = [
                {"label": "在档阿姨", "value": ayah_total, "trend": "+12 本月", "icon": "users"},
                {"label": "进行中订单", "value": in_service, "trend": f"共 {order_total} 单", "icon": "clipboard"},
                {"label": "待接需求", "value": demand_total, "trend": "实时更新", "icon": "bell"},
                {"label": "持证上岗率", "value": f"{round(cert_total / max(ayah_total, 1) * 100, 1)}%", "trend": f"{cert_total} 张证书存证", "icon": "shield"},
            ]

            ayah_list = rows(
                "SELECT id, name, role, city, age, experience, rating, order_count, status, face_verified FROM ayahs ORDER BY order_count DESC LIMIT 6"
            )
            demand_list = rows(
                "SELECT d.id, d.title, d.role_needed, d.city, d.salary_from, d.salary_to, d.duration, e.name as employer_name, d.created_at FROM demands d LEFT JOIN employers e ON d.employer_id = e.id WHERE d.status = 'open' ORDER BY d.created_at DESC LIMIT 5"
            )
            order_list = rows(
                "SELECT o.id, o.order_no, o.role, o.city, o.salary, o.status, o.start_date, a.name as ayah_name, o.service_nodes, o.checkin_count FROM orders o LEFT JOIN ayahs a ON o.ayah_id = a.id ORDER BY o.created_at DESC LIMIT 5"
            )

            self._send_json({
                "ok": True,
                "metrics": metrics,
                "ayahs": ayah_list,
                "demands": demand_list,
                "orders": order_list,
                "stats": {
                    "ayah_total": ayah_total,
                    "order_total": order_total,
                    "demand_total": demand_total,
                    "in_service": in_service,
                    "avg_rating": round(avg_rating, 1),
                },
            })
            return

        if path == "/api/ayahs":
            ayahs = rows(
                "SELECT id, name, avatar, role, city, age, experience, rating, order_count, status, skills, checkin_today, face_verified FROM ayahs ORDER BY order_count DESC"
            )
            self._send_json({"ok": True, "list": ayahs})
            return

        if path == "/api/demands":
            demands = rows(
                "SELECT d.id, d.title, d.role_needed, d.city, d.salary_from, d.salary_to, d.start_date, d.duration, d.description, d.status, e.name as employer_name, e.phone as employer_phone, e.address as employer_address, d.created_at FROM demands d LEFT JOIN employers e ON d.employer_id = e.id ORDER BY d.created_at DESC"
            )
            self._send_json({"ok": True, "list": demands})
            return

        if path == "/api/orders":
            orders = rows(
                "SELECT o.id, o.order_no, o.role, o.city, o.salary, o.start_date, o.end_date, o.status, o.service_nodes, o.checkin_count, a.name as ayah_name, a.phone as ayah_phone, e.name as employer_name, e.address as employer_address, o.created_at FROM orders o LEFT JOIN ayahs a ON o.ayah_id = a.id LEFT JOIN employers e ON o.employer_id = e.id ORDER BY o.created_at DESC"
            )
            self._send_json({"ok": True, "list": orders})
            return

        if path == "/api/reports":
            city_stats = rows("SELECT * FROM city_stats ORDER BY order_count DESC")
            funnel = [
                {"stage": "浏览需求", "count": 1280, "rate": 100},
                {"stage": "意向抢单", "count": 560, "rate": 43.8},
                {"stage": "面试通过", "count": 392, "rate": 70.0},
                {"stage": "签约上户", "count": 328, "rate": 83.7},
                {"stage": "完成服务", "count": 298, "rate": 90.9},
            ]
            thresholds = [
                {"label": "月度最低接单量", "value": 4, "unit": "单", "actual": 856},
                {"label": "客户满意度阈值", "value": 4.5, "unit": "分", "actual": 4.78},
                {"label": "持证上岗率要求", "value": 80, "unit": "%", "actual": 87.2},
                {"label": "上户打卡合规率", "value": 95, "unit": "%", "actual": 96.4},
            ]
            self._send_json({
                "ok": True,
                "city_stats": city_stats,
                "funnel": funnel,
                "thresholds": thresholds,
            })
            return

        if path == "/api/courses":
            courses = rows("SELECT * FROM courses ORDER BY created_at DESC")
            self._send_json({"ok": True, "list": courses})
            return

        if path == "/api/certificates":
            certs = rows(
                "SELECT c.*, a.name as ayah_name FROM certificates c LEFT JOIN ayahs a ON c.ayah_id = a.id ORDER BY c.created_at DESC"
            )
            self._send_json({"ok": True, "list": certs})
            return

        if path == "/api/salaries":
            salaries = rows(
                "SELECT s.*, a.name as ayah_name, o.order_no FROM salaries s LEFT JOIN ayahs a ON s.ayah_id = a.id LEFT JOIN orders o ON s.order_id = o.id ORDER BY s.salary_month DESC, s.created_at DESC"
            )
            self._send_json({"ok": True, "list": salaries})
            return

        if path == "/api/disputes":
            disputes = rows(
                "SELECT d.*, o.order_no, e.name as expert_name FROM disputes d LEFT JOIN orders o ON d.order_id = o.id LEFT JOIN experts e ON d.expert_id = e.id ORDER BY d.created_at DESC"
            )
            experts = rows("SELECT * FROM experts")
            self._send_json({"ok": True, "list": disputes, "experts": experts})
            return

        if path == "/api/community":
            posts = rows("SELECT * FROM posts ORDER BY created_at DESC LIMIT 10")
            self._send_json({"ok": True, "list": posts})
            return

        if path == "/api/service-nodes":
            nodes = rows(
                "SELECT n.*, o.order_no, a.name as ayah_name FROM service_nodes n LEFT JOIN orders o ON n.order_id = o.id LEFT JOIN ayahs a ON o.ayah_id = a.id ORDER BY n.id"
            )
            self._send_json({"ok": True, "list": nodes})
            return

        if path == "/api/checkins":
            checkins = rows(
                "SELECT c.*, o.order_no, a.name as ayah_name FROM checkins c LEFT JOIN orders o ON c.order_id = o.id LEFT JOIN ayahs a ON c.ayah_id = a.id ORDER BY c.created_at DESC LIMIT 20"
            )
            self._send_json({"ok": True, "list": checkins})
            return

        self._send_json({"ok": False, "error": "Not found"}, HTTPStatus.NOT_FOUND)


def main() -> None:
    init_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"家政赋能工作台 API listening on http://{HOST}:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
