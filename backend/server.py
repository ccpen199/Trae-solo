#!/usr/bin/env python3
import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / ".env"


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if path.exists():
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


ENV = load_env(ENV_PATH)
APP_NAME = ENV.get("APP_NAME", "may-89137")
HOST = ENV.get("HOST", "127.0.0.1")
PORT = int(ENV.get("BACKEND_PORT", "59137"))
SQLITE_PATH = (PROJECT_ROOT / ENV.get("SQLITE_PATH", "backend/data/app.sqlite3")).resolve()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def local_now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def open_db() -> sqlite3.Connection:
    SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_database() -> None:
    with open_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS app_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                detail TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS access_devices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'online',
                firmware_version TEXT NOT NULL,
                last_heartbeat TEXT NOT NULL,
                offline_cache INTEGER DEFAULT 0,
                has_nfc INTEGER DEFAULT 1,
                has_bluetooth INTEGER DEFAULT 1,
                has_qr INTEGER DEFAULT 1,
                has_face INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS access_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                method TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (device_id) REFERENCES access_devices(id)
            );

            CREATE TABLE IF NOT EXISTS device_alarms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                level TEXT NOT NULL,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL,
                FOREIGN KEY (device_id) REFERENCES access_devices(id)
            );

            CREATE TABLE IF NOT EXISTS firmware_ota (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                version TEXT NOT NULL,
                status TEXT NOT NULL,
                progress INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (device_id) REFERENCES access_devices(id)
            );

            CREATE TABLE IF NOT EXISTS repair_orders (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                reporter TEXT NOT NULL,
                phone TEXT NOT NULL,
                location TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                priority TEXT NOT NULL DEFAULT 'medium',
                assignee TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS neighborhood_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                audit_opinion TEXT,
                created_at TEXT NOT NULL,
                audited_at TEXT
            );

            CREATE TABLE IF NOT EXISTS property_fees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner TEXT NOT NULL,
                room TEXT NOT NULL,
                amount REAL NOT NULL,
                period TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'unpaid',
                invoice_no TEXT,
                paid_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                fee_id INTEGER NOT NULL,
                invoice_code TEXT NOT NULL,
                invoice_number TEXT NOT NULL,
                amount REAL NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (fee_id) REFERENCES property_fees(id)
            );

            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                publisher TEXT NOT NULL,
                target_buildings TEXT,
                target_units TEXT,
                target_roles TEXT,
                status TEXT NOT NULL DEFAULT 'draft',
                created_at TEXT NOT NULL,
                published_at TEXT
            );

            CREATE TABLE IF NOT EXISTS org_structure (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                parent_id TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                module TEXT NOT NULL,
                can_view INTEGER DEFAULT 0,
                can_edit INTEGER DEFAULT 0,
                can_delete INTEGER DEFAULT 0,
                can_approve INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS boundary_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                boundary_type TEXT NOT NULL,
                role TEXT NOT NULL,
                allowed_actions TEXT NOT NULL,
                description TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS complaint_tickets (
                id TEXT PRIMARY KEY,
                owner TEXT NOT NULL,
                phone TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'submitted',
                response_time INTEGER,
                created_at TEXT NOT NULL,
                responded_at TEXT,
                closed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS response_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                total_tickets INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0,
                on_time_rate REAL DEFAULT 0,
                satisfaction_rate REAL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS visitor_access (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visitor_name TEXT NOT NULL,
                visitor_phone TEXT NOT NULL,
                host_name TEXT NOT NULL,
                host_room TEXT NOT NULL,
                device_id TEXT NOT NULL,
                qr_token TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                valid_from TEXT NOT NULL,
                valid_until TEXT NOT NULL,
                created_at TEXT NOT NULL,
                approved_at TEXT,
                opened_at TEXT,
                FOREIGN KEY (device_id) REFERENCES access_devices(id)
            );

            CREATE TABLE IF NOT EXISTS device_inspections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                inspection_type TEXT NOT NULL,
                inspector TEXT NOT NULL,
                findings TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'normal',
                created_at TEXT NOT NULL,
                FOREIGN KEY (device_id) REFERENCES access_devices(id)
            );

            CREATE TABLE IF NOT EXISTS alarm_dispatches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alarm_id INTEGER NOT NULL,
                handler TEXT NOT NULL,
                action TEXT NOT NULL,
                result TEXT,
                status TEXT NOT NULL DEFAULT 'processing',
                assigned_at TEXT NOT NULL,
                resolved_at TEXT,
                FOREIGN KEY (alarm_id) REFERENCES device_alarms(id)
            );

            CREATE TABLE IF NOT EXISTS ota_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ota_id INTEGER NOT NULL,
                stage TEXT NOT NULL,
                detail TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (ota_id) REFERENCES firmware_ota(id)
            );

            CREATE TABLE IF NOT EXISTS repair_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL,
                photo_url TEXT NOT NULL,
                photo_type TEXT NOT NULL,
                uploaded_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (repair_id) REFERENCES repair_orders(id)
            );

            CREATE TABLE IF NOT EXISTS repair_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL,
                action TEXT NOT NULL,
                operator TEXT NOT NULL,
                detail TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (repair_id) REFERENCES repair_orders(id)
            );

            CREATE TABLE IF NOT EXISTS repair_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL,
                satisfaction INTEGER NOT NULL,
                timeliness INTEGER NOT NULL,
                attitude INTEGER NOT NULL,
                quality INTEGER NOT NULL,
                comment TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (repair_id) REFERENCES repair_orders(id)
            );

            CREATE TABLE IF NOT EXISTS fee_payment_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fee_id INTEGER NOT NULL,
                payment_method TEXT NOT NULL,
                transaction_id TEXT NOT NULL,
                amount REAL NOT NULL,
                payer TEXT NOT NULL,
                paid_at TEXT NOT NULL,
                FOREIGN KEY (fee_id) REFERENCES property_fees(id)
            );

            CREATE TABLE IF NOT EXISTS complaint_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                complaint_id TEXT NOT NULL,
                action TEXT NOT NULL,
                operator TEXT NOT NULL,
                detail TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (complaint_id) REFERENCES complaint_tickets(id)
            );
            """
        )
        _seed_initial_data(conn)
        conn.commit()


def _seed_initial_data(conn: sqlite3.Connection) -> None:
    now = utc_now()
    now_local = local_now_str()

    count = conn.execute("SELECT COUNT(*) AS count FROM app_records").fetchone()["count"]
    if count == 0:
        conn.executemany(
            "INSERT INTO app_records (title, detail, created_at) VALUES (?, ?, ?)",
            [
                ("社区数字治理工作台", "已启动完整的社区治理平台，包含门禁、物业、治理等模块。", now),
                ("门禁设备纳管", "支持离线缓存、心跳检测、固件OTA、告警分级响应。", now),
                ("服务响应时效", "服务仅监听127.0.0.1，日志写入项目目录。", now),
            ],
        )

    device_count = conn.execute("SELECT COUNT(*) AS count FROM access_devices").fetchone()["count"]
    if device_count == 0:
        devices = [
            ("DEV-001", "南门主入口", "南门", "gate", "online", "v2.3.1", now, 0, 1, 1, 1, 1, now),
            ("DEV-002", "北门入口", "北门", "gate", "online", "v2.3.1", now, 0, 1, 1, 1, 1, now),
            ("DEV-003", "1号楼单元门", "1号楼", "unit_door", "online", "v2.2.0", now, 0, 1, 1, 1, 1, now),
            ("DEV-004", "2号楼单元门", "2号楼", "unit_door", "warning", "v2.3.0", now, 15, 1, 1, 1, 1, now),
            ("DEV-005", "3号楼单元门", "3号楼", "unit_door", "offline", "v2.1.5", _hours_ago(3), 128, 1, 1, 1, 0, now),
            ("DEV-006", "车库入口", "地下车库", "gate", "online", "v2.3.1", now, 0, 1, 1, 1, 1, now),
        ]
        conn.executemany(
            "INSERT INTO access_devices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            devices,
        )

        access_methods = ["bluetooth", "nfc", "qr_code", "face"]
        statuses = ["success", "success", "success", "failed"]
        names = ["张三", "李四", "王五", "赵六", "陈七", "刘八"]
        access_records = []
        for i in range(20):
            device_idx = i % 6
            method = access_methods[i % 4]
            status = statuses[0] if i % 5 != 0 else statuses[3]
            access_records.append((
                f"DEV-00{device_idx + 1}",
                names[i % 6],
                method,
                status,
                _minutes_ago(i * 15)
            ))
        conn.executemany(
            "INSERT INTO access_records (device_id, user_name, method, status, created_at) VALUES (?, ?, ?, ?, ?)",
            access_records,
        )

        alarms = [
            ("DEV-005", "critical", "offline", "设备离线超过3小时", "pending", _hours_ago(3)),
            ("DEV-004", "warning", "cache_full", "离线缓存即将满", "processing", _hours_ago(1)),
            ("DEV-002", "info", "ota_available", "有新固件可升级", "pending", _hours_ago(6)),
        ]
        conn.executemany(
            "INSERT INTO device_alarms (device_id, level, type, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            alarms,
        )

        ota_records = [
            ("DEV-003", "v2.3.1", "updating", 65, _hours_ago(0.5)),
            ("DEV-001", "v2.3.1", "completed", 100, _days_ago(1)),
        ]
        conn.executemany(
            "INSERT INTO firmware_ota (device_id, version, status, progress, created_at) VALUES (?, ?, ?, ?, ?)",
            ota_records,
        )

    repair_count = conn.execute("SELECT COUNT(*) AS count FROM repair_orders").fetchone()["count"]
    if repair_count == 0:
        repairs = [
            ("REP-2026-001", "电梯故障", "3号楼西梯按钮失灵，无法正常使用", "张三", "13800138001", "3号楼2单元", "equipment", "pending", "high", None, now, now),
            ("REP-2026-002", "路灯损坏", "小区北门路灯不亮", "李四", "13800138002", "北门绿化带", "public_facility", "processing", "medium", "王维修", _days_ago(1), _hours_ago(2)),
            ("REP-2026-003", "水管漏水", "1号楼12层公共区域水管漏水", "王五", "13800138003", "1号楼1单元12层", "plumbing", "completed", "high", "李维修", _days_ago(2), _days_ago(1)),
            ("REP-2026-004", "门禁刷卡无反应", "南门门禁刷卡区域无反应", "赵六", "13800138004", "南门", "access_control", "pending", "low", None, _hours_ago(8), _hours_ago(8)),
        ]
        conn.executemany(
            "INSERT INTO repair_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            repairs,
        )

    post_count = conn.execute("SELECT COUNT(*) AS count FROM neighborhood_posts").fetchone()["count"]
    if post_count == 0:
        posts = [
            ("孙八", "寻找走失宠物", "今天下午在花园附近走失一只金毛，看到请联系13800138005", "pending", None, _hours_ago(3), None),
            ("周九", "闲置物品转让", "转让一台九成新的儿童自行车，价格面议", "approved", "内容合规", _days_ago(1), _hours_ago(20)),
            ("吴十", "噪音投诉", "晚上10点后篮球场仍有噪音，影响休息", "pending", None, _hours_ago(1), None),
            ("郑十一", "社区活动通知", "本周六上午将举办亲子活动，欢迎参加", "approved", "内容合规", _days_ago(2), _days_ago(2)),
            ("钱十二", "可疑人员通报", "发现一名陌生人员在各楼层徘徊，请大家注意", "rejected", "内容需要核实后重新发布", _hours_ago(5), _hours_ago(2)),
        ]
        conn.executemany(
            "INSERT INTO neighborhood_posts (author, title, content, status, audit_opinion, created_at, audited_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            posts,
        )

    fee_count = conn.execute("SELECT COUNT(*) AS count FROM property_fees").fetchone()["count"]
    if fee_count == 0:
        fees = [
            ("张三", "1号楼1单元101", 258.50, "2026-06", "paid", "INV-202606001", _days_ago(5), _days_ago(10)),
            ("李四", "1号楼1单元102", 262.00, "2026-06", "paid", "INV-202606002", _days_ago(3), _days_ago(10)),
            ("王五", "2号楼1单元301", 310.80, "2026-06", "unpaid", None, None, _days_ago(15)),
            ("赵六", "2号楼2单元502", 295.00, "2026-06", "paid", "INV-202606003", _days_ago(1), _days_ago(15)),
            ("陈七", "3号楼1单元801", 278.00, "2026-06", "overdue", None, None, _days_ago(15)),
        ]
        conn.executemany(
            "INSERT INTO property_fees (owner, room, amount, period, status, invoice_no, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            fees,
        )

        invoices = [
            ("INV-202606001", 1, "001", "20260001", 258.50, _days_ago(5)),
            ("INV-202606002", 2, "001", "20260002", 262.00, _days_ago(3)),
            ("INV-202606003", 4, "001", "20260003", 295.00, _days_ago(1)),
        ]
        conn.executemany(
            "INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?)",
            invoices,
        )

    ann_count = conn.execute("SELECT COUNT(*) AS count FROM announcements").fetchone()["count"]
    if ann_count == 0:
        announcements = [
            ("停水通知", "因管道维修，6月20日上午9:00-12:00，1号楼将暂停供水。", "物业管理员", "1号楼", None, "all", "published", now_local, _days_ago(1)),
            ("电梯年检通知", "6月25日将进行电梯年检，届时各楼电梯将分批暂停使用。", "物业管理员", "1号楼,2号楼,3号楼", None, "owner", "published", now_local, _days_ago(3)),
            ("消防安全演练", "定于6月30日下午进行消防安全演练，请各位业主配合。", "物业管理员", None, None, "all", "draft", now_local, None),
            ("业委会选举通知", "新一届业委会选举将于7月10日举行，请符合条件的业主积极参与。", "业委会", None, None, "owner", "published", now_local, _days_ago(7)),
        ]
        conn.executemany(
            "INSERT INTO announcements (title, content, publisher, target_buildings, target_units, target_roles, status, created_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            announcements,
        )

    org_count = conn.execute("SELECT COUNT(*) AS count FROM org_structure").fetchone()["count"]
    if org_count == 0:
        orgs = [
            ("ORG-001", "社区治理中心", "root", None, now),
            ("ORG-002", "物业管理处", "department", "ORG-001", now),
            ("ORG-003", "业主委员会", "committee", "ORG-001", now),
            ("ORG-004", "保安部", "team", "ORG-002", now),
            ("ORG-005", "维修部", "team", "ORG-002", now),
            ("ORG-006", "客服部", "team", "ORG-002", now),
            ("ORG-007", "财务部", "team", "ORG-002", now),
            ("ORG-008", "1号楼栋长", "building", "ORG-003", now),
            ("ORG-009", "2号楼栋长", "building", "ORG-003", now),
            ("ORG-010", "3号楼栋长", "building", "ORG-003", now),
        ]
        conn.executemany(
            "INSERT INTO org_structure VALUES (?, ?, ?, ?, ?)",
            orgs,
        )

    perm_count = conn.execute("SELECT COUNT(*) AS count FROM permissions").fetchone()["count"]
    if perm_count == 0:
        perms = [
            ("admin", "repair", 1, 1, 1, 1),
            ("admin", "neighborhood", 1, 1, 1, 1),
            ("admin", "property_fee", 1, 1, 1, 1),
            ("admin", "announcement", 1, 1, 1, 1),
            ("admin", "access_device", 1, 1, 1, 1),
            ("admin", "complaint", 1, 1, 1, 1),
            ("property", "repair", 1, 1, 0, 1),
            ("property", "neighborhood", 1, 1, 0, 1),
            ("property", "property_fee", 1, 1, 0, 0),
            ("property", "announcement", 1, 1, 0, 1),
            ("property", "access_device", 1, 1, 0, 0),
            ("property", "complaint", 1, 1, 0, 1),
            ("committee", "repair", 1, 0, 0, 0),
            ("committee", "neighborhood", 1, 0, 0, 1),
            ("committee", "property_fee", 1, 0, 0, 0),
            ("committee", "announcement", 1, 0, 0, 0),
            ("committee", "access_device", 1, 0, 0, 0),
            ("committee", "complaint", 1, 0, 0, 0),
            ("owner", "repair", 1, 1, 0, 0),
            ("owner", "neighborhood", 1, 1, 0, 0),
            ("owner", "property_fee", 1, 1, 0, 0),
            ("owner", "announcement", 1, 0, 0, 0),
            ("owner", "complaint", 1, 1, 0, 0),
        ]
        conn.executemany(
            "INSERT INTO permissions (role, module, can_view, can_edit, can_delete, can_approve) VALUES (?, ?, ?, ?, ?, ?)",
            perms,
        )

    boundary_count = conn.execute("SELECT COUNT(*) AS count FROM boundary_config").fetchone()["count"]
    if boundary_count == 0:
        boundaries = [
            ("finance_view", "committee", "view", "业委会仅可查看财务数据，不可编辑或导出"),
            ("notice_edit", "property", "edit,view", "物业可编辑通知，但需审批后发布"),
            ("complaint_submit", "owner", "submit,view", "业主可提交和查看自身诉求，不可处理"),
            ("device_manage", "property", "view,edit", "物业可管理设备，但固件升级需管理员审批"),
        ]
        conn.executemany(
            "INSERT INTO boundary_config (boundary_type, role, allowed_actions, description) VALUES (?, ?, ?, ?)",
            boundaries,
        )

    complaint_count = conn.execute("SELECT COUNT(*) AS count FROM complaint_tickets").fetchone()["count"]
    if complaint_count == 0:
        complaints = [
            ("CP-2026-001", "张三", "13800138001", "noise", "装修噪音", "周末仍有装修施工，噪音扰民", "processing", 120, _days_ago(1), _hours_ago(22), None),
            ("CP-2026-002", "李四", "13800138002", "sanitation", "垃圾清理不及时", "单元门口垃圾堆放两天未清理", "closed", 45, _days_ago(2), _days_ago(2), _days_ago(1)),
            ("CP-2026-003", "王五", "13800138003", "parking", "车位被占", "私家车位长期被其他车辆占用", "submitted", None, _hours_ago(5), None, None),
            ("CP-2026-004", "赵六", "13800138004", "security", "陌生人出入", "经常有陌生人随意出入小区", "processing", 180, _days_ago(1), _hours_ago(20), None),
            ("CP-2026-005", "陈七", "13800138005", "greening", "绿化维护", "小区绿化树木长期未修剪", "closed", 30, _days_ago(3), _days_ago(3), _days_ago(2)),
        ]
        conn.executemany(
            "INSERT INTO complaint_tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            complaints,
        )

    stats_count = conn.execute("SELECT COUNT(*) AS count FROM response_stats").fetchone()["count"]
    if stats_count == 0:
        base = datetime.now()
        stats = []
        for i in range(30):
            day = base - timedelta(days=i)
            day_str = day.strftime("%Y-%m-%d")
            total = 5 + (i % 5)
            avg = 30 + (i % 4) * 15
            on_time = 90 + (i % 3) * 3
            satisfaction = 85 + (i % 4) * 4
            stats.append((day_str, total, avg, on_time, satisfaction))
        conn.executemany(
            "INSERT INTO response_stats (date, total_tickets, avg_response_time, on_time_rate, satisfaction_rate) VALUES (?, ?, ?, ?, ?)",
            stats,
        )

    visitor_count = conn.execute("SELECT COUNT(*) AS count FROM visitor_access").fetchone()["count"]
    if visitor_count == 0:
        visitors = [
            ("快递员王师傅", "13900139001", "张三", "1号楼1单元101", "DEV-001", "QR-20260618-001", "approved",
             _hours_ago(2), _hours_ago(1), _hours_ago(3), _hours_ago(2.5), _hours_ago(1.5)),
            ("家政李阿姨", "13900139002", "李四", "1号楼1单元102", "DEV-003", "QR-20260618-002", "completed",
             _hours_ago(5), _hours_ago(4), _hours_ago(6), _hours_ago(5.5), _hours_ago(4.5)),
            ("访客刘先生", "13900139003", "王五", "2号楼1单元301", "DEV-001", "QR-20260618-003", "pending",
             _minutes_ago(30), _hours_ago(2), _minutes_ago(45), None, None),
            ("外卖员小张", "13900139004", "赵六", "2号楼2单元502", "DEV-001", "QR-20260618-004", "expired",
             _hours_ago(24), _hours_ago(23), _hours_ago(25), _hours_ago(23.5), None),
            ("维修供应商周工", "13900139005", "陈七", "3号楼1单元801", "DEV-005", "QR-20260618-005", "approved",
             _hours_ago(1), _hours_ago(0.5), _hours_ago(1.5), _hours_ago(1.2), None),
        ]
        conn.executemany(
            "INSERT INTO visitor_access (visitor_name, visitor_phone, host_name, host_room, device_id, qr_token, status, valid_from, valid_until, created_at, approved_at, opened_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            visitors,
        )

    inspection_count = conn.execute("SELECT COUNT(*) AS count FROM device_inspections").fetchone()["count"]
    if inspection_count == 0:
        inspections = [
            ("DEV-001", "daily", "保安队长-刘队", "设备运行正常，读卡灵敏，网络稳定", "normal", _days_ago(0)),
            ("DEV-002", "daily", "保安队长-刘队", "设备正常，人脸识别镜头有灰尘已擦拭", "normal", _days_ago(0)),
            ("DEV-003", "weekly", "运维-陈工", "读卡器磨损较严重，建议2周后更换", "warning", _days_ago(3)),
            ("DEV-004", "fault", "运维-王工", "离线缓存积压原因：网络不稳定导致上传失败，已修复网络", "resolved", _hours_ago(3)),
            ("DEV-005", "fault", "运维-李工", "设备离线：电源适配器损坏，已更换适配器，等待设备重启", "processing", _hours_ago(2)),
            ("DEV-001", "monthly", "运维总监-赵总", "月度全面检查：固件版本、硬件磨损、网络稳定性均达标", "normal", _days_ago(15)),
        ]
        conn.executemany(
            "INSERT INTO device_inspections (device_id, inspection_type, inspector, findings, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            inspections,
        )

    dispatch_count = conn.execute("SELECT COUNT(*) AS count FROM alarm_dispatches").fetchone()["count"]
    if dispatch_count == 0:
        dispatches = [
            (1, "运维-李工", "现场排查", "检测到电源故障，正在更换电源适配器", "processing", _hours_ago(2.5), None),
            (1, "保安-小王", "现场确认", "已到现场确认设备确实离线，已通知运维", "completed", _hours_ago(3), _hours_ago(2.8)),
            (2, "运维-王工", "清理缓存", "手动触发缓存上传，已上传12条记录，剩余3条", "completed", _hours_ago(1), _hours_ago(0.5)),
            (2, "客服-小李", "通知物业", "已短信通知物业经理缓存情况", "completed", _hours_ago(1.2), _hours_ago(1.1)),
            (3, "运维-陈工", "准备升级", "已下载固件包，等待低峰期升级", "pending", _hours_ago(5), None),
        ]
        conn.executemany(
            "INSERT INTO alarm_dispatches (alarm_id, handler, action, result, status, assigned_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            dispatches,
        )

    ota_progress_count = conn.execute("SELECT COUNT(*) AS count FROM ota_progress").fetchone()["count"]
    if ota_progress_count == 0:
        ota_progress = [
            (1, "download", "下载固件包 v2.3.1，大小 12.8MB", _hours_ago(0.5)),
            (1, "verify", "校验固件 MD5 完整性通过", _hours_ago(0.45)),
            (1, "backup", "备份当前固件配置", _hours_ago(0.4)),
            (1, "flash", "正在刷写固件分区，进度 65%", _hours_ago(0.35)),
            (2, "download", "下载固件包 v2.3.1，大小 12.8MB", _days_ago(1)),
            (2, "verify", "校验固件 MD5 完整性通过", _hours_ago(23)),
            (2, "flash", "刷写固件分区完成", _days_ago(0.95)),
            (2, "reboot", "设备重启成功", _days_ago(0.9)),
            (2, "verify_version", "确认升级成功，当前版本 v2.3.1", _days_ago(0.85)),
        ]
        conn.executemany(
            "INSERT INTO ota_progress (ota_id, stage, detail, created_at) VALUES (?, ?, ?, ?)",
            ota_progress,
        )

    repair_photo_count = conn.execute("SELECT COUNT(*) AS count FROM repair_photos").fetchone()["count"]
    if repair_photo_count == 0:
        repair_photos = [
            ("REP-2026-002", "https://placeholder-img/repair-1a.jpg", "report", "李四", _days_ago(1)),
            ("REP-2026-002", "https://placeholder-img/repair-1b.jpg", "report", "李四", _days_ago(1)),
            ("REP-2026-002", "https://placeholder-img/repair-1c.jpg", "process", "王维修", _hours_ago(3)),
            ("REP-2026-002", "https://placeholder-img/repair-1d.jpg", "done", "王维修", _hours_ago(2)),
            ("REP-2026-003", "https://placeholder-img/repair-2a.jpg", "report", "王五", _days_ago(2)),
            ("REP-2026-003", "https://placeholder-img/repair-2b.jpg", "process", "李维修", _days_ago(1.5)),
            ("REP-2026-003", "https://placeholder-img/repair-2c.jpg", "done", "李维修", _days_ago(1)),
            ("REP-2026-001", "https://placeholder-img/repair-3a.jpg", "report", "张三", _hours_ago(5)),
        ]
        conn.executemany(
            "INSERT INTO repair_photos (repair_id, photo_url, photo_type, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?)",
            repair_photos,
        )

    repair_log_count = conn.execute("SELECT COUNT(*) AS count FROM repair_logs").fetchone()["count"]
    if repair_log_count == 0:
        repair_logs = [
            ("REP-2026-003", "create", "王五", "提交报修：1号楼12层公共区域水管漏水", _days_ago(2)),
            ("REP-2026-003", "auto_assign", "系统", "根据类型自动派单给李维修（水电组）", _days_ago(2)),
            ("REP-2026-003", "accept", "李维修", "接单，携带工具前往现场", _days_ago(1.9)),
            ("REP-2026-003", "arrive", "李维修", "到达现场，开始排查漏水点", _days_ago(1.8)),
            ("REP-2026-003", "diagnose", "李维修", "诊断结果：12层主水管接口处密封老化导致渗水", _days_ago(1.7)),
            ("REP-2026-003", "repair", "李维修", "更换密封垫圈，修复漏水点", _days_ago(1.5)),
            ("REP-2026-003", "test", "李维修", "通水测试30分钟，无渗漏，现场清理完毕", _days_ago(1.2)),
            ("REP-2026-003", "complete", "李维修", "工单完成，等待业主确认", _days_ago(1)),
            ("REP-2026-003", "feedback", "王五", "业主已评价并确认完成", _days_ago(0.8)),
            ("REP-2026-002", "create", "李四", "提交报修：小区北门路灯不亮", _days_ago(1)),
            ("REP-2026-002", "auto_assign", "系统", "根据类型自动派单给王维修（公共设施组）", _days_ago(0.98)),
            ("REP-2026-002", "accept", "王维修", "接单，准备更换LED镇流器", _hours_ago(5)),
            ("REP-2026-002", "arrive", "王维修", "到达北门现场，开始检修", _hours_ago(3)),
            ("REP-2026-002", "repair", "王维修", "更换镇流器和光源，重新接线", _hours_ago(2.5)),
            ("REP-2026-001", "create", "张三", "提交报修：3号楼西梯按钮失灵", _hours_ago(5)),
        ]
        conn.executemany(
            "INSERT INTO repair_logs (repair_id, action, operator, detail, created_at) VALUES (?, ?, ?, ?, ?)",
            repair_logs,
        )

    repair_feedback_count = conn.execute("SELECT COUNT(*) AS count FROM repair_feedback").fetchone()["count"]
    if repair_feedback_count == 0:
        feedbacks = [
            ("REP-2026-003", 5, 5, 5, 5, "维修师傅非常专业，漏水问题彻底解决了，态度也很好，还顺便帮我检查了其他管道。", _days_ago(0.8)),
            ("REP-2026-002", 4, 4, 5, 4, "修得还不错，就是响应时间稍微慢了一点，整体满意。", _hours_ago(1)),
        ]
        conn.executemany(
            "INSERT INTO repair_feedback (repair_id, satisfaction, timeliness, attitude, quality, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            feedbacks,
        )

    fee_payment_count = conn.execute("SELECT COUNT(*) AS count FROM fee_payment_records").fetchone()["count"]
    if fee_payment_count == 0:
        fee_payments = [
            (1, "wechat", "WX20260613100123456789", 258.50, "张三", _days_ago(5)),
            (2, "alipay", "ALI20260615094512345678", 262.00, "李四", _days_ago(3)),
            (4, "bank_transfer", "BANK2026061700001234", 295.00, "赵六", _days_ago(1)),
        ]
        conn.executemany(
            "INSERT INTO fee_payment_records (fee_id, payment_method, transaction_id, amount, payer, paid_at) VALUES (?, ?, ?, ?, ?, ?)",
            fee_payments,
        )

    complaint_log_count = conn.execute("SELECT COUNT(*) AS count FROM complaint_logs").fetchone()["count"]
    if complaint_log_count == 0:
        complaint_logs = [
            ("CP-2026-002", "create", "李四", "提交诉求：单元门口垃圾堆放两天未清理", _days_ago(2)),
            ("CP-2026-002", "assign", "系统", "自动派单给保洁组张主管", _hours_ago(47)),
            ("CP-2026-002", "response", "张主管", "已响应，安排保洁人员前往清理", _hours_ago(46)),
            ("CP-2026-002", "process", "保洁-王姐", "现场清理完毕，已消毒", _hours_ago(44)),
            ("CP-2026-002", "close", "张主管", "问题已解决，工单关闭", _days_ago(1)),
            ("CP-2026-001", "create", "张三", "提交诉求：周末仍有装修施工，噪音扰民", _days_ago(1)),
            ("CP-2026-001", "assign", "系统", "自动派单给保安部刘队", _hours_ago(23)),
            ("CP-2026-001", "response", "刘队", "已响应，派保安前往3号楼查看", _hours_ago(22)),
            ("CP-2026-001", "process", "保安-小王", "已找到装修施工人员，告知周末施工规定并劝止", _hours_ago(20)),
            ("CP-2026-005", "create", "陈七", "提交诉求：小区绿化树木长期未修剪", _days_ago(3)),
            ("CP-2026-005", "assign", "系统", "自动派单给绿化组", _hours_ago(71)),
            ("CP-2026-005", "close", "绿化组", "已完成修剪，工单关闭", _days_ago(2)),
        ]
        conn.executemany(
            "INSERT INTO complaint_logs (complaint_id, action, operator, detail, created_at) VALUES (?, ?, ?, ?, ?)",
            complaint_logs,
        )


def _hours_ago(hours: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()


def _minutes_ago(minutes: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()


def _days_ago(days: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def health_payload() -> dict[str, object]:
    try:
        with open_db() as conn:
            conn.execute("SELECT 1").fetchone()
        db_ok = True
        db_error = None
    except Exception as exc:
        db_ok = False
        db_error = str(exc)

    return {
        "ok": db_ok,
        "service": APP_NAME,
        "host": HOST,
        "port": PORT,
        "time": utc_now(),
        "database": {
            "ok": db_ok,
            "path": str(SQLITE_PATH),
            "error": db_error,
        },
    }


def records() -> list[dict[str, str]]:
    with open_db() as conn:
        rows = conn.execute(
            "SELECT id, title, detail, created_at FROM app_records ORDER BY id"
        ).fetchall()
        return [dict(row) for row in rows]


def get_dashboard_stats() -> dict[str, object]:
    with open_db() as conn:
        device_stats = conn.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
                SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning,
                SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
            FROM access_devices"""
        ).fetchone()

        alarm_stats = conn.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN level = 'critical' THEN 1 ELSE 0 END) as critical
            FROM device_alarms"""
        ).fetchone()

        repair_stats = conn.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
            FROM repair_orders"""
        ).fetchone()

        fee_stats = conn.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
                SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount
            FROM property_fees"""
        ).fetchone()

        post_stats = conn.execute(
            "SELECT COUNT(*) as pending FROM neighborhood_posts WHERE status = 'pending'"
        ).fetchone()

        complaint_stats = conn.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted
            FROM complaint_tickets"""
        ).fetchone()

        recent_access = conn.execute(
            """SELECT ar.*, ad.name as device_name
            FROM access_records ar
            LEFT JOIN access_devices ad ON ar.device_id = ad.id
            ORDER BY ar.created_at DESC
            LIMIT 10"""
        ).fetchall()

        return {
            "ok": True,
            "devices": {
                "total": device_stats["total"],
                "online": device_stats["online"],
                "warning": device_stats["warning"],
                "offline": device_stats["offline"],
            },
            "alarms": {
                "total": alarm_stats["total"],
                "pending": alarm_stats["pending"],
                "critical": alarm_stats["critical"],
            },
            "repairs": {
                "total": repair_stats["total"],
                "pending": repair_stats["pending"],
                "processing": repair_stats["processing"],
            },
            "fees": {
                "total": fee_stats["total"],
                "unpaid": fee_stats["unpaid"],
                "overdue": fee_stats["overdue"],
                "paid_amount": fee_stats["paid_amount"],
            },
            "posts": {
                "pending": post_stats["pending"],
            },
            "complaints": {
                "total": complaint_stats["total"],
                "submitted": complaint_stats["submitted"],
            },
            "recent_access": [dict(row) for row in recent_access],
        }


def get_access_devices(status: str | None = None) -> dict[str, object]:
    with open_db() as conn:
        query = "SELECT * FROM access_devices"
        params = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY id"
        rows = conn.execute(query, params).fetchall()
        return {
            "ok": True,
            "devices": [dict(row) for row in rows],
        }


def get_access_records(limit: int = 50) -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            """SELECT ar.*, ad.name as device_name, ad.location as device_location
            FROM access_records ar
            LEFT JOIN access_devices ad ON ar.device_id = ad.id
            ORDER BY ar.created_at DESC
            LIMIT ?""",
            (limit,),
        ).fetchall()
        return {
            "ok": True,
            "records": [dict(row) for row in rows],
        }


def get_device_alarms() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            """SELECT da.*, ad.name as device_name, ad.location as device_location
            FROM device_alarms da
            LEFT JOIN access_devices ad ON da.device_id = ad.id
            ORDER BY da.created_at DESC"""
        ).fetchall()
        return {
            "ok": True,
            "alarms": [dict(row) for row in rows],
        }


def get_firmware_ota() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            """SELECT fo.*, ad.name as device_name, ad.firmware_version as current_version
            FROM firmware_ota fo
            LEFT JOIN access_devices ad ON fo.device_id = ad.id
            ORDER BY fo.created_at DESC"""
        ).fetchall()
        return {
            "ok": True,
            "ota_records": [dict(row) for row in rows],
        }


def get_repair_orders(status: str | None = None) -> dict[str, object]:
    with open_db() as conn:
        query = "SELECT * FROM repair_orders"
        params = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return {
            "ok": True,
            "orders": [dict(row) for row in rows],
        }


def get_neighborhood_posts(status: str | None = None) -> dict[str, object]:
    with open_db() as conn:
        query = "SELECT * FROM neighborhood_posts"
        params = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return {
            "ok": True,
            "posts": [dict(row) for row in rows],
        }


def get_property_fees() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            "SELECT * FROM property_fees ORDER BY created_at DESC"
        ).fetchall()
        return {
            "ok": True,
            "fees": [dict(row) for row in rows],
        }


def get_invoices() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            """SELECT i.*, pf.owner, pf.room, pf.period
            FROM invoices i
            LEFT JOIN property_fees pf ON i.fee_id = pf.id
            ORDER BY i.created_at DESC"""
        ).fetchall()
        return {
            "ok": True,
            "invoices": [dict(row) for row in rows],
        }


def get_announcements() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            "SELECT * FROM announcements ORDER BY created_at DESC"
        ).fetchall()
        return {
            "ok": True,
            "announcements": [dict(row) for row in rows],
        }


def get_org_structure() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            "SELECT * FROM org_structure ORDER BY id"
        ).fetchall()
        return {
            "ok": True,
            "orgs": [dict(row) for row in rows],
        }


def get_permissions() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            "SELECT * FROM permissions ORDER BY role, module"
        ).fetchall()
        return {
            "ok": True,
            "permissions": [dict(row) for row in rows],
        }


def get_boundary_config() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            "SELECT * FROM boundary_config ORDER BY boundary_type"
        ).fetchall()
        return {
            "ok": True,
            "boundaries": [dict(row) for row in rows],
        }


def get_complaint_tickets() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            "SELECT * FROM complaint_tickets ORDER BY created_at DESC"
        ).fetchall()
        return {
            "ok": True,
            "tickets": [dict(row) for row in rows],
        }


def get_response_stats() -> dict[str, object]:
    with open_db() as conn:
        rows = conn.execute(
            "SELECT * FROM response_stats ORDER BY date DESC LIMIT 30"
        ).fetchall()
        return {
            "ok": True,
            "stats": [dict(row) for row in rows],
        }


def get_visitor_access(status: str | None = None) -> dict[str, object]:
    with open_db() as conn:
        query = "SELECT va.*, ad.name as device_name FROM visitor_access va LEFT JOIN access_devices ad ON va.device_id = ad.id"
        params = []
        if status:
            query += " WHERE va.status = ?"
            params.append(status)
        query += " ORDER BY va.created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return {
            "ok": True,
            "visitors": [dict(row) for row in rows],
        }


def get_device_detail(device_id: str) -> dict[str, object]:
    with open_db() as conn:
        device = conn.execute("SELECT * FROM access_devices WHERE id = ?", (device_id,)).fetchone()
        if not device:
            return {"ok": False, "error": "设备不存在"}
        inspections = conn.execute(
            "SELECT * FROM device_inspections WHERE device_id = ? ORDER BY created_at DESC",
            (device_id,),
        ).fetchall()
        alarms = conn.execute(
            "SELECT da.*, ad.name as device_name FROM device_alarms da LEFT JOIN access_devices ad ON da.device_id = ad.id WHERE da.device_id = ? ORDER BY da.created_at DESC",
            (device_id,),
        ).fetchall()
        alarm_ids = [a["id"] for a in alarms]
        dispatches = []
        if alarm_ids:
            placeholders = ",".join(["?"] * len(alarm_ids))
            dispatches = conn.execute(
                f"SELECT * FROM alarm_dispatches WHERE alarm_id IN ({placeholders}) ORDER BY assigned_at DESC",
                alarm_ids,
            ).fetchall()
        ota_records = conn.execute(
            "SELECT * FROM firmware_ota WHERE device_id = ? ORDER BY created_at DESC",
            (device_id,),
        ).fetchall()
        ota_ids = [o["id"] for o in ota_records]
        ota_progress = []
        if ota_ids:
            placeholders = ",".join(["?"] * len(ota_ids))
            ota_progress = conn.execute(
                f"SELECT * FROM ota_progress WHERE ota_id IN ({placeholders}) ORDER BY created_at ASC",
                ota_ids,
            ).fetchall()
        return {
            "ok": True,
            "device": dict(device),
            "inspections": [dict(row) for row in inspections],
            "alarms": [dict(row) for row in alarms],
            "dispatches": [dict(row) for row in dispatches],
            "ota_records": [dict(row) for row in ota_records],
            "ota_progress": [dict(row) for row in ota_progress],
        }


def get_repair_detail(repair_id: str) -> dict[str, object]:
    with open_db() as conn:
        order = conn.execute("SELECT * FROM repair_orders WHERE id = ?", (repair_id,)).fetchone()
        if not order:
            return {"ok": False, "error": "工单不存在"}
        photos = conn.execute(
            "SELECT * FROM repair_photos WHERE repair_id = ? ORDER BY created_at ASC",
            (repair_id,),
        ).fetchall()
        logs = conn.execute(
            "SELECT * FROM repair_logs WHERE repair_id = ? ORDER BY created_at ASC",
            (repair_id,),
        ).fetchall()
        feedback = conn.execute(
            "SELECT * FROM repair_feedback WHERE repair_id = ? ORDER BY created_at DESC LIMIT 1",
            (repair_id,),
        ).fetchone()
        return {
            "ok": True,
            "order": dict(order),
            "photos": [dict(row) for row in photos],
            "logs": [dict(row) for row in logs],
            "feedback": dict(feedback) if feedback else None,
        }


def get_dashboard_detail() -> dict[str, object]:
    with open_db() as conn:
        recent_alarms = conn.execute(
            """SELECT da.*, ad.name as device_name
            FROM device_alarms da LEFT JOIN access_devices ad ON da.device_id = ad.id
            ORDER BY da.created_at DESC LIMIT 5"""
        ).fetchall()
        recent_repairs = conn.execute(
            "SELECT * FROM repair_orders ORDER BY created_at DESC LIMIT 5"
        ).fetchall()
        recent_fees = conn.execute(
            "SELECT pf.*, i.invoice_code, i.invoice_number FROM property_fees pf LEFT JOIN invoices i ON pf.invoice_no = i.id ORDER BY pf.created_at DESC LIMIT 5"
        ).fetchall()
        recent_complaints = conn.execute(
            "SELECT * FROM complaint_tickets ORDER BY created_at DESC LIMIT 5"
        ).fetchall()
        complaint_logs = conn.execute(
            """SELECT cl.*, ct.title as complaint_title FROM complaint_logs cl
            LEFT JOIN complaint_tickets ct ON cl.complaint_id = ct.id
            ORDER BY cl.created_at DESC LIMIT 10"""
        ).fetchall()
        return {
            "ok": True,
            "recent_alarms": [dict(row) for row in recent_alarms],
            "recent_repairs": [dict(row) for row in recent_repairs],
            "recent_fees": [dict(row) for row in recent_fees],
            "recent_complaints": [dict(row) for row in recent_complaints],
            "complaint_logs": [dict(row) for row in complaint_logs],
        }


def get_fee_detail(fee_id: int) -> dict[str, object]:
    with open_db() as conn:
        fee = conn.execute("SELECT * FROM property_fees WHERE id = ?", (fee_id,)).fetchone()
        if not fee:
            return {"ok": False, "error": "费用记录不存在"}
        payments = conn.execute(
            "SELECT * FROM fee_payment_records WHERE fee_id = ? ORDER BY paid_at DESC",
            (fee_id,),
        ).fetchall()
        invoice = conn.execute(
            "SELECT * FROM invoices WHERE fee_id = ? ORDER BY created_at DESC LIMIT 1",
            (fee_id,),
        ).fetchone()
        return {
            "ok": True,
            "fee": dict(fee),
            "payments": [dict(row) for row in payments],
            "invoice": dict(invoice) if invoice else None,
        }


def get_complaint_detail(complaint_id: str) -> dict[str, object]:
    with open_db() as conn:
        ticket = conn.execute("SELECT * FROM complaint_tickets WHERE id = ?", (complaint_id,)).fetchone()
        if not ticket:
            return {"ok": False, "error": "诉求工单不存在"}
        logs = conn.execute(
            "SELECT * FROM complaint_logs WHERE complaint_id = ? ORDER BY created_at ASC",
            (complaint_id,),
        ).fetchall()
        return {
            "ok": True,
            "ticket": dict(ticket),
            "logs": [dict(row) for row in logs],
        }


class Handler(BaseHTTPRequestHandler):
    server_version = f"{APP_NAME}/1.0"

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_common_headers()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        routes: dict[str, callable] = {
            "/api/health": lambda: health_payload(),
            "/health": lambda: health_payload(),
            "/api/records": lambda: {"ok": True, "service": APP_NAME, "records": records(), "updatedAt": utc_now()},
            "/api/business": lambda: {"ok": True, "service": APP_NAME, "records": records(), "updatedAt": utc_now()},
            "/api/dashboard": lambda: get_dashboard_stats(),
            "/api/dashboard/detail": lambda: get_dashboard_detail(),
            "/api/access/devices": lambda: get_access_devices(query.get("status", [None])[0]),
            "/api/access/records": lambda: get_access_records(int(query.get("limit", [50])[0])),
            "/api/access/alarms": lambda: get_device_alarms(),
            "/api/access/ota": lambda: get_firmware_ota(),
            "/api/access/visitors": lambda: get_visitor_access(query.get("status", [None])[0]),
            "/api/repair": lambda: get_repair_orders(query.get("status", [None])[0]),
            "/api/neighborhood": lambda: get_neighborhood_posts(query.get("status", [None])[0]),
            "/api/property/fees": lambda: get_property_fees(),
            "/api/property/invoices": lambda: get_invoices(),
            "/api/announcements": lambda: get_announcements(),
            "/api/admin/org": lambda: get_org_structure(),
            "/api/admin/permissions": lambda: get_permissions(),
            "/api/admin/boundaries": lambda: get_boundary_config(),
            "/api/admin/complaints": lambda: get_complaint_tickets(),
            "/api/admin/stats": lambda: get_response_stats(),
        }

        handler = routes.get(path)
        if handler:
            try:
                result = handler()
                self.respond_json(result, 200)
            except Exception as exc:
                self.respond_json(
                    {"ok": False, "error": str(exc)},
                    500,
                )
            return

        path_parts = path.strip("/").split("/")
        if len(path_parts) >= 4:
            if path_parts[0] == "api" and path_parts[1] == "access" and path_parts[2] == "devices":
                try:
                    result = get_device_detail(path_parts[3])
                    self.respond_json(result, 200)
                    return
                except Exception as exc:
                    self.respond_json({"ok": False, "error": str(exc)}, 500)
                    return
            if path_parts[0] == "api" and path_parts[1] == "repair" and path_parts[2] == "detail":
                try:
                    result = get_repair_detail(path_parts[3])
                    self.respond_json(result, 200)
                    return
                except Exception as exc:
                    self.respond_json({"ok": False, "error": str(exc)}, 500)
                    return
            if path_parts[0] == "api" and path_parts[1] == "property" and path_parts[2] == "fees":
                try:
                    result = get_fee_detail(int(path_parts[3]))
                    self.respond_json(result, 200)
                    return
                except Exception as exc:
                    self.respond_json({"ok": False, "error": str(exc)}, 500)
                    return
            if path_parts[0] == "api" and path_parts[1] == "admin" and path_parts[2] == "complaints":
                try:
                    result = get_complaint_detail(path_parts[3])
                    self.respond_json(result, 200)
                    return
                except Exception as exc:
                    self.respond_json({"ok": False, "error": str(exc)}, 500)
                    return

        self.respond_json(
            {
                "ok": False,
                "error": "not_found",
                "available": sorted(routes.keys()),
            },
            404,
        )

    def respond_json(self, payload: dict[str, object], status: int) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_common_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[{utc_now()}] {self.address_string()} {fmt % args}", flush=True)


def main() -> None:
    init_database()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"{APP_NAME} backend listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
