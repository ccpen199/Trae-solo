#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


PROJECT_DIR = Path(os.environ.get("PROJECT_DIR") or Path(__file__).resolve().parents[1]).resolve()
HOST = os.environ.get("HOST", "127.0.0.1")
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "59089"))
FRONTEND_PORT = int(os.environ.get("FRONTEND_PORT", str(BACKEND_PORT - 10000)))
PROJECT_NAME = os.environ.get("PROJECT_NAME") or PROJECT_DIR.name


def database_path() -> Path:
    raw = os.environ.get("DB_PATH") or os.environ.get("DATABASE_PATH") or os.environ.get("DATABASE_URL") or "data/app.sqlite"
    raw = raw.replace("sqlite:///", "").replace("sqlite://", "")
    path = Path(raw)
    if not path.is_absolute():
        path = PROJECT_DIR / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


DB_PATH = database_path()


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                provider TEXT NOT NULL,
                price INTEGER NOT NULL,
                rating REAL NOT NULL,
                status TEXT NOT NULL,
                description TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_id INTEGER,
                customer TEXT NOT NULL,
                phone TEXT NOT NULL,
                amount INTEGER NOT NULL,
                status TEXT NOT NULL,
                note TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL,
                title TEXT NOT NULL,
                contact TEXT NOT NULL,
                detail TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor TEXT NOT NULL,
                action TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        service_count = db.execute("SELECT COUNT(*) AS count FROM services").fetchone()["count"]
        if service_count == 0:
            db.executemany(
                """
                INSERT INTO services (title, category, provider, price, rating, status, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    ("智能投顾组合诊断", "资产规划", "PinAI 顾问中心", 199, 4.8, "可购买", "分析现金流、风险偏好和持仓结构，输出可执行的调仓建议。"),
                    ("小微企业预算管家", "企业服务", "财务自动化实验室", 399, 4.7, "可购买", "为门店和工作室建立收入、成本、库存与税费预算模型。"),
                    ("家庭账本自动整理", "个人中心", "本地数据助手", 99, 4.6, "可购买", "导入日常收支，自动生成分类、趋势和异常提醒。"),
                    ("发票报销审核", "后台管理", "合规审核台", 149, 4.5, "审核中", "面向管理后台的票据查重、报销规则校验和审批留痕。"),
                    ("资金周转测算", "搜索筛选", "现金流引擎", 129, 4.4, "可购买", "按客户、项目和周期筛选测算未来 90 天资金缺口。"),
                ],
            )
        user_count = db.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        if user_count == 0:
            now = time.strftime("%Y-%m-%d %H:%M:%S")
            db.executemany(
                "INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)",
                [
                    ("演示用户", "13800138000", "user", now),
                    ("后台管理员", "13900139000", "admin", now),
                ],
            )
        log_count = db.execute("SELECT COUNT(*) AS count FROM audit_logs").fetchone()["count"]
        if log_count == 0:
            now = time.strftime("%Y-%m-%d %H:%M:%S")
            db.executemany(
                "INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)",
                [
                    ("system", "初始化本地 SQLite 数据", now),
                    ("admin", "启用后台管理看板", now),
                ],
            )


def rows(sql: str, params: tuple = ()) -> list[dict]:
    with connect() as db:
        return [dict(row) for row in db.execute(sql, params).fetchall()]


def row(sql: str, params: tuple = ()) -> dict | None:
    with connect() as db:
        found = db.execute(sql, params).fetchone()
        return dict(found) if found else None


def write(sql: str, params: tuple = ()) -> int:
    with connect() as db:
        cur = db.execute(sql, params)
        db.commit()
        return int(cur.lastrowid)


class Handler(BaseHTTPRequestHandler):
    server_version = "PinAILocal/1.0"

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.cors()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        query = parse_qs(parsed.query)

        if path == "/api/health":
            self.json({"ok": True, "status": "ok", "project": PROJECT_NAME, "db": str(DB_PATH), "time": int(time.time())})
            return
        if path in {"/api/categories", "/api/service-categories"}:
            self.json({"ok": True, "data": [r["category"] for r in rows("SELECT DISTINCT category FROM services ORDER BY category")]})
            return
        if path in {"/api/services", "/api/products", "/api/tasks", "/api/search", "/api/teachers", "/api/courses", "/api/bookings"}:
            search = (query.get("search") or query.get("q") or [""])[0].strip()
            category = (query.get("category") or [""])[0].strip()
            sql = "SELECT * FROM services WHERE 1=1"
            params: list[str] = []
            if search:
                sql += " AND (title LIKE ? OR provider LIKE ? OR description LIKE ? OR category LIKE ?)"
                like = f"%{search}%"
                params.extend([like, like, like, like])
            if category and category != "全部":
                sql += " AND category = ?"
                params.append(category)
            sql += " ORDER BY rating DESC, id ASC"
            self.json({"ok": True, "data": rows(sql, tuple(params))})
            return
        detail_match = re.fullmatch(r"/api/(?:services|products|tasks)/(\d+)", path)
        if detail_match:
            item = row("SELECT * FROM services WHERE id = ?", (detail_match.group(1),))
            self.json({"ok": bool(item), "data": item})
            return
        if path in {"/api/orders", "/api/my/orders"}:
            self.json({"ok": True, "data": rows("SELECT * FROM orders ORDER BY id DESC")})
            return
        if path in {"/api/submissions", "/api/requests"}:
            self.json({"ok": True, "data": rows("SELECT * FROM submissions ORDER BY id DESC")})
            return
        if path in {"/api/profile", "/api/auth/me", "/api/users/profile", "/api/user/profile"}:
            profile = row("SELECT * FROM users ORDER BY id LIMIT 1")
            stats = {
                "orders": row("SELECT COUNT(*) AS count FROM orders")["count"],
                "submissions": row("SELECT COUNT(*) AS count FROM submissions")["count"],
            }
            self.json({"ok": True, "data": {"user": profile, "stats": stats}})
            return
        if path in {"/api/admin/summary", "/api/admin/dashboard", "/api/admin/stats"}:
            summary = {
                "users": row("SELECT COUNT(*) AS count FROM users")["count"],
                "services": row("SELECT COUNT(*) AS count FROM services")["count"],
                "orders": row("SELECT COUNT(*) AS count FROM orders")["count"],
                "submissions": row("SELECT COUNT(*) AS count FROM submissions")["count"],
                "revenue": row("SELECT COALESCE(SUM(amount), 0) AS total FROM orders")["total"],
                "logs": rows("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5"),
            }
            self.json({"ok": True, "data": summary})
            return
        if path == "/api/admin/orders":
            self.json({"ok": True, "data": rows("SELECT * FROM orders ORDER BY id DESC")})
            return
        if path == "/api/cart":
            self.json({
                "ok": True,
                "data": {
                    "items": rows("SELECT * FROM orders ORDER BY id DESC LIMIT 5"),
                    "total": row("SELECT COALESCE(SUM(amount), 0) AS total FROM orders")["total"],
                },
            })
            return

        self.json({"ok": False, "error": f"Unknown endpoint: {path}"}, status=404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        data = self.body()
        now = time.strftime("%Y-%m-%d %H:%M:%S")

        if path in {"/api/auth/login", "/api/login"}:
            phone = str(data.get("phone") or "13800138000")
            user = row("SELECT * FROM users WHERE phone = ?", (phone,))
            if user is None:
                user_id = write("INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)", ("新用户", phone, "user", now))
                user = row("SELECT * FROM users WHERE id = ?", (user_id,))
            self.json({"ok": True, "token": f"local-token-{user['id']}", "user": user})
            return
        if path in {"/api/auth/register", "/api/register"}:
            name = str(data.get("name") or "注册用户").strip()
            phone = str(data.get("phone") or f"13{int(time.time()) % 1000000000:09d}")
            existing = row("SELECT * FROM users WHERE phone = ?", (phone,))
            if existing:
                self.json({"ok": True, "token": f"local-token-{existing['id']}", "user": existing})
                return
            user_id = write("INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)", (name, phone, "user", now))
            self.json({"ok": True, "token": f"local-token-{user_id}", "user": row("SELECT * FROM users WHERE id = ?", (user_id,))})
            return
        if path in {"/api/orders", "/api/purchase", "/api/buy"}:
            service_id = int(data.get("serviceId") or data.get("service_id") or 1)
            service = row("SELECT * FROM services WHERE id = ?", (service_id,)) or row("SELECT * FROM services ORDER BY id LIMIT 1")
            amount = int(data.get("amount") or (service["price"] if service else 0))
            order_id = write(
                "INSERT INTO orders (service_id, customer, phone, amount, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    service_id,
                    str(data.get("customer") or "演示用户"),
                    str(data.get("phone") or "13800138000"),
                    amount,
                    "已提交",
                    str(data.get("note") or "网页提交的购买申请"),
                    now,
                ),
            )
            write("INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)", ("user", f"提交订单 #{order_id}", now))
            self.json({"ok": True, "data": row("SELECT * FROM orders WHERE id = ?", (order_id,))})
            return
        if path in {"/api/submissions", "/api/submit", "/api/requests"}:
            submission_id = write(
                "INSERT INTO submissions (kind, title, contact, detail, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    str(data.get("kind") or "需求提交"),
                    str(data.get("title") or "新的业务需求"),
                    str(data.get("contact") or "13800138000"),
                    str(data.get("detail") or "需要平台安排顾问跟进"),
                    "待处理",
                    now,
                ),
            )
            write("INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)", ("user", f"提交需求 #{submission_id}", now))
            self.json({"ok": True, "data": row("SELECT * FROM submissions WHERE id = ?", (submission_id,))})
            return

        self.json({"ok": False, "error": f"Unknown endpoint: {path}"}, status=404)

    def body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length == 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {k: v[0] if len(v) == 1 else v for k, v in parse_qs(raw).items()}

    def cors(self) -> None:
        origin = self.headers.get("Origin") or f"http://127.0.0.1:{FRONTEND_PORT}"
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")

    def json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {self.address_string()} {fmt % args}", flush=True)


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer((HOST, BACKEND_PORT), Handler)
    print(f"{PROJECT_NAME} backend listening on http://{HOST}:{BACKEND_PORT}", flush=True)
    print(f"SQLite database: {DB_PATH}", flush=True)
    server.serve_forever()
