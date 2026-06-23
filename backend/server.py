from __future__ import annotations

import json
import sqlite3
import hashlib
import random
import uuid
from datetime import datetime, timezone, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs


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
PORT = int(ENV.get("BACKEND_PORT", ENV.get("PORT", "59229")))
DB_PATH = ROOT / ENV.get("SQLITE_PATH", "data/app.sqlite3")
ORDER_ID = "may-89229"

GD_CITIES = [
    ("440100", "广州市"), ("440200", "韶关市"), ("440300", "深圳市"),
    ("440400", "珠海市"), ("440500", "汕头市"), ("440600", "佛山市"),
    ("440700", "江门市"), ("440800", "湛江市"), ("440900", "茂名市"),
    ("441200", "肇庆市"), ("441300", "惠州市"), ("441400", "梅州市"),
    ("441500", "汕尾市"), ("441600", "河源市"), ("441700", "阳江市"),
    ("441800", "清远市"), ("441900", "东莞市"), ("442000", "中山市"),
    ("445100", "潮州市"), ("445200", "揭阳市"), ("445300", "云浮市"),
]


def mask_id_card(id_card: str) -> str:
    if not id_card or len(id_card) < 8:
        return id_card or ""
    return id_card[:4] + "********" + id_card[-4:]


def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 7:
        return phone or ""
    return phone[:3] + "****" + phone[-4:]


def mask_name(name: str) -> str:
    if not name or len(name) <= 1:
        return name or ""
    return name[0] + "*" * (len(name) - 1)


def mask_plate(plate: str) -> str:
    if not plate or len(plate) < 4:
        return plate or ""
    return plate[:2] + "***" + plate[-1:]


def gen_order_no(prefix: str) -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    rand = str(random.randint(1000, 9999))
    return f"{prefix}{ts}{rand}"


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS service_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                order_id TEXT NOT NULL,
                status TEXT NOT NULL,
                frontend_port INTEGER NOT NULL,
                backend_port INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cities (
                city_code TEXT PRIMARY KEY,
                city_name TEXT NOT NULL,
                enabled INTEGER DEFAULT 1,
                config TEXT
            );

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                real_name TEXT NOT NULL,
                id_card TEXT,
                phone TEXT,
                role TEXT NOT NULL,
                city_code TEXT,
                avatar TEXT,
                verified INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS certificate_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                city_code TEXT NOT NULL,
                business_type TEXT NOT NULL,
                permit_type TEXT NOT NULL,
                real_name TEXT NOT NULL,
                id_card TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                pickup_time TEXT,
                material_list TEXT,
                ocr_result TEXT,
                pre_audit_status TEXT DEFAULT 'pending',
                pre_audit_remark TEXT,
                express_no TEXT,
                express_company TEXT DEFAULT 'EMS',
                receipt_no TEXT,
                status TEXT NOT NULL DEFAULT 'created',
                current_node TEXT,
                deadline TEXT,
                overdue INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vehicle_violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                plate_no TEXT NOT NULL,
                plate_type TEXT NOT NULL,
                owner_name TEXT NOT NULL DEFAULT '',
                owner_id_card TEXT NOT NULL DEFAULT '',
                engine_no TEXT NOT NULL DEFAULT '',
                frame_no TEXT NOT NULL DEFAULT '',
                owner_verified INTEGER DEFAULT 0,
                violation_time TEXT NOT NULL,
                violation_location TEXT NOT NULL,
                violation_code TEXT NOT NULL,
                violation_desc TEXT NOT NULL,
                fine_amount REAL NOT NULL,
                deduct_points INTEGER NOT NULL,
                city TEXT NOT NULL,
                data_source TEXT NOT NULL DEFAULT '',
                data_source_city TEXT NOT NULL DEFAULT '',
                processing_status TEXT NOT NULL DEFAULT 'normal',
                paid INTEGER DEFAULT 0,
                paid_at TEXT,
                pay_method TEXT,
                escrow_account TEXT,
                pay_no TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vehicle_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                city_code TEXT NOT NULL,
                business_type TEXT NOT NULL,
                plate_no TEXT NOT NULL,
                plate_type TEXT,
                vehicle_brand TEXT,
                real_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT,
                pickup_time TEXT,
                inspection_station TEXT,
                qualified_flag TEXT,
                express_no TEXT,
                status TEXT NOT NULL DEFAULT 'created',
                current_node TEXT,
                deadline TEXT,
                overdue INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS idcard_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                city_code TEXT NOT NULL,
                business_type TEXT NOT NULL,
                real_name TEXT NOT NULL,
                id_card TEXT NOT NULL,
                phone TEXT NOT NULL,
                old_id_card TEXT,
                reason TEXT,
                mailing_address TEXT NOT NULL,
                police_verified INTEGER DEFAULT 0,
                express_no TEXT,
                status TEXT NOT NULL DEFAULT 'created',
                current_node TEXT,
                deadline TEXT,
                overdue INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS work_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                work_no TEXT UNIQUE NOT NULL,
                courier_id INTEGER,
                courier_name TEXT,
                business_type TEXT NOT NULL,
                related_order_no TEXT NOT NULL,
                city_code TEXT NOT NULL,
                address TEXT NOT NULL,
                contact_name TEXT NOT NULL,
                contact_phone TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                lat REAL,
                lng REAL,
                scheduled_time TEXT,
                completed_time TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS logistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT NOT NULL,
                express_no TEXT NOT NULL,
                status TEXT NOT NULL,
                location TEXT,
                description TEXT,
                operator TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pay_no TEXT UNIQUE NOT NULL,
                order_no TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                pay_method TEXT NOT NULL,
                pay_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                escrow_account TEXT NOT NULL,
                settled INTEGER DEFAULT 0,
                paid_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS escrow_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_no TEXT UNIQUE NOT NULL,
                city_code TEXT NOT NULL,
                bank_name TEXT NOT NULL,
                total_balance REAL DEFAULT 0,
                frozen_balance REAL DEFAULT 0,
                available_balance REAL DEFAULT 0,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type TEXT NOT NULL,
                level TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                related_order_no TEXT,
                city_code TEXT,
                handled INTEGER DEFAULT 0,
                handled_by TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT,
                action TEXT NOT NULL,
                module TEXT NOT NULL,
                detail TEXT,
                ip TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS receipt_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_no TEXT UNIQUE NOT NULL,
                order_no TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                business_type TEXT NOT NULL,
                issue_date TEXT NOT NULL,
                valid_date TEXT,
                qr_code TEXT,
                verify_code TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT NOT NULL,
                value INTEGER NOT NULL,
                trend TEXT NOT NULL
            );
        """)

        conn.execute(
            """
            INSERT INTO service_status (id, order_id, status, frontend_port, backend_port, updated_at)
            VALUES (1, ?, 'running', ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                order_id = excluded.order_id,
                status = excluded.status,
                frontend_port = excluded.frontend_port,
                backend_port = excluded.backend_port,
                updated_at = excluded.updated_at
            """,
            (
                ORDER_ID,
                int(ENV.get("FRONTEND_PORT", ENV.get("APP_PORT", "49229"))),
                PORT,
                datetime.now(timezone.utc).isoformat(),
            ),
        )

        city_count = conn.execute("SELECT COUNT(*) FROM cities").fetchone()[0]
        if city_count == 0:
            conn.executemany(
                "INSERT INTO cities (city_code, city_name, enabled, config) VALUES (?, ?, 1, ?)",
                [(code, name, json.dumps({"express_fee": 18, "audit_hours": 48})) for code, name in GD_CITIES],
            )

        user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if user_count == 0:
            now = datetime.now(timezone.utc).isoformat()
            users = [
                ("applicant01", hashlib.md5(b"123456").hexdigest(), "张三", "440101199001011234",
                 "13800138001", "applicant", "440100", "👤", 1, now),
                ("courier01", hashlib.md5(b"123456").hexdigest(), "李快递", "440101198501015678",
                 "13900139001", "courier", "440100", "🚚", 1, now),
                ("auditor01", hashlib.md5(b"123456").hexdigest(), "王审批", "440101198001019012",
                 "13700137001", "auditor", "440100", "📋", 1, now),
                ("operator_gz", hashlib.md5(b"123456").hexdigest(), "陈运营", "440101198801013456",
                 "13600136001", "operator", "440100", "🏢", 1, now),
                ("thirdparty_122", hashlib.md5(b"123456").hexdigest(), "交管12123", None,
                 "4001234567", "thirdparty", "440000", "🔌", 1, now),
                ("admin", hashlib.md5(b"123456").hexdigest(), "系统管理员", None,
                 "4000000000", "admin", "440000", "⚙️", 1, now),
            ]
            conn.executemany(
                """INSERT INTO users (username, password, real_name, id_card, phone, role,
                   city_code, avatar, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                users,
            )

        cert_count = conn.execute("SELECT COUNT(*) FROM certificate_orders").fetchone()[0]
        if cert_count == 0:
            now = datetime.now(timezone.utc)
            orders = []
            for i in range(5):
                order_date = now - timedelta(days=i)
                deadline = order_date + timedelta(hours=48)
                statuses = ["created", "pickup_scheduled", "materials_received",
                           "pre_auditing", "auditing", "approved", "mailing", "completed"]
                st_idx = min(i, len(statuses) - 1)
                status = statuses[st_idx]
                overdue = 1 if deadline < now and status != "completed" else 0
                orders.append((
                    gen_order_no("CRT"), 1, "440100",
                    "hk_macao_endorse", "g-card",
                    "张三", "440101199001011234", "13800138001",
                    "广州市天河区珠江新城花城大道1号",
                    (order_date + timedelta(hours=2)).isoformat(),
                    json.dumps(["身份证原件", "往来港澳通行证", "照片"]),
                    json.dumps({"name": "张三", "id_card": "440101199001011234", "confidence": 0.98}),
                    "passed" if st_idx >= 4 else ("pending" if st_idx < 3 else "auditing"),
                    "材料齐全，符合要求" if st_idx >= 4 else "",
                    f"EMS{random.randint(100000000000, 999999999999)}" if st_idx >= 6 else "",
                    "EMS",
                    f"RCP{random.randint(10000000, 99999999)}" if st_idx >= 7 else "",
                    status, status,
                    deadline.isoformat(), overdue,
                    order_date.isoformat(), (order_date + timedelta(hours=3)).isoformat(),
                ))
            conn.executemany(
                """INSERT INTO certificate_orders (order_no, user_id, city_code, business_type,
                   permit_type, real_name, id_card, phone, address, pickup_time, material_list,
                   ocr_result, pre_audit_status, pre_audit_remark, express_no, express_company,
                   receipt_no, status, current_node, deadline, overdue, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                orders,
            )

        vio_count = conn.execute("SELECT COUNT(*) FROM vehicle_violations").fetchone()[0]
        if vio_count == 0:
            now = datetime.now(timezone.utc)
            violations = []
            for i in range(8):
                vtime = now - timedelta(days=random.randint(1, 30), hours=random.randint(1, 23))
                violations.append((
                    1, f"粤A{random.randint(10000, 99999)}", "小型汽车",
                    vtime.isoformat(),
                    random.choice(["广州市天河区天河路", "广州市越秀区环市路", "深圳市南山区深南大道",
                                  "佛山市禅城区季华路", "东莞市南城区鸿福路"]),
                    f"{random.randint(1000, 9999)}",
                    random.choice(["违反禁止标线指示", "超速不足10%", "闯红灯", "不按导向车道行驶",
                                  "违法停车", "不系安全带"]),
                    random.choice([50, 100, 150, 200, 500]),
                    random.choice([0, 2, 3, 6]),
                    random.choice(["广州", "深圳", "佛山", "东莞"]),
                    1 if i >= 4 else 0,
                    now.isoformat(),
                ))
            conn.executemany(
                """INSERT INTO vehicle_violations (user_id, plate_no, plate_type, violation_time,
                   violation_location, violation_code, violation_desc, fine_amount, deduct_points,
                   city, paid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                violations,
            )

        vorder_count = conn.execute("SELECT COUNT(*) FROM vehicle_orders").fetchone()[0]
        if vorder_count == 0:
            now = datetime.now(timezone.utc)
            orders = []
            for i in range(3):
                order_date = now - timedelta(days=i)
                deadline = order_date + timedelta(hours=72)
                statuses = ["created", "pickup_scheduled", "inspecting", "qualified", "mailing", "completed"]
                st_idx = min(i, len(statuses) - 1)
                status = statuses[st_idx]
                overdue = 1 if deadline < now and status != "completed" else 0
                orders.append((
                    gen_order_no("VEH"), 1, "440100",
                    "six_year_exempt", f"粤B{random.randint(10000, 99999)}",
                    "小型汽车", "丰田", "张三", "13800138001",
                    "广州市天河区中山大道西1号",
                    (order_date + timedelta(hours=4)).isoformat(),
                    "广州市天河区机动车检测站",
                    "合格" if st_idx >= 3 else "",
                    f"EMS{random.randint(100000000000, 999999999999)}" if st_idx >= 4 else "",
                    status, status,
                    deadline.isoformat(), overdue,
                    order_date.isoformat(), (order_date + timedelta(hours=2)).isoformat(),
                ))
            conn.executemany(
                """INSERT INTO vehicle_orders (order_no, user_id, city_code, business_type,
                   plate_no, plate_type, vehicle_brand, real_name, phone, address, pickup_time,
                   inspection_station, qualified_flag, express_no, status, current_node,
                   deadline, overdue, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                orders,
            )

        idcard_count = conn.execute("SELECT COUNT(*) FROM idcard_orders").fetchone()[0]
        if idcard_count == 0:
            now = datetime.now(timezone.utc)
            orders = []
            for i in range(2):
                order_date = now - timedelta(days=i)
                deadline = order_date + timedelta(hours=120)
                statuses = ["created", "materials_received", "police_auditing", "approved", "mailing", "completed"]
                st_idx = min(i, len(statuses) - 1)
                status = statuses[st_idx]
                overdue = 1 if deadline < now and status != "completed" else 0
                orders.append((
                    gen_order_no("IDC"), 1, "440100",
                    "reissue", "张三", "440101199001011234", "13800138001",
                    "440101199001011234", "证件丢失",
                    "广州市天河区体育西路1号",
                    1 if st_idx >= 3 else 0,
                    f"EMS{random.randint(100000000000, 999999999999)}" if st_idx >= 4 else "",
                    status, status,
                    deadline.isoformat(), overdue,
                    order_date.isoformat(), (order_date + timedelta(hours=1)).isoformat(),
                ))
            conn.executemany(
                """INSERT INTO idcard_orders (order_no, user_id, city_code, business_type,
                   real_name, id_card, phone, old_id_card, reason, mailing_address,
                   police_verified, express_no, status, current_node, deadline, overdue,
                   created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                orders,
            )

        wo_count = conn.execute("SELECT COUNT(*) FROM work_orders").fetchone()[0]
        if wo_count == 0:
            now = datetime.now(timezone.utc)
            cert_rows = conn.execute(
                "SELECT order_no, address, real_name, phone, city_code FROM certificate_orders LIMIT 3"
            ).fetchall()
            for i, cert in enumerate(cert_rows):
                statuses = ["pending", "accepted", "on_the_way", "picked_up"]
                st_idx = min(i, len(statuses) - 1)
                wo = (
                    gen_order_no("WO"), 2, "李快递",
                    "hk_macao_endorse", cert["order_no"], cert["city_code"],
                    cert["address"], cert["real_name"], cert["phone"],
                    "pickup", statuses[st_idx],
                    23.1291 + random.uniform(-0.05, 0.05),
                    113.2644 + random.uniform(-0.05, 0.05),
                    (now + timedelta(hours=1)).isoformat(),
                    (now + timedelta(hours=2)).isoformat() if st_idx >= 3 else None,
                    now.isoformat(),
                )
                conn.execute(
                    """INSERT INTO work_orders (work_no, courier_id, courier_name, business_type,
                       related_order_no, city_code, address, contact_name, contact_phone, type,
                       status, lat, lng, scheduled_time, completed_time, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    wo,
                )
            vrows = conn.execute(
                "SELECT order_no, address, real_name, phone, city_code FROM vehicle_orders LIMIT 2"
            ).fetchall()
            for i, v in enumerate(vrows):
                statuses = ["pending", "accepted"]
                st_idx = min(i, len(statuses) - 1)
                wo = (
                    gen_order_no("WO"), 2, "李快递",
                    "six_year_exempt", v["order_no"], v["city_code"],
                    v["address"], v["real_name"], v["phone"],
                    "pickup", statuses[st_idx],
                    23.1291 + random.uniform(-0.05, 0.05),
                    113.2644 + random.uniform(-0.05, 0.05),
                    (now + timedelta(hours=3)).isoformat(),
                    None,
                    now.isoformat(),
                )
                conn.execute(
                    """INSERT INTO work_orders (work_no, courier_id, courier_name, business_type,
                       related_order_no, city_code, address, contact_name, contact_phone, type,
                       status, lat, lng, scheduled_time, completed_time, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    wo,
                )

        log_count = conn.execute("SELECT COUNT(*) FROM logistics").fetchone()[0]
        if log_count == 0:
            certs = conn.execute(
                "SELECT order_no, express_no FROM certificate_orders WHERE express_no != '' LIMIT 2"
            ).fetchall()
            for cert in certs:
                nodes = [
                    ("已揽收", "广州市天河区珠江新城揽投部", "EMS揽收员 王师傅"),
                    ("运输中", "广州市邮件处理中心", "系统"),
                    ("到达目的地", "广州市越秀区解放北投递部", "系统"),
                    ("派送中", "广州市越秀区", "投递员 李师傅"),
                    ("已签收", "广州市越秀区收件人", "本人签收"),
                ]
                for j, (st, loc, op) in enumerate(nodes):
                    t = datetime.now(timezone.utc) - timedelta(days=1, hours=5 - j)
                    conn.execute(
                        """INSERT INTO logistics (order_no, express_no, status, location,
                           description, operator, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                        (cert["order_no"], cert["express_no"], st, loc, f"快件{st}", op, t.isoformat()),
                    )

        pay_count = conn.execute("SELECT COUNT(*) FROM payments").fetchone()[0]
        if pay_count == 0:
            now = datetime.now(timezone.utc)
            certs = conn.execute("SELECT order_no, id FROM certificate_orders LIMIT 3").fetchall()
            for i, cert in enumerate(certs):
                pay_no = gen_order_no("PAY")
                methods = ["wechat", "alipay", "unionpay"]
                statuses = ["success", "success", "pending"]
                conn.execute(
                    """INSERT INTO payments (pay_no, order_no, user_id, amount, pay_method,
                       pay_type, status, escrow_account, settled, paid_at, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (pay_no, cert["order_no"], 1, 120.0, methods[i % 3], "service_fee",
                     statuses[i % 3], f"ESCROW_GZ_{i+1}",
                     1 if i == 0 else 0,
                     (now - timedelta(hours=i * 2)).isoformat() if statuses[i % 3] == "success" else None,
                     now.isoformat()),
                )
            vios = conn.execute("SELECT id FROM vehicle_violations WHERE paid = 1 LIMIT 2").fetchall()
            for i, vio in enumerate(vios):
                pay_no = gen_order_no("PAY")
                conn.execute(
                    """INSERT INTO payments (pay_no, order_no, user_id, amount, pay_method,
                       pay_type, status, escrow_account, settled, paid_at, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (pay_no, f"VIO{vio['id']}", 1, 200.0, "wechat",
                     "fine", "success", f"ESCROW_FINE_{i+1}",
                     1, (now - timedelta(days=i + 1)).isoformat(), now.isoformat()),
                )

        escrow_count = conn.execute("SELECT COUNT(*) FROM escrow_accounts").fetchone()[0]
        if escrow_count == 0:
            now = datetime.now(timezone.utc).isoformat()
            accounts = [
                ("ESCROW_GZ_001", "440100", "中国建设银行广州分行", 58600.0, 12000.0, 46600.0, now),
                ("ESCROW_GZ_FINE", "440100", "中国工商银行广州分行", 128500.0, 35000.0, 93500.0, now),
                ("ESCROW_SZ_001", "440300", "招商银行深圳分行", 72300.0, 8500.0, 63800.0, now),
            ]
            conn.executemany(
                """INSERT INTO escrow_accounts (account_no, city_code, bank_name, total_balance,
                   frozen_balance, available_balance, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                accounts,
            )

        alert_count = conn.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
        if alert_count == 0:
            now = datetime.now(timezone.utc)
            alerts = [
                ("overdue", "high", "签注订单超期预警",
                 "订单CRT202401011200001234已超过48小时未完成审批",
                 "CRT202401011200001234", "440100", 0, None, now.isoformat()),
                ("overdue", "medium", "六年免检业务即将超期",
                 "订单VEH202401021200005678还剩6小时到期",
                 "VEH202401021200005678", "440100", 0, None,
                 (now + timedelta(hours=6)).isoformat()),
                ("payment", "medium", "代缴资金待结算",
                 "广州市监管账户有3笔罚款资金待结算，金额600元",
                 None, "440100", 0, None, now.isoformat()),
                ("system", "low", "接口监控：交管12123响应超时",
                 "近5分钟接口平均响应时间3.2s，超过阈值2s",
                 None, "440000", 1, "admin", (now - timedelta(hours=1)).isoformat()),
            ]
            conn.executemany(
                """INSERT INTO alerts (alert_type, level, title, content, related_order_no,
                   city_code, handled, handled_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                alerts,
            )

        audit_count = conn.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0]
        if audit_count == 0:
            now = datetime.now(timezone.utc)
            logs = [
                (1, "applicant01", "create_order", "certificate", "创建港澳签注上门收件订单",
                 "127.0.0.1", (now - timedelta(hours=5)).isoformat()),
                (2, "courier01", "accept_workorder", "workorder", "揽收员接单：WO202401011200001234",
                 "127.0.0.1", (now - timedelta(hours=4)).isoformat()),
                (3, "auditor01", "audit_pass", "certificate", "审批通过：CRT202401011200001234",
                 "127.0.0.1", (now - timedelta(hours=3)).isoformat()),
                (4, "operator_gz", "export_report", "operation", "导出广州市月度业务报表",
                 "127.0.0.1", (now - timedelta(hours=2)).isoformat()),
            ]
            conn.executemany(
                """INSERT INTO audit_logs (user_id, username, action, module, detail, ip, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                logs,
            )

        receipt_count = conn.execute("SELECT COUNT(*) FROM receipt_records").fetchone()[0]
        if receipt_count == 0:
            now = datetime.now(timezone.utc)
            cert = conn.execute("SELECT order_no FROM certificate_orders WHERE status = 'completed' LIMIT 1").fetchone()
            if cert:
                conn.execute(
                    """INSERT INTO receipt_records (receipt_no, order_no, user_id, business_type,
                       issue_date, valid_date, qr_code, verify_code, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (f"RCP{random.randint(10000000, 99999999)}", cert["order_no"], 1,
                     "hk_macao_endorse", now.isoformat(),
                     (now + timedelta(days=90)).isoformat(),
                     str(uuid.uuid4()), f"V{random.randint(100000, 999999)}",
                     now.isoformat()),
                )

        metric_count = conn.execute("SELECT COUNT(*) FROM metrics").fetchone()[0]
        if metric_count == 0:
            conn.executemany(
                "INSERT INTO metrics (label, value, trend) VALUES (?, ?, ?)",
                [
                    ("今日订单", 128, "+12.5%"),
                    ("在途工单", 42, "进行中"),
                    ("超期预警", 3, "待处理"),
                    ("监管资金", "58600", "元"),
                ],
            )

        conn.commit()


def rows(query: str, params: tuple = ()) -> list[dict[str, object]]:
    with connect() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]


def row(query: str, params: tuple = ()) -> dict[str, object]:
    with connect() as conn:
        result = conn.execute(query, params).fetchone()
        return dict(result) if result else {}


def paginate(query: str, count_query: str, page: int = 1, page_size: int = 10, params: tuple = ()) -> dict[str, object]:
    offset = (page - 1) * page_size
    data_query = f"{query} LIMIT ? OFFSET ?"
    data_params = params + (page_size, offset)
    items = rows(data_query, data_params)
    total = row(count_query, params)
    total_count = total.get("total", 0) if isinstance(total, dict) else 0
    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 0,
    }


def mask_user_fields(user: dict) -> dict:
    if not user:
        return user
    if user.get("id_card"):
        user["id_card_masked"] = mask_id_card(user["id_card"])
    if user.get("phone"):
        user["phone_masked"] = mask_phone(user["phone"])
    if user.get("real_name"):
        user["real_name_masked"] = mask_name(user["real_name"])
    user.pop("password", None)
    return user


def mask_order_fields(order: dict) -> dict:
    if not order:
        return order
    if order.get("id_card"):
        order["id_card_masked"] = mask_id_card(order["id_card"])
    if order.get("phone"):
        order["phone_masked"] = mask_phone(order["phone"])
    if order.get("real_name"):
        order["real_name_masked"] = mask_name(order["real_name"])
    if order.get("plate_no"):
        order["plate_no_masked"] = mask_plate(order["plate_no"])
    if order.get("contact_phone"):
        order["contact_phone_masked"] = mask_phone(order["contact_phone"])
    if order.get("contact_name"):
        order["contact_name_masked"] = mask_name(order["contact_name"])
    return order


class Handler(BaseHTTPRequestHandler):
    server_version = "may-89229-api/2.0"

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"{self.address_string()} - {fmt % args}", flush=True)

    def _send_json(self, payload: dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, message: str, status: HTTPStatus = HTTPStatus.BAD_REQUEST) -> None:
        self._send_json({"ok": False, "error": message}, status)

    def _get_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length)
        try:
            return json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def _get_query(self) -> dict[str, str]:
        parsed = urlparse(self.path)
        return {k: v[0] for k, v in parse_qs(parsed.query).items()}

    def do_OPTIONS(self) -> None:
        self._send_json({"ok": True})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}

        routes = {
            "/api/health": self._api_health,
            "/api/dashboard": self._api_dashboard,
            "/api/auth/current": self._api_current_user,
            "/api/cities": self._api_cities,
            "/api/certificate/orders": self._api_certificate_orders,
            "/api/vehicle/violations": self._api_vehicle_violations,
            "/api/vehicle/orders": self._api_vehicle_orders,
            "/api/idcard/orders": self._api_idcard_orders,
            "/api/workorders": self._api_workorders,
            "/api/logistics": self._api_logistics,
            "/api/payments": self._api_payments,
            "/api/escrow": self._api_escrow,
            "/api/alerts": self._api_alerts,
            "/api/audit": self._api_audit,
            "/api/receipt": self._api_receipt,
            "/api/stats/overview": self._api_stats_overview,
            "/api/stats/business": self._api_stats_business,
            "/api/operator/city-stats": self._api_operator_city_stats,
            "/api/users": self._api_users,
        }

        handler = routes.get(path)
        if handler:
            try:
                handler(query)
            except Exception as e:
                print(f"API Error {path}: {e}", flush=True)
                self._send_error(f"Internal server error: {e}", HTTPStatus.INTERNAL_SERVER_ERROR)
        else:
            self._send_error("Not found", HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._get_body()

        routes = {
            "/api/auth/login": self._api_login,
            "/api/certificate/create": self._api_certificate_create,
            "/api/vehicle/pay-violation": self._api_vehicle_pay_violation,
            "/api/vehicle/create-exempt": self._api_vehicle_create_exempt,
            "/api/idcard/create": self._api_idcard_create,
            "/api/workorders/accept": self._api_workorder_accept,
            "/api/workorders/complete": self._api_workorder_complete,
            "/api/alerts/handle": self._api_alert_handle,
            "/api/payment/create": self._api_payment_create,
        }

        handler = routes.get(path)
        if handler:
            try:
                handler(body)
            except Exception as e:
                print(f"API Error {path}: {e}", flush=True)
                self._send_error(f"Internal server error: {e}", HTTPStatus.INTERNAL_SERVER_ERROR)
        else:
            self._send_error("Not found", HTTPStatus.NOT_FOUND)

    def _api_health(self, query=None):
        status = row("SELECT * FROM service_status WHERE id = 1")
        self._send_json({
            "ok": True,
            "service": ORDER_ID,
            "status": status.get("status", "running"),
            "database": str(DB_PATH.relative_to(ROOT)),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "version": "2.0.0",
        })

    def _api_dashboard(self, query=None):
        self._send_json({
            "ok": True,
            "status": row("SELECT * FROM service_status WHERE id = 1"),
            "metrics": rows("SELECT label, value, trend FROM metrics ORDER BY id"),
        })

    def _api_current_user(self, query=None):
        user = row("SELECT * FROM users WHERE id = 1")
        self._send_json({"ok": True, "user": mask_user_fields(user)})

    def _api_cities(self, query=None):
        cities = rows("SELECT city_code, city_name, enabled, config FROM cities ORDER BY city_code")
        self._send_json({"ok": True, "cities": cities})

    def _api_login(self, body):
        username = body.get("username", "")
        password = body.get("password", "")
        hashed = hashlib.md5(password.encode()).hexdigest()
        user = row(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            (username, hashed),
        )
        if not user:
            self._send_error("用户名或密码错误", HTTPStatus.UNAUTHORIZED)
            return
        self._send_json({
            "ok": True,
            "token": f"token_{user['id']}_{int(datetime.now().timestamp())}",
            "user": mask_user_fields(user),
        })

    def _api_certificate_orders(self, query):
        page = int(query.get("page", 1))
        page_size = int(query.get("page_size", 10))
        status = query.get("status", "")
        user_id = query.get("user_id", "1")

        where = "WHERE 1=1"
        params = []
        if status:
            where += " AND status = ?"
            params.append(status)
        if user_id:
            where += " AND user_id = ?"
            params.append(user_id)

        q = f"SELECT * FROM certificate_orders {where} ORDER BY created_at DESC"
        cq = f"SELECT COUNT(*) as total FROM certificate_orders {where}"
        result = paginate(q, cq, page, page_size, tuple(params))
        result["items"] = [mask_order_fields(o) for o in result["items"]]
        self._send_json({"ok": True, **result})

    def _api_certificate_create(self, body):
        now = datetime.now(timezone.utc).isoformat()
        deadline = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()
        order_no = gen_order_no("CRT")

        with connect() as conn:
            conn.execute(
                """INSERT INTO certificate_orders (order_no, user_id, city_code, business_type,
                   permit_type, real_name, id_card, phone, address, pickup_time, material_list,
                   pre_audit_status, status, current_node, deadline, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    order_no, body.get("user_id", 1), body.get("city_code", "440100"),
                    body.get("business_type", "hk_macao_endorse"),
                    body.get("permit_type", "g-card"),
                    body.get("real_name", ""), body.get("id_card", ""),
                    body.get("phone", ""), body.get("address", ""),
                    body.get("pickup_time", None),
                    json.dumps(body.get("materials", [])),
                    "pending", "created", "created", deadline, now, now,
                ),
            )
            work_no = gen_order_no("WO")
            conn.execute(
                """INSERT INTO work_orders (work_no, business_type, related_order_no,
                   city_code, address, contact_name, contact_phone, type, status,
                   lat, lng, scheduled_time, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    work_no, body.get("business_type", "hk_macao_endorse"),
                    order_no, body.get("city_code", "440100"),
                    body.get("address", ""), body.get("real_name", ""),
                    body.get("phone", ""), "pickup", "pending",
                    23.1291, 113.2644, body.get("pickup_time", None), now,
                ),
            )
            pay_no = gen_order_no("PAY")
            conn.execute(
                """INSERT INTO payments (pay_no, order_no, user_id, amount, pay_method,
                   pay_type, status, escrow_account, settled, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)""",
                (pay_no, order_no, body.get("user_id", 1), 120.0,
                 body.get("pay_method", "wechat"), "service_fee",
                 "pending", f"ESCROW_{body.get('city_code', 'GZ')}_001", now),
            )
            conn.commit()

        order = row("SELECT * FROM certificate_orders WHERE order_no = ?", (order_no,))
        self._send_json({"ok": True, "order": mask_order_fields(order), "work_no": work_no})

    def _api_vehicle_violations(self, query):
        page = int(query.get("page", 1))
        page_size = int(query.get("page_size", 10))
        user_id = query.get("user_id", "1")
        paid = query.get("paid", "")

        where = "WHERE user_id = ?"
        params = [user_id]
        if paid:
            where += " AND paid = ?"
            params.append(int(paid))

        q = f"SELECT * FROM vehicle_violations {where} ORDER BY violation_time DESC"
        cq = f"SELECT COUNT(*) as total FROM vehicle_violations {where}"
        result = paginate(q, cq, page, page_size, tuple(params))
        result["items"] = [mask_order_fields(v) for v in result["items"]]

        total_fine = row(
            f"SELECT COALESCE(SUM(fine_amount), 0) as total FROM vehicle_violations {where}",
            tuple(params),
        )
        result["total_fine"] = total_fine.get("total", 0)
        self._send_json({"ok": True, **result})

    def _api_vehicle_pay_violation(self, body):
        violation_ids = body.get("violation_ids", [])
        pay_method = body.get("pay_method", "wechat")
        now = datetime.now(timezone.utc).isoformat()

        with connect() as conn:
            total_amount = 0
            for vid in violation_ids:
                vio = row("SELECT * FROM vehicle_violations WHERE id = ?", (vid,))
                if vio and not vio["paid"]:
                    total_amount += vio["fine_amount"]
                    conn.execute(
                        "UPDATE vehicle_violations SET paid = 1 WHERE id = ?",
                        (vid,),
                    )
                    pay_no = gen_order_no("PAY")
                    conn.execute(
                        """INSERT INTO payments (pay_no, order_no, user_id, amount, pay_method,
                           pay_type, status, escrow_account, settled, paid_at, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)""",
                        (pay_no, f"VIO{vid}", body.get("user_id", 1),
                         vio["fine_amount"], pay_method, "fine",
                         "success", f"ESCROW_FINE_001", now, now),
                    )
            conn.commit()

        self._send_json({"ok": True, "total_amount": total_amount, "paid_count": len(violation_ids)})

    def _api_vehicle_orders(self, query):
        page = int(query.get("page", 1))
        page_size = int(query.get("page_size", 10))
        user_id = query.get("user_id", "1")

        q = "SELECT * FROM vehicle_orders WHERE user_id = ? ORDER BY created_at DESC"
        cq = "SELECT COUNT(*) as total FROM vehicle_orders WHERE user_id = ?"
        result = paginate(q, cq, page, page_size, (user_id,))
        result["items"] = [mask_order_fields(o) for o in result["items"]]
        self._send_json({"ok": True, **result})

    def _api_vehicle_create_exempt(self, body):
        now = datetime.now(timezone.utc).isoformat()
        deadline = (datetime.now(timezone.utc) + timedelta(hours=72)).isoformat()
        order_no = gen_order_no("VEH")

        with connect() as conn:
            conn.execute(
                """INSERT INTO vehicle_orders (order_no, user_id, city_code, business_type,
                   plate_no, plate_type, real_name, phone, address, pickup_time,
                   status, current_node, deadline, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    order_no, body.get("user_id", 1), body.get("city_code", "440100"),
                    "six_year_exempt", body.get("plate_no", ""),
                    body.get("plate_type", "小型汽车"),
                    body.get("real_name", ""), body.get("phone", ""),
                    body.get("address", ""), body.get("pickup_time", None),
                    "created", "created", deadline, now, now,
                ),
            )
            work_no = gen_order_no("WO")
            conn.execute(
                """INSERT INTO work_orders (work_no, business_type, related_order_no,
                   city_code, address, contact_name, contact_phone, type, status,
                   lat, lng, scheduled_time, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    work_no, "six_year_exempt", order_no,
                    body.get("city_code", "440100"), body.get("address", ""),
                    body.get("real_name", ""), body.get("phone", ""),
                    "pickup", "pending", 23.1291, 113.2644,
                    body.get("pickup_time", None), now,
                ),
            )
            conn.commit()

        order = row("SELECT * FROM vehicle_orders WHERE order_no = ?", (order_no,))
        self._send_json({"ok": True, "order": mask_order_fields(order), "work_no": work_no})

    def _api_idcard_orders(self, query):
        page = int(query.get("page", 1))
        page_size = int(query.get("page_size", 10))
        user_id = query.get("user_id", "1")

        q = "SELECT * FROM idcard_orders WHERE user_id = ? ORDER BY created_at DESC"
        cq = "SELECT COUNT(*) as total FROM idcard_orders WHERE user_id = ?"
        result = paginate(q, cq, page, page_size, (user_id,))
        result["items"] = [mask_order_fields(o) for o in result["items"]]
        self._send_json({"ok": True, **result})

    def _api_idcard_create(self, body):
        now = datetime.now(timezone.utc).isoformat()
        deadline = (datetime.now(timezone.utc) + timedelta(hours=120)).isoformat()
        order_no = gen_order_no("IDC")

        with connect() as conn:
            conn.execute(
                """INSERT INTO idcard_orders (order_no, user_id, city_code, business_type,
                   real_name, id_card, phone, reason, mailing_address,
                   status, current_node, deadline, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    order_no, body.get("user_id", 1), body.get("city_code", "440100"),
                    body.get("business_type", "reissue"),
                    body.get("real_name", ""), body.get("id_card", ""),
                    body.get("phone", ""), body.get("reason", ""),
                    body.get("mailing_address", ""),
                    "created", "created", deadline, now, now,
                ),
            )
            conn.commit()

        order = row("SELECT * FROM idcard_orders WHERE order_no = ?", (order_no,))
        self._send_json({"ok": True, "order": mask_order_fields(order)})

    def _api_workorders(self, query):
        page = int(query.get("page", 1))
        page_size = int(query.get("page_size", 10))
        courier_id = query.get("courier_id", "")
        status = query.get("status", "")
        city_code = query.get("city_code", "")

        where = "WHERE 1=1"
        params = []
        if courier_id:
            where += " AND courier_id = ?"
            params.append(courier_id)
        if status:
            where += " AND status = ?"
            params.append(status)
        if city_code:
            where += " AND city_code = ?"
            params.append(city_code)

        q = f"SELECT * FROM work_orders {where} ORDER BY created_at DESC"
        cq = f"SELECT COUNT(*) as total FROM work_orders {where}"
        result = paginate(q, cq, page, page_size, tuple(params))
        result["items"] = [mask_order_fields(w) for w in result["items"]]
        self._send_json({"ok": True, **result})

    def _api_workorder_accept(self, body):
        work_no = body.get("work_no", "")
        courier_id = body.get("courier_id", 2)
        courier_name = body.get("courier_name", "李快递")
        now = datetime.now(timezone.utc).isoformat()

        with connect() as conn:
            conn.execute(
                "UPDATE work_orders SET status = 'accepted', courier_id = ?, courier_name = ? WHERE work_no = ?",
                (courier_id, courier_name, work_no),
            )
            conn.commit()

        wo = row("SELECT * FROM work_orders WHERE work_no = ?", (work_no,))
        self._send_json({"ok": True, "work_order": mask_order_fields(wo)})

    def _api_workorder_complete(self, body):
        work_no = body.get("work_no", "")
        now = datetime.now(timezone.utc).isoformat()

        with connect() as conn:
            conn.execute(
                "UPDATE work_orders SET status = 'completed', completed_time = ? WHERE work_no = ?",
                (now, work_no),
            )
            wo = row("SELECT * FROM work_orders WHERE work_no = ?", (work_no,))
            if wo and wo["related_order_no"]:
                if wo["type"] == "pickup":
                    conn.execute(
                        "UPDATE certificate_orders SET status = 'materials_received', current_node = 'materials_received', updated_at = ? WHERE order_no = ?",
                        (now, wo["related_order_no"]),
                    )
            conn.commit()

        self._send_json({"ok": True, "work_no": work_no})

    def _api_logistics(self, query):
        order_no = query.get("order_no", "")
        express_no = query.get("express_no", "")

        if order_no:
            items = rows(
                "SELECT * FROM logistics WHERE order_no = ? ORDER BY created_at DESC",
                (order_no,),
            )
        elif express_no:
            items = rows(
                "SELECT * FROM logistics WHERE express_no = ? ORDER BY created_at DESC",
                (express_no,),
            )
        else:
            items = []

        self._send_json({"ok": True, "items": items})

    def _api_payments(self, query):
        page = int(query.get("page", 1))
        page_size = int(query.get("page_size", 10))
        user_id = query.get("user_id", "")

        where = "WHERE 1=1"
        params = []
        if user_id:
            where += " AND user_id = ?"
            params.append(user_id)

        q = f"SELECT * FROM payments {where} ORDER BY created_at DESC"
        cq = f"SELECT COUNT(*) as total FROM payments {where}"
        result = paginate(q, cq, page, page_size, tuple(params))
        self._send_json({"ok": True, **result})

    def _api_escrow(self, query):
        city_code = query.get("city_code", "")
        if city_code:
            items = rows(
                "SELECT * FROM escrow_accounts WHERE city_code = ? ORDER BY account_no",
                (city_code,),
            )
        else:
            items = rows("SELECT * FROM escrow_accounts ORDER BY city_code, account_no")
        self._send_json({"ok": True, "items": items})

    def _api_alerts(self, query):
        page = int(query.get("page", 1))
        page_size = int(query.get("page_size", 10))
        handled = query.get("handled", "")
        city_code = query.get("city_code", "")

        where = "WHERE 1=1"
        params = []
        if handled:
            where += " AND handled = ?"
            params.append(int(handled))
        if city_code:
            where += " AND city_code = ?"
            params.append(city_code)

        q = f"SELECT * FROM alerts {where} ORDER BY created_at DESC"
        cq = f"SELECT COUNT(*) as total FROM alerts {where}"
        result = paginate(q, cq, page, page_size, tuple(params))
        self._send_json({"ok": True, **result})

    def _api_alert_handle(self, body):
        alert_id = body.get("alert_id", "")
        handled_by = body.get("handled_by", "admin")

        with connect() as conn:
            conn.execute(
                "UPDATE alerts SET handled = 1, handled_by = ? WHERE id = ?",
                (handled_by, alert_id),
            )
            conn.commit()

        self._send_json({"ok": True, "alert_id": alert_id})

    def _api_audit(self, query):
        page = int(query.get("page", 1))
        page_size = int(query.get("page_size", 10))
        module = query.get("module", "")

        where = "WHERE 1=1"
        params = []
        if module:
            where += " AND module = ?"
            params.append(module)

        q = f"SELECT * FROM audit_logs {where} ORDER BY created_at DESC"
        cq = f"SELECT COUNT(*) as total FROM audit_logs {where}"
        result = paginate(q, cq, page, page_size, tuple(params))
        self._send_json({"ok": True, **result})

    def _api_receipt(self, query):
        order_no = query.get("order_no", "")
        receipt_no = query.get("receipt_no", "")

        receipt = {}
        if receipt_no:
            receipt = row("SELECT * FROM receipt_records WHERE receipt_no = ?", (receipt_no,))
        elif order_no:
            receipt = row("SELECT * FROM receipt_records WHERE order_no = ?", (order_no,))

        self._send_json({"ok": True, "receipt": receipt if receipt else {}})

    def _api_stats_overview(self, query):
        cert_count = row("SELECT COUNT(*) as total FROM certificate_orders WHERE DATE(created_at) = DATE('now')")
        veh_count = row("SELECT COUNT(*) as total FROM vehicle_orders WHERE DATE(created_at) = DATE('now')")
        idc_count = row("SELECT COUNT(*) as total FROM idcard_orders WHERE DATE(created_at) = DATE('now')")
        wo_count = row("SELECT COUNT(*) as total FROM work_orders WHERE status != 'completed'")
        overdue_count = row(
            "SELECT COUNT(*) as total FROM certificate_orders WHERE overdue = 1 AND status != 'completed'"
        )
        total_amount = row("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'success'")

        self._send_json({
            "ok": True,
            "today_orders": {
                "certificate": cert_count.get("total", 0),
                "vehicle": veh_count.get("total", 0),
                "idcard": idc_count.get("total", 0),
                "total": cert_count.get("total", 0) + veh_count.get("total", 0) + idc_count.get("total", 0),
            },
            "pending_workorders": wo_count.get("total", 0),
            "overdue_count": overdue_count.get("total", 0),
            "total_payment_amount": total_amount.get("total", 0),
        })

    def _api_stats_business(self, query):
        city_code = query.get("city_code", "")

        where = ""
        params = ()
        if city_code:
            where = "WHERE city_code = ?"
            params = (city_code,)

        cert_by_status = rows(
            f"SELECT status, COUNT(*) as count FROM certificate_orders {where} GROUP BY status",
            params,
        )
        veh_by_status = rows(
            f"SELECT status, COUNT(*) as count FROM vehicle_orders {where} GROUP BY status",
            params,
        )

        self._send_json({
            "ok": True,
            "certificate_by_status": cert_by_status,
            "vehicle_by_status": veh_by_status,
        })

    def _api_operator_city_stats(self, query):
        cities = rows("SELECT city_code, city_name FROM cities ORDER BY city_code")
        result = []
        for city in cities:
            cert_count = row(
                "SELECT COUNT(*) as total FROM certificate_orders WHERE city_code = ?",
                (city["city_code"],),
            )
            veh_count = row(
                "SELECT COUNT(*) as total FROM vehicle_orders WHERE city_code = ?",
                (city["city_code"],),
            )
            idc_count = row(
                "SELECT COUNT(*) as total FROM idcard_orders WHERE city_code = ?",
                (city["city_code"],),
            )
            wo_count = row(
                "SELECT COUNT(*) as total FROM work_orders WHERE city_code = ?",
                (city["city_code"],),
            )
            overdue = row(
                """SELECT COUNT(*) as total FROM certificate_orders
                   WHERE city_code = ? AND overdue = 1 AND status != 'completed'""",
                (city["city_code"],),
            )
            result.append({
                **city,
                "cert_total": cert_count.get("total", 0),
                "vehicle_total": veh_count.get("total", 0),
                "idcard_total": idc_count.get("total", 0),
                "workorder_total": wo_count.get("total", 0),
                "overdue_count": overdue.get("total", 0),
                "total_orders": cert_count.get("total", 0) + veh_count.get("total", 0) + idc_count.get("total", 0),
            })

        self._send_json({"ok": True, "cities": result})

    def _api_users(self, query):
        role = query.get("role", "")
        where = ""
        params = ()
        if role:
            where = "WHERE role = ?"
            params = (role,)

        users = rows(
            f"SELECT id, username, real_name, role, city_code, verified, created_at FROM users {where} ORDER BY id",
            params,
        )
        users = [mask_user_fields(u) for u in users]
        self._send_json({"ok": True, "users": users})

    def _api_payment_create(self, body):
        order_no = body.get("order_no", "")
        amount = body.get("amount", 0)
        pay_method = body.get("pay_method", "wechat")
        pay_type = body.get("pay_type", "service_fee")
        user_id = body.get("user_id", 1)
        now = datetime.now(timezone.utc).isoformat()
        pay_no = gen_order_no("PAY")

        with connect() as conn:
            conn.execute(
                """INSERT INTO payments (pay_no, order_no, user_id, amount, pay_method,
                   pay_type, status, escrow_account, settled, paid_at, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, 'success', ?, 0, ?, ?)""",
                (pay_no, order_no, user_id, amount, pay_method, pay_type,
                 "ESCROW_GZ_001", now, now),
            )
            conn.commit()

        self._send_json({"ok": True, "pay_no": pay_no, "amount": amount})


def main() -> None:
    init_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"{ORDER_ID} API listening on http://{HOST}:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()