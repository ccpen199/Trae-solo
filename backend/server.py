#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
DATA_DIR = ROOT / "backend" / "src" / "db"
DB_PATH = DATA_DIR / "app.sqlite"


def load_env() -> None:
    if not ENV_PATH.exists():
        return
    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS profile (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              role TEXT NOT NULL,
              city TEXT NOT NULL,
              phone TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS projects (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              client TEXT NOT NULL,
              status TEXT NOT NULL,
              progress INTEGER NOT NULL,
              budget INTEGER NOT NULL,
              due_date TEXT NOT NULL,
              manager TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tickets (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              priority TEXT NOT NULL,
              status TEXT NOT NULL,
              owner TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS appointments (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              service TEXT NOT NULL,
              scheduled_at TEXT NOT NULL,
              status TEXT NOT NULL,
              address TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activities (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              project_id TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )

        project_count = conn.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
        if project_count:
            return

        conn.execute(
            "INSERT OR REPLACE INTO profile VALUES (?, ?, ?, ?, ?, ?)",
            (
                "ops-89190",
                "林青",
                "本地运营负责人",
                "上海",
                "138****9190",
                now_iso(),
            ),
        )
        conn.executemany(
            "INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    "proj-001",
                    "滨江壹号全屋改造",
                    "周女士",
                    "施工中",
                    68,
                    286000,
                    "2026-07-18",
                    "许明",
                ),
                (
                    "proj-002",
                    "云栖里儿童房升级",
                    "陈先生",
                    "方案确认",
                    36,
                    98000,
                    "2026-06-28",
                    "姚可",
                ),
                (
                    "proj-003",
                    "天河花园厨房翻新",
                    "刘女士",
                    "待验收",
                    91,
                    76000,
                    "2026-06-20",
                    "邵宁",
                ),
            ],
        )
        conn.executemany(
            "INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?)",
            [
                ("t-001", "水电验收照片缺少回路标注", "高", "处理中", "许明", "2026-06-13 09:40"),
                ("t-002", "主材到货批次需要二次确认", "中", "待跟进", "姚可", "2026-06-13 10:15"),
                ("t-003", "业主申请调整橱柜台面颜色", "低", "已排期", "邵宁", "2026-06-12 17:50"),
            ],
        )
        conn.executemany(
            "INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?)",
            [
                ("a-001", "proj-001", "第三方监理巡检", "2026-06-14 10:30", "已确认", "徐汇区滨江壹号 8 幢"),
                ("a-002", "proj-002", "设计方案复核", "2026-06-15 14:00", "待确认", "浦东新区云栖里 3 幢"),
                ("a-003", "proj-003", "竣工验收", "2026-06-18 09:30", "已确认", "天河花园 12 幢"),
            ],
        )
        conn.executemany(
            "INSERT INTO activities (project_id, message, created_at) VALUES (?, ?, ?)",
            [
                ("proj-001", "监理已上传水电巡检记录，等待项目经理复核。", "2026-06-13 11:20"),
                ("proj-002", "设计师提交两版儿童房收纳方案。", "2026-06-13 10:05"),
                ("proj-003", "橱柜安装完成，进入竣工验收准备。", "2026-06-12 18:30"),
            ],
        )


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict]:
    return [dict(row) for row in rows]


class Handler(BaseHTTPRequestHandler):
    server_version = "May89190Backend/1.0"

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"{self.address_string()} - {fmt % args}", flush=True)

    def _headers(self, status: int = 200, content_type: str = "application/json; charset=utf-8") -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def _json(self, payload: dict, status: int = 200) -> None:
        self._headers(status)
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or "0")
        if not length:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    def do_OPTIONS(self) -> None:
        self._headers(HTTPStatus.NO_CONTENT)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        query = parse_qs(parsed.query)

        try:
            if path == "/api/health":
                self._json(
                    {
                        "success": True,
                        "message": "ok",
                        "service": "may-89190-backend",
                        "database": str(DB_PATH),
                        "timestamp": now_iso(),
                    }
                )
                return

            if path == "/api/profile":
                with connect() as conn:
                    row = conn.execute("SELECT * FROM profile LIMIT 1").fetchone()
                self._json({"success": True, "data": dict(row) if row else None})
                return

            if path == "/api/dashboard":
                with connect() as conn:
                    projects = conn.execute("SELECT * FROM projects ORDER BY due_date").fetchall()
                    tickets = conn.execute("SELECT * FROM tickets ORDER BY created_at DESC").fetchall()
                    appointments = conn.execute("SELECT * FROM appointments ORDER BY scheduled_at").fetchall()
                    activities = conn.execute(
                        "SELECT * FROM activities ORDER BY created_at DESC, id DESC LIMIT 8"
                    ).fetchall()
                project_rows = rows_to_dicts(projects)
                ticket_rows = rows_to_dicts(tickets)
                self._json(
                    {
                        "success": True,
                        "data": {
                            "metrics": {
                                "activeProjects": len(project_rows),
                                "averageProgress": round(
                                    sum(item["progress"] for item in project_rows) / max(len(project_rows), 1)
                                ),
                                "openTickets": len([item for item in ticket_rows if item["status"] != "已关闭"]),
                                "confirmedAppointments": len(
                                    [item for item in appointments if item["status"] == "已确认"]
                                ),
                            },
                            "projects": project_rows,
                            "tickets": ticket_rows,
                            "appointments": rows_to_dicts(appointments),
                            "activities": rows_to_dicts(activities),
                        },
                    }
                )
                return

            if path == "/api/projects":
                keyword = (query.get("q", [""])[0] or "").strip()
                with connect() as conn:
                    if keyword:
                        like = f"%{keyword}%"
                        rows = conn.execute(
                            """
                            SELECT * FROM projects
                            WHERE name LIKE ? OR client LIKE ? OR status LIKE ? OR manager LIKE ?
                            ORDER BY due_date
                            """,
                            (like, like, like, like),
                        ).fetchall()
                    else:
                        rows = conn.execute("SELECT * FROM projects ORDER BY due_date").fetchall()
                self._json({"success": True, "data": rows_to_dicts(rows), "total": len(rows)})
                return

            if path == "/api/tickets":
                with connect() as conn:
                    rows = conn.execute("SELECT * FROM tickets ORDER BY created_at DESC").fetchall()
                self._json({"success": True, "data": rows_to_dicts(rows), "total": len(rows)})
                return

            if path == "/api/appointments":
                with connect() as conn:
                    rows = conn.execute("SELECT * FROM appointments ORDER BY scheduled_at").fetchall()
                self._json({"success": True, "data": rows_to_dicts(rows), "total": len(rows)})
                return

            self._json({"success": False, "error": "API not found", "path": path}, HTTPStatus.NOT_FOUND)
        except Exception as exc:
            self._json({"success": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        try:
            if path == "/api/tickets":
                data = self._read_json()
                title = str(data.get("title") or "").strip()
                if not title:
                    self._json({"success": False, "error": "title is required"}, HTTPStatus.BAD_REQUEST)
                    return
                ticket_id = f"t-{int(datetime.now().timestamp())}"
                with connect() as conn:
                    conn.execute(
                        "INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?)",
                        (
                            ticket_id,
                            title,
                            str(data.get("priority") or "中"),
                            "待跟进",
                            str(data.get("owner") or "运营组"),
                            datetime.now().strftime("%Y-%m-%d %H:%M"),
                        ),
                    )
                self._json({"success": True, "data": {"id": ticket_id}})
                return

            self._json({"success": False, "error": "API not found", "path": path}, HTTPStatus.NOT_FOUND)
        except Exception as exc:
            self._json({"success": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)


def main() -> None:
    load_env()
    init_db()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("BACKEND_PORT", "59190"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"may-89190 backend listening on http://{host}:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
