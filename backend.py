#!/usr/bin/env python3
import json
import os
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent


def load_env():
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ[key.strip()] = value.strip()


load_env()

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("BACKEND_PORT", "58935"))
DB_PATH = ROOT / os.environ.get("DATABASE_PATH", "app.db")


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS service_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            INSERT INTO service_state (id, title, message, updated_at)
            VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING
            """,
            (
                "may-88935 local service",
                "Frontend, backend, and SQLite are running on localhost.",
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def state_payload():
    with db() as conn:
        row = conn.execute(
            "SELECT title, message, updated_at FROM service_state WHERE id = 1"
        ).fetchone()
    return dict(row)


class Handler(BaseHTTPRequestHandler):
    server_version = "may-88935-backend/1.0"

    def log_message(self, fmt, *args):
        print(
            "%s - - [%s] %s"
            % (self.client_address[0], self.log_date_time_string(), fmt % args),
            flush=True,
        )

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:%s" % os.environ.get("FRONTEND_PORT", "48935"))
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(204, {})

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            self.send_json(
                200,
                {
                    "ok": True,
                    "service": "may-88935-backend",
                    "database": DB_PATH.name,
                    "time": datetime.now(timezone.utc).isoformat(),
                },
            )
            return
        if path == "/api/state":
            self.send_json(200, {"ok": True, "data": state_payload()})
            return
        self.send_json(404, {"ok": False, "error": "not_found"})


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"backend listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()
