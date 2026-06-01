#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    if ENV_PATH.exists():
        for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


ENV = load_env()
HOST = ENV.get("HOST", os.environ.get("HOST", "127.0.0.1"))
PORT = int(ENV.get("BACKEND_PORT", os.environ.get("BACKEND_PORT", "56937")))
DB_PATH = ROOT / ENV.get("SQLITE_DB", os.environ.get("SQLITE_DB", "data/app.sqlite3"))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ready',
                created_at TEXT NOT NULL
            )
            """
        )
        existing = conn.execute("SELECT COUNT(*) AS count FROM entries").fetchone()["count"]
        if existing == 0:
            conn.executemany(
                """
                INSERT INTO entries (title, body, status, created_at)
                VALUES (?, ?, ?, ?)
                """,
                [
                    (
                        "Local service restored",
                        "Frontend, backend, and SQLite are running inside this project.",
                        "ready",
                        now_iso(),
                    ),
                    (
                        "Health endpoint available",
                        "Use /api/health to verify the backend and database connection.",
                        "ready",
                        now_iso(),
                    ),
                    (
                        "Browser data loaded",
                        "The page fetches live data from the local API.",
                        "ready",
                        now_iso(),
                    ),
                ],
            )
        conn.commit()


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(row) for row in rows]


def read_entries(limit: int = 20) -> list[dict[str, Any]]:
    safe_limit = min(max(limit, 1), 100)
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, title, body, status, created_at
            FROM entries
            ORDER BY id DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()
    return rows_to_dicts(rows)


def make_summary() -> dict[str, Any]:
    with connect() as conn:
        total = conn.execute("SELECT COUNT(*) AS count FROM entries").fetchone()["count"]
        ready = conn.execute(
            "SELECT COUNT(*) AS count FROM entries WHERE status = ?",
            ("ready",),
        ).fetchone()["count"]
    return {
        "service": "may-86937",
        "status": "ready",
        "totalEntries": total,
        "readyEntries": ready,
        "database": str(DB_PATH.relative_to(ROOT)),
        "updatedAt": now_iso(),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "May86937Backend/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        print(
            f"{self.address_string()} - - [{self.log_date_time_string()}] {fmt % args}",
            flush=True,
        )

    def send_json(self, payload: dict[str, Any] | list[dict[str, Any]], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path == "/api/health":
            try:
                with connect() as conn:
                    conn.execute("SELECT 1").fetchone()
                self.send_json(
                    {
                        "ok": True,
                        "service": "may-86937",
                        "database": "connected",
                        "timestamp": now_iso(),
                    }
                )
            except sqlite3.Error as exc:
                self.send_json({"ok": False, "error": str(exc)}, status=500)
            return

        if path == "/api/summary":
            self.send_json(make_summary())
            return

        if path == "/api/entries":
            query = parse_qs(parsed.query)
            try:
                limit = int(query.get("limit", ["20"])[0])
            except ValueError:
                limit = 20
            self.send_json({"items": read_entries(limit)})
            return

        self.send_json(
            {
                "ok": True,
                "service": "may-86937",
                "endpoints": ["/api/health", "/api/summary", "/api/entries"],
            }
        )


def main() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Backend listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
