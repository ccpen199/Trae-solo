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
            "/api/access/devices": lambda: get_access_devices(query.get("status", [None])[0]),
            "/api/access/records": lambda: get_access_records(int(query.get("limit", [50])[0])),
            "/api/access/alarms": lambda: get_device_alarms(),
            "/api/access/ota": lambda: get_firmware_ota(),
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
