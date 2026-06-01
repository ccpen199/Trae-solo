#!/usr/bin/env python3
import json
import os
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs


PROJECT_DIR = Path(__file__).resolve().parent
ENV_PATH = PROJECT_DIR / ".env"


def load_env():
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


ENV = load_env()
HOST = ENV.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("BACKEND_PORT") or ENV.get("BACKEND_PORT", "53476"))
DATABASE_PATH = Path(os.environ.get("DATABASE_PATH") or ENV.get("DATABASE_PATH", "./data/app.sqlite"))
if not DATABASE_PATH.is_absolute():
    DATABASE_PATH = PROJECT_DIR / DATABASE_PATH


def db_connect():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with db_connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                display_name TEXT,
                role TEXT DEFAULT 'participant',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS boards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                theme TEXT,
                template TEXT DEFAULT 'blank',
                status TEXT DEFAULT 'setup',
                meeting_time TEXT,
                output_goal TEXT,
                created_by TEXT,
                permissions TEXT DEFAULT '{}',
                is_anonymous INTEGER DEFAULT 0,
                time_limit INTEGER,
                host_lock INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS board_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                user_id INTEGER,
                display_name TEXT,
                role TEXT DEFAULT 'participant',
                joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                group_id INTEGER,
                content TEXT,
                note_type TEXT DEFAULT 'idea',
                color TEXT DEFAULT '#fff9c4',
                x REAL DEFAULT 0,
                y REAL DEFAULT 0,
                width REAL DEFAULT 180,
                height REAL DEFAULT 100,
                created_by TEXT,
                is_anonymous INTEGER DEFAULT 0,
                tags TEXT DEFAULT '[]',
                votes_count INTEGER DEFAULT 0,
                merged_from TEXT DEFAULT '[]',
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS note_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                title TEXT,
                color TEXT DEFAULT '#e3f2fd',
                x REAL DEFAULT 0,
                y REAL DEFAULT 0,
                width REAL DEFAULT 300,
                height REAL DEFAULT 400,
                created_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                from_note_id INTEGER NOT NULL,
                to_note_id INTEGER NOT NULL,
                label TEXT,
                color TEXT DEFAULT '#666',
                created_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id INTEGER NOT NULL,
                user_id TEXT,
                vote_type TEXT DEFAULT 'up',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS action_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                note_id INTEGER,
                title TEXT NOT NULL,
                description TEXT,
                item_type TEXT DEFAULT 'action',
                assignee TEXT,
                due_date TEXT,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'medium',
                created_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS operation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                operation TEXT NOT NULL,
                data TEXT,
                created_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#2196f3',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.commit()

        try:
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            if user_count == 0:
                conn.execute(
                    """
                    INSERT INTO users (username, display_name, role) VALUES (?, ?, ?)
                    """,
                    ("host", "会议主持人", "host")
                )
                conn.execute(
                    """
                    INSERT INTO users (username, display_name, role) VALUES (?, ?, ?)
                    """,
                    ("participant1", "参与者A", "participant")
                )
                conn.commit()
        except Exception:
            pass


def row_to_dict(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [dict(row) for row in rows]


def record_operation(conn, board_id, operation, data, created_by):
    conn.execute(
        """
        INSERT INTO operation_history (board_id, operation, data, created_by)
        VALUES (?, ?, ?, ?)
        """,
        (board_id, operation, json.dumps(data, ensure_ascii=False), created_by)
    )


class Handler(BaseHTTPRequestHandler):
    server_version = "may-63476-backend/1.0"

    def log_message(self, fmt, *args):
        timestamp = datetime.now(timezone.utc).isoformat()
        try:
            print(f"{timestamp} {self.address_string()} {fmt % args}", flush=True)
        except Exception:
            pass

    def _send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
            return True
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            return False

    def _read_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        body = self.rfile.read(length)
        return json.loads(body.decode("utf-8"))

    def do_OPTIONS(self):
        self._send_json(204, {})

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/health":
            try:
                with db_connect() as conn:
                    board_count = conn.execute("SELECT COUNT(*) FROM boards").fetchone()[0]
                    note_count = conn.execute("SELECT COUNT(*) FROM notes").fetchone()[0]
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": str(exc)})
                return
            self._send_json(
                200,
                {
                    "ok": True,
                    "service": "may-63476-backend",
                    "database": str(DATABASE_PATH),
                    "boards": board_count,
                    "notes": note_count,
                    "time": datetime.now(timezone.utc).isoformat(),
                },
            )
            return

        if path == "/api/users":
            with db_connect() as conn:
                rows = conn.execute("SELECT * FROM users ORDER BY id").fetchall()
            self._send_json(200, {"ok": True, "data": rows_to_list(rows)})
            return

        if path == "/api/boards":
            with db_connect() as conn:
                rows = conn.execute(
                    "SELECT * FROM boards ORDER BY updated_at DESC"
                ).fetchall()
            self._send_json(200, {"ok": True, "data": rows_to_list(rows)})
            return

        if path.startswith("/api/boards/stats"):
            with db_connect() as conn:
                total_boards = conn.execute("SELECT COUNT(*) FROM boards").fetchone()[0]
                total_notes = conn.execute("SELECT COUNT(*) FROM notes").fetchone()[0]
                total_actions = conn.execute("SELECT COUNT(*) FROM action_items").fetchone()[0]
                total_participants = conn.execute("SELECT COUNT(*) FROM board_participants").fetchone()[0]
            self._send_json(200, {
                "ok": True,
                "data": {
                    "total_boards": total_boards,
                    "total_notes": total_notes,
                    "total_actions": total_actions,
                    "total_participants": total_participants
                }
            })
            return

        if path.startswith("/api/boards/"):
            parts = path.split("/")
            board_id = parts[3]
            if len(parts) >= 5 and parts[4] == "notes":
                with db_connect() as conn:
                    rows = conn.execute(
                        "SELECT * FROM notes WHERE board_id = ? ORDER BY created_at DESC",
                        (board_id,)
                    ).fetchall()
                self._send_json(200, {"ok": True, "data": rows_to_list(rows)})
                return
            elif len(parts) >= 5 and parts[4] == "groups":
                with db_connect() as conn:
                    rows = conn.execute(
                        "SELECT * FROM note_groups WHERE board_id = ? ORDER BY created_at DESC",
                        (board_id,)
                    ).fetchall()
                self._send_json(200, {"ok": True, "data": rows_to_list(rows)})
                return
            elif len(parts) >= 5 and parts[4] == "connections":
                with db_connect() as conn:
                    rows = conn.execute(
                        "SELECT * FROM connections WHERE board_id = ?",
                        (board_id,)
                    ).fetchall()
                self._send_json(200, {"ok": True, "data": rows_to_list(rows)})
                return
            elif len(parts) >= 5 and parts[4] == "actions":
                with db_connect() as conn:
                    rows = conn.execute(
                        "SELECT * FROM action_items WHERE board_id = ? ORDER BY created_at DESC",
                        (board_id,)
                    ).fetchall()
                self._send_json(200, {"ok": True, "data": rows_to_list(rows)})
                return
            elif len(parts) >= 5 and parts[4] == "participants":
                with db_connect() as conn:
                    rows = conn.execute(
                        "SELECT * FROM board_participants WHERE board_id = ?",
                        (board_id,)
                    ).fetchall()
                self._send_json(200, {"ok": True, "data": rows_to_list(rows)})
                return
            elif len(parts) >= 5 and parts[4] == "history":
                with db_connect() as conn:
                    rows = conn.execute(
                        "SELECT * FROM operation_history WHERE board_id = ? ORDER BY created_at DESC LIMIT 100",
                        (board_id,)
                    ).fetchall()
                self._send_json(200, {"ok": True, "data": rows_to_list(rows)})
                return
            elif len(parts) >= 5 and parts[4] == "stats":
                with db_connect() as conn:
                    participant_count = conn.execute(
                        "SELECT COUNT(*) FROM board_participants WHERE board_id = ?", (board_id,)
                    ).fetchone()[0]
                    total_notes = conn.execute(
                        "SELECT COUNT(*) FROM notes WHERE board_id = ?", (board_id,)
                    ).fetchone()[0]
                    total_votes = conn.execute(
                        "SELECT SUM(votes_count) FROM notes WHERE board_id = ?", (board_id,)
                    ).fetchone()[0] or 0
                    action_count = conn.execute(
                        "SELECT COUNT(*) FROM action_items WHERE board_id = ?", (board_id,)
                    ).fetchone()[0]
                    completed_actions = conn.execute(
                        "SELECT COUNT(*) FROM action_items WHERE board_id = ? AND status = 'completed'", (board_id,)
                    ).fetchone()[0]
                self._send_json(200, {
                    "ok": True,
                    "data": {
                        "participant_count": participant_count,
                        "total_notes": total_notes,
                        "total_votes": total_votes,
                        "action_count": action_count,
                        "completed_actions": completed_actions
                    }
                })
                return
            elif len(parts) >= 5 and parts[4] == "review":
                with db_connect() as conn:
                    notes = conn.execute(
                        "SELECT * FROM notes WHERE board_id = ? ORDER BY votes_count DESC",
                        (board_id,)
                    ).fetchall()
                    actions = conn.execute(
                        "SELECT * FROM action_items WHERE board_id = ?",
                        (board_id,)
                    ).fetchall()
                    participants = conn.execute(
                        "SELECT * FROM board_participants WHERE board_id = ?",
                        (board_id,)
                    ).fetchall()
                    note_count = {}
                    for n in notes:
                        creator = n["created_by"]
                        if creator:
                            note_count[creator] = note_count.get(creator, 0) + 1
                self._send_json(200, {
                    "ok": True,
                    "data": {
                        "notes": rows_to_list(notes),
                        "actions": rows_to_list(actions),
                        "participants": rows_to_list(participants),
                        "participation": note_count,
                        "top_notes": rows_to_list(notes[:5])
                    }
                })
                return
            else:
                with db_connect() as conn:
                    row = conn.execute(
                        "SELECT * FROM boards WHERE id = ?",
                        (board_id,)
                    ).fetchone()
                self._send_json(200, {"ok": True, "data": row_to_dict(row)})
                return

        self._send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = self._read_body()

        if path == "/api/boards":
            with db_connect() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO boards (title, theme, template, meeting_time, output_goal, created_by, is_anonymous, time_limit)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        data.get("title", "新白板"),
                        data.get("theme", ""),
                        data.get("template", "blank"),
                        data.get("meeting_time", ""),
                        data.get("output_goal", ""),
                        data.get("created_by", "anonymous"),
                        data.get("is_anonymous", 0),
                        data.get("time_limit"),
                    ),
                )
                board_id = cursor.lastrowid
                conn.execute(
                    """
                    INSERT INTO board_participants (board_id, display_name, role)
                    VALUES (?, ?, ?)
                    """,
                    (board_id, data.get("created_by", "主持人"), "host")
                )
                record_operation(conn, board_id, "create_board", {"board_id": board_id}, data.get("created_by", "anonymous"))
                conn.commit()
                row = conn.execute("SELECT * FROM boards WHERE id = ?", (board_id,)).fetchone()
            self._send_json(201, {"ok": True, "data": row_to_dict(row)})
            return

        if path.startswith("/api/boards/"):
            parts = path.split("/")
            board_id = parts[3]
            if len(parts) >= 5 and parts[4] == "notes":
                with db_connect() as conn:
                    cursor = conn.execute(
                        """
                        INSERT INTO notes (board_id, content, note_type, color, x, y, created_by, is_anonymous)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            board_id,
                            data.get("content", ""),
                            data.get("note_type", "idea"),
                            data.get("color", "#fff9c4"),
                            data.get("x", 100),
                            data.get("y", 100),
                            data.get("created_by", "anonymous"),
                            data.get("is_anonymous", 0),
                        ),
                    )
                    note_id = cursor.lastrowid
                    record_operation(conn, board_id, "create_note", {"note_id": note_id}, data.get("created_by", "anonymous"))
                    conn.commit()
                    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
                self._send_json(201, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 5 and parts[4] == "groups":
                with db_connect() as conn:
                    cursor = conn.execute(
                        """
                        INSERT INTO note_groups (board_id, title, color, x, y, width, height, created_by)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            board_id,
                            data.get("title", "分组"),
                            data.get("color", "#e3f2fd"),
                            data.get("x", 200),
                            data.get("y", 200),
                            data.get("width", 300),
                            data.get("height", 400),
                            data.get("created_by", "anonymous"),
                        ),
                    )
                    group_id = cursor.lastrowid
                    record_operation(conn, board_id, "create_group", {"group_id": group_id}, data.get("created_by", "anonymous"))
                    conn.commit()
                    row = conn.execute("SELECT * FROM note_groups WHERE id = ?", (group_id,)).fetchone()
                self._send_json(201, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 5 and parts[4] == "connections":
                with db_connect() as conn:
                    cursor = conn.execute(
                        """
                        INSERT INTO connections (board_id, from_note_id, to_note_id, label, color, created_by)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            board_id,
                            data.get("from_note_id"),
                            data.get("to_note_id"),
                            data.get("label", ""),
                            data.get("color", "#666"),
                            data.get("created_by", "anonymous"),
                        ),
                    )
                    conn_id = cursor.lastrowid
                    record_operation(conn, board_id, "create_connection", {"connection_id": conn_id}, data.get("created_by", "anonymous"))
                    conn.commit()
                    row = conn.execute("SELECT * FROM connections WHERE id = ?", (conn_id,)).fetchone()
                self._send_json(201, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 5 and parts[4] == "actions":
                with db_connect() as conn:
                    cursor = conn.execute(
                        """
                        INSERT INTO action_items (board_id, note_id, title, description, item_type, assignee, due_date, status, priority, created_by)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            board_id,
                            data.get("note_id"),
                            data.get("title", ""),
                            data.get("description", ""),
                            data.get("item_type", "action"),
                            data.get("assignee", ""),
                            data.get("due_date", ""),
                            data.get("status", "pending"),
                            data.get("priority", "medium"),
                            data.get("created_by", "anonymous"),
                        ),
                    )
                    action_id = cursor.lastrowid
                    record_operation(conn, board_id, "create_action", {"action_id": action_id}, data.get("created_by", "anonymous"))
                    conn.commit()
                    row = conn.execute("SELECT * FROM action_items WHERE id = ?", (action_id,)).fetchone()
                self._send_json(201, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 5 and parts[4] == "participants":
                with db_connect() as conn:
                    cursor = conn.execute(
                        """
                        INSERT INTO board_participants (board_id, display_name, role)
                        VALUES (?, ?, ?)
                        """,
                        (
                            board_id,
                            data.get("display_name", "参与者"),
                            data.get("role", "participant"),
                        ),
                    )
                    participant_id = cursor.lastrowid
                    record_operation(conn, board_id, "add_participant", {"participant_id": participant_id}, data.get("display_name", "参与者"))
                    conn.commit()
                    row = conn.execute("SELECT * FROM board_participants WHERE id = ?", (participant_id,)).fetchone()
                self._send_json(201, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 7 and parts[5] == "notes" and parts[7] == "vote":
                note_id = parts[6]
                with db_connect() as conn:
                    conn.execute(
                        "UPDATE notes SET votes_count = votes_count + 1 WHERE id = ?", (note_id,))
                    conn.execute(
                        "INSERT INTO votes (note_id, user_id, vote_type) VALUES (?, ?, ?)",
                        (note_id, data.get("user_id", "anonymous"), "up"))
                    record_operation(conn, board_id, "vote_note", {"note_id": note_id}, data.get("user_id", "anonymous"))
                    conn.commit()
                    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
                self._send_json(200, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 7 and parts[5] == "notes" and parts[7] == "comments":
                note_id = parts[6]
                with db_connect() as conn:
                    cursor = conn.execute(
                        """
                        INSERT INTO comments (note_id, content, created_by)
                        VALUES (?, ?, ?)
                        """,
                        (
                            note_id,
                            data.get("content", ""),
                            data.get("created_by", "anonymous"),
                        ),
                    )
                    comment_id = cursor.lastrowid
                    conn.commit()
                    row = conn.execute("SELECT * FROM comments WHERE id = ?", (comment_id,)).fetchone()
                self._send_json(201, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 5 and parts[4] == "merge":
                with db_connect() as conn:
                    note_ids = data.get("note_ids", [])
                    if len(note_ids) >= 2:
                        primary_id = note_ids[0]
                        for nid in note_ids[1:]:
                            conn.execute(
                                "UPDATE notes SET status = 'merged', merged_from = ? WHERE id = ?",
                                (json.dumps(note_ids), nid)
                            )
                        conn.execute(
                            "UPDATE notes SET merged_from = ? WHERE id = ?",
                            (json.dumps(note_ids), primary_id)
                        )
                        record_operation(conn, board_id, "merge_notes", {"note_ids": note_ids}, data.get("created_by", "anonymous"))
                        conn.commit()
                self._send_json(200, {"ok": True})
                return

        self._send_json(404, {"ok": False, "error": "Not found"})

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = self._read_body()

        if path.startswith("/api/boards/"):
            parts = path.split("/")
            board_id = parts[3]
            if len(parts) == 4:
                with db_connect() as conn:
                    conn.execute(
                        """
                        UPDATE boards SET title = ?, theme = ?, template = ?, status = ?, meeting_time = ?, output_goal = ?, host_lock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
                        """,
                        (
                            data.get("title"),
                            data.get("theme"),
                            data.get("template"),
                            data.get("status"),
                            data.get("meeting_time"),
                            data.get("output_goal"),
                            data.get("host_lock", 0),
                            board_id,
                        ),
                    )
                    record_operation(conn, board_id, "update_board", data, data.get("updated_by", "anonymous"))
                    conn.commit()
                    row = conn.execute("SELECT * FROM boards WHERE id = ?", (board_id,)).fetchone()
                self._send_json(200, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 6 and parts[4] == "notes":
                note_id = parts[5]
                with db_connect() as conn:
                    conn.execute(
                        """
                        UPDATE notes SET content = ?, note_type = ?, color = ?, x = ?, y = ?, group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
                        """,
                        (
                            data.get("content"),
                            data.get("note_type"),
                            data.get("color"),
                            data.get("x"),
                            data.get("y"),
                            data.get("group_id"),
                            note_id,
                        ),
                    )
                    record_operation(conn, board_id, "update_note", {"note_id": note_id, "data": data}, data.get("updated_by", "anonymous"))
                    conn.commit()
                    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
                self._send_json(200, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 6 and parts[4] == "groups":
                group_id = parts[5]
                with db_connect() as conn:
                    conn.execute(
                        """
                        UPDATE note_groups SET title = ?, color = ?, x = ?, y = ?, width = ?, height = ? WHERE id = ?
                        """,
                        (
                            data.get("title"),
                            data.get("color"),
                            data.get("x"),
                            data.get("y"),
                            data.get("width"),
                            data.get("height"),
                            group_id,
                        ),
                    )
                    conn.commit()
                    row = conn.execute("SELECT * FROM note_groups WHERE id = ?", (group_id,)).fetchone()
                self._send_json(200, {"ok": True, "data": row_to_dict(row)})
                return
            elif len(parts) >= 6 and parts[4] == "actions":
                action_id = parts[5]
                with db_connect() as conn:
                    conn.execute(
                        """
                        UPDATE action_items SET title = ?, description = ?, item_type = ?, assignee = ?, due_date = ?, status = ?, priority = ? WHERE id = ?
                        """,
                        (
                            data.get("title"),
                            data.get("description"),
                            data.get("item_type"),
                            data.get("assignee"),
                            data.get("due_date"),
                            data.get("status"),
                            data.get("priority"),
                            action_id,
                        ),
                    )
                    conn.commit()
                    row = conn.execute("SELECT * FROM action_items WHERE id = ?", (action_id,)).fetchone()
                self._send_json(200, {"ok": True, "data": row_to_dict(row)})
                return

        self._send_json(404, {"ok": False, "error": "Not found"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/boards/"):
            parts = path.split("/")
            board_id = parts[3]
            if len(parts) == 4:
                with db_connect() as conn:
                    conn.execute("DELETE FROM boards WHERE id = ?", (board_id,))
                    conn.commit()
                self._send_json(200, {"ok": True})
                return
            elif len(parts) >= 6 and parts[4] == "notes":
                note_id = parts[5]
                with db_connect() as conn:
                    conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
                    record_operation(conn, board_id, "delete_note", {"note_id": note_id}, "anonymous")
                    conn.commit()
                self._send_json(200, {"ok": True})
                return
            elif len(parts) >= 6 and parts[4] == "groups":
                group_id = parts[5]
                with db_connect() as conn:
                    conn.execute("DELETE FROM note_groups WHERE id = ?", (group_id,))
                    conn.commit()
                self._send_json(200, {"ok": True})
                return
            elif len(parts) >= 6 and parts[4] == "connections":
                conn_id = parts[5]
                with db_connect() as conn:
                    conn.execute("DELETE FROM connections WHERE id = ?", (conn_id,))
                    conn.commit()
                self._send_json(200, {"ok": True})
                return

        self._send_json(404, {"ok": False, "error": "Not found"})


class LocalServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    init_db()
    httpd = LocalServer((HOST, PORT), Handler)
    print(f"backend listening on http://{HOST}:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
