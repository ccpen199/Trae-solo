#!/usr/bin/env python3
import json
import os
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent


def load_env():
    env_path = ROOT / ".env"
    values = {}
    if env_path.exists():
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values


ENV = load_env()
HOST = ENV.get("HOST", "127.0.0.1")
PORT = int(ENV.get("BACKEND_PORT", "59143"))
DB_PATH = (ROOT / ENV.get("DB_PATH", "./data/app.sqlite")).resolve()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                owner TEXT NOT NULL,
                status TEXT NOT NULL,
                points INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        task_count = conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
        if task_count == 0:
            rows = [
                ("签到奖励链路", "运营", "running", 120, now_iso()),
                ("邀请任务审核", "增长", "ready", 86, now_iso()),
                ("提现风控巡检", "财务", "blocked", 42, now_iso()),
            ]
            conn.executemany(
                "INSERT INTO tasks (title, owner, status, points, created_at) VALUES (?, ?, ?, ?, ?)",
                rows,
            )
        event_count = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        if event_count == 0:
            events = [
                ("服务已恢复，前后端和 SQLite 均在本地启动。", now_iso()),
                ("健康检查接口 /api/health 可用。", now_iso()),
            ]
            conn.executemany("INSERT INTO events (message, created_at) VALUES (?, ?)", events)
        conn.commit()


def rows_to_dicts(rows):
    return [dict(row) for row in rows]


def build_summary():
    with get_db() as conn:
        total_tasks = conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
        total_points = conn.execute("SELECT COALESCE(SUM(points), 0) FROM tasks").fetchone()[0]
        running = conn.execute("SELECT COUNT(*) FROM tasks WHERE status = 'running'").fetchone()[0]
        ready = conn.execute("SELECT COUNT(*) FROM tasks WHERE status = 'ready'").fetchone()[0]
        blocked = conn.execute("SELECT COUNT(*) FROM tasks WHERE status = 'blocked'").fetchone()[0]
        recent_tasks = conn.execute("SELECT * FROM tasks ORDER BY id DESC LIMIT 5").fetchall()
    return {
        "summary": {
            "totalTasks": total_tasks,
            "totalPoints": total_points,
            "running": running,
            "ready": ready,
            "blocked": blocked,
        },
        "recentTasks": rows_to_dicts(recent_tasks),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "may-89143-api/1.0"

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)

    def _send(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in {"/api/health", "/health"}:
            self._send(
                200,
                {
                    "ok": True,
                    "service": "may-89143",
                    "db": str(DB_PATH),
                    "time": now_iso(),
                },
            )
            return
        if parsed.path == "/api/summary":
            payload = build_summary()
            self._send(200, {"ok": True, "summary": payload["summary"]})
            return
        if parsed.path in {"/api/admin/stats", "/api/admin/dashboard"}:
            payload = build_summary()
            self._send(
                200,
                {
                    "ok": True,
                    "service": "may-89143",
                    "stats": payload["summary"],
                    "summary": payload["summary"],
                    "recentTasks": payload["recentTasks"],
                },
            )
            return
        if parsed.path == "/api/tasks":
            params = parse_qs(parsed.query)
            status = params.get("status", [""])[0]
            with get_db() as conn:
                if status:
                    rows = conn.execute(
                        "SELECT * FROM tasks WHERE status = ? ORDER BY id DESC",
                        (status,),
                    ).fetchall()
                else:
                    rows = conn.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
            self._send(200, {"ok": True, "tasks": rows_to_dicts(rows)})
            return
        if parsed.path == "/api/events":
            with get_db() as conn:
                rows = conn.execute("SELECT * FROM events ORDER BY id DESC LIMIT 10").fetchall()
            self._send(200, {"ok": True, "events": rows_to_dicts(rows)})
            return
        self._send(404, {"ok": False, "error": "Not found", "path": parsed.path})

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/tasks":
            self._send(404, {"ok": False, "error": "Not found", "path": parsed.path})
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length).decode("utf-8") if length else "{}"
        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError:
            self._send(400, {"ok": False, "error": "Invalid JSON"})
            return
        title = str(data.get("title", "")).strip()
        owner = str(data.get("owner", "运营")).strip() or "运营"
        status = str(data.get("status", "ready")).strip() or "ready"
        points = int(data.get("points", 10))
        if not title:
            self._send(400, {"ok": False, "error": "title is required"})
            return
        if status not in {"ready", "running", "blocked"}:
            self._send(400, {"ok": False, "error": "unsupported status"})
            return
        with get_db() as conn:
            cur = conn.execute(
                "INSERT INTO tasks (title, owner, status, points, created_at) VALUES (?, ?, ?, ?, ?)",
                (title, owner, status, points, now_iso()),
            )
            conn.execute("INSERT INTO events (message, created_at) VALUES (?, ?)", (f"新增任务：{title}", now_iso()))
            conn.commit()
            row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cur.lastrowid,)).fetchone()
        self._send(201, {"ok": True, "task": dict(row)})


def main():
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"backend listening on http://{HOST}:{PORT}", flush=True)
    print(f"sqlite db: {DB_PATH}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
