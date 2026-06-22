#!/usr/bin/env python3
import json
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / ".env"


def load_env() -> dict[str, str]:
    data: dict[str, str] = {}
    if not ENV_PATH.exists():
        return data
    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


ENV = load_env()
HOST = ENV.get("HOST", "127.0.0.1")
PORT = int(ENV.get("BACKEND_PORT", "59333"))
FRONTEND_URL = ENV.get("FRONTEND_URL", "http://127.0.0.1:49333")
PROJECT_TITLE = ENV.get("PROJECT_TITLE", "PinAI 线索运营台")
ORDER_ID = ENV.get("ORDER_ID", PROJECT_ROOT.name)
DB_PATH = PROJECT_ROOT / ENV.get("SQLITE_PATH", "backend/app/data/app.sqlite")

ALLOWED_LEAD_FIELDS = {
    "name",
    "company",
    "channel",
    "owner",
    "status",
    "priority",
    "budget",
    "next_action",
}


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                company TEXT NOT NULL DEFAULT '',
                channel TEXT NOT NULL DEFAULT '',
                owner TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'new',
                priority TEXT NOT NULL DEFAULT 'medium',
                budget REAL NOT NULL DEFAULT 0,
                next_action TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER NOT NULL,
                note TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
            );
            """
        )

        lead_count = connection.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        if lead_count:
            return

        now = iso_now()
        seed_leads = [
            (
                "辰星连锁",
                "华东区域 12 店巡检升级",
                "转介绍",
                "林岚",
                "proposal",
                "high",
                188000,
                "准备下周的付款节奏和实施表",
                now,
                now,
            ),
            (
                "澄澈科技",
                "新客线索池整理",
                "官网留资",
                "周临",
                "contacted",
                "medium",
                68000,
                "本周四确认采购角色和试点名单",
                now,
                now,
            ),
            (
                "白桦商贸",
                "季度经营复盘驾驶舱",
                "活动会场",
                "叶青",
                "new",
                "medium",
                42000,
                "48 小时内完成首通并补齐业务数据",
                now,
                now,
            ),
        ]
        connection.executemany(
            """
            INSERT INTO leads
            (name, company, channel, owner, status, priority, budget, next_action, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            seed_leads,
        )
        seed_activities = [
            (1, "已完成需求范围确认，等待财务流程。", now),
            (1, "客户要求把门店维度拆到区域经理。", now),
            (2, "首次电话触达完成，客户需要演示视频。", now),
            (3, "线下活动回收名片，待补录联系人。", now),
        ]
        connection.executemany(
            "INSERT INTO activities (lead_id, note, created_at) VALUES (?, ?, ?)",
            seed_activities,
        )


def row_to_dict(row: sqlite3.Row) -> dict:
    return {key: row[key] for key in row.keys()}


def json_bytes(payload: dict | list) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


class ApiHandler(BaseHTTPRequestHandler):
    server_version = "PinAILeadOps/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(
            f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
            f"{self.client_address[0]} {fmt % args}"
        )

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", FRONTEND_URL)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _send_json(self, status: int, payload: dict | list) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path in {"/api/health", "/health"}:
            return self._handle_health()
        if path in {"/api/dashboard", "/api/admin/dashboard"}:
            return self._handle_dashboard()
        if path == "/api/admin/stats":
            return self._handle_admin_stats()
        if path == "/api/leads":
            return self._handle_leads()
        if path == "/api/products":
            return self._handle_products()
        if path == "/api/orders":
            return self._handle_orders()
        if path == "/api/cart":
            return self._handle_cart()
        if path.startswith("/api/leads/") and path.endswith("/activities"):
            lead_id = path.split("/")[3]
            return self._handle_activities(lead_id)

        self._send_json(404, {"ok": False, "error": f"Route not found: {path}"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path == "/api/leads":
            return self._create_lead()
        if path.startswith("/api/leads/") and path.endswith("/activities"):
            lead_id = path.split("/")[3]
            return self._create_activity(lead_id)

        self._send_json(404, {"ok": False, "error": f"Route not found: {path}"})

    def do_PATCH(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path.startswith("/api/leads/"):
            lead_id = path.split("/")[3]
            return self._update_lead(lead_id)

        self._send_json(404, {"ok": False, "error": f"Route not found: {path}"})

    def _handle_health(self) -> None:
        with get_connection() as connection:
            lead_count = connection.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
            activity_count = connection.execute("SELECT COUNT(*) FROM activities").fetchone()[0]
        self._send_json(
            200,
            {
                "ok": True,
                "orderId": ORDER_ID,
                "projectTitle": PROJECT_TITLE,
                "database": str(DB_PATH.relative_to(PROJECT_ROOT)),
                "leadCount": lead_count,
                "activityCount": activity_count,
                "timestamp": iso_now(),
            },
        )

    def _dashboard_payload(self) -> dict:
        with get_connection() as connection:
            status_rows = connection.execute(
                "SELECT status, COUNT(*) AS count FROM leads GROUP BY status ORDER BY count DESC, status ASC"
            ).fetchall()
            priority_rows = connection.execute(
                "SELECT priority, COUNT(*) AS count FROM leads GROUP BY priority ORDER BY count DESC, priority ASC"
            ).fetchall()
            totals = connection.execute(
                """
                SELECT
                    COUNT(*) AS total_leads,
                    COALESCE(SUM(budget), 0) AS total_budget,
                    COALESCE(SUM(CASE WHEN status != 'lost' THEN budget ELSE 0 END), 0) AS pipeline_budget
                FROM leads
                """
            ).fetchone()
            recent_activity = connection.execute(
                """
                SELECT
                    activities.id,
                    activities.note,
                    activities.created_at,
                    leads.id AS lead_id,
                    leads.name,
                    leads.company
                FROM activities
                JOIN leads ON leads.id = activities.lead_id
                ORDER BY activities.created_at DESC, activities.id DESC
                LIMIT 8
                """
            ).fetchall()

        return {
            "ok": True,
            "summary": row_to_dict(totals),
            "statusBreakdown": [row_to_dict(row) for row in status_rows],
            "priorityBreakdown": [row_to_dict(row) for row in priority_rows],
            "recentActivity": [row_to_dict(row) for row in recent_activity],
        }

    def _handle_dashboard(self) -> None:
        self._send_json(200, self._dashboard_payload())

    def _handle_admin_stats(self) -> None:
        dashboard = self._dashboard_payload()
        summary = dashboard["summary"]
        status_index = {
            item["status"]: item["count"]
            for item in dashboard["statusBreakdown"]
        }
        payload = {
            "ok": True,
            "total_leads": summary["total_leads"],
            "total_budget": summary["total_budget"],
            "pipeline_budget": summary["pipeline_budget"],
            "open_leads": summary["total_leads"] - status_index.get("won", 0) - status_index.get("lost", 0),
            "won_leads": status_index.get("won", 0),
            "lost_leads": status_index.get("lost", 0),
            "stats": {
                "totalLeads": summary["total_leads"],
                "totalBudget": summary["total_budget"],
                "pipelineBudget": summary["pipeline_budget"],
                "openLeads": summary["total_leads"] - status_index.get("won", 0) - status_index.get("lost", 0),
                "wonLeads": status_index.get("won", 0),
                "lostLeads": status_index.get("lost", 0),
            },
        }
        self._send_json(200, payload)

    def _handle_leads(self) -> None:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT
                    leads.*,
                    COUNT(activities.id) AS activity_count,
                    MAX(activities.created_at) AS last_activity_at
                FROM leads
                LEFT JOIN activities ON activities.lead_id = leads.id
                GROUP BY leads.id
                ORDER BY
                    CASE leads.priority
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        ELSE 3
                    END,
                    leads.updated_at DESC,
                    leads.id DESC
                """
            ).fetchall()

        self._send_json(200, {"ok": True, "items": [row_to_dict(row) for row in rows]})

    def _handle_activities(self, lead_id: str) -> None:
        if not lead_id.isdigit():
            return self._send_json(400, {"ok": False, "error": "Invalid lead id"})

        with get_connection() as connection:
            lead = connection.execute(
                "SELECT id, name, company FROM leads WHERE id = ?",
                (lead_id,),
            ).fetchone()
            if lead is None:
                return self._send_json(404, {"ok": False, "error": "Lead not found"})
            rows = connection.execute(
                """
                SELECT id, note, created_at
                FROM activities
                WHERE lead_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (lead_id,),
            ).fetchall()

        self._send_json(
            200,
            {
                "ok": True,
                "lead": row_to_dict(lead),
                "items": [row_to_dict(row) for row in rows],
            },
        )

    def _handle_products(self) -> None:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT
                    id,
                    name,
                    company,
                    status,
                    priority,
                    budget,
                    updated_at
                FROM leads
                ORDER BY updated_at DESC, id DESC
                """
            ).fetchall()

        items = [
            {
                "id": row["id"],
                "name": row["name"],
                "title": row["name"],
                "subtitle": row["company"],
                "status": row["status"],
                "priority": row["priority"],
                "price": row["budget"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]
        self._send_json(200, {"ok": True, "items": items, "total": len(items)})

    def _handle_orders(self) -> None:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT
                    leads.id,
                    leads.name,
                    leads.company,
                    leads.owner,
                    leads.status,
                    leads.budget,
                    COUNT(activities.id) AS activity_count,
                    leads.updated_at
                FROM leads
                LEFT JOIN activities ON activities.lead_id = leads.id
                GROUP BY leads.id
                ORDER BY leads.updated_at DESC, leads.id DESC
                """
            ).fetchall()

        items = [
            {
                "id": row["id"],
                "order_no": f"LEAD-{row['id']:04d}",
                "customer": row["company"],
                "name": row["name"],
                "owner": row["owner"],
                "status": row["status"],
                "amount": row["budget"],
                "activity_count": row["activity_count"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]
        self._send_json(200, {"ok": True, "items": items, "total": len(items)})

    def _handle_cart(self) -> None:
        self._send_json(200, {"ok": True, "items": [], "total": 0, "amount": 0})

    def _create_lead(self) -> None:
        try:
            payload = self._read_json()
        except json.JSONDecodeError:
            return self._send_json(400, {"ok": False, "error": "Invalid JSON payload"})

        name = str(payload.get("name", "")).strip()
        if not name:
            return self._send_json(400, {"ok": False, "error": "Lead name is required"})

        now = iso_now()
        values = {
            "name": name,
            "company": str(payload.get("company", "")).strip(),
            "channel": str(payload.get("channel", "")).strip(),
            "owner": str(payload.get("owner", "")).strip(),
            "status": str(payload.get("status", "new")).strip() or "new",
            "priority": str(payload.get("priority", "medium")).strip() or "medium",
            "budget": float(payload.get("budget") or 0),
            "next_action": str(payload.get("next_action", "")).strip(),
        }

        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO leads
                (name, company, channel, owner, status, priority, budget, next_action, created_at, updated_at)
                VALUES (:name, :company, :channel, :owner, :status, :priority, :budget, :next_action, :created_at, :updated_at)
                """,
                {**values, "created_at": now, "updated_at": now},
            )
            lead_id = cursor.lastrowid
            lead = connection.execute(
                "SELECT * FROM leads WHERE id = ?",
                (lead_id,),
            ).fetchone()

        self._send_json(201, {"ok": True, "item": row_to_dict(lead)})

    def _update_lead(self, lead_id: str) -> None:
        if not lead_id.isdigit():
            return self._send_json(400, {"ok": False, "error": "Invalid lead id"})

        try:
            payload = self._read_json()
        except json.JSONDecodeError:
            return self._send_json(400, {"ok": False, "error": "Invalid JSON payload"})

        updates = {key: value for key, value in payload.items() if key in ALLOWED_LEAD_FIELDS}
        if not updates:
            return self._send_json(400, {"ok": False, "error": "No valid fields to update"})

        if "budget" in updates:
            updates["budget"] = float(updates["budget"] or 0)

        assignments = ", ".join(f"{key} = :{key}" for key in updates)
        updates["id"] = int(lead_id)
        updates["updated_at"] = iso_now()

        with get_connection() as connection:
            existing = connection.execute("SELECT id FROM leads WHERE id = ?", (lead_id,)).fetchone()
            if existing is None:
                return self._send_json(404, {"ok": False, "error": "Lead not found"})
            connection.execute(
                f"UPDATE leads SET {assignments}, updated_at = :updated_at WHERE id = :id",
                updates,
            )
            lead = connection.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()

        self._send_json(200, {"ok": True, "item": row_to_dict(lead)})

    def _create_activity(self, lead_id: str) -> None:
        if not lead_id.isdigit():
            return self._send_json(400, {"ok": False, "error": "Invalid lead id"})

        try:
            payload = self._read_json()
        except json.JSONDecodeError:
            return self._send_json(400, {"ok": False, "error": "Invalid JSON payload"})

        note = str(payload.get("note", "")).strip()
        if not note:
            return self._send_json(400, {"ok": False, "error": "Activity note is required"})

        now = iso_now()
        with get_connection() as connection:
            existing = connection.execute("SELECT id FROM leads WHERE id = ?", (lead_id,)).fetchone()
            if existing is None:
                return self._send_json(404, {"ok": False, "error": "Lead not found"})
            cursor = connection.execute(
                "INSERT INTO activities (lead_id, note, created_at) VALUES (?, ?, ?)",
                (lead_id, note, now),
            )
            connection.execute(
                "UPDATE leads SET updated_at = ? WHERE id = ?",
                (now, lead_id),
            )
            activity = connection.execute(
                "SELECT id, note, created_at FROM activities WHERE id = ?",
                (cursor.lastrowid,),
            ).fetchone()

        self._send_json(201, {"ok": True, "item": row_to_dict(activity)})


def main() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), ApiHandler)
    print(f"Backend listening on http://{HOST}:{PORT} for {ORDER_ID}")
    server.serve_forever()


if __name__ == "__main__":
    main()
